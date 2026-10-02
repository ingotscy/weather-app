/**
 * The API always returns metric values; we convert on the client, so switching
 * °C/°F is instant and needs no new request.
 */

export type Unit = 'c' | 'f'

export function convertTemp(celsius: number, unit: Unit): number {
  return unit === 'f' ? (celsius * 9) / 5 + 32 : celsius
}

/** Whole degrees, e.g. "31°". */
export function formatTemp(celsius: number, unit: Unit): string {
  return `${Math.round(convertTemp(celsius, unit))}°`
}

/** Metric users get km/h, imperial users get mph. */
export function formatWind(kmh: number, unit: Unit): string {
  return unit === 'f' ? `${Math.round(kmh * 0.621371)} mph` : `${Math.round(kmh)} km/h`
}
