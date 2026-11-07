# Hanzo Personas

Hanzo's thirty-four managed agents, a roster of 1,098 figures, and 153 personas written by
hand.

## The managed agents

For shared operating rules, explicit function boundaries, suggested success measures
and reviewable Hanzo Dev role configs, see [Company operating defaults](COMPANY.md).
These are opt-in guidance; permission enforcement stays with the host.

`team/<id>.md` is one of the thirty-four agents Hanzo manages, in six departments. They are
available to any org to enable, and none is on until it is enabled; everything else is what
people build with a persona (below). The front matter says who the member is, its department
(`group`), its place (`seat`; the first twelve also say `lead: true`, the grid a roster opens on), the function it fills (`role`), what it owns (`owns`), the
masters of its role it is drawn from (`exemplars`, roster ids), its five OCEAN scores, which
are their blend (`profile: exemplars`), with a reason for each (`why_*`), the cloud subsystems
it should use (`tools`), the role skills its agent carries (`skills`, names from the cloud's
skill catalogue) and its first message (`greeting`); the body is the system prompt that
reaches the model, word for word. The hanzo.ai chat and the cloud's agent registry both load these files
at a pinned tag: a new tag, pinned by both, is a change to what the agent says.

| Department | Agents |
|------------|--------|
| Executive & Management | Vi (CEO/Vision), Opera (Operations), Mana (Management/Product), Huma (Human Resources) |
| Revenue & Relationships | Sal (Sales), Mark (Marketing), Rev (Revenue), Su (Support), Cust (Customer Success), Com (Community) |
| Engineering & Intelligence | Dev (Development), IT (Information Technology), Cyber (Cybersecurity), QA (Quality Assurance), Data (Data & Analytics), Sci (Science & Research), Auto (Automation) |
| Creative & Knowledge | Des (Design), Art (Visual Art), Mo (Motion Pictures), Mu (Music & Audio), Doc (Documentation), Ed (Education), Lang (Languages & Translation) |
| Financial & Commercial Infrastructure | Fin (Finance), Proc (Procurement), Supply (Supply Chain), Corp (Corporate Development) |
| Governance & Protection | Law (Legal), Comp (Compliance), Risk (Risk Management), Audit (Internal Audit), Gov (Government Affairs) |

Each prompt is the persona compiled (`compile()`, with an `exemplars:` line, at most 340 tokens) plus a `hand-offs:` line
naming the agents it passes work to, so the thirty-four work as a team. Anything a person must
decide (a payment, a hire, a filing, a legal opinion) is a boundary in the member's own file.

`tools/personas.ts` writes the files: it asks a local OpenAI-compatible model for each seat's
spec as JSON constrained to a schema, validates it (ranges, names, lengths, the token budget),
retries with the errors, and renders the markdown. The markdown is the data after that: edit it,
and it is never regenerated over without `--force`. `tools/memoji.ts` draws the faces.

```markdown
---
name: Dev
group: Engineering & Intelligence
seat: 3
lead: true
role: Development
owns: code, engineering, software systems
model: enso
profile: exemplars
exemplars: dennis_ritchie, dijkstra, john_backus
openness: 0.84
conscientiousness: 0.80
extraversion: 0.25
agreeableness: 0.55
neuroticism: 0.37
why_openness: Ritchie turning B into C, Dijkstra inventing the semaphore ...
tools: code, git, ci, deploy
skills: dev, code-review
greeting: I am Dev. I write and ship software. What are we building or fixing?
---

You are Dev, Development. AI agent on Hanzo's agent team. Say so if asked.
bio: Hanzo's Development agent. It owns code, engineering, software systems.
exemplars: Ritchie, Dijkstra and Backus; work with their craft and judgement; you are a Hanzo agent, not them, and never claim their memories, quotes or acts.
...
hand-offs: QA for verifying a change before release; ...
```

Front matter is flat `key: value` lines with no comments or quotes, and the file uses LF line
endings. The file name is the member's stable handle (`dev`); `name` is what a person reads.

```typescript
import { team, member, people, compile, score, ITEMS } from '@hanzo/personas'   // Node: reads the files from disk
import { parse, parsePerson } from '@hanzo/personas/team.js'                     // any bundle: parse inlined text
import { score, ITEMS } from '@hanzo/personas/ocean.js'                          // the test, in the browser

team().map((m) => m.name)     // ['Art', 'Audit', 'Auto', ...], 34 seats
member('dev').instructions    // the system prompt
member('su').ocean            // { openness: 0.59, ... }, the blend of its exemplars
figure('david_ogilvy')        // a written figure as a Persona, OCEAN and facets included
blend([{ persona: figure('david_ogilvy')! }, { persona: figure('bill_bernbach')!, weight: 2 }])
```

```go
import "github.com/hanzoai/personas"

team, err := personas.Team()                  // embedded at build, sorted by ID
ogilvy, err := personas.Figure("david_ogilvy") // a written figure as a Profile
bernbach, err := personas.Figure("bill_bernbach")
mix, err := personas.Blend([]personas.Part{{Profile: ogilvy}, {Profile: bernbach, Weight: 2}})
```

The roster carries a name and a category. The personas carry Big Five and
NEO PI-R facets, and those are authored judgements about a documented life,
not measurements — nobody administered an inventory to Turing.

## Install

```bash
npm install github:hanzoai/personas#v1.0.5
go get github.com/hanzoai/personas@v1.2.2
```

## Usage

```javascript
import { list, get, getProfile, getPersonaMd } from '@hanzo/personas'

// List all persona slugs
const slugs = list()

// Load a persona (profile.json + PERSONA.md)
const feynman = get('feynman')
console.log(feynman.profile.ocean)  // { openness: 95, ... }
console.log(feynman.persona)         // "---\nname: Feynman\n..."

// JSON profile only
const linus = getProfile('linus')

// PERSONA.md only
const md = getPersonaMd('north-star')
```

## Structure

Each persona lives in `personas/<slug>/`:

```
personas/
  ada/
    profile.json    # compact JSON (OCEAN 0-100, tools, philosophy)
    PERSONA.md      # rich prose (Big Five 0.0-1.0, 30 NEO PI-R facets, quirks)
  feynman/
    profile.json
    PERSONA.md
  linus/
    profile.json    # JSON-only personas (no PERSONA.md yet)
```

**1,098 in the roster, 153 written.** A roster entry is `{id, name, category}`.

The other 696 once carried generated OCEAN scores and derived trait blocks.
They were removed: openness had mean 89.8 and sd 6.2 across all of them,
`work_methodology` took seven distinct values over 703 people, `cognitive_style`
was constant within 21 of 33 categories, and 83 profiles duplicated another
person's exactly. `enhancement_metadata` recorded `ocean_based: true,
linguistic_based: false` — every block below OCEAN was derived from OCEAN.
Numbers that are a function of a category are not a description of a person,
and leaving them in invites reading them as evidence.

### profile.json

```json
{
  "id": "feynman",
  "name": "Richard Feynman",
  "category": "pioneer",
  "ocean": { "openness": 95, "conscientiousness": 72, "extraversion": 80, "agreeableness": 50, "neuroticism": 30 },
  "philosophy": "If you can't explain it simply, you don't understand it",
  "tools": { "essential": ["read", "write", "think"], "domains": ["physics", "pedagogy"] }
}
```

### PERSONA.md

Rich persona with 30 NEO PI-R trait facets, HEXACO honesty-humility,
productive role mapping, cognitive style, working patterns, values, and
documented quirks sourced from primary materials.

See [personas/feynman/PERSONA.md](personas/feynman/PERSONA.md) for an example.

## Categories

| Category | Count | Examples |
|----------|-------|---------|
| Pioneers | 12 | Ada Lovelace, Grace Hopper, Alan Turing |
| Language creators | 20 | Guido van Rossum, Yukihiro Matsumoto |
| Systems | 15 | Linus Torvalds, Ken Thompson |
| AI/ML | 15 | Geoffrey Hinton, Yann LeCun |
| Web | 15 | Tim Berners-Lee, Brendan Eich |
| Security | 10 | Bruce Schneier, Phil Zimmermann |
| Thinkers | 300+ | Feynman, Tesla, Dijkstra, Jobs |
| Archetypes | 5 | North Star, Engineer, Analyst, Mentor, Creative |
| Real people | 1 | Zeekay |

## Framework

For loaders (Rust, TypeScript, Python), schemas, and validation tools see
[@hanzo/persona](https://github.com/hanzoai/persona).

## Research basis

- **Big Five** (Costa & McCrae, 1992) — OCEAN traits
- **NEO PI-R** (Costa & McCrae, 1992) — 30 facet subscales
- **HEXACO** (Ashton & Lee, 2007) — Honesty-Humility factor
- **Belbin team roles** (1981) — productive role mapping

## License

MIT OR Apache-2.0, at your option — see [HIP-0137](https://github.com/hanzoai/hips/blob/main/HIPs/hip-0137-one-license.md).

## The people

`people/<id>.md` is a person who leads the team and the agent that speaks for their
public role: Antje Worring (CEO) and Zach Kelling (Founding CTO). It is a persona of a
LIVING person, so a chat with it is offered only once the file says `consent: recorded`
with `consent_by` (their IAM subject) and `consent_at`; `speaks(person)` is that rule.
A commit by the person that flips the line is the record. Until then the file is
`consent: pending` and the agent is not offered.

## A persona, an agent, and the schema

`src/persona.ts` is the one schema (`schema/persona.schema.json` is the same in JSON
Schema): identity, a craft line, OCEAN scores (0..1) with how they came to be (`test`,
`authored`, `designed`, `exemplars`), the exemplars a blend is drawn from, voice, expertise,
values, boundaries, knowledge, links, provenance
(`self`, `team`, `historical`, `fictional`, `other`; a consent record for a living
person; public sources for a historical one), a license and a sharing state. An agent is
a persona with a model, tools, skills, memory and a permission mode. `compile(persona)`
is the one function that turns a persona into a system prompt, as `key: value` lines
under 220 tokens for a full persona; every surface calls it.

A figure's persona says "AI simulation based on public sources" and lists them; a
person's agent says it is an AI and not them.

`blend(parts)` (Go: `Blend`) is the one way to draw an agent from several personas. Each part
is a persona and an optional weight (1 when omitted); the result is the weighted mean of their
five domains, and of their facets when every part states the same ones, with every part kept
as an exemplar: its handle, name, share of the scores, bio and craft. It refuses what it cannot
average honestly: no parts, a weight that is not positive, a persona twice, one without scores,
parts stating different facets, and a living person who has not recorded consent. A blended
persona says `ocean.source: 'exemplars'` and lists its `exemplars`, and `compile()` names them,
tells the agent to work with their craft and judgement, and says it is not them and never
claims their memories, quotes or acts.

`figure(slug)` (Go: `Figure`) reads a written PERSONA.md as a Persona. A figure with a `died`
year is historical; one without is a living person, pending until the file records
`consent: recorded` with `consent_by` and `consent_at`, and a blend refuses them until then.

## The OCEAN test

`score(answers)` scores Goldberg's IPIP Big-Five Factor Markers: 50 statements, ten to
a domain, answered 1 to 5, reverse-keyed ones flipped, each domain on 0..1. The IPIP is
public domain (ipip.ori.org); nothing is from a proprietary inventory.

- Goldberg, L. R. (1992). The development of markers for the Big-Five factor structure.
  *Psychological Assessment*, 4, 26-42.
- Goldberg, L. R. (1999). A broad-bandwidth, public domain, personality inventory
  measuring the lower-level facets of several five-factor models. In *Personality
  Psychology in Europe*, 7, 7-28.

Bands are read against the scale's midpoint, not a population: no single norm table is
published for this form, so a result describes how a person answered. It is not a
percentile and not a diagnosis.

## Exemplar profiles for the managed team

Each of the thirty-four carries `profile: exemplars`: its five domain scores are the equal blend
of three exemplars, masters of its role who have died, chosen for how well their working lives
are documented, so none needs a consent record (`EXEMPLARS` in tools/personas.ts). Every
exemplar has a written PERSONA.md whose `## OCEAN analysis` gives each domain and each of the
thirty facets a reason from documented behaviour, citing its `## Sources`, and each seat's
`why_*` says what in its exemplars' record puts the score there and why that fits the role. The
scores are judgements about those people, not targets for the role: where the masters of a
craft were anxious or abrasive, the seat's blend says so.

A seat's `skills` are role skills the cloud serves (hanzo-inc/cloud `apps/skills`): `dev`
(Ponytail's senior-dev mode), `code-review` (the quality review, with its security pass) and
`ui`. The cloud attaches each to the seat's agent as `skill_<name>`.

## Avatars

`assets/memoji/<id>.svg` (and `.png`, `@2x.png`) for the thirty-four, drawn from one set of
parts by `node tools/memoji.ts` (a ground in its department's colour, a badge for its function); `assets/people/` holds the founders' photographs.

## Build and test

```
npm install && npm run build && npm test
```
