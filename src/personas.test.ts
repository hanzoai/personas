import { strict as assert } from 'node:assert'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { all, compile, get, getProfile, grouped, list, member, parse, parsePerson, people, score, speaks, team, tokens, validate, ITEMS, DOMAINS, type Persona } from './index.ts'
import { ROSTER, TOOLS } from '../tools/personas.ts'

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

test('the managed agents: thirty-two seats in six departments, each who the product shows and what the model is told', () => {
  const crew = team()
  assert.deepEqual(crew.map((m) => m.id).sort(), ROSTER.map((s) => s.id).sort())
  assert.deepEqual(grouped(crew).map((g) => [g.group, g.members.length]), [
    ['Executive & Management', 4],
    ['Revenue & Relationships', 6],
    ['Engineering & Intelligence', 7],
    ['Creative & Knowledge', 6],
    ['Financial & Commercial Infrastructure', 4],
    ['Governance & Protection', 5],
  ])
  assert.deepEqual(crew.map((m) => m.seat).sort((a, b) => a - b), Array.from({ length: 32 }, (_, i) => i + 1))
  for (const m of crew) {
    const seat = ROSTER[m.seat - 1]
    assert.deepEqual([m.name, m.group, m.role, m.owns], [seat.name, seat.group, seat.role, seat.owns], `${m.id} is the owner's seat ${m.seat}`)
    assert.equal(m.name.toLowerCase(), m.id)
    assert.match(m.model, /^enso(-[a-z]+)?$/)
    assert.ok(m.instructions.startsWith(`You are ${m.name}, ${m.role}.`), `${m.id}: opens with its name and function`)
    assert.ok(!/\bas an ai\b/i.test(m.instructions))
    assert.match(m.instructions, /\nhand-offs: /)
    assert.ok(tokens(m.instructions) <= 300, `${m.id}: ${tokens(m.instructions)} tokens`)
    assert.ok(m.greeting.includes(m.name) && m.greeting.length <= 180, `${m.id}: a greeting that says who it is`)
    assert.ok(m.tools.length >= 2 && m.tools.every((t) => t in TOOLS), `${m.id}: tools are real subsystems`)
    const line = m.instructions.split('\nhand-offs: ')[1] ?? ''
    const named = line.split('; ').map((h) => h.split(' for ')[0])
    assert.ok(named.length >= 3 && new Set(named).size === named.length, `${m.id}: three or more distinct hand-offs`)
    for (const n of named) assert.ok(n !== m.name && crew.some((o) => o.name === n), `${m.id} hands off to ${n}, who is not another member`)
  }
  assert.equal(new Set(crew.map((m) => m.role)).size, 32, 'a function of its own each')
  assert.equal(member('dev')?.name, 'Dev')
  assert.equal(member('nobody'), null)
  assert.equal(member('../README'), null)
  assert.equal(member('DEV'), null)
  assert.throws(() => parse('x', 'no front matter'))
})

test('every member carries a designed OCEAN profile with a reason for each domain, and a face', () => {
  for (const m of team()) {
    assert.ok(m.ocean, `${m.id} has OCEAN`)
    assert.equal(m.profile, 'designed')
    for (const d of DOMAINS) assert.ok(m.ocean[d] >= 0 && m.ocean[d] <= 1)
    assert.ok(m.ocean.conscientiousness >= 0.6 && m.ocean.neuroticism <= 0.4, `${m.id}: the role-wide floor and ceiling`)
    const spread = Math.max(...DOMAINS.map((d) => m.ocean![d])) - Math.min(...DOMAINS.map((d) => m.ocean![d]))
    assert.ok(spread >= 0.3, `${m.id}: a profile that says something`)
    const text = readFileSync(join(TEAM_DIR, `${m.id}.md`), 'utf8')
    for (const d of DOMAINS) assert.match(text, new RegExp(`\\nwhy_${d}: \\S.{10,}`), `${m.id}: why ${d}`)
    for (const file of [`${m.id}.svg`, `${m.id}.png`, `${m.id}@2x.png`]) assert.ok(existsSync(join(MEMOJI, file)), `assets/memoji/${file}`)
  }
  assert.deepEqual(readdirSync(MEMOJI).filter((f) => f.endsWith('.svg')).map((f) => f.slice(0, -4)).sort(), team().map((m) => m.id).sort(), 'no face without a member')
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
