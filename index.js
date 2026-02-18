import { readFileSync, readdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PERSONAS_DIR = join(__dirname, 'personas')

/**
 * List all available persona slugs.
 * @returns {string[]}
 */
export function list() {
  return readdirSync(PERSONAS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()
}

/**
 * Load a persona's JSON profile by slug.
 * @param {string} slug
 * @returns {object|null}
 */
export function getProfile(slug) {
  const file = join(PERSONAS_DIR, slug, 'profile.json')
  if (!existsSync(file)) return null
  return JSON.parse(readFileSync(file, 'utf-8'))
}

/**
 * Load a persona's PERSONA.md content by slug.
 * @param {string} slug
 * @returns {string|null}
 */
export function getPersonaMd(slug) {
  const file = join(PERSONAS_DIR, slug, 'PERSONA.md')
  if (!existsSync(file)) return null
  return readFileSync(file, 'utf-8')
}

/**
 * Load a persona with both profile and markdown if available.
 * @param {string} slug
 * @returns {{ slug: string, profile: object|null, persona: string|null }|null}
 */
export function get(slug) {
  const dir = join(PERSONAS_DIR, slug)
  if (!existsSync(dir)) return null
  return {
    slug,
    profile: getProfile(slug),
    persona: getPersonaMd(slug),
  }
}

/**
 * Load all personas.
 * @returns {Array<{ slug: string, profile: object|null, persona: string|null }>}
 */
export function all() {
  return list().map((slug) => get(slug))
}

export default { list, get, getProfile, getPersonaMd, all }
