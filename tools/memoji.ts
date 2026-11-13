/**
 * The team's memojis and the 1,100 historical figures' memojis, drawn from one
 * cohesive 3D-shaded character system: a round-faced figure with soft studio light
 * from the upper left, period hair, facial hair, eyewear and attire, and a chest
 * badge for its discipline.
 *
 * `node tools/memoji.ts` writes:
 *   - assets/memoji/<id>.svg for every seat in ROSTER
 *   - assets/personas/<slug>.svg for every historical figure in personas/
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ROSTER } from './personas.ts'

type Hair =
  | 'short'
  | 'messy'
  | 'bun'
  | 'long'
  | 'curly'
  | 'braids'
  | 'side'
  | 'swoop'
  | 'bob'
  | 'buzz'
  | 'pony'
  | 'wavy'
  | 'receding'
  | 'wig'
  | 'turban'
  | 'laurel'
  | 'veil'
  | 'beret'
type Gear = 'glasses' | 'headset' | 'headphones' | 'tie'
type Beard = 'none' | 'mustache' | 'walrus' | 'goatee' | 'short_beard' | 'full_beard' | 'long_beard' | 'chops'
type Glasses = 'none' | 'round' | 'rect' | 'pince_nez'
type Attire =
  | 'suit_tie'
  | 'bowtie'
  | 'turtleneck'
  | 'lab_coat'
  | 'robe_classical'
  | 'robe_scholar'
  | 'victorian'
  | 'kimono'
  | 'sari'
  | 'tunic'
  | 'smock'
  | 'gown'
type Expr = 'calm' | 'smile' | 'wise' | 'intense' | 'playful'

interface Look {
  skin: string
  hair: string
  hairStyle: Hair
  gear?: Gear[]
  /** Eyes: round `dot` (the default) or `happy` (a closed arc). */
  eyes?: 'happy'
}

export interface PersonaLook {
  skin: string
  hair: string
  hairStyle: Hair
  beard?: Beard
  glasses?: Glasses
  attire?: Attire
  expr?: Expr
  palette?: string
}

/** A department's colours: the ground (light, dark), the top, its collar, and the badge's ink. */
const GROUP: Record<string, { ground: [string, string]; top: string; trim: string; ink: string }> = {
  'Executive & Management': { ground: ['#a5b4fc', '#4338ca'], top: '#4338ca', trim: '#e0e7ff', ink: '#3730a3' },
  'Revenue & Relationships': { ground: ['#fdba74', '#c2410c'], top: '#ea580c', trim: '#ffedd5', ink: '#9a3412' },
  'Engineering & Intelligence': { ground: ['#5eead4', '#0f766e'], top: '#0f766e', trim: '#ccfbf1', ink: '#115e59' },
  'Creative & Knowledge': { ground: ['#d9d9d9', '#787878'], top: '#787878', trim: '#f3f3f3', ink: '#646464' },
  'Financial & Commercial Infrastructure': { ground: ['#fde68a', '#b45309'], top: '#b45309', trim: '#fef3c7', ink: '#92400e' },
  'Governance & Protection': { ground: ['#cbd5e1', '#334155'], top: '#475569', trim: '#e2e8f0', ink: '#334155' },
}

const PALETTE: Record<string, { ground: [string, string]; top: string; trim: string; accent: string }> = {
  indigo: { ground: ['#312e81', '#0f172a'], top: '#3730a3', trim: '#e0e7ff', accent: '#818cf8' },
  emerald: { ground: ['#065f46', '#062c22'], top: '#047857', trim: '#d1fae5', accent: '#34d399' },
  amber: { ground: ['#78350f', '#271306'], top: '#92400e', trim: '#fef3c7', accent: '#fbbf24' },
  crimson: { ground: ['#7f1d1d', '#280909'], top: '#991b1b', trim: '#fee2e2', accent: '#f87171' },
  graphite: { ground: ['#595959', '#1c1c1c'], top: '#6c6c6c', trim: '#f3f3f3', accent: '#c2c2c2' },
  slate: { ground: ['#334155', '#0f172a'], top: '#1e293b', trim: '#e2e8f0', accent: '#94a3b8' },
  teal: { ground: ['#115e59', '#042f2e'], top: '#0f766e', trim: '#ccfbf1', accent: '#2dd4bf' },
  bronze: { ground: ['#573b26', '#1c130c'], top: '#6c4930', trim: '#f5ebe1', accent: '#d97706' },
  navy: { ground: ['#1e3a8a', '#091538'], top: '#1d4ed8', trim: '#dbeafe', accent: '#60a5fa' },
  charcoal: { ground: ['#3a3a3a', '#151515'], top: '#454545', trim: '#f2f2f2', accent: '#b3b3b3' },
  forest: { ground: ['#14532d', '#052010'], top: '#166534', trim: '#dcfce7', accent: '#4ade80' },
  ochre: { ground: ['#713f12', '#261405'], top: '#854d0e', trim: '#fef9c3', accent: '#facc15' },
}

const SKIN: Record<string, string> = {
  s1: '#f6d3b3',
  s2: '#f1c9a5',
  s3: '#e0ac86',
  s4: '#c68863',
  s5: '#a9714b',
  s6: '#8d5a3b',
  s7: '#6b4226',
}
const HAIR: Record<string, string> = {
  black: '#111827',
  dark: '#2b2118',
  brown: '#5a3a22',
  auburn: '#9a3412',
  blond: '#d6a84a',
  gray: '#9ca3af',
  silver: '#d1d5db',
  white: '#e5e7eb',
  bald: 'transparent',
  teal: '#0f766e',
  graphite: '#808080',
  ash: '#818181',
  charcoal: '#3d3d3d',
}

const LOOKS: Record<string, Look> = {
  vi: { skin: SKIN.s4, hair: HAIR.black, hairStyle: 'side', gear: ['tie'] },
  opera: { skin: SKIN.s5, hair: HAIR.black, hairStyle: 'braids', gear: ['glasses'] },
  mana: { skin: SKIN.s2, hair: HAIR.auburn, hairStyle: 'bob' },
  huma: { skin: SKIN.s6, hair: HAIR.dark, hairStyle: 'bun', eyes: 'happy' },
  sal: { skin: '#b7774f', hair: '#44200f', hairStyle: 'swoop', eyes: 'happy' },
  mark: { skin: SKIN.s2, hair: HAIR.auburn, hairStyle: 'long', eyes: 'happy' },
  rev: { skin: SKIN.s3, hair: '#292524', hairStyle: 'short', gear: ['glasses'] },
  su: { skin: SKIN.s7, hair: '#1c1410', hairStyle: 'curly', gear: ['headset'], eyes: 'happy' },
  dev: { skin: SKIN.s3, hair: HAIR.dark, hairStyle: 'messy', gear: ['headphones', 'glasses'] },
  cyber: { skin: SKIN.s4, hair: HAIR.graphite, hairStyle: 'swoop' },
  data: { skin: SKIN.s6, hair: HAIR.black, hairStyle: 'short', gear: ['glasses'] },
  sci: { skin: SKIN.s1, hair: HAIR.silver, hairStyle: 'curly' },
  des: { skin: SKIN.s2, hair: HAIR.charcoal, hairStyle: 'bun', gear: ['glasses'] },
  art: { skin: SKIN.s4, hair: HAIR.ash, hairStyle: 'long', eyes: 'happy' },
  mu: { skin: SKIN.s6, hair: HAIR.black, hairStyle: 'braids', gear: ['headphones'], eyes: 'happy' },
  doc: { skin: SKIN.s3, hair: HAIR.brown, hairStyle: 'bob', gear: ['glasses'] },
  ed: { skin: SKIN.s1, hair: HAIR.gray, hairStyle: 'short', eyes: 'happy' },
  edu: { skin: SKIN.s1, hair: HAIR.gray, hairStyle: 'short', eyes: 'happy' },
  lang: { skin: SKIN.s3, hair: HAIR.auburn, hairStyle: 'pony' },
  fin: { skin: SKIN.s3, hair: '#292524', hairStyle: 'short', gear: ['glasses'] },
  law: { skin: SKIN.s2, hair: HAIR.gray, hairStyle: 'side', gear: ['glasses', 'tie'] },
  gov: { skin: SKIN.s5, hair: '#1c1917', hairStyle: 'swoop', gear: ['tie'] },
  mo: { skin: SKIN.s5, hair: HAIR.teal, hairStyle: 'messy', gear: ['headphones'], eyes: 'happy' },
  vid: { skin: SKIN.s5, hair: HAIR.teal, hairStyle: 'messy', gear: ['headphones'], eyes: 'happy' },
  biz: { skin: SKIN.s2, hair: HAIR.brown, hairStyle: 'swoop', gear: ['tie'], eyes: 'happy' },
  grant: { skin: SKIN.s2, hair: HAIR.dark, hairStyle: 'swoop', gear: ['glasses'] },
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
  dev: '<path d="M9 7l-5 5 5 5M15 7l5 5-5 5M13.5 5l-3 14"/>',
  cyber: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><circle cx="12" cy="11" r="2"/><path d="M12 13v3"/>',
  data: '<path d="M4 20V10M10 20V4M16 20v-8M3 20h18"/>',
  sci: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 002 3h10a2 2 0 002-3l-5-9V3"/><path d="M8 15h8"/>',
  des: '<path d="M4 20l1-5L16 4l4 4L9 19z"/><path d="M14 6l4 4"/>',
  art: '<path d="M12 3a9 9 0 100 18c1.5 0 2-1 1.5-2-.6-1.2.2-2.5 1.6-2.5H17a4 4 0 004-4c0-5-4-9.5-9-9.5z"/><circle cx="8" cy="11" r="1"/><circle cx="11" cy="7.5" r="1"/><circle cx="16" cy="8.5" r="1"/>',
  mu: '<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
  doc: '<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5M9 13h7M9 17h7"/>',
  ed: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5M22 9v6"/>',
  edu: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5M22 9v6"/>',
  lang: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  fin: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>',
  law: '<path d="M12 3v18M6 21h12M5 7h14"/><path d="M5 7l-3 7a3.5 3 0 006 0zM19 7l-3 7a3.5 3 0 006 0z"/>',
  gov: '<path d="M3 9l9-6 9 6zM5 11v7M9.5 11v7M14.5 11v7M19 11v7M3 21h18"/>',
  mo: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3z"/>',
  vid: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3z"/>',
  biz: '<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/>',
  grant: '<path d="M5 3h9l4 4v5M5 3v17h7M14 3v4h4M8 9h6M8 13h4"/><circle cx="17" cy="16" r="3"/><path d="M15.5 18.6L15 22l2-1 2 1-.5-3.4"/>',
}

const shade = (hex: string, by: number): string => {
  if (!hex.startsWith('#')) return hex
  const n = parseInt(hex.slice(1), 16)
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v + by * 255)))
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => c(v).toString(16).padStart(2, '0')).join('')}`
}

function hairBack(style: Hair, h: string): string {
  if (h === 'transparent') return ''
  switch (style) {
    case 'long':
    case 'wavy':
      return `<path d="M62 118 C52 190 60 218 84 226 L172 226 C196 218 204 190 194 118 Z" fill="${h}"/>`
    case 'wig':
      return `<path d="M56 112 C44 176 52 216 78 224 L178 224 C204 216 212 176 200 112 Z" fill="#e5e7eb"/><circle cx="62" cy="148" r="14" fill="#d1d5db"/><circle cx="64" cy="174" r="14" fill="#d1d5db"/><circle cx="194" cy="148" r="14" fill="#d1d5db"/><circle cx="192" cy="174" r="14" fill="#d1d5db"/>`
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
    case 'veil':
      return `<path d="M58 106 C48 176 54 228 74 248 L182 248 C202 228 208 176 198 106 C192 54 162 38 128 38 C94 38 64 54 58 106 Z" fill="#1e293b"/>`
    default:
      return ''
  }
}

function hairFront(style: Hair, h: string): string {
  if (h === 'transparent' && !['turban', 'laurel', 'veil', 'beret', 'wig'].includes(style)) return ''
  const hi = h === 'transparent' ? '#fff' : shade(h, 0.08)
  switch (style) {
    case 'short':
    case 'pony':
      return `<path d="M72 112 C68 64 100 48 128 48 C158 48 190 64 184 112 C172 90 150 80 128 82 C106 80 84 90 72 112 Z" fill="${h}"/>`
    case 'receding':
      return `<path d="M68 118 C64 84 78 66 96 64 C86 82 82 98 76 116 Z" fill="${h}"/><path d="M188 118 C192 84 178 66 160 64 C170 82 174 98 180 116 Z" fill="${h}"/>`
    case 'messy':
    case 'wavy':
      return `<path d="M70 114 C60 70 92 44 128 46 C166 44 198 72 186 114 C176 92 160 84 148 86 L136 74 L124 88 L110 76 L98 90 C86 92 76 100 70 114 Z" fill="${h}"/><path d="M104 56 C118 50 140 50 154 58" stroke="${hi}" stroke-width="5" stroke-linecap="round" fill="none"/>`
    case 'bun':
      return `<path d="M70 114 C66 66 98 50 128 50 C158 50 190 66 186 114 C176 94 156 84 128 86 C100 84 80 94 70 114 Z" fill="${h}"/>`
    case 'long':
      return `<path d="M68 118 C64 66 96 46 128 46 C162 46 194 66 188 118 C182 96 164 80 140 76 C124 90 96 98 68 118 Z" fill="${h}"/>`
    case 'wig':
      return `<path d="M66 116 C60 60 94 42 128 42 C162 42 196 60 190 116 C178 90 154 78 128 80 C102 78 78 90 66 116 Z" fill="#f3f4f6"/>`
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
    case 'turban':
      return `<path d="M62 106 C58 52 94 34 128 34 C162 34 198 52 194 106 C172 84 148 76 128 86 C108 76 84 84 62 106 Z" fill="#f5ebe1"/><path d="M72 72 Q128 52 184 72" stroke="#d6c7b2" stroke-width="5" fill="none"/><circle cx="128" cy="72" r="7" fill="#d97706"/>`
    case 'laurel':
      return `${h !== 'transparent' ? `<path d="M72 112 C68 64 100 48 128 48 C158 48 190 64 184 112 C172 90 150 80 128 82 C106 80 84 90 72 112 Z" fill="${h}"/>` : ''}<path d="M68 96 Q96 66 124 72 M188 96 Q160 66 132 72" stroke="#eab308" stroke-width="6" stroke-linecap="round" fill="none"/>`
    case 'veil':
      return `<path d="M64 116 C64 64 96 44 128 44 C160 44 192 64 192 116 C178 90 156 78 128 78 C100 78 78 90 64 116 Z" fill="#334155"/>`
    case 'beret':
      return `${h !== 'transparent' ? `<path d="M70 114 C66 80 96 64 128 64 C160 64 190 80 186 114 C172 94 150 86 128 86 C106 86 84 94 70 114 Z" fill="${h}"/>` : ''}<path d="M58 84 C52 50 104 34 148 40 C188 46 204 68 188 86 Z" fill="#1e293b"/><path d="M126 38 L132 30" stroke="#1e293b" stroke-width="5" stroke-linecap="round"/>`
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
  parts.push(`<circle cx="182" cy="226" r="16" fill="#f8fafc"/><g transform="translate(172 216) scale(.83)" fill="none" stroke="${c.ink}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${EMBLEM[id] ?? EMBLEM.sci}</g>`)
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

function drawBeard(beard: Beard = 'none', h: string): string {
  const c = h === 'transparent' ? '#6b7280' : h
  switch (beard) {
    case 'mustache':
      return `<path d="M104 150 Q116 142 128 148 Q140 142 152 150 Q140 156 128 151 Q116 156 104 150 Z" fill="${c}"/>`
    case 'walrus':
      return `<path d="M98 152 C104 140 120 142 128 146 C136 142 152 140 158 152 C156 160 142 158 128 154 C114 158 100 160 98 152 Z" fill="${c}"/>`
    case 'goatee':
      return `<path d="M108 150 Q128 144 148 150" stroke="${c}" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M114 166 Q128 188 142 166 Q128 176 114 166 Z" fill="${c}"/>`
    case 'short_beard':
      return `<path d="M74 136 C76 168 100 186 128 186 C156 186 180 168 182 136 C176 156 158 170 128 170 C98 170 80 156 74 136 Z" fill="${c}" opacity=".88"/><path d="M106 150 Q128 143 150 150" stroke="${c}" stroke-width="5" stroke-linecap="round" fill="none"/>`
    case 'full_beard':
      return `<path d="M72 132 C72 178 96 198 128 198 C160 198 184 178 184 132 C176 156 156 168 128 168 C100 168 80 156 72 132 Z" fill="${c}"/><path d="M104 150 Q128 142 152 150" stroke="${shade(c, 0.1)}" stroke-width="6" stroke-linecap="round" fill="none"/>`
    case 'long_beard':
      return `<path d="M72 132 C68 188 94 226 128 228 C162 226 188 188 184 132 C176 156 156 168 128 168 C100 168 80 156 72 132 Z" fill="${c}"/><path d="M102 150 Q128 140 154 150" stroke="${shade(c, 0.12)}" stroke-width="6" stroke-linecap="round" fill="none"/>`
    case 'chops':
      return `<path d="M70 124 C70 152 80 168 96 166 C90 150 84 136 78 124 Z" fill="${c}"/><path d="M186 124 C186 152 176 168 160 166 C166 150 172 136 178 124 Z" fill="${c}"/>`
    default:
      return ''
  }
}

function drawGlasses(g: Glasses = 'none'): string {
  switch (g) {
    case 'round':
      return `<g fill="#ffffff18" stroke="#d4af37" stroke-width="3.8"><circle cx="102" cy="124" r="16"/><circle cx="154" cy="124" r="16"/></g><path d="M118 124 L138 124" stroke="#d4af37" stroke-width="3.8"/>`
    case 'rect':
      return `<g fill="#ffffff18" stroke="#1f2937" stroke-width="4.2"><rect x="84" y="112" width="34" height="22" rx="5"/><rect x="138" y="112" width="34" height="22" rx="5"/></g><path d="M118 122 L138 122" stroke="#1f2937" stroke-width="4.2"/>`
    case 'pince_nez':
      return `<g fill="#ffffff18" stroke="#9ca3af" stroke-width="3.2"><ellipse cx="104" cy="124" rx="14" ry="12"/><ellipse cx="152" cy="124" rx="14" ry="12"/></g><path d="M118 120 Q128 112 138 120" stroke="#9ca3af" stroke-width="3.2" fill="none"/>`
    default:
      return ''
  }
}

function drawAttire(attire: Attire = 'suit_tie', p: (typeof PALETTE)[string]): string {
  const base = `<path d="M26 256 C30 212 66 194 128 194 C190 194 226 212 230 256 Z" fill="${p.top}"/><path d="M26 256 C30 212 66 194 128 194 C100 212 96 240 98 256 Z" fill="${shade(p.top, 0.08)}" opacity=".5"/>`
  switch (attire) {
    case 'turtleneck':
      return `<path d="M26 256 C30 212 66 194 128 194 C190 194 226 212 230 256 Z" fill="#18181b"/><rect x="104" y="182" width="48" height="24" rx="8" fill="#27272a"/>`
    case 'lab_coat':
      return `<path d="M26 256 C30 212 66 194 128 194 C190 194 226 212 230 256 Z" fill="#f1f5f9"/><path d="M98 194 L128 242 L158 194 Z" fill="${p.top}"/><path d="M92 194 L116 244 M164 194 L140 244" stroke="#cbd5e1" stroke-width="4"/>`
    case 'robe_classical':
    case 'robe_scholar':
      return `${base}<path d="M58 206 L146 256 L198 206" stroke="${p.trim}" stroke-width="14" opacity=".85" fill="none"/>`
    case 'victorian':
      return `${base}<path d="M102 194 L128 232 L154 194 Z" fill="#fef3c7"/><path d="M118 204 L138 204 L132 228 L124 228 Z" fill="#f5ebe1"/>`
    case 'bowtie':
      return `${base}<path d="M104 194 L128 224 L152 194 Z" fill="${p.trim}"/><path d="M112 204 L128 212 L112 220 Z M144 204 L128 212 L144 220 Z" fill="#b91c1c"/>`
    case 'smock':
    case 'kimono':
    case 'sari':
    case 'tunic':
    case 'gown':
      return `${base}<path d="M96 194 L128 230 L160 194" stroke="${p.accent}" stroke-width="6" fill="none"/>`
    default:
      return `${base}<path d="M104 194 L128 226 L152 194 Z" fill="${p.trim}"/><path d="M122 210 L134 210 L138 252 L128 260 L118 252 Z" fill="${p.accent}"/>`
  }
}

export function drawPersona(slug: string, spec: PersonaLook): string {
  const skin = SKIN[spec.skin] ?? SKIN.s2
  const hair = HAIR[spec.hair] ?? HAIR.brown
  const style = spec.hairStyle ?? 'short'
  const pal = PALETTE[spec.palette ?? 'indigo'] ?? PALETTE.indigo
  const id = slug.replace(/[^a-zA-Z0-9_-]/g, '')
  const browColor = hair === 'transparent' ? '#4b5563' : shade(hair, -0.05)
  const brows =
    spec.expr === 'intense'
      ? `<path d="M88 102 L118 108"/><path d="M168 102 L138 108"/>`
      : spec.expr === 'wise'
        ? `<path d="M88 104 Q104 94 118 102"/><path d="M138 102 Q152 94 168 104"/>`
        : `<path d="M90 106 Q104 98 118 104"/><path d="M138 104 Q152 98 166 106"/>`
  const mouth =
    spec.expr === 'smile' || spec.expr === 'playful'
      ? `<path d="M110 156 Q128 170 146 156" stroke="#7c2d12" stroke-width="4.5" fill="#fff" stroke-linecap="round" stroke-linejoin="round"/>`
      : `<path d="M114 158 Q128 163 142 158" stroke="${shade(skin, -0.32)}" stroke-width="4" fill="none" stroke-linecap="round"/>`

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-label="${slug}">
<defs>
<linearGradient id="g-${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${pal.ground[0]}"/><stop offset="1" stop-color="${pal.ground[1]}"/></linearGradient>
<radialGradient id="f-${id}" cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="${shade(skin, 0.1)}"/><stop offset="1" stop-color="${shade(skin, -0.1)}"/></radialGradient>
<clipPath id="c-${id}"><circle cx="128" cy="128" r="128"/></clipPath>
</defs>
<g clip-path="url(#c-${id})">
<rect width="256" height="256" fill="url(#g-${id})"/>
<circle cx="96" cy="76" r="84" fill="${pal.accent}" opacity=".14"/>
${hairBack(style, hair)}${drawAttire(spec.attire, pal)}
<rect x="110" y="168" width="36" height="36" rx="14" fill="${shade(skin, -0.12)}"/>
<ellipse cx="68" cy="128" rx="9" ry="13" fill="${shade(skin, -0.05)}"/><ellipse cx="188" cy="128" rx="9" ry="13" fill="${shade(skin, -0.05)}"/>
<ellipse cx="128" cy="120" rx="58" ry="62" fill="url(#f-${id})"/>
${hairFront(style, hair)}
<g stroke="${browColor}" stroke-width="4.8" stroke-linecap="round" fill="none">${brows}</g>
<g fill="#1f2937"><ellipse cx="104" cy="125" rx="7" ry="8.5"/><ellipse cx="152" cy="125" rx="7" ry="8.5"/></g>
<g fill="#fff"><circle cx="106.5" cy="121.5" r="2.5"/><circle cx="154.5" cy="121.5" r="2.5"/></g>
<ellipse cx="88" cy="144" rx="10" ry="6" fill="#f87171" opacity=".22"/><ellipse cx="168" cy="144" rx="10" ry="6" fill="#f87171" opacity=".22"/>
<path d="M126 130 L124 142 Q128 145 132 142" stroke="${shade(skin, -0.22)}" stroke-width="3.2" fill="none" stroke-linecap="round"/>
${mouth}
${drawBeard(spec.beard, hair)}
${drawGlasses(spec.glasses)}
</g>
</svg>
`
}

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(rootDir, 'assets', 'memoji')
mkdirSync(out, { recursive: true })
for (const s of ROSTER) writeFileSync(join(out, `${s.id}.svg`), draw(s.id, s.group))
console.log(`memoji: ${ROSTER.length} written to assets/memoji`)

const looksPath = join(rootDir, 'tools', 'persona-looks.json')
if (existsSync(looksPath)) {
  const looks = JSON.parse(readFileSync(looksPath, 'utf8')) as Record<string, PersonaLook>
  const personasOut = join(rootDir, 'assets', 'personas')
  mkdirSync(personasOut, { recursive: true })
  const slugs = readdirSync(join(rootDir, 'personas')).sort()
  for (const slug of slugs) {
    const spec = looks[slug] ?? { skin: 's2', hair: 'brown', hairStyle: 'short', palette: 'indigo' }
    writeFileSync(join(personasOut, `${slug}.svg`), drawPersona(slug, spec))
  }
  console.log(`personas: ${slugs.length} memojis written to assets/personas`)
}
