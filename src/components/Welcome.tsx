import { LocateFixed, Loader2 } from 'lucide-react'
import type { Place } from '../lib/place'
import { WeatherIcon } from './WeatherIcon'

const POPULAR: Place[] = [
  { name: 'Kuala Lumpur', region: 'Kuala Lumpur, Malaysia', lat: 3.1412, lon: 101.6865 },
  { name: 'Singapore', region: 'Singapore', lat: 1.2897, lon: 103.8501 },
  { name: 'Tokyo', region: 'Tokyo, Japan', lat: 35.6895, lon: 139.6917 },
  { name: 'London', region: 'England, United Kingdom', lat: 51.5085, lon: -0.1257 },
  { name: 'New York', region: 'New York, United States', lat: 40.7143, lon: -74.006 },
  { name: 'Sydney', region: 'New South Wales, Australia', lat: -33.8678, lon: 151.2073 },
]

interface Props {
  onPick: (place: Place) => void
  onLocate: () => void
  locating: boolean
}

/** First visit: explain the app in one line and offer the fastest ways in. */
export function Welcome({ onPick, onLocate, locating }: Props) {
  return (
    <section className="glass mx-auto max-w-2xl animate-rise p-8 text-center sm:p-12">
      <div className="flex justify-center -space-x-4" aria-hidden>
        <WeatherIcon icon="clear-day" label="" className="h-20 w-20" />
        <WeatherIcon icon="partly-cloudy-day-rain" label="" className="h-20 w-20" />
        <WeatherIcon icon="thunderstorms-night-rain" label="" className="h-20 w-20" />
      </div>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Weather at a glance</h1>
      <p className="mx-auto mt-3 max-w-md text-white/80">
        What's it like now, will it rain later, and how does the week look, for the places you care about.
      </p>

      <button
        type="button"
        onClick={onLocate}
        disabled={locating}
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-medium text-indigo-700 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-70"
      >
        {locating ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <LocateFixed className="h-5 w-5" aria-hidden />}
        {locating ? 'Finding you…' : 'Use my location'}
      </button>
      <p className="mt-3 text-sm text-white/70">or search for any city above</p>

      <div className="mt-8">
        <p className="text-xs font-semibold tracking-wider text-white/60 uppercase">Popular</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {POPULAR.map((place) => (
            <button
              key={place.name}
              type="button"
              onClick={() => onPick(place)}
              className="rounded-full bg-white/15 px-4 py-1.5 text-sm transition hover:bg-white/25"
            >
              {place.name}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
