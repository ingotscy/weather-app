import type { Forecast } from '../api/openMeteo'
import { aqiLevel, formatClock, type Level, uvLevel } from '../lib/format'
import { formatWind, type Unit } from '../lib/units'
import { WeatherIcon } from './WeatherIcon'

interface Props {
  forecast: Forecast
  airQuality: number | null | undefined
  unit: Unit
}

const TONE: Record<Level['tone'], string> = {
  good: 'bg-emerald-400/25 text-emerald-100',
  ok: 'bg-yellow-300/25 text-yellow-100',
  warn: 'bg-orange-400/30 text-orange-100',
  bad: 'bg-red-500/30 text-red-100',
  severe: 'bg-fuchsia-600/35 text-fuchsia-100',
}

interface TileProps {
  icon: string
  title: string
  value: string
  level?: Level
  note?: string
}

function Tile({ icon, title, value, level, note }: TileProps) {
  return (
    <div className="glass flex items-center gap-2 p-3 transition hover:-translate-y-0.5 sm:gap-3 sm:p-4">
      <WeatherIcon icon={icon} label="" className="h-9 w-9 shrink-0 sm:h-12 sm:w-12" />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold tracking-wider text-white/65 uppercase sm:text-xs">{title}</p>
        <p className="text-lg font-semibold whitespace-nowrap sm:text-xl">{value}</p>
        {level && (
          <span className={`mt-1 inline-block rounded-lg px-2 py-0.5 text-[11px] leading-tight font-medium sm:text-xs ${TONE[level.tone]}`}>
            {level.label}
          </span>
        )}
        {note && <p className="text-xs text-white/65">{note}</p>}
      </div>
    </div>
  )
}

/** Health and comfort details: sunburn risk, air quality, daylight, comfort. */
export function DetailsGrid({ forecast, airQuality, unit }: Props) {
  const today = forecast.daily[0]
  const uv = Math.round(today.uvMax)

  return (
    <section className="grid animate-rise grid-cols-2 gap-3 [animation-delay:280ms] sm:gap-4" aria-label="Details">
      <Tile icon="uv-index" title="UV index" value={String(uv)} level={uvLevel(uv)} />
      {airQuality != null ? (
        <Tile icon="dust-wind" title="Air quality" value={String(airQuality)} level={aqiLevel(airQuality)} />
      ) : (
        <Tile icon="dust-wind" title="Air quality" value="–" note="No data for this place" />
      )}
      <Tile icon="sunrise" title="Sunrise" value={formatClock(today.sunrise)} />
      <Tile icon="sunset" title="Sunset" value={formatClock(today.sunset)} />
      <Tile icon="humidity" title="Humidity" value={`${forecast.current.humidity}%`} />
      <Tile icon="wind" title="Wind" value={formatWind(forecast.current.windSpeed, unit)} />
    </section>
  )
}
