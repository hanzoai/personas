import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { companyDefaults } from './index.ts'
import { devConfigFiles } from './dev.ts'

test('Dev preset has Vi at entry and one config per canonical role, without permission overrides', () => {
  const bundle = companyDefaults()
  const files = devConfigFiles(bundle)
  assert.equal(Object.keys(files).length, 33)
  assert.match(files['config.toml'], /developer_instructions = "You are Vi,/)
  assert.match(files['config.toml'], /max_concurrent_threads_per_session = 4/)
  for (const m of bundle.members) {
    assert.ok(files['config.toml'].includes(`[agents.${m.id}]`))
    assert.ok(files[`employees/${m.id}.toml`].includes(JSON.stringify(m.instructions)))
  }
  assert.match(files['employees/cyber.toml'], /model = "zen6-cyber"/)
  assert.ok(files['employees/lang.toml'])
  assert.ok(!files['employees/loc.toml'])
  assert.ok(!Object.values(files).some(text => /^(approval_policy|sandbox_mode|mcp_servers)\s*[=.]/m.test(text)))
  assert.throws(() => devConfigFiles({ ...bundle, members: [] }), /entrypoint/)
  assert.throws(() => devConfigFiles({ ...bundle, members: [...bundle.members, bundle.members[0]] }), /duplicate/)
  assert.throws(() => devConfigFiles({ ...bundle, members: [...bundle.members, { ...bundle.members[0], id: '../bad' }] }), /invalid/)
})
