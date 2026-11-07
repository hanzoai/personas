import { strict as assert } from 'node:assert'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { all, blend, compile, figure, get, getProfile, grouped, list, member, parse, parsePerson, people, score, speaks, team, tokens, validate, ITEMS, DOMAINS, FACETS, type Persona } from './index.ts'
import { BUDGET, EXEMPLARS, ROSTER, SKILLS, TOOLS } from '../tools/personas.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
const MEMOJI = join(HERE, '..', 'assets', 'memoji')
const TEAM_DIR = join(HERE, '..', 'team')

test('the roster: one entry per person, the named figures present', () => {
  const slugs = list()
  assert.ok(slugs.length >= 600, `600+ figures, got ${slugs.length}`)
  const names = slugs.map((s) => getProfile(s)?.name).filter(Boolean)
  assert.deepEqual(names.filter((n, i) => names.indexOf(n) !== i), [], 'no duplicate names')
  for (const slug of ['feynman', 'zeekay', 'north-star']) assert.ok(slugs.includes(slug), slug)
  assert.ok(slugs[0] < slugs[1], 'sorted')
  assert.equal(getProfile('nonexistent-slug-xyz'), null)
  assert.equal(get('does-not-exist'), null)
  assert.equal(all().length, slugs.length)
  const z = get('zeekay')
  assert.ok(z?.profile && z.persona?.includes('Architect'))
})

test('the managed agents: thirty-four seats in six departments, each who the product shows and what the model is told', () => {
  const crew = team()
  assert.deepEqual(crew.map((m) => m.id).sort(), ROSTER.map((s) => s.id).sort())
  assert.deepEqual(grouped(crew).map((g) => [g.group, g.members.length]), [
    ['Executive & Management', 4],
    ['Financial & Commercial Infrastructure', 4],
    ['Engineering & Intelligence', 7],
    ['Revenue & Relationships', 7],
    ['Creative & Knowledge', 7],
    ['Governance & Protection', 5],
  ])
  assert.deepEqual(crew.map((m) => m.seat).sort((a, b) => a - b), Array.from({ length: 34 }, (_, i) => i + 1))
  assert.deepEqual(
    [...crew].sort((a, b) => a.seat - b.seat).filter((m) => m.lead).map((m) => m.id),
    ['vi', 'fin', 'dev', 'mark', 'opera', 'des', 'sal', 'su', 'cyber', 'sci', 'huma', 'mana'],
    'the grid a roster opens on is the first twelve seats',
  )
  for (const m of crew) {
    const seat = ROSTER[m.seat - 1]
    assert.deepEqual([m.name, m.group, m.role, m.owns], [seat.name, seat.group, seat.role, seat.owns], `${m.id} is the owner's seat ${m.seat}`)
    assert.match(m.id, /^[a-z]+$/, `${m.id}: a lower-case handle`)
    assert.match(m.model, /^enso(-[a-z]+)?$/)
    assert.ok(m.instructions.startsWith(`You are ${m.name}, ${m.role}.`), `${m.id}: opens with its name and function`)
    assert.ok(!/\bas an ai\b/i.test(m.instructions))
    assert.match(m.instructions, /\nhand-offs: /)
    assert.ok(tokens(m.instructions) <= BUDGET, `${m.id}: ${tokens(m.instructions)} tokens`)
    assert.ok(m.greeting.includes(m.name) && m.greeting.length <= 180, `${m.id}: a greeting that says who it is`)
    assert.ok(m.tools.length >= 2 && m.tools.every((t) => t in TOOLS), `${m.id}: tools are real subsystems`)
    const line = m.instructions.split('\nhand-offs: ')[1] ?? ''
    const named = line.split('; ').map((h) => h.split(' for ')[0])
    assert.ok(named.length >= 3 && new Set(named).size === named.length, `${m.id}: three or more distinct hand-offs`)
    for (const n of named) assert.ok(n !== m.name && crew.some((o) => o.name === n), `${m.id} hands off to ${n}, who is not another member`)
  }
  assert.equal(new Set(crew.map((m) => m.role)).size, 34, 'a function of its own each')
  assert.equal(member('dev')?.name, 'Dev')
  assert.equal(member('nobody'), null)
  assert.equal(member('../README'), null)
  assert.equal(member('DEV'), null)
  assert.throws(() => parse('x', 'no front matter'))
})

test('every member is the blend of three or more exemplars, with a reason for each domain, and a face', () => {
  for (const m of team()) {
    assert.ok(m.ocean, `${m.id} has OCEAN`)
    assert.equal(m.profile, 'exemplars')
    assert.deepEqual(m.exemplars, EXEMPLARS[m.id], `${m.id}: the exemplars its seat names`)
    assert.ok(m.exemplars.length >= 3, `${m.id}: at least three exemplars`)
    const b = blend(m.exemplars.map((id) => ({ persona: figure(id)! })))
    for (const d of DOMAINS) assert.ok(Math.abs(m.ocean[d] - b.ocean.domains[d]) <= 0.005 + 1e-9, `${m.id}: ${d} ${m.ocean[d]} is the blend ${b.ocean.domains[d]}`)
    const named = b.exemplars.map((e) => e.name)
    assert.ok(m.instructions.includes(`\nexemplars: ${named.slice(0, -1).join(', ')} and ${named.at(-1)}; work with their craft and judgement; you are a Hanzo agent, not them, and never claim their memories, quotes or acts.\n`), `${m.id}: names its exemplars`)
    const text = readFileSync(join(TEAM_DIR, `${m.id}.md`), 'utf8')
    for (const d of DOMAINS) {
      const why = new RegExp(`\\nwhy_${d}: (.+)\\n`).exec(text)?.[1] ?? ''
      assert.ok(why.length >= 60 && named.some((n) => why.includes(n)), `${m.id}: why ${d} is analysis that names an exemplar`)
    }
    for (const file of [`${m.id}.svg`, `${m.id}.png`, `${m.id}@2x.png`]) assert.ok(existsSync(join(MEMOJI, file)), `assets/memoji/${file}`)
  }
  assert.deepEqual(readdirSync(MEMOJI).filter((f) => f.endsWith('.svg')).map((f) => f.slice(0, -4)).sort(), team().map((m) => m.id).sort(), 'no face without a member')
})

// The 35 reasoned lines of a PERSONA.md's "## OCEAN analysis": each domain, then its six facets.
const ANALYSIS = DOMAINS.flatMap((d) => [`- ${d}: `, ...FACETS[d].map((f) => `  - ${f}: `)])

test('every exemplar is a written figure who has died, with a bio, a craft and a cited reason for every score', () => {
  const ids = [...new Set(Object.values(EXEMPLARS).flat())]
  assert.equal(ids.length, new Set(ids).size)
  for (const id of ids) {
    const p = figure(id)
    assert.ok(p, `${id}: a written PERSONA.md`)
    assert.ok(getProfile(id), `${id}: in the roster`)
    assert.equal(p.provenance.kind, 'historical', `${id}: has died`)
    assert.ok(p.bio && p.bio.length <= 280 && p.craft && p.craft.length <= 100, `${id}: a bio and a craft`)
    assert.deepEqual(validate(p), [], `${id}: a valid persona`)
    assert.deepEqual(Object.keys(p.ocean!.facets!).sort(), DOMAINS.flatMap((d) => FACETS[d]).sort(), `${id}: thirty facets`)
    const sources = p.provenance.sources!
    assert.ok(sources.length >= 2, `${id}: two or more sources`)
    const text = readFileSync(join(HERE, '..', 'personas', id, 'PERSONA.md'), 'utf8')
    const lines = /\n## OCEAN analysis\n\n([\s\S]*?)\n\n## Sources\n/.exec(text)?.[1].split('\n') ?? []
    assert.equal(lines.length, ANALYSIS.length, `${id}: 35 analysis lines`)
    lines.forEach((line, i) => {
      assert.ok(line.startsWith(ANALYSIS[i]), `${id}: line ${i + 1} is ${ANALYSIS[i].trim()}`)
      const cites = /\[(\d+(?:, \d+)*)\]$/.exec(line)?.[1].split(', ').map(Number) ?? []
      assert.ok(cites.length && cites.every((n) => n >= 1 && n <= sources.length), `${id}: ${ANALYSIS[i].trim()} cites its sources`)
      assert.ok(line.length - ANALYSIS[i].length >= 40, `${id}: ${ANALYSIS[i].trim()} gives a reason`)
    })
  }
})

test('the role skills: the hardcore software set for Dev, the UI skill for Des, nothing outside the catalogue', () => {
  assert.deepEqual(member('dev')?.skills, ['dev', 'code-review'])
  assert.deepEqual(member('des')?.skills, ['ui'])
  assert.deepEqual(member('qa')?.skills, ['code-review', 'dev'])
  assert.deepEqual(member('cyber')?.skills, ['code-review'])
  // hanzo-inc/cloud apps/skills builtin.go: the role skills the cloud serves.
  for (const m of team()) {
    assert.deepEqual(m.skills, SKILLS[m.id] ?? [], `${m.id}: the skills its seat names`)
    for (const s of m.skills) assert.ok(['code-review', 'dev', 'ui'].includes(s), `${m.id}: ${s} is in the catalogue`)
  }
})

test('the people: Antje and Zach, speaking only once each records consent', () => {
  const ps = people()
  assert.deepEqual(ps.map((p) => p.id), ['antje', 'zach'])
  assert.equal(ps.find((p) => p.id === 'antje')?.role, 'CEO')
  assert.equal(ps.find((p) => p.id === 'zach')?.role, 'Founding CTO')
  for (const p of ps) {
    assert.ok(p.instructions.includes('ir@hanzo.ai'), 'the investor path')
    assert.ok(/not (Antje|Zach)/.test(p.instructions), 'says it is an AI and not them')
    assert.equal(speaks(p), false, `${p.id} has not recorded consent yet`)
  }
  const recorded = parsePerson('x', '---\nname: X\nrole: Y\nconsent: recorded\nconsent_by: sub-1\nconsent_at: 2026-10-26T00:00:00Z\n---\nYou are X.')
  assert.equal(speaks(recorded), true)
  assert.equal(speaks(parsePerson('x', '---\nname: X\nrole: Y\nconsent: recorded\n---\nYou are X.')), false, 'recorded needs who recorded it')
})

const answers = (f: (item: (typeof ITEMS)[number]) => number) => ITEMS.map(f)

test('OCEAN scoring: fifty statements, ten to a domain, reverse keys flipped', () => {
  assert.equal(ITEMS.length, 50)
  for (const d of DOMAINS) assert.equal(ITEMS.filter((i) => i.domain === d).length, 10, d)
  assert.equal(ITEMS.filter((i) => i.key === -1).length, 18, 'reverse-keyed: E 5, A 4, C 4, O 3, and the two stability statements of N, which is scored as neuroticism')
  const mid = score(answers(() => 3))
  for (const d of DOMAINS) assert.equal(mid.domains[d], 0.5)
  const high = score(answers((i) => (i.key === 1 ? 5 : 1)))
  const low = score(answers((i) => (i.key === 1 ? 1 : 5)))
  for (const d of DOMAINS) {
    assert.equal(high.domains[d], 1)
    assert.equal(high.bands[d], 'high')
    assert.equal(low.domains[d], 0)
    assert.equal(low.bands[d], 'low')
  }
  // Agreeing with every statement is not the same as scoring high: the reversed ones cancel it.
  const yes = score(answers(() => 5))
  for (const d of DOMAINS) assert.ok(yes.domains[d] >= 0.2 && yes.domains[d] <= 0.8)
  // One domain only: extraverted answers, the rest neutral.
  const e = score(answers((i) => (i.domain === 'extraversion' ? (i.key === 1 ? 4 : 2) : 3)))
  assert.equal(e.domains.extraversion, 0.75)
  assert.equal(e.domains.openness, 0.5)
  assert.throws(() => score([1, 2, 3]))
  assert.throws(() => score(answers((i) => (i.n === 7 ? 6 : 3))))
})

const persona = (p: Partial<Persona> = {}): Persona => ({
  handle: 'ada',
  name: 'Ada',
  provenance: { kind: 'other', consent: { status: 'not-required' } },
  ...p,
})

test('a persona validates, and says what is wrong when it does not', () => {
  assert.deepEqual(validate(persona()), [])
  assert.ok(validate(persona({ handle: 'A' }))[0].startsWith('handle'))
  assert.ok(validate(persona({ bio: 'x'.repeat(281) })).some((e) => e.startsWith('bio')))
  assert.ok(validate(persona({ provenance: { kind: 'self', consent: { status: 'not-required' } } })).some((e) => e.includes('living person')))
  assert.ok(validate(persona({ provenance: { kind: 'self', consent: { status: 'recorded' } } })).some((e) => e.includes('consent.by')))
  assert.ok(validate(persona({ provenance: { kind: 'historical', consent: { status: 'not-required' } } })).some((e) => e.includes('sources')))
  assert.ok(validate(persona({ ocean: { domains: { openness: 2, conscientiousness: 0, extraversion: 0, agreeableness: 0, neuroticism: 0 }, source: 'test' } })).length >= 2)
})

test('a persona compiles to a short prompt that says it is an AI', () => {
  const einstein = compile(
    persona({
      handle: 'einstein',
      name: 'Einstein',
      role: 'Physicist',
      bio: 'Theoretical physicist; examined patents in Bern.',
      ocean: { domains: { openness: 0.95, conscientiousness: 0.6, extraversion: 0.4, agreeableness: 0.6, neuroticism: 0.3 }, source: 'authored' },
      voice: { style: 'thought experiments', tone: 'gentle, wry' },
      expertise: ['relativity', 'statistical mechanics'],
      boundaries: ['legal advice'],
      provenance: { kind: 'historical', basedOn: 'Albert Einstein (1879-1955)', sources: ['https://en.wikipedia.org/wiki/Albert_Einstein'], consent: { status: 'not-required' } },
    }),
  )
  assert.match(einstein, /AI simulation based on public sources of Albert Einstein/)
  assert.match(einstein, /temperament: .*curious/)
  assert.match(einstein, /never: legal advice/)
  assert.ok(tokens(einstein) < 220, `compact: ${tokens(einstein)} tokens`)
  const self = compile(persona({ name: 'Zee', provenance: { kind: 'self', consent: { status: 'recorded', by: 'sub-1' } } }))
  assert.match(self, /AI agent of Zee; you are not Zee/)
  assert.ok(tokens(self) < 120)
})
