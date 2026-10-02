import { describe, expect, it } from 'vitest'
import { aqiLevel, formatAgo, formatClock, formatHour, formatWeekday, uvLevel } from './format'
import { placeFromSearch, placeToSearch, samePlace } from './place'
import { convertTemp, formatTemp, formatWind } from './units'
import { describeWeather } from './weatherCodes'

describe('describeWeather', () => {
  it('picks the day or night icon', () => {
    expect(describeWeather(0, true)).toEqual({ label: 'Clear sky', icon: 'clear-day', theme: 'clear' })
    expect(describeWeather(0, false).icon).toBe('clear-night')
  })

  it('maps thunderstorms to the storm theme', () => {
    expect(describeWeather(95).theme).toBe('storm')
  })

  it('falls back safely for unknown codes', () => {
    expect(describeWeather(1234)).toEqual({ label: 'Unknown', icon: 'not-available', theme: 'cloudy' })
  })
})

describe('units', () => {
  it('converts Celsius to Fahrenheit', () => {
    expect(convertTemp(0, 'f')).toBe(32)
    expect(convertTemp(100, 'f')).toBe(212)
    expect(convertTemp(21, 'c')).toBe(21)
  })

  it('formats whole degrees', () => {
    expect(formatTemp(30.6, 'c')).toBe('31°')
    expect(formatTemp(30, 'f')).toBe('86°')
  })

  it('formats wind in km/h or mph', () => {
    expect(formatWind(10, 'c')).toBe('10 km/h')
    expect(formatWind(10, 'f')).toBe('6 mph')
  })
})

describe('format', () => {
  it('formats hours as 12-hour time', () => {
    expect(formatHour('2026-10-02T00:00')).toBe('12 am')
    expect(formatHour('2026-10-02T12:00')).toBe('12 pm')
    expect(formatHour('2026-10-02T15:00')).toBe('3 pm')
    expect(formatClock('2026-10-02T07:08')).toBe('7:08 am')
  })

  it('names weekdays without timezone shifts', () => {
    expect(formatWeekday('2026-10-02', 0)).toBe('Today')
    expect(formatWeekday('2026-10-03', 1)).toBe('Sat')
  })

  it('describes how long ago', () => {
    expect(formatAgo(10_000)).toBe('just now')
    expect(formatAgo(5 * 60_000)).toBe('5 min ago')
    expect(formatAgo(2 * 3_600_000)).toBe('2 h ago')
  })

  it('classifies UV and air quality', () => {
    expect(uvLevel(2).label).toBe('Low')
    expect(uvLevel(9).label).toBe('Very high')
    expect(aqiLevel(40).label).toBe('Good')
    expect(aqiLevel(120).tone).toBe('warn')
  })
})

describe('place in the URL', () => {
  const penang = { name: 'George Town', region: 'Penang, Malaysia', lat: 5.4141, lon: 100.3288 }

  it('round-trips through the query string', () => {
    expect(placeFromSearch(placeToSearch(penang))).toEqual(penang)
  })

  it('rejects missing or invalid coordinates', () => {
    expect(placeFromSearch('')).toBeNull()
    expect(placeFromSearch('?name=X&lat=abc&lon=1')).toBeNull()
    expect(placeFromSearch('?name=X&lat=95&lon=1')).toBeNull()
  })

  it('treats places within ~5 km as the same place', () => {
    // search result vs GPS position in George Town (~600 m apart)
    expect(samePlace(penang, { ...penang, lat: 5.4164, lon: 100.3327 })).toBe(true)
    expect(samePlace(penang, { ...penang, name: 'Bayan Lepas', lat: 5.3 })).toBe(false) // another town ~12 km south
    expect(samePlace(penang, { ...penang, lat: 3.14 })).toBe(false) // Kuala Lumpur
  })

  it('treats the same name within ~30 km as the same place, but not far-apart namesakes', () => {
    const klCentre = { name: 'Kuala Lumpur', lat: 3.1412, lon: 101.6865 }
    const klWest = { name: 'Kuala Lumpur', lat: 3.1397, lon: 101.6299 } // ~6 km away
    expect(samePlace(klCentre, klWest)).toBe(true)
    expect(samePlace(klCentre, { ...klWest, name: 'Petaling Jaya' })).toBe(false)

    const springfieldIL = { name: 'Springfield', lat: 39.8017, lon: -89.6437 }
    const springfieldMA = { name: 'Springfield', lat: 42.1015, lon: -72.5898 }
    expect(samePlace(springfieldIL, springfieldMA)).toBe(false)
  })
})
