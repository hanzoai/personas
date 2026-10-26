import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, parsePerson, type Member, type Person } from './team.ts'

export { grouped, parse, parsePerson, speaks, type Member, type Person } from './team.ts'
export { compile, tokens } from './compile.ts'
export { ITEMS, INSTRUMENT, CHOICES, SAYS, band, score } from './ocean.ts'
export { DOMAINS, validate } from './persona.ts'
export type { Agent, Domain, Kind, Ocean, Persona, Scores, Share } from './persona.ts'

// dist/ and src/ both sit one level under the package root.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const PERSONAS_DIR = join(ROOT, 'personas')
const TEAM_DIR = join(ROOT, 'team')
const PEOPLE_DIR = join(ROOT, 'people')

/** A roster entry: personas/<slug>/profile.json. */
export interface Profile {
  id: string
  name: string
  category: string
  [key: string]: unknown
}

/** A persona of the roster: its profile and its PERSONA.md where one is written. */
export interface Figure {
  slug: string
  profile: Profile | null
  persona: string | null
}

/** Every roster slug, sorted. */
export function list(): string[] {
  return readdirSync(PERSONAS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()
}

/** A figure's profile.json, or null. */
export function getProfile(slug: string): Profile | null {
  const file = join(PERSONAS_DIR, slug, 'profile.json')
  return existsSync(file) ? (JSON.parse(readFileSync(file, 'utf-8')) as Profile) : null
}

/** A figure's PERSONA.md, or null where none is written. */
export function getPersonaMd(slug: string): string | null {
  const file = join(PERSONAS_DIR, slug, 'PERSONA.md')
  return existsSync(file) ? readFileSync(file, 'utf-8') : null
}

/** A figure with its profile and PERSONA.md, or null for no such slug. */
export function get(slug: string): Figure | null {
  if (!existsSync(join(PERSONAS_DIR, slug))) return null
  return { slug, profile: getProfile(slug), persona: getPersonaMd(slug) }
}

/** Every figure. */
export function all(): Figure[] {
  return list().map((slug) => get(slug)!)
}

/** One member of Hanzo's core agent team by id (lower case letters), or null for no such member. */
export function member(id: string): Member | null {
  if (!/^[a-z]+$/.test(id)) return null
  const file = join(TEAM_DIR, `${id}.md`)
  return existsSync(file) ? parse(id, readFileSync(file, 'utf-8')) : null
}

/** Hanzo's core agent team, sorted by id. */
export function team(): Member[] {
  return readdirSync(TEAM_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.slice(0, -3))
    .sort()
    .map((id) => member(id)!)
}

/** The people on the team, sorted by id. */
export function people(): Person[] {
  if (!existsSync(PEOPLE_DIR)) return []
  return readdirSync(PEOPLE_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.slice(0, -3))
    .sort()
    .map((id) => parsePerson(id, readFileSync(join(PEOPLE_DIR, `${id}.md`), 'utf-8')))
}
