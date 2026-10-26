/**
 * THE ONE PERSONA SCHEMA. A persona is who someone is (identity, how they tend to
 * act, how they sound, what they know and will not do); an agent is a persona put
 * to work (a model, tools, memory, permissions). Every surface (the chat's
 * `agent=`, the platform, Slack) compiles the same persona into the same prompt
 * (compile.ts), so a persona changes in one place.
 *
 * Scores are 0..1, as the 67 hand-written PERSONA.md files in this package state
 * them. schema/persona.schema.json is this file as JSON Schema.
 */

export const DOMAINS = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'] as const
export type Domain = (typeof DOMAINS)[number]

/** The five domain scores, each 0..1. */
export type Ocean = Record<Domain, number>

/** How a set of scores came to be. A `test` names its instrument; `authored` is somebody's judgement; `designed` is a role's profile written for a managed teammate. */
export interface Scores {
  domains: Ocean
  /** Facet scores 0..1 by facet name (`fantasy`, `order`, ...), where known. */
  facets?: Record<string, number>
  source: 'test' | 'authored' | 'designed'
  instrument?: { name: string; version: string; items: number; at?: string }
}

/** What a persona is of. A living person's is `self` (their own) and carries a recorded consent. */
export type Kind = 'self' | 'team' | 'historical' | 'fictional' | 'other'

/** The record that the person a persona is of has agreed to it. Written through their own IAM identity, never assumed. */
export interface Consent {
  status: 'recorded' | 'pending' | 'not-required'
  /** The person's IAM subject, when recorded. */
  by?: string
  /** RFC 3339 time it was recorded. */
  at?: string
}

export type Share = 'private' | 'org' | 'link' | 'market'

export interface Persona {
  /** Stable handle: lower case letters, digits and hyphens, 2..32. */
  handle: string
  name: string
  role?: string
  /** One or two sentences, at most 280 characters. */
  bio?: string
  /** A URL or an asset id. */
  avatar?: string
  ocean?: Scores
  voice?: { style?: string; tone?: string; vocabulary?: string[]; humor?: string }
  expertise?: string[]
  values?: string[]
  /** What the persona will not do or say. */
  boundaries?: string[]
  knowledge?: { title: string; url: string }[]
  links?: Record<string, string>
  provenance: {
    kind: Kind
    /** The author's IAM subject or handle. */
    author?: string
    /** For historical and fictional: who or what it is modelled on. */
    basedOn?: string
    /** For historical: the public sources. */
    sources?: string[]
    consent: Consent
  }
  license?: string
  share?: Share
}

/** A persona put to work. */
export interface Agent {
  persona: string | Persona
  /** An Enso tier or any model id the gateway serves. */
  model: string
  tools?: string[]
  skills?: string[]
  memory?: boolean
  /** `ask` stops for approval before it acts; `auto` does not. */
  permissions?: 'ask' | 'auto'
}

const HANDLE = /^[a-z0-9][a-z0-9-]{1,31}$/

/** The problems with a persona, as sentences a person can act on; empty when it is sound. */
export function validate(p: Persona): string[] {
  const out: string[] = []
  if (!HANDLE.test(p.handle ?? '')) out.push('handle: 2 to 32 lower-case letters, digits or hyphens')
  if (!p.name?.trim()) out.push('name: required')
  if ((p.bio ?? '').length > 280) out.push('bio: at most 280 characters')
  if (p.ocean) {
    for (const d of DOMAINS) {
      const v = p.ocean.domains?.[d]
      if (typeof v !== 'number' || v < 0 || v > 1) out.push(`ocean.${d}: a number from 0 to 1`)
    }
    if (p.ocean.source === 'test' && !p.ocean.instrument) out.push('ocean: a test names its instrument')
  }
  const k = p.provenance?.kind
  if (!k) out.push('provenance.kind: required')
  const consent = p.provenance?.consent
  if (!consent) out.push('provenance.consent: required')
  if (k === 'self' && consent?.status === 'not-required') out.push('provenance.consent: a persona of a living person needs their consent')
  if (consent?.status === 'recorded' && !consent.by) out.push('provenance.consent.by: the person who agreed')
  if (k === 'historical' && !(p.provenance?.sources?.length)) out.push('provenance.sources: a historical persona lists its public sources')
  return out
}
