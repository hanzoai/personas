/**
 * Hanzo's thirty-two managed agents, as data: one markdown file per member under team/.
 * The front matter says who the member is; the body is the system prompt that
 * reaches the model, word for word.
 *
 * This module reads no files, so a browser bundle can import it beside the
 * markdown its bundler inlines. index.ts reads team/ from disk with it.
 */
import { DOMAINS, type Consent, type Ocean } from './persona.ts'

/** One of Hanzo's thirty-two managed agents, from team/<id>.md. */
export interface Member {
  /** The file's name and the member's stable handle: `dev`. */
  id: string
  /** The name a person sees: `Dev`. */
  name: string
  /** The department it belongs to: `Engineering & Intelligence`. */
  group: string
  /** Its place on the team, 1..32, in the order the groups and their members are shown. */
  seat: number
  /** The function it fills: `Development`. */
  role: string
  /** What it owns, in a line: `code, engineering, software systems`. */
  owns: string
  /** The model the member runs on: an Enso tier. */
  model: string
  /** The five OCEAN domain scores, 0..1, when the file states them. */
  ocean: Ocean | null
  /** How `ocean` came to be: `designed` for a managed teammate's role. */
  profile: 'designed' | null
  /** Requested cloud subsystems; the host must authorize actual tool access. */
  tools: string[]
  /** Its first message to a person. */
  greeting: string
  /** The system prompt, word for word. */
  instructions: string
}

/** The members by department, in the order they are shown: groups by their first seat, members by seat. */
export function grouped(members: Member[]): { group: string; members: Member[] }[] {
  const out: { group: string; members: Member[] }[] = []
  for (const m of [...members].sort((a, b) => a.seat - b.seat)) {
    const at = out.find((g) => g.group === m.group)
    if (at) at.members.push(m)
    else out.push({ group: m.group, members: [m] })
  }
  return out
}

/** Flat `key: value` front matter and the body after it. Throws without front matter. */
export function split(id: string, text: string): { meta: Record<string, string>; body: string } {
  const head = /^---\n([\s\S]*?)\n---\n/.exec(text)
  if (!head) throw new Error(`${id}.md has no front matter`)
  const meta: Record<string, string> = {}
  for (const line of head[1].split('\n')) {
    const at = line.indexOf(':')
    if (at > 0) meta[line.slice(0, at).trim()] = line.slice(at + 1).trim()
  }
  return { meta, body: text.slice(head[0].length).trim() }
}

/** One member from the text of team/<id>.md. Throws on a file missing a name, group, seat, role, ownership, model or greeting. */
export function parse(id: string, text: string): Member {
  const { meta, body } = split(`team/${id}`, text)
  for (const key of ['name', 'group', 'seat', 'role', 'owns', 'model', 'greeting']) {
    if (!meta[key]) throw new Error(`team/${id}.md has no ${key}`)
  }
  const present = DOMAINS.every((d) => (meta[d] ?? '') !== '')
  const scores = DOMAINS.map((d) => Number(meta[d]))
  const ocean = present && scores.every((v) => Number.isFinite(v) && v >= 0 && v <= 1) ? (Object.fromEntries(DOMAINS.map((d, i) => [d, scores[i]])) as Ocean) : null
  const profile = meta.profile === 'designed' ? meta.profile : null
  return {
    id,
    name: meta.name,
    group: meta.group,
    seat: Number(meta.seat),
    role: meta.role,
    owns: meta.owns,
    model: meta.model,
    ocean,
    profile,
    tools: (meta.tools ?? '').split(',').map((t) => t.trim()).filter(Boolean),
    greeting: meta.greeting,
    instructions: body,
  }
}

/**
 * A real person on the team, from people/<id>.md: who they are in public and the
 * agent that speaks for their role. It is a persona of a LIVING person, so it
 * carries the consent record and a chat with it may be offered only once that
 * record says `recorded` (see `speaks`).
 */
export interface Person {
  id: string
  name: string
  role: string
  /** Where to read about them: `github`, `linkedin`, `x` handles or URLs. */
  links: Record<string, string>
  consent: Consent
  instructions: string
}

const LINKS = ['github', 'linkedin', 'x'] as const

/** One person from the text of people/<id>.md. */
export function parsePerson(id: string, text: string): Person {
  const { meta, body } = split(`people/${id}`, text)
  for (const key of ['name', 'role', 'consent']) {
    if (!meta[key]) throw new Error(`people/${id}.md has no ${key}`)
  }
  const status = meta.consent === 'recorded' ? 'recorded' : 'pending'
  const links: Record<string, string> = {}
  for (const k of LINKS) if (meta[k]) links[k] = meta[k]
  return {
    id,
    name: meta.name,
    role: meta.role,
    links,
    consent: status === 'recorded' ? { status, by: meta.consent_by, at: meta.consent_at } : { status },
    instructions: body,
  }
}

/** Whether a chat with this person's agent may be offered: only once they have recorded their consent. */
export const speaks = (p: Person): boolean => p.consent.status === 'recorded' && !!p.consent.by
