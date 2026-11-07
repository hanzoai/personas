/**
 * Several personas into one profile. Any agent can be drawn from more than one
 * persona: its OCEAN is the weighted mean of theirs, and it keeps who it was drawn
 * from, with each one's bio and craft. team.go's Blend is the same function in Go.
 */
import { DOMAINS, type Exemplar, type Ocean, type Persona, type Scores } from './persona.ts'

/** One persona in a blend and its weight. Weights are relative: 1 each when omitted. */
export interface Part {
  persona: Persona
  weight?: number
}

/** A blend: the mean scores, `source: 'exemplars'`, and the personas they came from. */
export interface Blend {
  ocean: Scores
  exemplars: Exemplar[]
}

/**
 * The weighted mean of the parts' OCEAN domains, and of their facets when every part
 * states the same facets, with each part as an exemplar whose weight is its share of
 * the total. Throws on no parts, a weight that is not a positive number, a persona
 * listed twice, a part without the five domain scores, parts that state different
 * facets, or a living person who has not recorded their consent.
 */
export function blend(parts: Part[]): Blend {
  if (!parts.length) throw new Error('blend: no personas')
  const weights = parts.map((p) => p.weight ?? 1)
  if (weights.some((w) => !Number.isFinite(w) || w <= 0)) throw new Error('blend: every weight is a positive number')
  const handles = parts.map((p) => p.persona.handle)
  if (new Set(handles).size !== handles.length) throw new Error('blend: a persona is listed twice')
  for (const { persona: p } of parts) {
    const { kind, consent } = p.provenance
    if ((kind === 'self' || consent.status === 'pending') && !(consent.status === 'recorded' && consent.by)) {
      throw new Error(`blend: ${p.handle} is a living person who has not recorded consent`)
    }
    if (!p.ocean || DOMAINS.some((d) => typeof p.ocean!.domains[d] !== 'number')) throw new Error(`blend: ${p.handle} has no OCEAN scores`)
  }
  const total = weights.reduce((a, w) => a + w, 0)
  const share = weights.map((w) => w / total)
  const mean = (score: (p: Persona) => number) => parts.reduce((a, { persona }, i) => a + share[i] * score(persona), 0)

  const keys = (p: Persona) => Object.keys(p.ocean!.facets ?? {}).sort().join(',')
  const first = keys(parts[0].persona)
  if (parts.some(({ persona }) => keys(persona) !== first)) throw new Error('blend: the personas state different facets')

  const ocean: Scores = {
    domains: Object.fromEntries(DOMAINS.map((d) => [d, mean((p) => p.ocean!.domains[d])])) as Ocean,
    source: 'exemplars',
  }
  if (first) ocean.facets = Object.fromEntries(first.split(',').map((f) => [f, mean((p) => p.ocean!.facets![f])]))
  return {
    ocean,
    exemplars: parts.map(({ persona: p }, i) => ({
      handle: p.handle,
      name: p.name,
      weight: share[i],
      ...(p.bio ? { bio: p.bio } : {}),
      ...(p.craft ? { craft: p.craft } : {}),
    })),
  }
}
