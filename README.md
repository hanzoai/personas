# Hanzo Personas

712 personality profiles for AI agents, grounded in personality psychology.

## Install

```bash
npm install @hanzo/personas
```

## Usage

```javascript
import { list, get, getProfile, getPersonaMd } from '@hanzo/personas'

// List all 712 persona slugs
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

**712 total** — 14 have deep PERSONA.md files, all have JSON profiles.

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

MIT
