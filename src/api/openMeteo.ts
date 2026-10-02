/**
 * All calls to outside services live here. Open-Meteo needs no API key, so
 * nothing secret is shipped to the browser (https://open-meteo.com).
 */
import type { Place } from '../lib/place'

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
const AIR_QUALITY_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality'
// Free, key-less reverse lookup for browser apps: coordinates → place name.
const REVERSE_GEOCODING_URL = 'https://api.bigdatacloud.net/data/reverse-geocode-client'

export class ApiError extends Error {}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  let response: Response
  try {
    response = await fetch(url, { signal })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError('Network error: check your internet connection.')
  }

  if (!response.ok) {
    throw new ApiError(`The weather service is unavailable right now (HTTP ${response.status}).`)
  }

  return response.json() as Promise<T>
}

/* ------------------------------------------------------------------ search */

interface GeocodingResponse {
  results?: Array<{
    id: number
    name: string
    latitude: number
    longitude: number
    country?: string
    admin1?: string
  }>
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  const params = new URLSearchParams({ name: query, count: '6', language: 'en', format: 'json' })
  const data = await getJson<GeocodingResponse>(`${GEOCODING_URL}?${params}`, signal)

  const places = (data.results ?? []).map((r) => ({
    name: r.name,
    region: [r.admin1, r.country].filter(Boolean).join(', ') || undefined,
    lat: r.latitude,
    lon: r.longitude,
  }))

  // Different villages can share a name and region; showing two identical rows
  // looks like a bug, so keep the first (most relevant) one.
  const seen = new Set<string>()

  return places.filter((p) => {
    const label = `${p.name}|${p.region ?? ''}`
    if (seen.has(label)) return false
    seen.add(label)
    return true
  })
}

interface ReverseGeocodingResponse {
  city?: string
  locality?: string
  principalSubdivision?: string
  countryName?: string
}

/** Best-effort name for the user's coordinates; falls back to "My location". */
export async function nameForCoordinates(lat: number, lon: number): Promise<Place> {
  const fallback: Place = { name: 'My location', lat, lon }
  try {
    const params = new URLSearchParams({ latitude: String(lat), longitude: String(lon), localityLanguage: 'en' })
    const data = await getJson<ReverseGeocodingResponse>(`${REVERSE_GEOCODING_URL}?${params}`)
    const name = data.city || data.locality
    if (!name) return fallback

    return {
      name,
      region: [data.principalSubdivision, data.countryName].filter(Boolean).join(', ') || undefined,
      lat,
      lon,
    }
  } catch {
    return fallback
  }
}

/* ---------------------------------------------------------------- forecast */

export interface Forecast {
  timezone: string
  utcOffsetSeconds: number // the place's offset from UTC, e.g. 32400 for Tokyo
  current: {
    time: string
    temperature: number
    feelsLike: number
    humidity: number
    windSpeed: number
    weatherCode: number
    isDay: boolean
  }
  hourly: Array<{
    time: string
    temperature: number
    weatherCode: number
    rainChance: number
    isDay: boolean
  }>
  daily: Array<{
    date: string
    weatherCode: number
    max: number
    min: number
    rainChance: number
    uvMax: number
    sunrise: string
    sunset: string
  }>
}

interface ForecastResponse {
  timezone: string
  utc_offset_seconds: number
  current: {
    time: string
    temperature_2m: number
    apparent_temperature: number
    relative_humidity_2m: number
    wind_speed_10m: number
    weather_code: number
    is_day: number
  }
  hourly: {
    time: string[]
    temperature_2m: number[]
    weather_code: number[]
    precipitation_probability: Array<number | null>
    is_day: number[]
  }
  daily: {
    time: string[]
    weather_code: number[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    precipitation_probability_max: Array<number | null>
    uv_index_max: Array<number | null>
    sunrise: string[]
    sunset: string[]
  }
}

export async function getForecast(lat: number, lon: number, signal?: AbortSignal): Promise<Forecast> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    timezone: 'auto', // times come back in the place's own local time
    forecast_days: '7',
    forecast_hours: '24', // the next 24 hours, starting now
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day',
    hourly: 'temperature_2m,weather_code,precipitation_probability,is_day',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,sunrise,sunset',
  })
  const data = await getJson<ForecastResponse>(`${FORECAST_URL}?${params}`, signal)

  return {
    timezone: data.timezone,
    utcOffsetSeconds: data.utc_offset_seconds,
    current: {
      time: data.current.time,
      temperature: data.current.temperature_2m,
      feelsLike: data.current.apparent_temperature,
      humidity: data.current.relative_humidity_2m,
      windSpeed: data.current.wind_speed_10m,
      weatherCode: data.current.weather_code,
      isDay: data.current.is_day === 1,
    },
    hourly: data.hourly.time.map((time, i) => ({
      time,
      temperature: data.hourly.temperature_2m[i],
      weatherCode: data.hourly.weather_code[i],
      rainChance: data.hourly.precipitation_probability[i] ?? 0,
      isDay: data.hourly.is_day[i] === 1,
    })),
    daily: data.daily.time.map((date, i) => ({
      date,
      weatherCode: data.daily.weather_code[i],
      max: data.daily.temperature_2m_max[i],
      min: data.daily.temperature_2m_min[i],
      rainChance: data.daily.precipitation_probability_max[i] ?? 0,
      uvMax: data.daily.uv_index_max[i] ?? 0,
      sunrise: data.daily.sunrise[i],
      sunset: data.daily.sunset[i],
    })),
  }
}

/* ------------------------------------------------------------- air quality */

interface AirQualityResponse {
  current?: { us_aqi?: number | null }
}

/** US AQI, or null when there's no data for the place (air quality is optional). */
export async function getAirQuality(lat: number, lon: number, signal?: AbortSignal): Promise<number | null> {
  const params = new URLSearchParams({ latitude: String(lat), longitude: String(lon), current: 'us_aqi' })
  const data = await getJson<AirQualityResponse>(`${AIR_QUALITY_URL}?${params}`, signal)

  return data.current?.us_aqi ?? null
}
