/**
 * "Compare two places": the link format and the verdict line.
 * The URL keeps both places (?view=compare&aname=…&alat=…&bname=…), so refresh,
 * the Back button and shared links all work.
 */
import { formatTemp, type Unit } from './units'
import { type Place, placeFromSearch, placeToSearch } from './place'

export type Slots = [Place | null, Place | null]

/** Place → "aname=…&alat=…" (prefix "a" or "b"). */
function prefixed(place: Place, prefix: 'a' | 'b'): string {
  const params = new URLSearchParams(placeToSearch(place))
  const out = new URLSearchParams()
  params.forEach((value, key) => out.set(`${prefix}${key}`, value))

  return out.toString()
}

function unprefixed(params: URLSearchParams, prefix: 'a' | 'b'): Place | null {
  const out = new URLSearchParams()
  params.forEach((value, key) => key.startsWith(prefix) && out.set(key.slice(1), value))

  return placeFromSearch(`?${out.toString()}`)
}

export function compareToSearch([a, b]: Slots): string {
  const parts = ['view=compare']
  if (a) parts.push(prefixed(a, 'a'))
  if (b) parts.push(prefixed(b, 'b'))

  return `?${parts.join('&')}`
}

/** The two slots, or null when the URL isn't a compare view. */
export function compareFromSearch(search: string): Slots | null {
  const params = new URLSearchParams(search)
  if (params.get('view') !== 'compare') return null

  return [unprefixed(params, 'a'), unprefixed(params, 'b')]
}

/* ------------------------------------------------------------------ verdict */

export interface CompareSide {
  name: string
  temperature: number // °C now
  rainChanceToday: number // %
  uvMax: number
}

/**
 * The answer the user is actually looking for: which place is drier and
 * which is warmer. Differences too small to matter are called "about the same".
 */
export function compareVerdicts(a: CompareSide, b: CompareSide, unit: Unit): string[] {
  const lines: string[] = []

  const rainGap = a.rainChanceToday - b.rainChanceToday
  if (Math.abs(rainGap) < 10) {
    lines.push(`☂ Similar chance of rain today (${a.rainChanceToday}% vs ${b.rainChanceToday}%)`)
  } else {
    const drier = rainGap < 0 ? a : b
    const wetter = drier === a ? b : a
    lines.push(`☂ Drier today: ${drier.name} (${drier.rainChanceToday}% vs ${wetter.rainChanceToday}% chance of rain)`)
  }

  const tempGap = a.temperature - b.temperature
  if (Math.abs(tempGap) < 1.5) {
    lines.push(`🌡 About the same temperature now (${formatTemp(a.temperature, unit)} vs ${formatTemp(b.temperature, unit)})`)
  } else {
    const warmer = tempGap > 0 ? a : b
    const degrees = Math.round(Math.abs(unit === 'f' ? (tempGap * 9) / 5 : tempGap))
    lines.push(`🌡 Warmer now: ${warmer.name} (+${degrees}°)`)
  }

  if (Math.abs(a.uvMax - b.uvMax) >= 3) {
    const sunnier = a.uvMax > b.uvMax ? a : b
    lines.push(`☀ Stronger sun today: ${sunnier.name} (UV ${Math.round(sunnier.uvMax)})`)
  }

  return lines
}
