import { describe, expect, it } from 'vitest'
import { rainOutlook } from './rainOutlook'

const hours = (chances: number[]) =>
  chances.map((rainChance, i) => ({ time: `2026-10-02T${String(14 + i).padStart(2, '0')}:00`, rainChance }))

describe('rainOutlook', () => {
  it('says when rain becomes likely', () => {
    expect(rainOutlook(hours([10, 20, 60, 80, 30]))).toBe('Rain likely from 4 pm (up to 80%). Take an umbrella.')
  })

  it('handles rain right now', () => {
    expect(rainOutlook(hours([70, 40]))).toBe('Rain likely right now (70%). Take an umbrella.')
  })

  it('mentions a small chance of showers', () => {
    expect(rainOutlook(hours([10, 30, 20]))).toBe('Mostly dry, with a small chance of showers (up to 30%).')
  })

  it('says dry when there is no real chance', () => {
    expect(rainOutlook(hours([0, 5, 10]))).toBe('No rain expected in the next 24 hours.')
    expect(rainOutlook([])).toBe('No rain expected in the next 24 hours.')
  })
})
