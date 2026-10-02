import { formatHour } from './format'

export const RAIN_LIKELY = 50 // % chance from which we call rain "likely"

interface Hour {
  time: string
  rainChance: number
}

/**
 * Answers "Will it rain later?" in one sentence, so the user doesn't have to
 * read 24 numbers.
 */
export function rainOutlook(hours: Hour[]): string {
  const firstLikely = hours.findIndex((h) => h.rainChance >= RAIN_LIKELY)

  if (firstLikely === -1) {
    const peak = Math.max(0, ...hours.map((h) => h.rainChance))
    return peak >= 20 ? `Mostly dry, with a small chance of showers (up to ${peak}%).` : 'No rain expected in the next 24 hours.'
  }

  const peak = Math.max(...hours.slice(firstLikely).map((h) => h.rainChance))
  if (firstLikely === 0) return `Rain likely right now (${peak}%). Take an umbrella.`

  return `Rain likely from ${formatHour(hours[firstLikely].time)} (up to ${peak}%). Take an umbrella.`
}
