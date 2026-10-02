import { Umbrella } from 'lucide-react'
import type { Forecast } from '../api/openMeteo'
import { formatHour } from '../lib/format'
import { RAIN_LIKELY, rainOutlook } from '../lib/rainOutlook'
import { formatTemp, type Unit } from '../lib/units'
import { describeWeather } from '../lib/weatherCodes'
import { WeatherIcon } from './WeatherIcon'

interface Props {
  hours: Forecast['hourly']
  current: Forecast['current']
  unit: Unit
}

/** "Will it rain later?": a one-line answer, then the next 24 hours. */
export function HourlyForecast({ hours, current, unit }: Props) {
  return (
    <section className="glass animate-rise p-5 [animation-delay:120ms] sm:p-6" aria-label="Next 24 hours">
      <h2 className="text-sm font-semibold tracking-wider text-white/70 uppercase">Next 24 hours</h2>
      <p className="mt-2 flex items-center gap-2 font-medium">
        <Umbrella className="h-4 w-4 shrink-0 text-sky-200" aria-hidden />
        {rainOutlook(hours)}
      </p>

      {/* The fade on the right edge hints that the strip scrolls. */}
      <ol className="no-scrollbar mt-4 -mx-1 flex snap-x gap-1 overflow-x-auto pr-8 pb-1 [mask-image:linear-gradient(to_right,black_85%,transparent)]">
        {hours.map((hour, index) => {
          // "Now" shows the same live reading as the main card, not the hour's forecast.
          const isNow = index === 0
          const weather = isNow
            ? describeWeather(current.weatherCode, current.isDay)
            : describeWeather(hour.weatherCode, hour.isDay)
          const temperature = isNow ? current.temperature : hour.temperature
          const likely = hour.rainChance >= RAIN_LIKELY

          return (
            <li
              key={hour.time}
              className={`flex min-w-16 snap-start flex-col items-center rounded-2xl px-2 py-3 transition hover:bg-white/10 ${isNow ? 'bg-white/15' : ''}`}
            >
              <span className="text-xs text-white/75">{isNow ? 'Now' : formatHour(hour.time)}</span>
              <WeatherIcon icon={weather.icon} label={weather.label} className="my-1 h-11 w-11" />
              <span className="font-semibold">{formatTemp(temperature, unit)}</span>
              <span className={`mt-1 text-xs ${likely ? 'font-semibold text-sky-200' : 'text-white/60'}`}>
                💧{hour.rainChance}%
              </span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
