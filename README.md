# Hanzo Personas

Hanzo's core agent team, a roster of 1,044 figures, and 67 personas written by
hand.

## The core team

`team/<id>.md` is one member of the agent team every Hanzo org starts with. The
front matter says who the member is; the body is the system prompt that reaches
the model, word for word. The hanzo.ai chat and the cloud's agent registry both
load these files, so a change here is a change to what the agent says.

| Name | Role | Hands off to |
|------|------|--------------|
| Dev | Engineer | Des, Leo, Vi, Feynman, Einstein |
| Des | Designer | Dev, Leo, Nora, Maya |
| Vi | Infrastructure & Reliability | Dev, Leo, Maya, Einstein |
| Feynman | Research | Dev, Einstein, Maya |
| Einstein | Legal & IP Counsel | Maya, Dev, Vi, Feynman |
| Maya | Operations & Coordination | everyone |
| Nora | Customer Support | Leo, Dev, Des, Maya, Einstein, Vi |
| Leo | Quality & Accessibility | Dev, Des, Vi, Nora |

```markdown
---
name: Dev          # the name a person sees, capitalized
role: Engineer     # the part on the team
model: enso        # an Enso tier
persona: feynman   # optional: the roster entry the member is modelled on
---

You are Dev, the engineer on Hanzo's agent team. ...
```

The file name is the member's stable handle (`dev`); the name is what a person
reads (`Dev`). Feynman and Einstein are Hanzo agents modelled on the two
physicists, and say so when asked.

```javascript
import { team, member } from '@hanzo/personas'   // Node: reads team/ from disk
import { parse } from '@hanzo/personas/team.js'  // any bundle: parse inlined text

team().map((m) => m.name)     // ['Des', 'Dev', 'Einstein', ...]
member('dev').instructions    // the system prompt
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
npm install @hanzo/personas       # or github:hanzoai/personas#v1.0.3
go get github.com/hanzoai/personas@v1.0.3
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
