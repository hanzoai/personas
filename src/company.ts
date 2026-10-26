import type { Member } from './team.ts'

/** Versioned operating guidance. Requested capabilities are never permission grants. */
export interface CompanyPolicy {
  schemaVersion: 1
  entrypoint: 'vi'
  rules: string[]
  members: Record<string, {
    /** Optional function-specific model; activation must verify it is served. */
    model?: string
    boundary: string
    successMeasures: string[]
  }>
}

export interface EmployeeDefault {
  id: string
  name: string
  group: string
  seat: number
  role: string
  owns: string
  model: string
  enabledByDefault: false
  reportsTo: 'vi' | 'human-owner'
  requestedTools: string[]
  successMeasures: string[]
  instructions: string
}

/** Compose guidance for an opted-in company session; the raw persona stays unchanged. */
export function composeCompanyInstructions(member: Member, policy: CompanyPolicy): string {
  if (policy.schemaVersion !== 1) throw new Error('unsupported company policy version')
  const own = Object.hasOwn(policy.members, member.id) ? policy.members[member.id] : undefined
  if (!own) throw new Error(`no company policy for ${member.id}`)
  return `${member.instructions}\n\nCompany operating rules:\n${policy.rules.map(r => `- ${r}`).join('\n')}\nFunction boundary: ${own.boundary}\nSuccess measures: ${own.successMeasures.join('; ')}.`
}

/** Build portable defaults for Dev or Cloud. Enabling and authorizing remain host operations. */
export function buildCompanyDefaults(members: Member[], policy: CompanyPolicy): {
  schemaVersion: 1
  entrypoint: 'vi'
  members: EmployeeDefault[]
} {
  if (policy.schemaVersion !== 1 || policy.entrypoint !== 'vi' || !members.some(m => m.id === policy.entrypoint)) {
    throw new Error('unsupported company policy or missing entrypoint')
  }
  const ids = members.map(m => m.id).sort()
  if (new Set(ids).size !== ids.length || JSON.stringify(ids) !== JSON.stringify(Object.keys(policy.members).sort())) {
    throw new Error('company policy must match the member roster exactly')
  }
  return {
    schemaVersion: 1,
    entrypoint: policy.entrypoint,
    members: members.map(m => ({
      id: m.id, name: m.name, group: m.group, seat: m.seat, role: m.role, owns: m.owns, model: policy.members[m.id].model ?? m.model,
      enabledByDefault: false,
      reportsTo: m.id === 'audit' ? 'human-owner' : 'vi',
      requestedTools: [...m.tools],
      successMeasures: [...policy.members[m.id].successMeasures],
      instructions: composeCompanyInstructions(m, policy),
    })),
  }
}
