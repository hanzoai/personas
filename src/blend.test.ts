import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { blend, compile, DOMAINS, FACETS, figure, parseFigure, validate, type Ocean, type Persona } from './index.ts'

const SCHEMA = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'schema', 'persona.schema.json'), 'utf8'))

const facets = (v: number) => Object.fromEntries(DOMAINS.flatMap((d) => FACETS[d].map((f) => [f, v])))
const one = (handle: string, v: number, extra: Partial<Persona> = {}): Persona => ({
  handle,
  name: handle.toUpperCase(),
  bio: `${handle} bio`,
  craft: `${handle} craft`,
  ocean: { domains: Object.fromEntries(DOMAINS.map((d) => [d, v])) as Ocean, facets: facets(v), source: 'authored' },
  provenance: { kind: 'historical', sources: ['a book'], consent: { status: 'not-required' } },
  ...extra,
})

test('blend: the weighted mean of domains and facets, the weights normalised to shares', () => {
  const b = blend([{ persona: one('aa', 0.2), weight: 1 }, { persona: one('bb', 0.6), weight: 3 }])
  for (const d of DOMAINS) assert.ok(Math.abs(b.ocean.domains[d] - 0.5) < 1e-12, d)
  for (const f of FACETS.openness) assert.ok(Math.abs(b.ocean.facets![f] - 0.5) < 1e-12, f)
  assert.equal(b.ocean.source, 'exemplars')
  assert.deepEqual(b.exemplars.map((e) => [e.handle, e.weight, e.bio, e.craft]), [
    ['aa', 0.25, 'aa bio', 'aa craft'],
    ['bb', 0.75, 'bb bio', 'bb craft'],
  ])
  const equal = blend([{ persona: one('aa', 0.1) }, { persona: one('bb', 0.4) }, { persona: one('cc', 0.7) }])
  for (const d of DOMAINS) assert.ok(Math.abs(equal.ocean.domains[d] - 0.4) < 1e-12, 'no weights is the equal blend')
  assert.deepEqual(equal.exemplars.map((e) => e.weight), [1 / 3, 1 / 3, 1 / 3])
  const scaled = blend([{ persona: one('aa', 0.2), weight: 10 }, { persona: one('bb', 0.6), weight: 30 }])
  assert.deepEqual(scaled.ocean.domains, b.ocean.domains, 'only the ratio of the weights matters')
})

test('blend: refuses what it cannot average honestly', () => {
  assert.throws(() => blend([]), /no personas/)
  assert.throws(() => blend([{ persona: one('aa', 0.5), weight: 0 }]), /positive/)
  assert.throws(() => blend([{ persona: one('aa', 0.5), weight: -1 }]), /positive/)
  assert.throws(() => blend([{ persona: one('aa', 0.5), weight: Number.NaN }]), /positive/)
  assert.throws(() => blend([{ persona: one('aa', 0.5) }, { persona: one('aa', 0.6) }]), /twice/)
  assert.throws(() => blend([{ persona: one('aa', 0.5) }, { persona: one('bb', 0.5, { ocean: undefined }) }]), /no OCEAN/)
  const fewer = one('bb', 0.5)
  delete fewer.ocean!.facets!.fantasy
  assert.throws(() => blend([{ persona: one('aa', 0.5) }, { persona: fewer }]), /different facets/)
  const none = one('cc', 0.5)
  delete none.ocean!.facets
  assert.throws(() => blend([{ persona: one('aa', 0.5) }, { persona: none }]), /different facets/)
  assert.equal(blend([{ persona: none }]).ocean.facets, undefined, 'no facets stated, none blended')
})

test('blend: a living person is drawn on only with their recorded consent', () => {
  const living = (consent: Persona['provenance']['consent']) => one('ll', 0.5, { provenance: { kind: 'self', consent } })
  assert.throws(() => blend([{ persona: living({ status: 'pending' }) }]), /living person/)
  assert.throws(() => blend([{ persona: living({ status: 'recorded' }) }]), /living person/, 'recorded names who recorded it')
  assert.equal(blend([{ persona: living({ status: 'recorded', by: 'sub-1' }) }]).exemplars[0].handle, 'll')

  const torvalds = figure('torvalds')!
  assert.equal(torvalds.provenance.kind, 'self', 'a figure without a died year is a living person')
  assert.equal(torvalds.provenance.consent.status, 'pending')
  assert.throws(() => blend([{ persona: figure('david_ogilvy')! }, { persona: torvalds }]), /torvalds is a living person/)

  const text = (lines: string) => `---\nname: Someone\n${lines}traits:\n  openness: 0.5\n  conscientiousness: 0.5\n  extraversion: 0.5\n  agreeableness: 0.5\n  neuroticism: 0.5\n---\n\n# Someone\n`
  assert.throws(() => blend([{ persona: parseFigure('someone', text('')) }]), /living person/)
  assert.equal(parseFigure('someone', text('died: 1900\n')).provenance.kind, 'historical')
  const agreed = parseFigure('someone', text('consent: recorded\nconsent_by: sub-9\nconsent_at: 2026-11-07T00:00:00Z\n'))
  assert.deepEqual(agreed.provenance.consent, { status: 'recorded', by: 'sub-9', at: '2026-11-07T00:00:00Z' })
  assert.equal(blend([{ persona: agreed }]).exemplars.length, 1)
})

test('schema: a blended persona validates; exemplars are named, weighed and counted once', () => {
  const b = blend([{ persona: one('aa', 0.2) }, { persona: one('bb', 0.6) }])
  const p: Persona = { handle: 'mixed', name: 'Mixed', ...b, provenance: { kind: 'team', consent: { status: 'not-required' } } }
  assert.deepEqual(validate(p), [])
  assert.ok(validate({ ...p, exemplars: undefined }).some((e) => e.includes('name the exemplars')))
  assert.ok(validate({ ...p, exemplars: [{ ...b.exemplars[0], weight: 0.9 }, b.exemplars[1]] }).some((e) => e.includes('sum to 1')))
  assert.ok(validate({ ...p, exemplars: [b.exemplars[0], { ...b.exemplars[0] }] }).some((e) => e.includes('once')))
  assert.ok(validate({ ...p, exemplars: [{ ...b.exemplars[0], weight: 0 }, { ...b.exemplars[1], weight: 1 }] }).some((e) => e.includes('weight above 0')))
  assert.ok(validate({ ...p, craft: 'x'.repeat(101) }).some((e) => e.startsWith('craft')))
  assert.ok(validate({ ...p, ocean: { ...p.ocean!, facets: { fantasy: 2 } } }).some((e) => e.startsWith('ocean.facets.fantasy')))

  assert.ok(SCHEMA.properties.ocean.properties.source.enum.includes('exemplars'))
  assert.deepEqual(SCHEMA.properties.exemplars.items.required, ['handle', 'name', 'weight'])
  assert.deepEqual(SCHEMA.then, { required: ['exemplars'] }, 'scores from exemplars name them')
  assert.equal(SCHEMA.properties.craft.maxLength, 100)
})

test('compile: a blend names its exemplars and says it is not them', () => {
  const b = blend([{ persona: one('aa', 0.2) }, { persona: one('bb', 0.6) }, { persona: one('cc', 0.4) }])
  const team = compile({ handle: 'mixed', name: 'Mixed', ...b, provenance: { kind: 'team', consent: { status: 'not-required' } } })
  assert.match(team, /\nexemplars: AA, BB and CC; work with their craft and judgement; you are a Hanzo agent, not them, and never claim their memories, quotes or acts\.\n/)
  const other = compile({ handle: 'mixed', name: 'Mixed', ...b, provenance: { kind: 'other', consent: { status: 'not-required' } } })
  assert.match(other, /you are an AI agent, not them/)
})
