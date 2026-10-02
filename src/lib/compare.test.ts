import { describe, expect, it } from 'vitest'
import { compareFromSearch, compareToSearch, compareVerdicts } from './compare'

const penang = { name: 'George Town', region: 'Penang, Malaysia', lat: 5.4141, lon: 100.3288 }
const kl = { name: 'Kuala Lumpur', region: 'Kuala Lumpur, Malaysia', lat: 3.1412, lon: 101.6865 }

describe('compare link', () => {
  it('round-trips both places through the URL', () => {
    expect(compareFromSearch(compareToSearch([penang, kl]))).toEqual([penang, kl])
  })

  it('keeps an empty slot empty', () => {
    expect(compareFromSearch(compareToSearch([penang, null]))).toEqual([penang, null])
    expect(compareFromSearch('?view=compare')).toEqual([null, null])
  })

  it('returns null when the URL is not a compare view', () => {
    expect(compareFromSearch('?name=X&lat=1&lon=2')).toBeNull()
    expect(compareFromSearch('')).toBeNull()
  })
})

describe('compareVerdicts', () => {
  const a = { name: 'Penang', temperature: 30, rainChanceToday: 20, uvMax: 9 }
  const b = { name: 'Langkawi', temperature: 27, rainChanceToday: 80, uvMax: 8 }

  it('names the drier and the warmer place', () => {
    expect(compareVerdicts(a, b, 'c')).toEqual([
      '☂ Drier today: Penang (20% vs 80% chance of rain)',
      '🌡 Warmer now: Penang (+3°)',
    ])
  })

  it('calls small differences "about the same"', () => {
    const lines = compareVerdicts(a, { ...a, name: 'B', temperature: 30.8, rainChanceToday: 25 }, 'c')
    expect(lines[0]).toBe('☂ Similar chance of rain today (20% vs 25%)')
    expect(lines[1]).toBe('🌡 About the same temperature now (30° vs 31°)')
  })

  it('shows the temperature gap in the chosen unit', () => {
    expect(compareVerdicts(a, b, 'f')[1]).toBe('🌡 Warmer now: Penang (+5°)')
  })

  it('mentions stronger sun only when it really differs', () => {
    expect(compareVerdicts(a, { ...b, uvMax: 4 }, 'c')[2]).toBe('☀ Stronger sun today: Penang (UV 9)')
    expect(compareVerdicts(a, b, 'c')).toHaveLength(2)
  })
})
