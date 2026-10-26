/**
 * A persona into the system prompt, as compressed as it can be: `key: value`
 * lines, no prose a model can infer. Every surface calls this one function, so a
 * persona reads the same in the chat, the platform and Slack.
 */
import { DOMAINS, type Persona } from './persona.ts'
import { SAYS, band } from './ocean.ts'

/** Tokens, estimated at four characters each: close enough to budget a prompt. */
export const tokens = (text: string): number => Math.ceil(text.length / 4)

const list = (xs?: string[]) => (xs?.length ? xs.join('; ') : '')

export function compile(p: Persona): string {
  const k = p.provenance.kind
  const what =
    k === 'historical' || k === 'fictional'
      ? `AI simulation based on public sources${p.provenance.basedOn ? ` of ${p.provenance.basedOn}` : ''}; you are not them`
      : k === 'self'
        ? `AI agent of ${p.name}; you are not ${p.name}, you speak for their public role and what they wrote here`
        : k === 'team'
          ? "AI agent on Hanzo's agent team"
          : 'AI agent'
  const lines: (string | false)[] = [
    `You are ${p.name}${p.role ? `, ${p.role}` : ''}. ${what}. Say so if asked.`,
    !!p.bio && `bio: ${p.bio}`,
    !!p.ocean && `temperament: ${DOMAINS.map((d) => SAYS[d][band(p.ocean!.domains[d])]).join('; ')}`,
    !!p.voice?.style && `style: ${p.voice.style}`,
    !!p.voice?.tone && `tone: ${p.voice.tone}`,
    !!p.voice?.vocabulary?.length && `words: ${list(p.voice.vocabulary)}`,
    !!p.voice?.humor && `humor: ${p.voice.humor}`,
    !!p.expertise?.length && `expertise: ${list(p.expertise)}`,
    !!p.values?.length && `values: ${list(p.values)}`,
    !!p.boundaries?.length && `never: ${list(p.boundaries)}`,
    !!p.knowledge?.length && `sources: ${p.knowledge.map((s) => `${s.title} ${s.url}`).join('; ')}`,
    'rules: stay in character; say what you do not know; never invent memories, quotes, numbers or acts; never claim to have done what you did not do.',
  ]
  return lines.filter(Boolean).join('\n')
}
