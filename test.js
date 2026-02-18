import { list, get, getProfile, getPersonaMd, all } from './index.js'

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
assert(slugs.length >= 700, 'Expected 700+ personas, got ' + slugs.length)
assert(slugs.includes('feynman'), 'Should include feynman')
assert(slugs.includes('zeekay'), 'Should include zeekay')
assert(slugs.includes('north-star'), 'Should include north-star')
assert(slugs[0] < slugs[1], 'Should be sorted')
console.log('  ✓ list()')

// Test getProfile()
const feynman = getProfile('feynman')
assert(feynman != null, 'feynman profile should exist')
assert(feynman && feynman.ocean, 'Should have ocean scores')
assert(feynman && typeof feynman.ocean.openness === 'number', 'openness should be number')
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

// Summary
console.log('')
if (failed === 0) {
  console.log(`All ${passed} tests passed ✓`)
} else {
  console.log(`${failed} FAILED, ${passed} passed`)
  process.exit(1)
}
