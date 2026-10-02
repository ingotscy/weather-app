/**
 * Open-Meteo returns local times for the place itself (timezone=auto), e.g.
 * "2026-10-02T15:00". We read them as plain text so the user's own computer
 * timezone never shifts the hours of a city on the other side of the world.
 */

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** "2026-10-02T15:00" → "3 pm" */
export function formatHour(localIso: string): string {
  const hour = Number(localIso.slice(11, 13))
  const suffix = hour < 12 ? 'am' : 'pm'
  const h12 = hour % 12 === 0 ? 12 : hour % 12

  return `${h12} ${suffix}`
}

/** "2026-10-02T07:08" → "7:08 am" */
export function formatClock(localIso: string): string {
  const minutes = localIso.slice(14, 16)
  const [h, suffix] = formatHour(localIso).split(' ')

  return `${h}:${minutes} ${suffix}`
}

/** "2026-10-02" → "Fri" (or "Today" for the first day). */
export function formatWeekday(localDate: string, index: number): string {
  if (index === 0) return 'Today'

  const [y, m, d] = localDate.split('-').map(Number)

  return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]
}

/** Milliseconds ago → "just now", "5 min ago", "2 h ago". */
export function formatAgo(msAgo: number): string {
  const minutes = Math.floor(msAgo / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`

  return `${Math.floor(minutes / 60)} h ago`
}

export interface Level {
  label: string
  tone: 'good' | 'ok' | 'warn' | 'bad' | 'severe'
}

/** WHO UV index categories. */
export function uvLevel(uv: number): Level {
  if (uv < 3) return { label: 'Low', tone: 'good' }
  if (uv < 6) return { label: 'Moderate', tone: 'ok' }
  if (uv < 8) return { label: 'High', tone: 'warn' }
  if (uv < 11) return { label: 'Very high', tone: 'bad' }

  return { label: 'Extreme', tone: 'severe' }
}

/** US EPA air quality index categories. */
export function aqiLevel(aqi: number): Level {
  if (aqi <= 50) return { label: 'Good', tone: 'good' }
  if (aqi <= 100) return { label: 'Moderate', tone: 'ok' }
  if (aqi <= 150) return { label: 'Unhealthy for sensitive groups', tone: 'warn' }
  if (aqi <= 200) return { label: 'Unhealthy', tone: 'bad' }

  return { label: 'Very unhealthy', tone: 'severe' }
}
