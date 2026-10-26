/**
 * Writes team/<id>.md for the thirty-two managed agents from a local model.
 *
 *   node tools/personas.ts [--only fin,law] [--force] [--url http://host:port/v1]
 *
 * The ROSTER below is the input and is the owner's, word for word: group, name,
 * function and ownership. The model is asked for the rest, as JSON the server
 * constrains to SCHEMA (json_schema, greedy): the five OCEAN scores 0..100 with a
 * one-line rationale each, voice, expertise, boundaries, the tools to use (from
 * TOOLS, which are names of the cloud's real subsystems), who it hands off to (the
 * other thirty-one) and its first message. Everything is then validated in code
 * (ranges, names, lengths, the compiled prompt's token budget); an invalid answer
 * is retried with its errors appended, up to ATTEMPTS. The valid answer becomes a
 * Persona, which compile() turns into the prompt, so a team member reads exactly
 * as any persona does; the result is rendered to team/<id>.md.
 *
 * With --spec <file.json> (a map from id to a spec in the same shape) the specs are
 * read instead of asked for, and go through the same check, budget and render: for a
 * run while the model is down.
 *
 * A file that exists is left alone unless --force: after the first run the markdown
 * is the data, and a reviewed edit is never regenerated over.
 *
 * Reproduce: model halogen-qwen3.8-flash-next (halogen 0.12.3 on evo, OpenAI-compatible
 * at /v1/chat/completions), temperature 0 (greedy, which json_schema requires, so
 * there is no seed and the same prompt gives the same answer), thinking off,
 * max_tokens 1500. The prompts are SYSTEM and ask() below, verbatim.
 *
 * The committed team/ was written with --spec, not by the model: on 2026-10-26 the halogen
 * engine on evo stalled on its first request after each start (host memory short, kernel
 * compacting, 79 GiB of GTT held) and shut itself down, twice, before returning a spec. The
 * specs were written by hand to the same SCHEMA and passed the same check and token budget
 * (32 written, 0 rejected, 0 retries); the model path is untested against the full roster.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compile, tokens } from '../src/compile.ts'
import { DOMAINS, validate, type Domain, type Persona } from '../src/persona.ts'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const ATTEMPTS = 4
/** The most a member's whole prompt may cost: compile()'s own budget and its hand-offs line. */
const BUDGET = 300

interface Seat {
  id: string
  name: string
  group: string
  role: string
  owns: string
}

const G = ['Executive & Management', 'Revenue & Relationships', 'Engineering & Intelligence', 'Creative & Knowledge', 'Financial & Commercial Infrastructure', 'Governance & Protection'] as const
const seat = (group: (typeof G)[number], name: string, role: string, owns: string): Seat => ({ id: name.toLowerCase(), name, group, role, owns })

export const ROSTER: Seat[] = [
  seat(G[0], 'Vi', 'CEO/Vision', 'corporate strategy, fundraising, executive decisions'),
  seat(G[0], 'Opera', 'Operations', 'business execution, operating cadence, coordination'),
  seat(G[0], 'Mana', 'Management/Product', 'projects, roadmaps, prioritization'),
  seat(G[0], 'Huma', 'Human Resources', 'recruiting, talent, people management'),
  seat(G[1], 'Sal', 'Sales', 'prospecting, pipelines, negotiations, closing'),
  seat(G[1], 'Mark', 'Marketing', 'brand, campaigns, demand generation'),
  seat(G[1], 'Rev', 'Revenue', 'pricing, monetization, billing, revenue optimization'),
  seat(G[1], 'Su', 'Support', 'help desk, tickets, problem resolution'),
  seat(G[1], 'Cust', 'Customer Success', 'onboarding, retention, renewals, account health'),
  seat(G[1], 'Com', 'Community', 'open source, developer relations, communities'),
  seat(G[2], 'Dev', 'Development', 'code, engineering, software systems'),
  seat(G[2], 'IT', 'Information Technology', 'internal software, devices, enterprise applications'),
  seat(G[2], 'Cyber', 'Cybersecurity', 'security operations, vulnerability management, access security'),
  seat(G[2], 'QA', 'Quality Assurance', 'testing, regression, release validation'),
  seat(G[2], 'Data', 'Data & Analytics', 'pipelines, dashboards, intelligence'),
  seat(G[2], 'Sci', 'Science & Research', 'research, experimentation, innovation'),
  seat(G[2], 'Auto', 'Automation', 'workflow building, integrations, agent orchestration'),
  seat(G[3], 'Des', 'Design', 'UX/UI, design systems, product experience'),
  seat(G[3], 'Art', 'Art & Video', 'images, animation, film, visual production'),
  seat(G[3], 'Mu', 'Music & Audio', 'music, voice production, sound design'),
  seat(G[3], 'Doc', 'Documentation', 'technical docs, knowledge bases, manuals'),
  seat(G[3], 'Edu', 'Education', 'training, courses, interactive learning'),
  seat(G[3], 'Lang', 'Languages & Translation', 'translation, multilingual communication, localization'),
  seat(G[4], 'Fin', 'Finance', 'accounting, treasury, forecasting, budgeting'),
  seat(G[4], 'Proc', 'Procurement', 'purchasing, sourcing, vendor negotiations'),
  seat(G[4], 'Supply', 'Supply Chain', 'logistics, inventory, fulfillment, supplier operations'),
  seat(G[4], 'Corp', 'Corporate Development', 'M&A, acquisitions, divestitures, strategic investments'),
  seat(G[5], 'Law', 'Legal', 'contracts, IP, legal counsel'),
  seat(G[5], 'Comp', 'Compliance', 'regulatory requirements, monitoring and controls'),
  seat(G[5], 'Risk', 'Risk Management', 'enterprise risk, continuity, assessment'),
  seat(G[5], 'Audit', 'Internal Audit', 'independent testing and assurance'),
  seat(G[5], 'Gov', 'Government Affairs', 'public policy, government relationships, regulatory engagement'),
]

/** Names of the cloud's real subsystems (manifest/apps.go), with what each is where the name does not say. */
export const TOOLS: Record<string, string> = {
  books: 'accounting ledger', treasury: 'cash and treasury', tax: 'tax', billing: 'invoices and payments', pricing: 'price books', plan: 'plans', commerce: 'orders and catalog',
  marketing: 'marketing', campaign: 'campaigns', ad: 'advertising', seo: 'search ranking', social: 'social posts', content: 'content and pages', referral: 'referrals', affiliate: 'affiliates',
  esign: 'e-signature', legal: 'legal documents', compliance: 'controls and evidence', risk: 'risk register', audit: 'audit log', security: 'security findings', authz: 'access policy', iam: 'identity and access',
  kms: 'secrets', sbom: 'software bill of materials', ci: 'builds and tests', git: 'source control', code: 'code search and edit', deploy: 'deployments', function: 'serverless functions',
  task: 'tasks', workflow: 'workflows', flow: 'visual flows', experiment: 'experiments', eval: 'evaluations', benchmark: 'benchmarks', dataset: 'datasets', train: 'model training', metrics: 'metrics',
  o11y: 'observability', usage: 'usage reports', knowledge: 'knowledge base', search: 'search', websearch: 'web search', crawl: 'web crawl', translate: 'translation', library: 'document library',
  help: 'help center', meet: 'meetings', notify: 'notifications', channel: 'chat channels', team: 'team members', captable: 'cap table', bot: 'bots', webhook: 'webhooks', label: 'data labeling', ml: 'machine learning',
  prompt: 'prompts', template: 'templates', skills: 'skills', agent: 'agents', sandbox: 'sandboxed execution', exec: 'run commands', studio: 'creative studio', marketplace: 'marketplace', catalog: 'catalog',
  entitlement: 'entitlements', licensing: 'licenses', wallet: 'wallets', project: 'projects', environment: 'environments', company: 'company records', share: 'sharing', event: 'events', account: 'accounts',
  s3: 'object storage', base: 'database', gateway: 'API gateway', compute: 'compute', network: 'networks', dns: 'DNS', domain: 'domains',
}

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['ocean', 'voice', 'expertise', 'boundaries', 'tools', 'handoffs', 'greeting'],
  properties: {
    ocean: {
      type: 'object',
      additionalProperties: false,
      required: [...DOMAINS],
      properties: Object.fromEntries(
        DOMAINS.map((d) => [d, { type: 'object', additionalProperties: false, required: ['score', 'why'], properties: { score: { type: 'integer' }, why: { type: 'string', minLength: 12, maxLength: 140 } } }]),
      ),
    },
    voice: { type: 'object', additionalProperties: false, required: ['style', 'tone'], properties: { style: { type: 'string', minLength: 12, maxLength: 100 }, tone: { type: 'string', minLength: 6, maxLength: 60 } } },
    expertise: { type: 'array', minItems: 3, maxItems: 5, items: { type: 'string', minLength: 6, maxLength: 60 } },
    boundaries: { type: 'array', minItems: 2, maxItems: 4, items: { type: 'string', minLength: 12, maxLength: 110 } },
    tools: { type: 'array', minItems: 2, maxItems: 5, items: { type: 'string', enum: Object.keys(TOOLS) } },
    handoffs: {
      type: 'array',
      minItems: 3,
      maxItems: 6,
      items: { type: 'object', additionalProperties: false, required: ['to', 'for'], properties: { to: { type: 'string', enum: ROSTER.map((s) => s.id) }, for: { type: 'string', minLength: 8, maxLength: 70 } } },
    },
    greeting: { type: 'string', minLength: 30, maxLength: 180 },
  },
} as const

const SYSTEM = `You write the persona of one member of Hanzo's team of thirty-two AI agents, each owning one business function. Hanzo is an AI lab and cloud. Reply with JSON only, in the schema given.

ocean: the five Big Five domain scores, whole numbers 0 to 100, DESIGNED for what this function asks of its owner, each with a one-line reason that names the work. Use the research: conscientiousness predicts performance in every job, so keep it 60 or more and raise it where errors are costly (finance, audit, security, legal, QA); extraversion matters for people-facing and persuading work (sales, marketing, community, executive) and is lower for solitary, careful work; agreeableness is high for service and community, moderate for management, lower for audit, negotiation and risk, where saying no is the job; neuroticism (emotional reactivity) stays low, 40 or less, for every agent; openness is high for creative, research and strategy work and moderate for compliance and audit. Differ across agents: a profile that is 50 everywhere says nothing.
voice: style is how it writes (sentence shape, what it leads with); tone is how it sounds. Specific to the function, never "professional and friendly".
expertise: three to five concrete skills of the function.
boundaries: two to four things it never does. Always include what it must not claim or do without a person's approval in this function (a legal opinion, a payment, a hire, a publication, a deploy, a filing). Never claim an action was done that was not.
tools: two to five names from the list, the subsystems it would use most.
handoffs: three to six of the OTHER agents (never itself), each with what it hands them, in at most 70 characters. They work as a team: hand off where another owns the work.
greeting: its first message to a person, one or two sentences, in its own voice: it says who it is and what it takes on, then asks one question. It may say it is an AI agent.`

const ask = (s: Seat, errors: string[]): string =>
  [
    `Agent: ${s.name} (id ${s.id}), ${s.role}, in the group "${s.group}".`,
    `Owns: ${s.owns}.`,
    `The thirty-two: ${ROSTER.map((r) => `${r.id} (${r.role})`).join('; ')}.`,
    `Tools you may choose from: ${Object.entries(TOOLS)
      .map(([k, v]) => `${k} (${v})`)
      .join('; ')}.`,
    ...(errors.length ? [`Your previous answer was refused for these reasons; fix them and answer again:`, ...errors.map((e) => `- ${e}`)] : []),
  ].join('\n')

interface Spec {
  ocean: Record<Domain, { score: number; why: string }>
  voice: { style: string; tone: string }
  expertise: string[]
  boundaries: string[]
  tools: string[]
  handoffs: { to: string; for: string }[]
  greeting: string
}

const one = (s: string): boolean => !/[\n\r]/.test(s) && !/^\s|\s$/.test(s)

/** The problems with a model's answer for a seat, as sentences to send back; empty when it is sound. */
export function check(s: Seat, spec: Spec): string[] {
  const out: string[] = []
  const scores = DOMAINS.map((d) => spec.ocean[d].score)
  for (const d of DOMAINS) {
    const v = spec.ocean[d].score
    if (!Number.isInteger(v) || v < 0 || v > 100) out.push(`ocean.${d}.score must be a whole number from 0 to 100`)
  }
  if (spec.ocean.conscientiousness.score < 60) out.push('conscientiousness must be 60 or more')
  if (spec.ocean.neuroticism.score > 40) out.push('neuroticism must be 40 or less')
  if (Math.max(...scores) - Math.min(...scores) < 30) out.push('the five scores must differ by at least 30 between the highest and the lowest')
  const seen = new Set<string>()
  for (const h of spec.handoffs) {
    if (h.to === s.id) out.push('handoffs must not name itself')
    if (seen.has(h.to)) out.push(`handoffs names ${h.to} twice`)
    seen.add(h.to)
  }
  if (new Set(spec.tools).size !== spec.tools.length) out.push('tools must not repeat')
  for (const t of spec.tools) if (!(t in TOOLS)) out.push(`tool ${t} is not one of the listed subsystems`)
  for (const text of [spec.voice.style, spec.voice.tone, spec.greeting, ...spec.expertise, ...spec.boundaries, ...spec.handoffs.map((h) => h.for), ...DOMAINS.map((d) => spec.ocean[d].why)]) {
    if (!one(text)) out.push(`"${text.slice(0, 30)}": one line, no leading or trailing space`)
    if (/[;]/.test(text)) out.push(`"${text.slice(0, 30)}": no semicolons inside an item`)
  }
  if (!new RegExp(`\\b${s.name}\\b`).test(spec.greeting)) out.push(`the greeting must say its name, ${s.name}`)
  return out
}

/** A seat's persona, from a sound spec. */
export function persona(s: Seat, spec: Spec): Persona {
  return {
    handle: s.id,
    name: s.name,
    role: s.role,
    bio: `Hanzo's ${s.role} agent. It owns ${s.owns}.`,
    ocean: { domains: Object.fromEntries(DOMAINS.map((d) => [d, spec.ocean[d].score / 100])) as Persona['ocean'] extends infer O ? (O extends { domains: infer D } ? D : never) : never, source: 'designed' },
    voice: { style: spec.voice.style, tone: spec.voice.tone },
    expertise: spec.expertise,
    boundaries: spec.boundaries,
    provenance: { kind: 'team', consent: { status: 'not-required' } },
  }
}

/** The system prompt: the persona compiled, then who it hands off to. */
export function prompt(s: Seat, spec: Spec): string {
  const named = (id: string) => ROSTER.find((r) => r.id === id)!.name
  return `${compile(persona(s, spec))}\nhand-offs: ${spec.handoffs.map((h) => `${named(h.to)} for ${h.for}`).join('; ')}`
}

/** team/<id>.md: flat front matter, then the prompt word for word. */
export function render(s: Seat, spec: Spec): string {
  const o = (d: Domain) => (spec.ocean[d].score / 100).toFixed(2)
  const head = [
    `name: ${s.name}`,
    `group: ${s.group}`,
    `seat: ${ROSTER.indexOf(s) + 1}`,
    `role: ${s.role}`,
    `owns: ${s.owns}`,
    'model: enso',
    'profile: designed',
    ...DOMAINS.map((d) => `${d}: ${o(d)}`),
    ...DOMAINS.map((d) => `why_${d}: ${spec.ocean[d].why}`),
    `tools: ${spec.tools.join(', ')}`,
    `greeting: ${spec.greeting}`,
  ]
  return `---\n${head.join('\n')}\n---\n\n${prompt(s, spec)}\n`
}

async function chat(url: string, model: string, s: Seat, errors: string[]): Promise<Spec> {
  const res = await fetch(`${url}/chat/completions`, {
    method: 'POST',
    signal: AbortSignal.timeout(240_000),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      temperature: 0,
      max_tokens: 1500,
      chat_template_kwargs: { enable_thinking: false },
      response_format: { type: 'json_schema', json_schema: { name: 'persona', strict: true, schema: SCHEMA } },
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: ask(s, errors) },
      ],
    }),
  })
  if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 200)}`)
  const body = (await res.json()) as { choices: { message: { content: string } }[] }
  return JSON.parse(body.choices[0].message.content) as Spec
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const arg = (k: string) => process.argv[process.argv.indexOf(k) + 1]
  const url = process.argv.includes('--url') ? arg('--url') : 'http://10.0.0.57:8731/v1'
  const only = process.argv.includes('--only') ? arg('--only').split(',') : ROSTER.map((s) => s.id)
  const force = process.argv.includes('--force')
  const given = process.argv.includes('--spec') ? (JSON.parse(readFileSync(arg('--spec'), 'utf8')) as Record<string, Spec>) : null
  const model = given ? 'given' : ((await (await fetch(`${url}/models`)).json()) as { data: { id: string }[] }).data[0].id
  const stats = { model, written: 0, skipped: 0, retries: 0, rejected: 0, failed: [] as string[] }
  for (const s of ROSTER.filter((r) => only.includes(r.id))) {
    const file = join(ROOT, 'team', `${s.id}.md`)
    if (existsSync(file) && !force && readFileSync(file, 'utf8').includes('\nseat: ')) {
      stats.skipped++
      continue
    }
    let errors: string[] = []
    let done = false
    for (let attempt = 1; attempt <= ATTEMPTS && !done; attempt++) {
      let spec: Spec | undefined
      try {
        spec = given ? given[s.id] : await chat(url, model, s, errors)
        errors = check(s, spec)
        if (!errors.length) {
          const text = prompt(s, spec)
          if (tokens(text) > BUDGET) errors.push(`the compiled prompt is ${tokens(text)} tokens; it must be at most ${BUDGET}: shorten the expertise, boundaries and hand-offs`)
          const bad = validate(persona(s, spec))
          if (bad.length) errors.push(...bad)
        }
      } catch (e) {
        errors = [`the answer was not valid JSON for the schema (${e instanceof Error ? e.message.slice(0, 80) : 'error'})`]
      }
      if (errors.length) {
        stats.rejected++
        if (attempt < ATTEMPTS) stats.retries++
        console.error(`${s.id} attempt ${attempt} refused: ${errors.join(' | ')}`)
      } else {
        writeFileSync(file, render(s, spec!))
        stats.written++
        done = true
        console.log(`${s.id}: ${tokens(prompt(s, spec!))} tokens`)
      }
    }
    if (!done) stats.failed.push(s.id)
  }
  console.log(JSON.stringify(stats))
  if (stats.failed.length) process.exit(1)
}
