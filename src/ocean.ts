/**
 * THE OCEAN TEST: Goldberg's IPIP Big-Five Factor Markers, 50 items, ten to a
 * domain. The International Personality Item Pool is public domain (ipip.ori.org);
 * nothing here is from a proprietary inventory (NEO-PI-R, MBTI).
 *
 *   Goldberg, L. R. (1992). The development of markers for the Big-Five factor
 *   structure. Psychological Assessment, 4, 26-42.
 *   Goldberg, L. R. (1999). A broad-bandwidth, public domain, personality
 *   inventory measuring the lower-level facets of several five-factor models. In
 *   Mervielde et al. (Eds.), Personality Psychology in Europe, 7, 7-28.
 *
 * Each statement is answered 1 (very inaccurate) to 5 (very accurate). A
 * reverse-keyed statement scores 6 minus the answer; a domain is the mean of its
 * ten, and `score` returns it on 0..1 as (mean - 1) / 4.
 *
 * The bands are read against the SCALE's own midpoint, not against a population:
 * the IPIP publishes no single norm table for this form, so a score here is a
 * description of how a person answered, never a percentile and never a diagnosis.
 */
import type { Domain, Ocean } from './persona.ts'

export interface Item {
  /** 1..50, the order the test is asked in. */
  n: number
  domain: Domain
  text: string
  /** `-1` for a reverse-keyed statement. */
  key: 1 | -1
}

/** A statement per row: domain, key, text. Asked in the order E A C N O, ten times. */
const ROWS: [Domain, 1 | -1, string][] = [
  ['extraversion', 1, 'Am the life of the party.'],
  ['agreeableness', -1, 'Feel little concern for others.'],
  ['conscientiousness', 1, 'Am always prepared.'],
  ['neuroticism', 1, 'Get stressed out easily.'],
  ['openness', 1, 'Have a rich vocabulary.'],
  ['extraversion', -1, "Don't talk a lot."],
  ['agreeableness', 1, 'Am interested in people.'],
  ['conscientiousness', -1, 'Leave my belongings around.'],
  ['neuroticism', -1, 'Am relaxed most of the time.'],
  ['openness', -1, 'Have difficulty understanding abstract ideas.'],
  ['extraversion', 1, 'Feel comfortable around people.'],
  ['agreeableness', -1, 'Insult people.'],
  ['conscientiousness', 1, 'Pay attention to details.'],
  ['neuroticism', 1, 'Worry about things.'],
  ['openness', 1, 'Have a vivid imagination.'],
  ['extraversion', -1, 'Keep in the background.'],
  ['agreeableness', 1, "Sympathize with others' feelings."],
  ['conscientiousness', -1, 'Make a mess of things.'],
  ['neuroticism', -1, 'Seldom feel blue.'],
  ['openness', -1, 'Am not interested in abstract ideas.'],
  ['extraversion', 1, 'Start conversations.'],
  ['agreeableness', -1, "Am not interested in other people's problems."],
  ['conscientiousness', 1, 'Get chores done right away.'],
  ['neuroticism', 1, 'Am easily disturbed.'],
  ['openness', 1, 'Have excellent ideas.'],
  ['extraversion', -1, 'Have little to say.'],
  ['agreeableness', 1, 'Have a soft heart.'],
  ['conscientiousness', -1, 'Often forget to put things back in their proper place.'],
  ['neuroticism', 1, 'Get upset easily.'],
  ['openness', -1, 'Do not have a good imagination.'],
  ['extraversion', 1, 'Talk to a lot of different people at parties.'],
  ['agreeableness', -1, 'Am not really interested in others.'],
  ['conscientiousness', 1, 'Like order.'],
  ['neuroticism', 1, 'Change my mood a lot.'],
  ['openness', 1, 'Am quick to understand things.'],
  ['extraversion', -1, "Don't like to draw attention to myself."],
  ['agreeableness', 1, 'Take time out for others.'],
  ['conscientiousness', -1, 'Shirk my duties.'],
  ['neuroticism', 1, 'Have frequent mood swings.'],
  ['openness', 1, 'Use difficult words.'],
  ['extraversion', 1, "Don't mind being the center of attention."],
  ['agreeableness', 1, "Feel others' emotions."],
  ['conscientiousness', 1, 'Follow a schedule.'],
  ['neuroticism', 1, 'Get irritated easily.'],
  ['openness', 1, 'Spend time reflecting on things.'],
  ['extraversion', -1, 'Am quiet around strangers.'],
  ['agreeableness', 1, 'Make people feel at ease.'],
  ['conscientiousness', 1, 'Am exacting in my work.'],
  ['neuroticism', 1, 'Often feel blue.'],
  ['openness', 1, 'Am full of ideas.'],
]

export const ITEMS: readonly Item[] = ROWS.map(([domain, key, text], i) => ({ n: i + 1, domain, key, text }))

/** What the test is, for a footnote and for the record kept with a score. */
export const INSTRUMENT = { name: 'IPIP Big-Five Factor Markers', version: 'Goldberg 1992, 50 items', items: ITEMS.length } as const

/** The five choices, 1..5. */
export const CHOICES = ['Very inaccurate', 'Moderately inaccurate', 'Neither accurate nor inaccurate', 'Moderately accurate', 'Very accurate'] as const

export type Band = 'low' | 'mid' | 'high'

/** A score's band against the scale's midpoint: below 2.5 of 5 low, above 3.5 high. */
export const band = (v: number): Band => (v < 0.375 ? 'low' : v > 0.625 ? 'high' : 'mid')

export interface Result {
  /** 0..1 per domain. */
  domains: Ocean
  bands: Record<Domain, Band>
}

/**
 * Score a complete set of answers: `answers[n - 1]` is the 1..5 answer to item n.
 * Throws on a missing or out-of-range answer: a partial test describes nobody.
 */
export function score(answers: readonly number[]): Result {
  if (answers.length !== ITEMS.length) throw new Error(`the test has ${ITEMS.length} statements, got ${answers.length} answers`)
  const sum: Record<Domain, number> = { openness: 0, conscientiousness: 0, extraversion: 0, agreeableness: 0, neuroticism: 0 }
  for (const item of ITEMS) {
    const a = answers[item.n - 1]
    if (!Number.isInteger(a) || a < 1 || a > 5) throw new Error(`statement ${item.n}: an answer from 1 to 5`)
    sum[item.domain] += item.key === 1 ? a : 6 - a
  }
  const domains = {} as Ocean
  const bands = {} as Record<Domain, Band>
  for (const d of Object.keys(sum) as Domain[]) {
    domains[d] = Math.round(((sum[d] / 10 - 1) / 4) * 1000) / 1000
    bands[d] = band(domains[d])
  }
  return { domains, bands }
}

/** One plain sentence for a domain at a band, for a result screen and for a persona's style. */
export const SAYS: Record<Domain, Record<Band, string>> = {
  openness: {
    low: 'practical and concrete; prefers what is proven',
    mid: 'balances new ideas with what works',
    high: 'curious and imaginative; drawn to abstract ideas and new things',
  },
  conscientiousness: {
    low: 'flexible and spontaneous; loose about plans and order',
    mid: 'organized when it matters, relaxed when it does not',
    high: 'organized, thorough and dependable; follows through',
  },
  extraversion: {
    low: 'reserved and reflective; energy comes from quiet',
    mid: 'comfortable alone or in company',
    high: 'outgoing and energetic; draws energy from people',
  },
  agreeableness: {
    low: 'direct and skeptical; puts the point before comfort',
    mid: 'cooperative, and willing to disagree',
    high: 'warm and considerate; trusting and helpful',
  },
  neuroticism: {
    low: 'calm and even; steady under pressure',
    mid: 'usually steady, sometimes tense',
    high: 'sensitive and quick to worry; feels stress strongly',
  },
}
