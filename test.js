import { list, get, getProfile, getPersonaMd, all, member, team, parse } from './index.js'

let passed = 0
let failed = 0

function assert(condition, msg) {
  if (condition) {
    passed++
  } else {
    failed++
    console.error('  FAIL:', msg)
  }
}

// Test list()
const slugs = list()
console.log('list():', slugs.length, 'personas')
assert(slugs.length >= 600, 'Expected 600+ personas, got ' + slugs.length)

// One entry per person. The generator stored each enrichment pass as its own
// persona - Marie Curie was four people - so a raw count passed while the
// corpus was 12% redundant. Uniqueness is what was actually broken.
const rosterNames = slugs.map((s) => (getProfile(s) || {}).name).filter(Boolean)
const rosterDupes = rosterNames.filter((n, i) => rosterNames.indexOf(n) !== i)
assert(rosterDupes.length === 0, 'Duplicate names: ' + [...new Set(rosterDupes)].slice(0, 5).join(', '))
console.log('  OK one entry per person (' + rosterNames.length + ' names, 0 duplicates)')
assert(slugs.includes('feynman'), 'Should include feynman')
assert(slugs.includes('zeekay'), 'Should include zeekay')
assert(slugs.includes('north-star'), 'Should include north-star')
assert(slugs[0] < slugs[1], 'Should be sorted')
console.log('  ✓ list()')

// Test getProfile()
const feynman = getProfile('feynman')
assert(feynman != null, 'feynman profile should exist')
assert(feynman && typeof feynman.name === 'string', 'profile should carry a name')
assert(feynman && typeof feynman.category === 'string', 'profile should carry a category')
assert(feynman && feynman.ocean === undefined, 'no generated psychometrics')
console.log('  ✓ getProfile()')

// Test getProfile() missing
assert(getProfile('nonexistent-slug-xyz') === null, 'Missing should return null')
console.log('  ✓ getProfile() null for missing')

// Test getPersonaMd()
const md = getPersonaMd('feynman')
assert(md != null, 'feynman PERSONA.md should exist')
assert(md && md.includes('Feynman'), 'Should contain Feynman')
console.log('  ✓ getPersonaMd()')

// Test getPersonaMd() missing
assert(getPersonaMd('aristotle') === null, 'aristotle has no PERSONA.md')
console.log('  ✓ getPersonaMd() null when no PERSONA.md')

// Test get()
const ada = get('ada')
assert(ada != null, 'ada should exist')
assert(ada && ada.slug === 'ada', 'slug should match')
assert(ada && ada.profile != null, 'should have profile')
assert(ada && ada.persona != null, 'ada should have PERSONA.md')
console.log('  ✓ get()')

// Test get() missing
assert(get('does-not-exist') === null, 'Missing should return null')
console.log('  ✓ get() null for missing')

// Test all()
const everyone = all()
assert(everyone.length === slugs.length, 'all() count should match list()')
assert(everyone[0].slug != null, 'Each entry should have slug')
console.log('  ✓ all()')

// Count PERSONA.md files
const withMd = everyone.filter(p => p.persona != null)
console.log('  Personas with PERSONA.md:', withMd.length)
assert(withMd.length >= 14, 'Should have 14+ with PERSONA.md')
console.log('  ✓ 14+ rich PERSONA.md files')

// Verify zeekay persona
const z = get('zeekay')
assert(z && z.profile && z.persona, 'zeekay should have both profile and PERSONA.md')
assert(z && z.persona && z.persona.includes('Architect'), 'zeekay PERSONA.md should mention Architect')
console.log('  ✓ zeekay persona')

// The core agent team: each member is who the product shows and what the
// model is told. A name is what a person reads, so it is capitalized; the id is
// the handle code keys on, so it is the name in lower case.
const crew = team()
const ids = crew.map((m) => m.id)
assert(
  JSON.stringify(ids) === JSON.stringify(['des', 'dev', 'einstein', 'feynman', 'leo', 'maya', 'nora', 'vi']),
  'team() should be the eight core members sorted by id, got ' + ids.join(','),
)
for (const m of crew) {
  assert(/^[A-Z][a-z]+$/.test(m.name), `${m.id}: name "${m.name}" should be one capitalized word`)
  assert(m.name.toLowerCase() === m.id, `${m.id}: id should be the name in lower case`)
  assert(m.role.length > 0, `${m.id}: should have a role`)
  assert(/^enso(-[a-z]+)?$/.test(m.model), `${m.id}: model "${m.model}" should be an Enso tier`)
  assert(m.instructions.startsWith(`You are ${m.name},`), `${m.id}: instructions should open "You are ${m.name},"`)
  assert(!/\bas an ai\b/i.test(m.instructions), `${m.id}: instructions should not say "as an AI"`)
  assert(/\nHand-offs: /.test(m.instructions), `${m.id}: instructions should say whom it hands off to`)
  for (const other of crew) {
    if (other.id !== m.id && new RegExp(`\\b${other.id}\\b`).test(m.instructions)) {
      assert(false, `${m.id}: names ${other.id} in lower case; a teammate is written by name`)
    }
  }
  if (m.persona) assert(getProfile(m.persona) != null, `${m.id}: persona ${m.persona} should be in the roster`)
}
const roles = crew.map((m) => m.role)
assert(new Set(roles).size === roles.length, 'each member should have a role of its own')
// Every teammate a member hands off to is on the team.
for (const m of crew) {
  const line = m.instructions.split('\nHand-offs: ')[1] || ''
  for (const named of line.match(/\b[A-Z][a-z]+\b(?= (?:for|to|builds|checks|tells|decides|with|when|says))/g) || []) {
    assert(crew.some((o) => o.name === named), `${m.id}: hands off to ${named}, who is not on the team`)
  }
}
console.log('  ✓ team(): ' + crew.map((m) => `${m.name} (${m.role})`).join(', '))

assert(member('dev') && member('dev').name === 'Dev', 'member(dev) should be Dev')
assert(member('nobody') === null, 'member() should be null for no such member')
assert(member('../README') === null, 'member() should read nothing outside team/')
assert(member('DEV') === null, 'member() should take the id in lower case only')
let refused = false
try {
  parse('x', 'no front matter')
} catch {
  refused = true
}
assert(refused, 'parse() should refuse a file with no front matter')
console.log('  ✓ member() and parse()')

// Summary
console.log('')
if (failed === 0) {
  console.log(`All ${passed} tests passed ✓`)
} else {
  console.log(`${failed} FAILED, ${passed} passed`)
  process.exit(1)
}
