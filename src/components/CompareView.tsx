import { ArrowLeft, ArrowRight, RefreshCw, Scale, X } from 'lucide-react'
import { useState } from 'react'
import type { Forecast } from '../api/openMeteo'
import { useOptionalForecast } from '../hooks/useWeather'
import { compareVerdicts, type Slots } from '../lib/compare'
import { uvLevel } from '../lib/format'
import { type Place, samePlace } from '../lib/place'
import { rainOutlook } from '../lib/rainOutlook'
import { localTimeLabel } from '../lib/timezone'
import { formatTemp, type Unit } from '../lib/units'
import { describeWeather } from '../lib/weatherCodes'
import { SearchBox } from './SearchBox'
import { Sky } from './Sky'
import { WeatherIcon } from './WeatherIcon'

interface Props {
  slots: Slots
  onChange: (slots: Slots) => void
  recentPlaces: Place[]
  onPicked: (place: Place) => void // remember in recent places
  onOpen: (place: Place) => void // open the full forecast
  onBack: () => void
  unit: Unit
  now: number
}

type ForecastQuery = ReturnType<typeof useOptionalForecast>

/** "Here or there?": two places side by side, with the answer spelled out. */
export function CompareView({ slots, onChange, recentPlaces, onPicked, onOpen, onBack, unit, now }: Props) {
  const [a, b] = slots
  const queryA = useOptionalForecast(a)
  const queryB = useOptionalForecast(b)
  const [note, setNote] = useState<string | null>(null)
  const [activeCard, setActiveCard] = useState(0)

  const filled = slots.filter(Boolean).length
  const pick = (place: Place) => {
    if (slots.some((s) => s && samePlace(s, place))) {
      setNote(`${place.name} is already in the comparison.`)
      return
    }
    setNote(null)
    onPicked(place)
    onChange(a === null ? [place, b] : [a, place])
  }
  const remove = (index: 0 | 1) => onChange(index === 0 ? [null, b] : [a, null])

  const suggestions = recentPlaces.filter((p) => !slots.some((s) => s && samePlace(s, p))).slice(0, 5)
  const verdicts =
    a && b && queryA.data && queryB.data
      ? compareVerdicts(
          { name: a.name, temperature: queryA.data.current.temperature, rainChanceToday: queryA.data.daily[0].rainChance, uvMax: queryA.data.daily[0].uvMax },
          { name: b.name, temperature: queryB.data.current.temperature, rainChanceToday: queryB.data.daily[0].rainChance, uvMax: queryB.data.daily[0].uvMax },
          unit,
        )
      : null

  return (
    <>
      <Sky theme="welcome" />

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm transition hover:bg-white/25">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back
        </button>
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight sm:text-2xl">
          <Scale className="h-5 w-5 text-sky-200" aria-hidden /> Compare two places
        </h1>
      </div>

      {filled < 2 && (
        <section className="glass relative z-20 mt-4 animate-rise p-4 sm:p-5" aria-label="Add a place">
          <p className="text-sm font-medium">
            Add a place <span className="text-white/60">({filled + 1} of 2)</span>
          </p>
          <div className="mt-3">
            <SearchBox onSelect={pick} />
          </div>
          {suggestions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="py-1.5 text-xs text-white/60">Recent:</span>
              {suggestions.map((p) => (
                <button key={`${p.lat},${p.lon}`} type="button" onClick={() => pick(p)} className="rounded-full bg-white/15 px-3 py-1.5 text-sm transition hover:bg-white/25">
                  + {p.name}
                </button>
              ))}
            </div>
          )}
          {note && <p className="mt-2 text-sm text-amber-200">{note}</p>}
        </section>
      )}

      {/* Phone: swipe sideways between the two cards. Tablet/laptop: side by side. */}
      <div
        className="no-scrollbar mt-4 -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0"
        onScroll={(e) => {
          const el = e.currentTarget
          setActiveCard(el.scrollLeft > el.scrollWidth / 4 ? 1 : 0)
        }}
      >
        {([a, b] as const).map((place, index) =>
          place ? (
            <CompareCard
              key={`${place.lat},${place.lon}`}
              place={place}
              query={index === 0 ? queryA : queryB}
              unit={unit}
              now={now}
              onRemove={() => remove(index as 0 | 1)}
              onOpen={() => onOpen(place)}
            />
          ) : (
            <div key={`empty-${index}`} className="flex min-h-72 w-[86%] shrink-0 snap-center items-center justify-center rounded-3xl border-2 border-dashed border-white/25 p-6 text-center text-white/60 sm:w-auto">
              Pick {index === 0 ? 'a first' : 'a second'} place above
            </div>
          ),
        )}
      </div>

      <div className="mt-3 flex justify-center gap-2 sm:hidden" aria-hidden>
        {[0, 1].map((i) => (
          <span key={i} className={`h-2 rounded-full transition-all ${activeCard === i ? 'w-5 bg-white' : 'w-2 bg-white/40'}`} />
        ))}
      </div>

      {verdicts && (
        <section className="glass mt-4 animate-rise p-5 sm:p-6" aria-label="Verdict">
          <h2 className="text-sm font-semibold tracking-wider text-white/70 uppercase">The short answer</h2>
          <ul className="mt-2 space-y-1.5">
            {verdicts.map((line) => (
              <li key={line} className="font-medium">
                {line}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}

interface CardProps {
  place: Place
  query: ForecastQuery
  unit: Unit
  now: number
  onRemove: () => void
  onOpen: () => void
}

/** One side of the comparison. Loads on its own, so one failing city doesn't break the other. */
function CompareCard({ place, query, unit, now, onRemove, onOpen }: CardProps) {
  return (
    <article className="glass flex w-[86%] shrink-0 snap-center flex-col p-5 sm:w-auto sm:p-6" aria-label={`Weather in ${place.name}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="truncate text-xl font-semibold tracking-tight">{place.name}</h2>
          {place.region && <p className="truncate text-sm text-white/70">{place.region}</p>}
        </div>
        <button type="button" onClick={onRemove} aria-label={`Remove ${place.name} from comparison`} title="Remove from comparison" className="rounded-full p-1.5 text-white/70 transition hover:bg-white/15 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>

      {query.isPending && <div className="skeleton mt-4 h-60" aria-busy="true" aria-label={`Loading ${place.name}`} />}

      {query.isError && (
        <div className="mt-6 flex flex-1 flex-col items-center justify-center text-center" role="alert">
          <p className="text-white/80">Couldn't load {place.name}.</p>
          <button type="button" onClick={() => query.refetch()} className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-900">
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
        </div>
      )}

      {query.data && <CompareDetails forecast={query.data} unit={unit} now={now} onOpen={onOpen} />}
    </article>
  )
}

function CompareDetails({ forecast, unit, now, onOpen }: { forecast: Forecast; unit: Unit; now: number; onOpen: () => void }) {
  const { current } = forecast
  const today = forecast.daily[0]
  const weather = describeWeather(current.weatherCode, current.isDay)
  const uv = Math.round(today.uvMax)

  return (
    <>
      <p className="mt-1 text-xs text-white/60">{localTimeLabel(now, forecast.utcOffsetSeconds)}</p>

      <div className="mt-3 flex items-center gap-3">
        <WeatherIcon icon={weather.icon} label={weather.label} className="h-24 w-24 shrink-0" />
        <div>
          <p className="text-6xl leading-none font-light tracking-tighter">{formatTemp(current.temperature, unit)}</p>
          <p className="mt-1 font-medium">{weather.label}</p>
          <p className="text-sm text-white/70">Feels like {formatTemp(current.feelsLike, unit)}</p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
        <div className="rounded-2xl bg-white/10 px-2 py-2.5">
          <dt className="text-[11px] tracking-wider text-white/60 uppercase">Hi / Lo</dt>
          <dd className="mt-0.5 font-semibold">
            {formatTemp(today.max, unit)} / {formatTemp(today.min, unit)}
          </dd>
        </div>
        <div className="rounded-2xl bg-white/10 px-2 py-2.5">
          <dt className="text-[11px] tracking-wider text-white/60 uppercase">Rain</dt>
          <dd className="mt-0.5 font-semibold">💧{today.rainChance}%</dd>
          <dd className="text-[11px] leading-tight text-white/70">today</dd>
        </div>
        <div className="rounded-2xl bg-white/10 px-2 py-2.5">
          <dt className="text-[11px] tracking-wider text-white/60 uppercase">UV</dt>
          <dd className="mt-0.5 font-semibold">{uv}</dd>
          <dd className="text-[11px] leading-tight text-white/70">{uvLevel(uv).label}</dd>
        </div>
      </dl>

      <p className="mt-4 text-sm text-white/85">{rainOutlook(forecast.hourly)}</p>

      <button
        type="button"
        onClick={onOpen}
        className="mt-auto inline-flex items-center justify-center gap-1.5 self-start pt-4 text-sm font-medium text-sky-200 transition hover:text-white"
      >
        Open full forecast <ArrowRight className="h-4 w-4" aria-hidden />
      </button>
    </>
  )
}
