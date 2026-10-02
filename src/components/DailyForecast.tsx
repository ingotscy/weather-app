import type { Forecast } from '../api/openMeteo'
import { formatWeekday } from '../lib/format'
import { RAIN_LIKELY } from '../lib/rainOutlook'
import { formatTemp, type Unit } from '../lib/units'
import { describeWeather } from '../lib/weatherCodes'
import { WeatherIcon } from './WeatherIcon'

interface Props {
  days: Forecast['daily']
  unit: Unit
}

/**
 * "What's the week looking like?". Each bar shows that day's low → high on
 * the same scale as the whole week, so warmer and cooler days stand out.
 */
export function DailyForecast({ days, unit }: Props) {
  const weekMin = Math.min(...days.map((d) => d.min))
  const weekMax = Math.max(...days.map((d) => d.max))
  const span = Math.max(weekMax - weekMin, 1)

  return (
    <section className="glass animate-rise p-5 [animation-delay:200ms] sm:p-6" aria-label="7-day forecast">
      <h2 className="text-sm font-semibold tracking-wider text-white/70 uppercase">7-day forecast</h2>

      <ul className="mt-3 divide-y divide-white/10">
        {days.map((day, index) => {
          const weather = describeWeather(day.weatherCode, true)
          const left = ((day.min - weekMin) / span) * 100
          const width = ((day.max - day.min) / span) * 100

          return (
            <li key={day.date} className="grid grid-cols-[3.5rem_2.75rem_3rem_1fr] items-center gap-2 py-2.5 sm:grid-cols-[4rem_3rem_3.5rem_1fr] sm:gap-3">
              <span className="font-medium">{formatWeekday(day.date, index)}</span>
              <WeatherIcon icon={weather.icon} label={weather.label} className="h-10 w-10" />
              <span className={`text-xs ${day.rainChance >= RAIN_LIKELY ? 'font-semibold text-sky-200' : 'text-white/60'}`}>
                💧{day.rainChance}%
              </span>
              <div className="flex items-center gap-2 text-sm">
                <span className="w-8 text-right text-white/70">{formatTemp(day.min, unit)}</span>
                <div className="relative h-1.5 flex-1 rounded-full bg-white/15" aria-hidden>
                  <div
                    className="absolute h-full rounded-full bg-gradient-to-r from-sky-300 via-amber-200 to-orange-400"
                    style={{ left: `${left}%`, width: `${Math.max(width, 4)}%` }}
                  />
                </div>
                <span className="w-8 font-semibold">{formatTemp(day.max, unit)}</span>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
