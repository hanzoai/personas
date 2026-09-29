/**
 * Hanzo's core agent team, as data: one markdown file per member under team/.
 * The front matter says who the member is; the body is the system prompt that
 * reaches the model, word for word.
 *
 * This module reads no files, so a browser bundle can import it beside the
 * markdown its bundler inlines. index.js reads team/ from disk with it.
 */

/**
 * One member from the text of team/<id>.md.
 * @param {string} id the file's name without .md
 * @param {string} text the file's contents
 * @returns {{ id: string, name: string, role: string, model: string, persona: string|null, instructions: string }}
 */
export function parse(id, text) {
  const head = /^---\n([\s\S]*?)\n---\n/.exec(text)
  if (!head) throw new Error(`team/${id}.md has no front matter`)
  const meta = {}
  for (const line of head[1].split('\n')) {
    const at = line.indexOf(':')
    if (at > 0) meta[line.slice(0, at).trim()] = line.slice(at + 1).trim()
  }
  for (const key of ['name', 'role', 'model']) {
    if (!meta[key]) throw new Error(`team/${id}.md has no ${key}`)
  }
  return {
    id,
    name: meta.name,
    role: meta.role,
    model: meta.model,
    persona: meta.persona || null,
    instructions: text.slice(head[0].length).trim(),
  }
}
