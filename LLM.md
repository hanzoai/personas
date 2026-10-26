# Hanzo Personas

## Overview
A roster of 1,044 figures (id, name, category) and 67 hand-written PERSONA.md
definitions carrying Big Five traits and NEO PI-R facets as authored judgement;
Hanzo's thirty-two managed agents (team/, six departments), the people who lead it (people/), the one
persona schema and compiler, and the public-domain IPIP OCEAN test (src/). README.md
says what each is and the rules (consent for a living person; designed profiles).

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
