/**
 * Turns an Open-Meteo / WMO weather code into what the UI needs:
 * a human label, an animated icon and a background theme.
 * https://open-meteo.com/en/docs (section "WMO Weather interpretation codes")
 */

export type Theme = 'clear' | 'cloudy' | 'fog' | 'rain' | 'snow' | 'storm'

export interface WeatherInfo {
  label: string
  icon: string // file name in /public/icons (without .svg)
  theme: Theme
}

interface CodeInfo {
  label: string
  day: string
  night: string
  theme: Theme
}

const CODES: Record<number, CodeInfo> = {
  0: { label: 'Clear sky', day: 'clear-day', night: 'clear-night', theme: 'clear' },
  1: { label: 'Mainly clear', day: 'clear-day', night: 'clear-night', theme: 'clear' },
  2: { label: 'Partly cloudy', day: 'partly-cloudy-day', night: 'partly-cloudy-night', theme: 'cloudy' },
  3: { label: 'Overcast', day: 'overcast-day', night: 'overcast-night', theme: 'cloudy' },
  45: { label: 'Fog', day: 'fog-day', night: 'fog-night', theme: 'fog' },
  48: { label: 'Freezing fog', day: 'fog-day', night: 'fog-night', theme: 'fog' },
  51: { label: 'Light drizzle', day: 'partly-cloudy-day-drizzle', night: 'partly-cloudy-night-drizzle', theme: 'rain' },
  53: { label: 'Drizzle', day: 'drizzle', night: 'drizzle', theme: 'rain' },
  55: { label: 'Heavy drizzle', day: 'drizzle', night: 'drizzle', theme: 'rain' },
  56: { label: 'Freezing drizzle', day: 'sleet', night: 'sleet', theme: 'snow' },
  57: { label: 'Freezing drizzle', day: 'sleet', night: 'sleet', theme: 'snow' },
  61: { label: 'Light rain', day: 'partly-cloudy-day-rain', night: 'partly-cloudy-night-rain', theme: 'rain' },
  63: { label: 'Rain', day: 'rain', night: 'rain', theme: 'rain' },
  65: { label: 'Heavy rain', day: 'rain', night: 'rain', theme: 'rain' },
  66: { label: 'Freezing rain', day: 'sleet', night: 'sleet', theme: 'snow' },
  67: { label: 'Freezing rain', day: 'sleet', night: 'sleet', theme: 'snow' },
  71: { label: 'Light snow', day: 'partly-cloudy-day-snow', night: 'partly-cloudy-night-snow', theme: 'snow' },
  73: { label: 'Snow', day: 'snow', night: 'snow', theme: 'snow' },
  75: { label: 'Heavy snow', day: 'snow', night: 'snow', theme: 'snow' },
  77: { label: 'Snow grains', day: 'snow', night: 'snow', theme: 'snow' },
  80: { label: 'Rain showers', day: 'partly-cloudy-day-rain', night: 'partly-cloudy-night-rain', theme: 'rain' },
  81: { label: 'Rain showers', day: 'partly-cloudy-day-rain', night: 'partly-cloudy-night-rain', theme: 'rain' },
  82: { label: 'Violent rain showers', day: 'rain', night: 'rain', theme: 'rain' },
  85: { label: 'Snow showers', day: 'partly-cloudy-day-snow', night: 'partly-cloudy-night-snow', theme: 'snow' },
  86: { label: 'Heavy snow showers', day: 'snow', night: 'snow', theme: 'snow' },
  95: { label: 'Thunderstorm', day: 'thunderstorms-day-rain', night: 'thunderstorms-night-rain', theme: 'storm' },
  96: { label: 'Thunderstorm with hail', day: 'hail', night: 'hail', theme: 'storm' },
  99: { label: 'Thunderstorm with hail', day: 'hail', night: 'hail', theme: 'storm' },
}

const UNKNOWN: WeatherInfo = { label: 'Unknown', icon: 'not-available', theme: 'cloudy' }

export function describeWeather(code: number, isDay = true): WeatherInfo {
  const info = CODES[code]
  if (!info) return UNKNOWN

  return { label: info.label, icon: isDay ? info.day : info.night, theme: info.theme }
}

export function iconUrl(icon: string): string {
  return `/icons/${icon}.svg`
}
