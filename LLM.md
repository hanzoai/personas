# Hanzo Personas

## Overview
A roster of 1,100 figures (id, name, category) and 155 hand-written PERSONA.md
definitions carrying Big Five traits and NEO PI-R facets as authored judgement;
Hanzo's twenty-four managed agents (team/, six departments; the first twelve seats are the grid a roster opens on), the people who lead it (people/), the one
persona schema and compiler, and the public-domain IPIP OCEAN test (src/). README.md
says what each is and the rules (consent for a living person; exemplar profiles).

## Exemplars, blends and skills
- `src/blend.ts` `blend(parts)` and `blend.go` `Blend` are the one way to combine personas: the
  weighted mean of domains and facets, each part kept as an `Exemplar` (handle, name, share,
  bio, craft). A living person (a figure with no `died` line) is refused until the file records
  `consent: recorded` + `consent_by`.
- `src/figure.ts` `parseFigure` / `figure.go` `ParseFigure`, `Figure` read a PERSONA.md front
  matter (the YAML subset the files use) into the schema; Go embeds `personas/*/PERSONA.md`.
- Each seat's three exemplars are `EXEMPLARS` in tools/personas.ts, its role skills `SKILLS`
  (names from hanzo-inc/cloud apps/skills builtin.go: `dev`, `code-review`, `ui`). Its OCEAN is
  the exemplars' blend, rounded to two places; `why_*` lines come from the spec. Regenerate a
  seat with `node tools/personas.ts --spec <specs.json> --force`.
- A seat's face: `assets/memoji/<id>.svg` from tools/memoji.ts (LOOKS, EMBLEM); `<id>.png` and
  `@2x.png` are the owner's roster avatar for the seat, PIL `resize` LANCZOS to 256 and 512,
  `save(optimize=True)` (reproduces every committed portrait byte for byte).
- An exemplar's PERSONA.md carries `born`, `died`, `bio`, `craft`, the 5 traits and 30 facets,
  and ends with `## OCEAN analysis` (35 lines, each citing `## Sources` by number) and
  `## Sources`. `src/personas.test.ts` holds every exemplar to that.

## Tech Stack
- **Language**: TypeScript (src/ builds to dist/); Go reads team/ for the cloud

## Build & Run
```bash
npm install && npm run build
npm test            # node --test "src/*.test.ts" && go test ./...
```

## Structure
```
personas/
  README.md
  index.js
  package.json
  personas/
  test.js
```

## Key Files
- `README.md` -- Project documentation
- `package.json` -- Dependencies and scripts

## License

Relicensed from BSD-3-Clause to the dual `MIT OR Apache-2.0` grant under
HIP-0137 ("One License", `hanzoai/hips`). `LICENSE` states the dual grant;
`LICENSE-MIT` and `LICENSE-APACHE` carry the full texts. The original BSD
copyright line — `2025-2026, Hanzo AI, Inc.` — carries over verbatim into
`LICENSE-MIT`: the relicense changes the grant, not the copyright record.
