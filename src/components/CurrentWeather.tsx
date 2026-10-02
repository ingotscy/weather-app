import { Clock, RefreshCw, Share2 } from 'lucide-react'
import type { Forecast } from '../api/openMeteo'
import { formatAgo } from '../lib/format'
import { localTimeLabel } from '../lib/timezone'
import type { Place } from '../lib/place'
import { formatTemp, type Unit } from '../lib/units'
import { describeWeather } from '../lib/weatherCodes'
import { WeatherIcon } from './WeatherIcon'

interface Props {
  place: Place
  forecast: Forecast
  unit: Unit
  updatedAt: number
  now: number
  refreshing: boolean
  onRefresh: () => void
  onShare: () => void
}

/** "What's it like right now?": the answer you see first. */
export function CurrentWeather({ place, forecast, unit, updatedAt, now, refreshing, onRefresh, onShare }: Props) {
  const { current } = forecast
  const today = forecast.daily[0]
  const weather = describeWeather(current.weatherCode, current.isDay)

  return (
    <section className="glass animate-rise p-6 sm:p-8" aria-label="Current weather">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">{place.name}</h1>
          {place.region && <p className="truncate text-white/70">{place.region}</p>}
          {/* All times on this screen are the place's local time; say so, with the viewer's time for comparison. */}
          <p className="mt-1 flex items-center gap-1.5 text-xs text-white/65">
            <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {localTimeLabel(now, forecast.utcOffsetSeconds)}
          </p>
        </div>
        <button
          type="button"
          onClick={onShare}
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5 hover:bg-white/25"
        >
          <Share2 className="h-4 w-4" aria-hidden /> Share
        </button>
      </div>

      <div className="mt-4 flex items-center gap-2 sm:gap-6">
        <WeatherIcon icon={weather.icon} label={weather.label} className="h-28 w-28 shrink-0 sm:h-36 sm:w-36" />
        <div>
          <p className="text-7xl leading-none font-light tracking-tighter sm:text-8xl">{formatTemp(current.temperature, unit)}</p>
          <p className="mt-2 text-lg font-medium">{weather.label}</p>
          <p className="text-white/75">Feels like {formatTemp(current.feelsLike, unit)}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/15 pt-4 text-sm">
        <p className="text-white/85">
          <span className="font-semibold">H {formatTemp(today.max, unit)}</span>
          <span className="mx-2 text-white/40">·</span>
          <span className="font-semibold">L {formatTemp(today.min, unit)}</span>
        </p>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-1.5 text-white/70 transition hover:text-white"
          title="Refresh now"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} aria-hidden />
          Updated {formatAgo(now - updatedAt)}
        </button>
      </div>
    </section>
  )
}
