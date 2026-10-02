/**
 * "Is it a good time to…?": turns the forecast into simple, explainable
 * ratings for everyday activities. These are rules of thumb, not medical advice.
 *
 * Each activity starts at 3 ("Great"); every concern lowers it:
 * a minor concern by 1, a major one by 2. The worst concern is shown as the reason.
 */
import type { Forecast } from '../api/openMeteo'

export interface Conditions {
  feelsLike: number // °C
  rainChanceSoon: number // highest % chance in the next 3 hours
  windSpeed: number // km/h
  humidity: number // %
  uvMax: number // today's maximum
  airQuality: number | null // US AQI, null when unknown
  isDay: boolean
}

export type Activity = 'running' | 'cycling' | 'gardening' | 'laundry'

export interface Rating {
  activity: Activity
  name: string
  emoji: string
  score: 0 | 1 | 2 | 3
  face: string
  verdict: string
  reason: string
}

interface Concern {
  weight: 1 | 2
  reason: string
}

const ACTIVITIES: Record<Activity, { name: string; emoji: string }> = {
  running: { name: 'Running', emoji: '🏃' },
  cycling: { name: 'Cycling', emoji: '🚴' },
  gardening: { name: 'Gardening', emoji: '🌱' },
  laundry: { name: 'Laundry', emoji: '🧺' },
}

const FACES = ['😟', '😐', '🙂', '😀'] as const
const VERDICTS = ['Poor', 'Fair', 'Good', 'Great'] as const

function concernsFor(activity: Activity, c: Conditions): Concern[] {
  const list: Array<Concern | false> = []
  const uvMatters = c.isDay

  switch (activity) {
    case 'running':
      list.push(
        c.rainChanceSoon >= 60 ? { weight: 2, reason: 'Rain likely soon' } : c.rainChanceSoon >= 30 && { weight: 1, reason: 'Chance of rain' },
        c.feelsLike > 35 ? { weight: 2, reason: 'Too hot to run safely' } : c.feelsLike > 30 && { weight: 1, reason: 'Hot, stay hydrated' },
        c.feelsLike < 0 && { weight: 1, reason: 'Freezing, dress warmly' },
        c.airQuality !== null && (c.airQuality > 150 ? { weight: 2, reason: 'Unhealthy air' } : c.airQuality > 100 && { weight: 1, reason: 'Air quality is poor' }),
        c.windSpeed > 40 && { weight: 1, reason: 'Very windy' },
      )
      break

    case 'cycling':
      list.push(
        c.rainChanceSoon >= 50 ? { weight: 2, reason: 'Rain likely: slippery roads' } : c.rainChanceSoon >= 25 && { weight: 1, reason: 'Chance of rain' },
        c.windSpeed > 35 ? { weight: 2, reason: 'Strong wind' } : c.windSpeed > 25 && { weight: 1, reason: 'Windy' },
        c.feelsLike > 37 ? { weight: 2, reason: 'Too hot' } : c.feelsLike > 32 && { weight: 1, reason: 'Hot, bring water' },
        c.airQuality !== null && c.airQuality > 150 && { weight: 2, reason: 'Unhealthy air' },
      )
      break

    case 'gardening':
      list.push(
        c.rainChanceSoon >= 60 && { weight: 2, reason: 'Rain likely soon' },
        uvMatters && c.uvMax >= 8 && { weight: 1, reason: 'Strong sun: wear a hat' },
        c.feelsLike > 34 && { weight: 1, reason: 'Hot: garden early or late' },
        c.feelsLike < 2 && { weight: 2, reason: 'Frost risk' },
      )
      break

    case 'laundry':
      list.push(
        c.rainChanceSoon >= 40 ? { weight: 2, reason: 'Rain likely: keep it inside' } : c.rainChanceSoon >= 20 && { weight: 1, reason: 'Might rain' },
        c.humidity > 85 && { weight: 1, reason: 'Humid: dries slowly' },
        !c.isDay && { weight: 1, reason: 'No sun: dries slowly' },
      )
      break
  }

  return list.filter((x): x is Concern => Boolean(x))
}

export function rateActivity(activity: Activity, conditions: Conditions): Rating {
  const concerns = concernsFor(activity, conditions)
  const penalty = concerns.reduce((sum, c) => sum + c.weight, 0)
  const score = Math.max(0, 3 - penalty) as Rating['score']
  const worst = [...concerns].sort((a, b) => b.weight - a.weight)[0]

  return {
    activity,
    ...ACTIVITIES[activity],
    score,
    face: FACES[score],
    verdict: VERDICTS[score],
    reason: worst?.reason ?? 'Good conditions',
  }
}

export function rateActivities(conditions: Conditions): Rating[] {
  return (Object.keys(ACTIVITIES) as Activity[]).map((a) => rateActivity(a, conditions))
}

/** The inputs for the activity rules, taken from data we already loaded. */
export function conditionsFrom(forecast: Forecast, airQuality: number | null | undefined): Conditions {
  return {
    feelsLike: forecast.current.feelsLike,
    rainChanceSoon: Math.max(0, ...forecast.hourly.slice(0, 3).map((h) => h.rainChance)),
    windSpeed: forecast.current.windSpeed,
    humidity: forecast.current.humidity,
    uvMax: forecast.daily[0]?.uvMax ?? 0,
    airQuality: airQuality ?? null,
    isDay: forecast.current.isDay,
  }
}
