/**
 * A figure of the roster as a Persona, from the text of personas/<id>/PERSONA.md.
 *
 * The front matter is YAML, read here as the subset the files are written in:
 * `key: value`, a `key:` with an indented block under it, `- item` lists and
 * `[a, b]` lists. The scores are `traits` (the five domains) and `trait_facets`
 * (the thirty facets under their domains). A figure who has died (`died: <year>`)
 * is historical and needs no consent; one who has not is a living person, whose
 * persona carries `consent: recorded` with `consent_by` and `consent_at` once they
 * agree, and is pending until then. The public sources are the body's `## Sources`
 * list. This module reads no files; index.ts does. figure.go is the same in Go.
 */
import { DOMAINS, type Ocean, type Persona } from './persona.ts'

type Node = string | string[] | { [key: string]: Node }

const scalar = (v: string): string | string[] => {
  const t = v.trim()
  if (t.startsWith('[') && t.endsWith(']')) return t.slice(1, -1).split(',').map((x) => x.trim()).filter(Boolean)
  return /^(['"]).*\1$/.test(t) ? t.slice(1, -1) : t
}

/** The front matter's lines, nested by indentation. */
function block(lines: string[], at: { i: number }, indent: number): Node {
  const map: Record<string, Node> = {}
  const list: string[] = []
  while (at.i < lines.length) {
    const line = lines[at.i]
    if (!line.trim()) {
      at.i++
      continue
    }
    const lead = line.length - line.trimStart().length
    if (lead < indent) break
    const text = line.trim()
    at.i++
    if (text.startsWith('- ')) {
      list.push(text.slice(2).trim())
      continue
    }
    const colon = text.indexOf(':')
    if (colon <= 0) continue
    const key = text.slice(0, colon).trim()
    const rest = text.slice(colon + 1)
    map[key] = rest.trim() ? scalar(rest) : block(lines, at, lead + 1)
  }
  return list.length && !Object.keys(map).length ? list : map
}

/** Front matter as nested values, and the body after it. Throws without front matter. */
export function frontMatter(id: string, text: string): { meta: Record<string, Node>; body: string } {
  const head = /^---\n([\s\S]*?)\n---\n/.exec(text)
  if (!head) throw new Error(`${id}: no front matter`)
  return { meta: block(head[1].split('\n'), { i: 0 }, 0) as Record<string, Node>, body: text.slice(head[0].length) }
}

const str = (n: Node | undefined): string => (typeof n === 'string' ? n : '')
const strs = (n: Node | undefined): string[] => (Array.isArray(n) ? n : [])
const num = (n: Node | undefined): number => (typeof n === 'string' && n !== '' ? Number(n) : NaN)

/** The numbered `## Sources` list of a PERSONA.md body. */
export function sources(body: string): string[] {
  const at = body.search(/^## Sources$/m)
  if (at < 0) return []
  const out: string[] = []
  for (const line of body.slice(at).split('\n').slice(1)) {
    if (line.startsWith('#')) break
    const m = /^\d+\.\s+(.+)$/.exec(line)
    if (m) out.push(m[1].trim())
  }
  return out
}

/** One figure from the text of personas/<id>/PERSONA.md. Throws on no front matter or no name. */
export function parseFigure(id: string, text: string): Persona {
  const { meta, body } = frontMatter(`personas/${id}/PERSONA.md`, text)
  const name = str(meta.name)
  if (!name) throw new Error(`personas/${id}/PERSONA.md has no name`)
  const traits = (meta.traits ?? {}) as Record<string, Node>
  const domains = Object.fromEntries(DOMAINS.map((d) => [d, num(traits[d])])) as Ocean
  const grouped = (meta.trait_facets ?? {}) as Record<string, Node>
  const facets: Record<string, number> = {}
  for (const d of DOMAINS) for (const [f, v] of Object.entries((grouped[d] ?? {}) as Record<string, Node>)) facets[f] = num(v)
  const died = num(meta.died)
  const consent =
    Number.isFinite(died) ? ({ status: 'not-required' } as const)
    : str(meta.consent) === 'recorded' && str(meta.consent_by) ? { status: 'recorded' as const, by: str(meta.consent_by), ...(str(meta.consent_at) ? { at: str(meta.consent_at) } : {}) }
    : ({ status: 'pending' } as const)
  const p: Persona = {
    handle: id.replace(/_/g, '-'),
    name,
    provenance: {
      kind: Number.isFinite(died) ? 'historical' : 'self',
      ...(str(meta.based_on) ? { basedOn: str(meta.based_on) } : {}),
      sources: sources(body),
      consent,
    },
  }
  if (str(meta.bio)) p.bio = str(meta.bio)
  if (str(meta.craft)) p.craft = str(meta.craft)
  if (DOMAINS.every((d) => Number.isFinite(domains[d]))) {
    p.ocean = { domains, source: 'authored', ...(Object.keys(facets).length ? { facets } : {}) }
  }
  if (strs(meta.expertise).length) p.expertise = strs(meta.expertise)
  if (strs(meta.values).length) p.values = strs(meta.values)
  return p
}
