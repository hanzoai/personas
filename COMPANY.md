# Company operating defaults

The canonical company has 32 seats in the six departments defined by `team/`.
Lang owns languages, translation and localization. There is no Loc seat.
Vi is the founder's entry point. Audit reports independently to the human owner
or governance body; the other seats coordinate through Vi.

`company.json` adds shared operating rules, function boundaries and suggested
success measures. It does not create accounts, activate agents, grant tools,
run workflows or enforce permissions. The host owns those controls.

Cyber's company default selects `zen6-cyber` for the private beta. It has no
silent fallback. The host must refuse activation until that exact model is served;
a catalog entry alone does not prove inference or evaluation readiness. Other
employees keep their persona model. This setting does not publish model weights
or expose an internal security backend.

## Use the defaults

```ts
import { companyDefaults, devConfigFiles } from '@hanzo/personas'

const company = companyDefaults()
// 32 disabled-by-default employees; tools are requestedTools, never grants.
const files = devConfigFiles(company)
// filename -> TOML; writes nothing. Review before installing in .hanzo/dev/.
```

```go
company, err := personas.CompanyDefaults()
// Handle err. Seed opted-in orgs from company.Members, preserving customized rows.
```

`Team()`, `team()`, `member()` and `parse()` retain the raw persona instructions.
The new defaults append the operating rules and the seat's function boundary.
Do not apply the company policy to historical figures or real-person personas.

From this source checkout:

```sh
npm run company:defaults --silent > company-defaults.json
npm run dev:defaults --silent > dev-config-files.json
```

The Dev export uses the existing `[agents.<handle>]` role configuration and
`developer_instructions`. Its top-level instructions select Vi. Review and merge
`config.toml` into a project's `.hanzo/dev/config.toml` and place the employee
files beside it under `employees/`. Preserve existing settings. Installing this
opt-in preset enables delegation, capped at four concurrent child threads per
session; it does not start 32 background agents. The cap is not an organization
budget or a limit across multiple sessions. The export changes no sandbox,
approval policy, credentials or MCP connections. It is a configuration template,
not a new `dev company` command or a live company service.

Consumers must pin a release containing these APIs before using them. Publishing
this package, updating the Cloud dependency, migrating org defaults and deploying
are separate steps. Do not overwrite user-edited personas during migration.

## Ownership and handoffs

- Vi sets strategy; Mana sets product priorities and project acceptance; Opera
  runs the operating cadence; Auto implements durable workflows.
- Sal closes new business; Cust owns adoption, retention and renewal coordination;
  Rev owns pricing and billing; Fin owns the ledger and cash reconciliation.
- Cyber sets security requirements and runs authorized assessments; IT implements
  internal access changes; Dev fixes code; QA validates changes; Audit tests
  controls independently.
- Doc owns reference material; Edu owns training; Lang owns translated language.
- Proc owns sourcing and purchasing; Supply owns fulfillment and inventory.
- Law owns legal analysis; Comp owns compliance controls; Risk owns risk treatment
  tracking; Gov owns public-policy engagement.

Delegation changes the executing agent, never the initiating principal or its
authority. A delegated task keeps its parent work order, purpose and grant scope.
The function owner remains accountable when another agent supplies a deliverable.

## Host implementation contract

Persist work orders with one accountable owner, objective, acceptance criteria,
dependencies, state, budget, next action, evidence references and the initiating
principal's org/project and grant references. Suggested states are `proposed`,
`ready`, `running`, `awaiting_approval`, `blocked`, `completed`, `failed`, `cancelled`.
These are guidance for a host implementation, not a state machine in this package.

The host must enforce membership and resource permissions at every effect and on
resume. A shared company data layer is not universal access: HR, financial, legal
and security records keep their access rules. Pass references to secrets rather
than their values. Enforce budgets across delegated work, record tool and model
costs separately, and stop or escalate when authority expires.

Low-risk reversible work can run within existing authority. Higher-impact work
needs explicit approval or an existing grant covering its action, object, limits
and expiry. A narrower boundary in a persona still applies. Idempotency keys,
reconciliation after ambiguous outcomes, bounded retries, checkpoints and
cancellation belong in the durable runtime, not solely in the prompt.

Audit needs a separate authorized reporting path to the human owner. A `reportsTo`
field does not create independence: auditees must not control finding disposition,
evidence deletion or audit access. Completion requires verification against the
work order's acceptance criteria. Suggested success measures need definitions and
source records in the host; this package invents no measured performance.
