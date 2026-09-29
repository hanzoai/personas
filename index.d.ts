import type { Member } from './team.js'

export type { Member } from './team.js'
export { parse } from './team.js'

/** A roster entry: personas/<slug>/profile.json. */
export interface Profile {
  id: string
  name: string
  category: string
  [key: string]: unknown
}

/** A persona: its profile and its PERSONA.md where one is written. */
export interface Persona {
  slug: string
  profile: Profile | null
  persona: string | null
}

/** Every persona slug, sorted. */
export function list(): string[]
/** A persona's profile.json, or null. */
export function getProfile(slug: string): Profile | null
/** A persona's PERSONA.md, or null where none is written. */
export function getPersonaMd(slug: string): string | null
/** A persona with its profile and PERSONA.md, or null for no such slug. */
export function get(slug: string): Persona | null
/** Every persona. */
export function all(): Persona[]
/** One member of Hanzo's core agent team by id, or null. */
export function member(id: string): Member | null
/** Hanzo's core agent team, sorted by id. */
export function team(): Member[]

declare const personas: {
  list: typeof list
  get: typeof get
  getProfile: typeof getProfile
  getPersonaMd: typeof getPersonaMd
  all: typeof all
  member: typeof member
  team: typeof team
  parse: typeof import('./team.js').parse
}
export default personas
