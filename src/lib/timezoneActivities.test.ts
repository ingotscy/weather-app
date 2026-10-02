import { describe, expect, it } from 'vitest'
import { type Conditions, rateActivities, rateActivity } from './activities'
import { clockAtOffset, formatOffset, localTimeLabel } from './timezone'

describe('timezone', () => {
  // 2026-10-02 09:42 UTC
  const now = Date.UTC(2026, 9, 2, 9, 42)

  it('formats UTC offsets', () => {
    expect(formatOffset(0)).toBe('GMT')
    expect(formatOffset(9 * 3600)).toBe('GMT+9')
    expect(formatOffset(5.5 * 3600)).toBe('GMT+5:30')
    expect(formatOffset(-4 * 3600)).toBe('GMT-4')
  })

  it('shows the clock at an offset', () => {
    expect(clockAtOffset(now, 9 * 3600)).toBe('6:42 pm') // Tokyo
    expect(clockAtOffset(now, 8 * 3600)).toBe('5:42 pm') // Kuala Lumpur
    expect(clockAtOffset(now, -4 * 3600)).toBe('5:42 am') // New York (summer)
  })

  it('adds the viewer time only when the timezones differ', () => {
    expect(localTimeLabel(now, 9 * 3600, 8 * 3600)).toBe('Local time 6:42 pm · GMT+9 · 5:42 pm your time')
    expect(localTimeLabel(now, 8 * 3600, 8 * 3600)).toBe('Local time 5:42 pm · GMT+8')
  })
})

describe('activities', () => {
  const perfect: Conditions = {
    feelsLike: 22,
    rainChanceSoon: 0,
    windSpeed: 8,
    humidity: 55,
    uvMax: 4,
    airQuality: 30,
    isDay: true,
  }

  it('rates everything great on a perfect day', () => {
    for (const rating of rateActivities(perfect)) {
      expect(rating).toMatchObject({ score: 3, face: '😀', verdict: 'Great', reason: 'Good conditions' })
    }
  })

  it('warns runners about heat and shows the worst reason', () => {
    const rating = rateActivity('running', { ...perfect, feelsLike: 37, rainChanceSoon: 35 })
    expect(rating.score).toBe(0) // -2 heat, -1 rain
    expect(rating.face).toBe('😟')
    expect(rating.reason).toBe('Too hot to run safely')
  })

  it('keeps laundry inside when rain is likely', () => {
    expect(rateActivity('laundry', { ...perfect, rainChanceSoon: 70 })).toMatchObject({ score: 1, reason: 'Rain likely: keep it inside' })
  })

  it('ignores UV at night and skips unknown air quality', () => {
    expect(rateActivity('gardening', { ...perfect, uvMax: 11, isDay: false }).score).toBe(3)
    expect(rateActivity('running', { ...perfect, airQuality: null }).score).toBe(3)
  })

  it('lowers cycling for wind', () => {
    expect(rateActivity('cycling', { ...perfect, windSpeed: 30 })).toMatchObject({ score: 2, face: '🙂', reason: 'Windy' })
  })
})
