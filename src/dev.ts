import type { buildCompanyDefaults } from './company.ts'

/** A reviewable config tree for Hanzo Dev; writes nothing and never grants permissions. */
export function devConfigFiles(bundle: ReturnType<typeof buildCompanyDefaults>): Record<string, string> {
  const vi = bundle.members.find(m => m.id === bundle.entrypoint)
  if (!vi) throw new Error('company entrypoint is missing')
  const files: Record<string, string> = {}
  const config = [
    '# Opt-in company preset. Merge into .hanzo/dev/config.toml after review.',
    '# Permissions, credentials, budgets and tool policy remain host-controlled.',
    `developer_instructions = ${JSON.stringify(vi.instructions)}`,
    '', '[agents]', 'enabled = true', 'max_concurrent_threads_per_session = 4', '',
  ]
  const seen = new Set<string>()
  for (const m of bundle.members) {
    if (!/^[a-z]+$/.test(m.id) || seen.has(m.id)) throw new Error(`invalid or duplicate employee handle: ${m.id}`)
    seen.add(m.id)
    config.push(`[agents.${m.id}]`, `description = ${JSON.stringify(`${m.name}: ${m.owns}`)}`, `config_file = "employees/${m.id}.toml"`, '')
    files[`employees/${m.id}.toml`] = `# ${m.name}: ${m.role}\nmodel = ${JSON.stringify(m.model)}\ndeveloper_instructions = ${JSON.stringify(m.instructions)}\n`
  }
  files['config.toml'] = config.join('\n')
  return files
}
