/** One member of Hanzo's core agent team, from team/<id>.md. */
export interface Member {
  /** The file's name and the member's stable handle: `dev`. */
  id: string
  /** The name a person sees: `Dev`. */
  name: string
  /** The member's part on the team: `Engineer`. */
  role: string
  /** The model the member runs on: an Enso tier. */
  model: string
  /** The slug under personas/ this member is modelled on, when there is one. */
  persona: string | null
  /** The system prompt, word for word. */
  instructions: string
}

/** One member from the text of team/<id>.md. Throws on a file with no name, role or model. */
export function parse(id: string, text: string): Member
