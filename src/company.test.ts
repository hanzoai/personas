import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { companyDefaults, companyPolicy, team } from './index.ts'
import { buildCompanyDefaults, composeCompanyInstructions } from './company.ts'

test('company defaults cover exactly the existing 32 seats and six departments', () => {
  const defaults = companyDefaults()
  assert.equal(defaults.schemaVersion, 1)
  assert.equal(defaults.entrypoint, 'vi')
  assert.equal(defaults.members.length, 32)
  assert.equal(new Set(defaults.members.map(m => m.group)).size, 6)
  assert.deepEqual(defaults.members.map(m => m.id), team().map(m => m.id))
  assert.deepEqual(Object.keys(companyPolicy().members).sort(), team().map(m => m.id))
  assert.ok(defaults.members.every(m => !m.enabledByDefault))
  assert.equal(defaults.members.find(m => m.id === 'audit')?.reportsTo, 'human-owner')
  assert.ok(defaults.members.filter(m => m.id !== 'audit').every(m => m.reportsTo === 'vi'))
})

test('runtime instructions retain the persona and add boundaries without granting tools', () => {
  const defaults = companyDefaults()
  for (const m of defaults.members) {
    assert.ok(m.instructions.startsWith(team().find(raw => raw.id === m.id)!.instructions))
    assert.ok(m.instructions.includes('Delegation never expands authority'))
    assert.ok(m.instructions.includes('completion requires verification evidence'))
    assert.ok(m.instructions.includes('only data the current principal may access'))
    assert.ok(m.successMeasures.length > 0)
    assert.deepEqual(m.requestedTools, team().find(raw => raw.id === m.id)!.tools)
    assert.ok(!('grantedTools' in m))
  }
  const policy = companyPolicy()
  const cyber = defaults.members.find(m => m.id === 'cyber')!
  assert.equal(cyber.model, 'zen6-cyber')
  assert.ok(defaults.members.filter(m => m.id !== 'cyber').every(m => m.model === team().find(raw => raw.id === m.id)!.model))
  assert.match(cyber.instructions, /authorized targets/)
  assert.match(cyber.instructions, /outside the worker/)
  assert.match(defaults.members.find(m => m.id === 'lang')!.instructions, /sole owner/)
  assert.match(defaults.members.find(m => m.id === 'audit')!.instructions, /including Vi/)
  assert.throws(() => composeCompanyInstructions({ ...team()[0], id: 'loc' }, policy), /no company policy/)
  assert.throws(() => composeCompanyInstructions({ ...team()[0], id: 'constructor' }, policy), /no company policy/)
  assert.throws(() => buildCompanyDefaults([...team(), team()[0]], policy), /match the member roster/)
  assert.throws(() => buildCompanyDefaults(team().slice(1), policy), /match the member roster/)
  assert.throws(() => buildCompanyDefaults([], policy), /entrypoint/)
})

test('callers cannot mutate subsequent defaults or policy reads', () => {
  const first = companyDefaults()
  first.members[0].successMeasures.length = 0
  first.members[0].requestedTools.length = 0
  companyPolicy().rules.length = 0
  const second = companyDefaults()
  assert.ok(second.members[0].successMeasures.length > 0)
  assert.ok(second.members[0].requestedTools.length > 0)
  assert.ok(companyPolicy().rules.length > 0)
})
