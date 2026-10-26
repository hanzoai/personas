/**
 * The team's memojis, drawn from one set of parts so every agent reads as the same
 * kind of character: a round-faced figure, soft light from the upper left, a ground
 * in its department's colour, and a badge on the chest for its function.
 * `node tools/memoji.ts` writes assets/memoji/<id>.svg for every seat in ROSTER.
 * The photographs of the two founders are not drawn here.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ROSTER } from './personas.ts'

type Hair = 'short' | 'messy' | 'bun' | 'long' | 'curly' | 'braids' | 'side' | 'swoop' | 'bob' | 'buzz' | 'pony'
type Gear = 'glasses' | 'headset' | 'headphones' | 'tie'

interface Look {
  skin: string
  hair: string
  hairStyle: Hair
  gear?: Gear[]
  /** Eyes: round `dot` (the default) or `happy` (a closed arc). */
  eyes?: 'happy'
}

/** A department's colours: the ground (light, dark), the top, its collar, and the badge's ink. */
const GROUP: Record<string, { ground: [string, string]; top: string; trim: string; ink: string }> = {
  'Executive & Management': { ground: ['#a5b4fc', '#4338ca'], top: '#4338ca', trim: '#e0e7ff', ink: '#3730a3' },
  'Revenue & Relationships': { ground: ['#fdba74', '#c2410c'], top: '#ea580c', trim: '#ffedd5', ink: '#9a3412' },
  'Engineering & Intelligence': { ground: ['#5eead4', '#0f766e'], top: '#0f766e', trim: '#ccfbf1', ink: '#115e59' },
  'Creative & Knowledge': { ground: ['#d8b4fe', '#7e22ce'], top: '#7e22ce', trim: '#f3e8ff', ink: '#6b21a8' },
  'Financial & Commercial Infrastructure': { ground: ['#fde68a', '#b45309'], top: '#b45309', trim: '#fef3c7', ink: '#92400e' },
  'Governance & Protection': { ground: ['#cbd5e1', '#334155'], top: '#475569', trim: '#e2e8f0', ink: '#334155' },
}

const SKIN = { s1: '#f6d3b3', s2: '#f1c9a5', s3: '#e0ac86', s4: '#c68863', s5: '#a9714b', s6: '#8d5a3b', s7: '#6b4226' }
const HAIR = { black: '#111827', dark: '#2b2118', brown: '#5a3a22', auburn: '#9a3412', blond: '#d6a84a', gray: '#9ca3af', silver: '#d1d5db', teal: '#0f766e', purple: '#6d28d9', pink: '#db2777', plum: '#3b2f4a' }

const LOOKS: Record<string, Look> = {
  vi: { skin: SKIN.s4, hair: HAIR.black, hairStyle: 'side', gear: ['tie'] },
  opera: { skin: SKIN.s5, hair: HAIR.black, hairStyle: 'braids', gear: ['glasses'] },
  mana: { skin: SKIN.s2, hair: HAIR.auburn, hairStyle: 'bob' },
  huma: { skin: SKIN.s6, hair: HAIR.dark, hairStyle: 'bun', eyes: 'happy' },
  sal: { skin: '#b7774f', hair: '#44200f', hairStyle: 'swoop', eyes: 'happy' },
  mark: { skin: SKIN.s2, hair: HAIR.auburn, hairStyle: 'long', eyes: 'happy' },
  rev: { skin: SKIN.s3, hair: '#292524', hairStyle: 'short', gear: ['glasses'] },
  su: { skin: SKIN.s7, hair: '#1c1410', hairStyle: 'curly', gear: ['headset'], eyes: 'happy' },
  cust: { skin: SKIN.s3, hair: HAIR.brown, hairStyle: 'bob', eyes: 'happy' },
  com: { skin: SKIN.s1, hair: HAIR.blond, hairStyle: 'messy' },
  dev: { skin: SKIN.s3, hair: HAIR.dark, hairStyle: 'messy', gear: ['headphones', 'glasses'] },
  it: { skin: SKIN.s5, hair: HAIR.black, hairStyle: 'buzz', gear: ['glasses'] },
  cyber: { skin: SKIN.s4, hair: HAIR.purple, hairStyle: 'swoop' },
  qa: { skin: SKIN.s1, hair: HAIR.auburn, hairStyle: 'pony', gear: ['glasses'] },
  data: { skin: SKIN.s6, hair: HAIR.black, hairStyle: 'short', gear: ['glasses'] },
  sci: { skin: SKIN.s1, hair: HAIR.silver, hairStyle: 'curly' },
  auto: { skin: SKIN.s3, hair: HAIR.teal, hairStyle: 'side' },
  des: { skin: SKIN.s2, hair: HAIR.plum, hairStyle: 'bun', gear: ['glasses'] },
  art: { skin: SKIN.s4, hair: HAIR.pink, hairStyle: 'long', eyes: 'happy' },
  mu: { skin: SKIN.s6, hair: HAIR.black, hairStyle: 'braids', gear: ['headphones'], eyes: 'happy' },
  doc: { skin: SKIN.s3, hair: HAIR.brown, hairStyle: 'bob', gear: ['glasses'] },
  edu: { skin: SKIN.s1, hair: HAIR.gray, hairStyle: 'short', eyes: 'happy' },
  lang: { skin: SKIN.s3, hair: HAIR.auburn, hairStyle: 'pony' },
  fin: { skin: SKIN.s3, hair: '#292524', hairStyle: 'short', gear: ['glasses'] },
  proc: { skin: SKIN.s5, hair: '#44200f', hairStyle: 'buzz' },
  supply: { skin: SKIN.s2, hair: HAIR.blond, hairStyle: 'messy' },
  corp: { skin: SKIN.s4, hair: HAIR.black, hairStyle: 'side', gear: ['tie'] },
  law: { skin: SKIN.s2, hair: HAIR.gray, hairStyle: 'side', gear: ['glasses', 'tie'] },
  comp: { skin: SKIN.s6, hair: HAIR.black, hairStyle: 'bob', gear: ['glasses'] },
  risk: { skin: SKIN.s3, hair: HAIR.brown, hairStyle: 'short' },
  audit: { skin: SKIN.s1, hair: HAIR.black, hairStyle: 'bun', gear: ['glasses'] },
  gov: { skin: SKIN.s5, hair: '#1c1917', hairStyle: 'swoop', gear: ['tie'] },
}

/** The chest badge's glyph for each function: strokes in a 24-unit box. */
const EMBLEM: Record<string, string> = {
  vi: '<path d="M12 3l2 7 7 2-7 2-2 7-2-7-7-2 7-2z"/>',
  opera: '<circle cx="12" cy="12" r="3.2"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>',
  mana: '<rect x="3" y="4" width="5" height="16" rx="1"/><rect x="10" y="4" width="5" height="10" rx="1"/><rect x="17" y="4" width="4" height="13" rx="1"/>',
  huma: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-4 3-6 6-6s6 2 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14c3 0 5 2 5 5"/>',
  sal: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".8"/>',
  mark: '<path d="M4 10v4h4l7 4V6L8 10z"/><path d="M18 9c1.5 1 1.5 5 0 6"/>',
  rev: '<circle cx="12" cy="12" r="9"/><path d="M14.5 9.5c0-1.2-1.2-2-2.5-2s-2.5.8-2.5 2 1 1.7 2.5 2 2.5.8 2.5 2-1.2 2-2.5 2-2.5-.8-2.5-2M12 5.5v2M12 16.5v2"/>',
  su: '<path d="M5 13v-1a7 7 0 0114 0v1"/><rect x="3.5" y="12.5" width="3.5" height="6" rx="1.5"/><rect x="17" y="12.5" width="3.5" height="6" rx="1.5"/><path d="M18 19c0 1.5-2 2-5 2"/>',
  cust: '<path d="M12 20s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.5-7 10-7 10z"/>',
  com: '<path d="M3 5h12v9H9l-3 3v-3H3z"/><path d="M18 9h3v9h-2v3l-3-3h-5v-2"/>',
  dev: '<path d="M9 7l-5 5 5 5M15 7l5 5-5 5M13.5 5l-3 14"/>',
  it: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  cyber: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><circle cx="12" cy="11" r="2"/><path d="M12 13v3"/>',
  qa: '<circle cx="12" cy="12" r="9"/><path d="M7.5 12.5l3 3 6-7"/>',
  data: '<path d="M4 20V10M10 20V4M16 20v-8M3 20h18"/>',
  sci: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 002 3h10a2 2 0 002-3l-5-9V3"/><path d="M8 15h8"/>',
  auto: '<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>',
  des: '<path d="M4 20l1-5L16 4l4 4L9 19z"/><path d="M14 6l4 4"/>',
  art: '<path d="M12 3a9 9 0 100 18c1.5 0 2-1 1.5-2-.6-1.2.2-2.5 1.6-2.5H17a4 4 0 004-4c0-5-4-9.5-9-9.5z"/><circle cx="8" cy="11" r="1"/><circle cx="11" cy="7.5" r="1"/><circle cx="16" cy="8.5" r="1"/>',
  mu: '<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
  doc: '<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5M9 13h7M9 17h7"/>',
  edu: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5M22 9v6"/>',
  lang: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  fin: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>',
  proc: '<path d="M3 4h3l2.5 11h9l2-8H7"/><circle cx="10" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>',
  supply: '<path d="M2 6h11v10H2zM13 9h4l4 4v3h-8z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  corp: '<path d="M5 4v6c0 3 3 4 7 6M19 4v6c0 3-3 4-7 6M12 16v5M9 18l3 3 3-3"/>',
  law: '<path d="M12 3v18M6 21h12M5 7h14"/><path d="M5 7l-3 7a3.5 3 0 006 0zM19 7l-3 7a3.5 3 0 006 0z"/>',
  comp: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM8.5 14l2.5 2.5 4.5-5"/>',
  risk: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',
  audit: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/>',
  gov: '<path d="M3 9l9-6 9 6zM5 11v7M9.5 11v7M14.5 11v7M19 11v7M3 21h18"/>',
}

const shade = (hex: string, by: number): string => {
  const n = parseInt(hex.slice(1), 16)
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v + by * 255)))
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => c(v).toString(16).padStart(2, '0')).join('')}`
}

function hairBack(style: Hair, h: string): string {
  switch (style) {
    case 'long':
      return `<path d="M62 118 C54 190 62 214 84 222 L172 222 C194 214 202 190 194 118 Z" fill="${h}"/>`
    case 'bob':
      return `<path d="M60 150 C52 70 96 40 128 40 C162 40 204 70 196 150 L188 164 L68 164 Z" fill="${h}"/>`
    case 'braids':
      return `<path d="M72 130 C62 170 70 196 82 214" stroke="${h}" stroke-width="16" stroke-linecap="round" fill="none"/><path d="M184 130 C194 170 186 196 174 214" stroke="${h}" stroke-width="16" stroke-linecap="round" fill="none"/>`
    case 'bun':
      return `<circle cx="128" cy="38" r="22" fill="${h}"/>`
    case 'pony':
      return `<path d="M170 72 C220 62 232 132 192 176 C210 130 196 100 160 94 Z" fill="${h}"/><circle cx="172" cy="84" r="7" fill="${shade(h, 0.18)}"/>`
    case 'curly':
      return [[76, 92, 24], [96, 66, 26], [128, 58, 28], [160, 66, 26], [180, 92, 24], [70, 122, 18], [186, 122, 18]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${h}"/>`).join('')
    default:
      return ''
  }
}

function hairFront(style: Hair, h: string): string {
  const hi = shade(h, 0.08)
  switch (style) {
    case 'short':
    case 'pony':
      return `<path d="M72 112 C68 64 100 48 128 48 C158 48 190 64 184 112 C172 90 150 80 128 82 C106 80 84 90 72 112 Z" fill="${h}"/>`
    case 'messy':
      return `<path d="M70 114 C60 70 92 44 128 46 C166 44 198 72 186 114 C176 92 160 84 148 86 L136 74 L124 88 L110 76 L98 90 C86 92 76 100 70 114 Z" fill="${h}"/><path d="M104 56 C118 50 140 50 154 58" stroke="${hi}" stroke-width="5" stroke-linecap="round" fill="none"/>`
    case 'bun':
      return `<path d="M70 114 C66 66 98 50 128 50 C158 50 190 66 186 114 C176 94 156 84 128 86 C100 84 80 94 70 114 Z" fill="${h}"/>`
    case 'long':
      return `<path d="M68 118 C64 66 96 46 128 46 C162 46 194 66 188 118 C182 96 164 80 140 76 C124 90 96 98 68 118 Z" fill="${h}"/>`
    case 'bob':
      return `<path d="M70 112 C74 80 100 66 128 68 C156 66 182 80 186 112 C170 92 150 88 128 90 C106 88 86 92 70 112 Z" fill="${h}"/>`
    case 'buzz':
      return `<path d="M74 104 C76 70 100 58 128 58 C156 58 180 70 182 104 C168 88 150 82 128 84 C106 82 88 88 74 104 Z" fill="${h}"/>`
    case 'curly':
      return `<path d="M74 108 C80 80 104 70 128 72 C152 70 176 80 182 108 C170 94 150 88 128 90 C106 88 86 94 74 108 Z" fill="${h}"/>`
    case 'braids':
      return `<path d="M70 114 C64 64 98 46 128 46 C160 46 194 64 186 114 C174 88 154 78 128 80 C102 78 82 88 70 114 Z" fill="${h}"/><path d="M128 48 L128 80" stroke="${shade(h, 0.1)}" stroke-width="3"/>`
    case 'swoop':
      return `<path d="M68 118 C62 66 98 42 138 44 C176 46 196 72 186 118 C184 98 170 86 152 84 C126 70 92 84 68 118 Z" fill="${h}"/><path d="M92 62 C120 44 160 48 180 74" stroke="${hi}" stroke-width="5" stroke-linecap="round" fill="none"/>`
    case 'side':
      return `<path d="M70 116 C64 68 96 44 132 46 C168 48 192 70 186 116 C180 98 168 84 150 80 C130 92 96 90 70 116 Z" fill="${h}"/><path d="M96 66 C118 56 146 56 168 70" stroke="${hi}" stroke-width="5" stroke-linecap="round" fill="none"/>`
  }
}

const gearBack = (g: Gear[] = []): string =>
  g.includes('headphones')
    ? `<path d="M66 118 C62 56 194 56 190 118" stroke="#111827" stroke-width="9" fill="none" stroke-linecap="round"/><rect x="56" y="108" width="18" height="34" rx="9" fill="#111827"/><rect x="182" y="108" width="18" height="34" rx="9" fill="#111827"/>`
    : ''

function gearFront(g: Gear[] = []): string {
  const out: string[] = []
  if (g.includes('glasses')) out.push(`<g fill="#ffffff22" stroke="#1f2937" stroke-width="5"><circle cx="102" cy="124" r="17"/><circle cx="154" cy="124" r="17"/></g><path d="M119 124 L137 124" stroke="#1f2937" stroke-width="5"/>`)
  if (g.includes('headset')) out.push(`<path d="M66 122 C60 54 196 54 190 122" stroke="#1f2937" stroke-width="8" fill="none" stroke-linecap="round"/><rect x="54" y="110" width="20" height="32" rx="10" fill="#1f2937"/><path d="M62 140 C66 170 94 176 112 170" stroke="#1f2937" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="114" cy="170" r="7" fill="#374151"/>`)
  return out.join('')
}

function body(id: string, look: Look, c: (typeof GROUP)[string]): string {
  const parts = [
    `<path d="M26 256 C30 214 66 196 128 196 C190 196 226 214 230 256 Z" fill="${c.top}"/>`,
    `<path d="M26 256 C30 214 66 196 128 196 C100 214 96 240 98 256 Z" fill="${shade(c.top, 0.07)}" opacity=".5"/>`,
    `<path d="M104 196 L128 226 L152 196 Z" fill="${c.trim}"/>`,
  ]
  if (look.gear?.includes('tie')) parts.push(`<path d="M120 214 L136 214 L142 252 L128 262 L114 252 Z" fill="#ef4444"/><path d="M120 206 L136 206 L132 216 L124 216 Z" fill="#dc2626"/>`)
  parts.push(`<circle cx="182" cy="226" r="16" fill="#f8fafc"/><g transform="translate(172 216) scale(.83)" fill="none" stroke="${c.ink}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${EMBLEM[id]}</g>`)
  return parts.join('')
}

export function draw(id: string, group: string): string {
  const l = LOOKS[id]
  const c = GROUP[group]
  if (!l || !c || !EMBLEM[id]) throw new Error(`no look for ${id} in ${group}`)
  const eyes =
    l.eyes === 'happy'
      ? `<path d="M92 126 Q104 114 116 126" stroke="#1f2937" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M140 126 Q152 114 164 126" stroke="#1f2937" stroke-width="5" fill="none" stroke-linecap="round"/>`
      : `<g fill="#1f2937"><ellipse cx="104" cy="126" rx="7.5" ry="9"/><ellipse cx="152" cy="126" rx="7.5" ry="9"/></g><g fill="#fff"><circle cx="107" cy="122" r="2.8"/><circle cx="155" cy="122" r="2.8"/></g>`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-label="${id}">
<defs>
<linearGradient id="g-${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c.ground[0]}"/><stop offset="1" stop-color="${c.ground[1]}"/></linearGradient>
<radialGradient id="f-${id}" cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="${shade(l.skin, 0.1)}"/><stop offset="1" stop-color="${shade(l.skin, -0.08)}"/></radialGradient>
<clipPath id="c-${id}"><circle cx="128" cy="128" r="128"/></clipPath>
</defs>
<g clip-path="url(#c-${id})">
<rect width="256" height="256" fill="url(#g-${id})"/>
<circle cx="84" cy="64" r="70" fill="#fff" opacity=".13"/>
${hairBack(l.hairStyle, l.hair)}${gearBack(l.gear)}${body(id, l, c)}
<rect x="110" y="168" width="36" height="36" rx="14" fill="${shade(l.skin, -0.1)}"/>
<ellipse cx="68" cy="128" rx="9" ry="13" fill="${shade(l.skin, -0.04)}"/><ellipse cx="188" cy="128" rx="9" ry="13" fill="${shade(l.skin, -0.04)}"/>
<ellipse cx="128" cy="120" rx="58" ry="62" fill="url(#f-${id})"/>
${hairFront(l.hairStyle, l.hair)}
<g stroke="${shade(l.hair, 0.03)}" stroke-width="5" stroke-linecap="round" fill="none"><path d="M90 106 Q104 98 118 104"/><path d="M138 104 Q152 98 166 106"/></g>
${eyes}
<ellipse cx="88" cy="146" rx="11" ry="7" fill="#f87171" opacity=".28"/><ellipse cx="168" cy="146" rx="11" ry="7" fill="#f87171" opacity=".28"/>
<path d="M126 134 Q132 140 126 144" stroke="${shade(l.skin, -0.2)}" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".7"/>
<path d="M110 154 Q128 172 146 154" stroke="#7c2d12" stroke-width="5" fill="#fff" stroke-linecap="round" stroke-linejoin="round"/>
${gearFront(l.gear)}
</g>
</svg>
`
}

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'memoji')
mkdirSync(out, { recursive: true })
for (const s of ROSTER) writeFileSync(join(out, `${s.id}.svg`), draw(s.id, s.group))
console.log(`memoji: ${ROSTER.length} written to assets/memoji`)
