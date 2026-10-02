import { Loader2, LocateFixed, Scale, X } from 'lucide-react'
import { useCallback } from 'react'
import { AboutButton } from './components/AboutButton'
import { CompareView } from './components/CompareView'
import { SearchBox } from './components/SearchBox'
import { Sky } from './components/Sky'
import { WeatherIcon } from './components/WeatherIcon'
import { WeatherView } from './components/WeatherView'
import { Welcome } from './components/Welcome'
import { useAutoLocate, useMyLocation } from './hooks/useMyLocation'
import { useNow } from './hooks/useNow'
import { useRecentPlaces } from './hooks/useRecentPlaces'
import { useStoredState } from './hooks/useStoredState'
import { useUrlState } from './hooks/useUrlPlace'
import { type Place, samePlace } from './lib/place'
import type { Unit } from './lib/units'

export default function App() {
  const { place, compare, setPlace, setCompare } = useUrlState()
  const now = useNow()
  const [unit, setUnit] = useStoredState<Unit>('weather.unit', 'c')
  const recent = useRecentPlaces()
  const addRecent = recent.add

  const choose = useCallback(
    (next: Place) => {
      setPlace(next)
      addRecent(next)
    },
    [setPlace, addRecent],
  )

  const myLocation = useMyLocation(choose)
  // Home with location already allowed → show the user's own location right away
  // (not on the compare screen, which has no single place but must stay open).
  useAutoLocate(place === null && compare === null, myLocation.locate)
  const openCompare = () => setCompare([place, null])

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 pt-5 pb-8 sm:px-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={() => setPlace(null)} className="flex items-center gap-1.5" aria-label="Skycast home">
            <WeatherIcon icon="partly-cloudy-day" label="" className="h-10 w-10" />
            <span className="text-xl font-semibold tracking-tight">Skycast</span>
          </button>
          <div className="flex items-center gap-2 sm:hidden">
            <CompareButton onClick={openCompare} active={compare !== null} />
            <LocationButton onClick={myLocation.locate} locating={myLocation.locating} />
            <UnitToggle unit={unit} onChange={setUnit} />
          </div>
        </div>

        <div className="flex-1">
          <SearchBox onSelect={choose} />
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          <CompareButton onClick={openCompare} active={compare !== null} />
          <LocationButton onClick={myLocation.locate} locating={myLocation.locating} />
          <UnitToggle unit={unit} onChange={setUnit} />
        </div>
      </header>

      {recent.places.length > 0 && (
        <nav aria-label="Recent places" className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {recent.places.map((p) => {
            const active = place !== null && samePlace(p, place)
            return (
              <span
                key={`${p.lat},${p.lon}`}
                className={`group inline-flex shrink-0 items-center rounded-full text-sm transition ${active ? 'bg-white text-slate-900' : 'bg-white/15 hover:bg-white/25'}`}
              >
                <button type="button" onClick={() => choose(p)} className="py-1.5 pr-1 pl-3.5">
                  {p.name}
                </button>
                <button
                  type="button"
                  onClick={() => recent.remove(p)}
                  aria-label={`Remove ${p.name} from recent places`}
                  className="mr-1 rounded-full p-1 opacity-60 transition hover:opacity-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            )
          })}
        </nav>
      )}

      {myLocation.error && (
        <div role="alert" className="mt-4 flex animate-rise items-start gap-3 rounded-2xl bg-amber-400/20 px-4 py-3 text-amber-50 ring-1 ring-amber-200/30">
          <p className="flex-1 text-sm">{myLocation.error}</p>
          <button type="button" onClick={myLocation.dismissError} aria-label="Dismiss" className="rounded-full p-0.5 hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <main className="mt-6 flex-1">
        {compare ? (
          <CompareView
            slots={compare}
            onChange={(slots) => setCompare(slots, true)}
            recentPlaces={recent.places}
            onPicked={addRecent}
            onOpen={choose}
            onBack={() => setPlace(compare[0] ?? compare[1])}
            unit={unit}
            now={now}
          />
        ) : place ? (
          <WeatherView key={`${place.lat},${place.lon}`} place={place} unit={unit} />
        ) : (
          <>
            <Sky theme="welcome" />
            <Welcome onPick={choose} onLocate={myLocation.locate} locating={myLocation.locating} />
          </>
        )}
      </main>

      <AboutButton />
    </div>
  )
}

function LocationButton({ onClick, locating }: { onClick: () => void; locating: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={locating}
      title="Use my location"
      aria-label="Use my location"
      className="glass !rounded-full p-2.5 transition hover:-translate-y-0.5 hover:bg-white/25 disabled:opacity-70"
    >
      {locating ? <Loader2 className="h-5 w-5 animate-spin" /> : <LocateFixed className="h-5 w-5" />}
    </button>
  )
}

function UnitToggle({ unit, onChange }: { unit: Unit; onChange: (unit: Unit) => void }) {
  return (
    <div className="glass flex !rounded-full p-1 text-sm font-medium" role="group" aria-label="Temperature unit">
      {(['c', 'f'] as const).map((u) => (
        <button
          key={u}
          type="button"
          onClick={() => onChange(u)}
          aria-pressed={unit === u}
          className={`rounded-full px-3 py-1.5 transition ${unit === u ? 'bg-white text-slate-900 shadow' : 'text-white/80 hover:text-white'}`}
        >
          °{u.toUpperCase()}
        </button>
      ))}
    </div>
  )
}

function CompareButton({ onClick, active }: { onClick: () => void; active: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Compare two places"
      aria-label="Compare two places"
      aria-pressed={active}
      className={`glass !rounded-full p-2.5 transition hover:-translate-y-0.5 hover:bg-white/25 ${active ? '!bg-white !text-slate-900' : ''}`}
    >
      <Scale className="h-5 w-5" />
    </button>
  )
}
