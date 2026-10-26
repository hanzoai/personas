# Hanzo Personas

Hanzo's thirty-two managed agents, a roster of 1,044 figures, and 67 personas written by
hand.

## The managed agents

`team/<id>.md` is one of the thirty-two agents Hanzo manages, in six departments. They are
available to any org to enable, and none is on until it is enabled; everything else is what
people build with a persona (below). The front matter says who the member is, its department
(`group`), its place (`seat`), the function it fills (`role`), what it owns (`owns`), its five
designed OCEAN scores with a reason for each (`why_*`), the cloud subsystems it should use
(`tools`) and its first message (`greeting`); the body is the system prompt that reaches the
model, word for word. The hanzo.ai chat and the cloud's agent registry both load these files
at a pinned tag: a new tag, pinned by both, is a change to what the agent says.

| Department | Agents |
|------------|--------|
| Executive & Management | Vi (CEO/Vision), Opera (Operations), Mana (Management/Product), Huma (Human Resources) |
| Revenue & Relationships | Sal (Sales), Mark (Marketing), Rev (Revenue), Su (Support), Cust (Customer Success), Com (Community) |
| Engineering & Intelligence | Dev (Development), IT (Information Technology), Cyber (Cybersecurity), QA (Quality Assurance), Data (Data & Analytics), Sci (Science & Research), Auto (Automation) |
| Creative & Knowledge | Des (Design), Art (Art & Video), Mu (Music & Audio), Doc (Documentation), Edu (Education), Lang (Languages & Translation) |
| Financial & Commercial Infrastructure | Fin (Finance), Proc (Procurement), Supply (Supply Chain), Corp (Corporate Development) |
| Governance & Protection | Law (Legal), Comp (Compliance), Risk (Risk Management), Audit (Internal Audit), Gov (Government Affairs) |

Each prompt is the persona compiled (`compile()`, at most 300 tokens) plus a `hand-offs:` line
naming the agents it passes work to, so the thirty-two work as a team. Anything a person must
decide (a payment, a hire, a filing, a legal opinion) is a boundary in the member's own file.

`tools/personas.ts` writes the files: it asks a local OpenAI-compatible model for each seat's
spec as JSON constrained to a schema, validates it (ranges, names, lengths, the token budget),
retries with the errors, and renders the markdown. The markdown is the data after that: edit it,
and it is never regenerated over without `--force`. `tools/memoji.ts` draws the faces.

```markdown
---
name: Dev
group: Engineering & Intelligence
seat: 11
role: Development
owns: code, engineering, software systems
model: enso
profile: designed
openness: 0.70
conscientiousness: 0.90
extraversion: 0.35
agreeableness: 0.55
neuroticism: 0.20
why_openness: Good engineering looks for the simpler design
tools: code, git, ci, deploy
greeting: I am Dev. I write and ship software. What are we building or fixing?
---

You are Dev, Development. AI agent on Hanzo's agent team. Say so if asked.
...
hand-offs: QA for verifying a change before release; ...
```

Front matter is flat `key: value` lines with no comments or quotes, and the file uses LF line
endings. The file name is the member's stable handle (`dev`); `name` is what a person reads.

```typescript
import { team, member, people, compile, score, ITEMS } from '@hanzo/personas'   // Node: reads the files from disk
import { parse, parsePerson } from '@hanzo/personas/team.js'                     // any bundle: parse inlined text
import { score, ITEMS } from '@hanzo/personas/ocean.js'                          // the test, in the browser

team().map((m) => m.name)     // ['Des', 'Dev', 'Einstein', ...]
member('dev').instructions    // the system prompt
member('su').ocean            // { openness: 0.6, ... }, a designed profile
```

```go
import "github.com/hanzoai/personas"

team, err := personas.Team() // embedded at build, sorted by ID
```

The roster carries a name and a category. The personas carry Big Five and
NEO PI-R facets, and those are authored judgements about a documented life,
not measurements — nobody administered an inventory to Turing.

## Install

```bash
npm install github:hanzoai/personas#v1.0.5
go get github.com/hanzoai/personas@v1.0.5
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

**1,044 in the roster, 67 written.** A roster entry is `{id, name, category}`.

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
Schema): identity, OCEAN scores (0..1) with how they came to be (`test`, `authored`,
`designed`), voice, expertise, values, boundaries, knowledge, links, provenance
(`self`, `team`, `historical`, `fictional`, `other`; a consent record for a living
person; public sources for a historical one), a license and a sharing state. An agent is
a persona with a model, tools, skills, memory and a permission mode. `compile(persona)`
is the one function that turns a persona into a system prompt, as `key: value` lines
under 220 tokens for a full persona; every surface calls it.

A figure's persona says "AI simulation based on public sources" and lists them; a
person's agent says it is an AI and not them.

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

## Designed profiles for the managed team

Each of the thirty-two carries `profile: designed`: five domain scores written for what its
function asks of its owner, not measured from a person, each with its reason in the file. They
follow the research: conscientiousness predicts performance in every job (Barrick & Mount, 1991,
*Personnel Psychology* 44(1)), so none is under 0.60 and the error-costly functions (finance,
audit, security, legal, QA) are highest; extraversion is highest where the work is persuading or
serving people (Barrick & Mount, 1991; Vinchur, Schippmann, Switzer & Roth, 1998, *J. Applied
Psychology* 83(4)); agreeableness is lowest where saying no is the job (audit, risk, negotiation);
emotional reactivity is low for all (Barrick, Stewart, Neubert & Mount, 1998, *J. Applied
Psychology* 83(3); Bell, 2007, *J. Applied Psychology* 92(3)).

## Avatars

`assets/memoji/<id>.svg` (and `.png`, `@2x.png`) for the thirty-two, drawn from one set of
parts by `node tools/memoji.ts` (a ground in its department's colour, a badge for its function); `assets/people/` holds the founders' photographs.

## Build and test

```
npm install && npm run build && npm test
```
