import type { Theme } from '../lib/weatherCodes'

interface Props {
  theme: Theme | 'welcome'
  isDay?: boolean
}

/**
 * Full-screen background that matches the weather and time of day.
 * The `key` makes it fade in again whenever the sky changes.
 */
export function Sky({ theme, isDay = true }: Props) {
  const variant = theme === 'welcome' ? 'sky-welcome sky-day' : `sky-${theme}-${isDay ? 'day' : 'night'} ${isDay ? 'sky-day' : ''}`

  return <div key={variant} className={`sky ${variant}`} aria-hidden />
}
