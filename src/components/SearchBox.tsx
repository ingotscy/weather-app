import { useQuery } from '@tanstack/react-query'
import { Loader2, MapPin, Search, X } from 'lucide-react'
import { type KeyboardEvent, useEffect, useId, useRef, useState } from 'react'
import { searchPlaces } from '../api/openMeteo'
import type { Place } from '../lib/place'

interface Props {
  onSelect: (place: Place) => void
}

/** Wait until the user pauses typing before searching (fewer requests, less flicker). */
function useDebounced(value: string, delayMs: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}

/** City search with suggestions; works with mouse, touch and keyboard (↑ ↓ Enter Esc). */
export function SearchBox({ onSelect }: Props) {
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  const query = useDebounced(text.trim(), 300)
  const enabled = query.length >= 2
  const { data: results = [], isFetching, isError } = useQuery({
    queryKey: ['search', query.toLowerCase()],
    queryFn: ({ signal }) => searchPlaces(query, signal),
    enabled,
    staleTime: 60 * 60 * 1000,
  })

  // Close the list when clicking anywhere else.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const choose = (place: Place) => {
    onSelect(place)
    setText('')
    setOpen(false)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActive((i) => Math.min(i + 1, results.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (event.key === 'Enter' && results[active]) {
      event.preventDefault()
      choose(results[active])
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  const showList = open && enabled
  const waiting = text.trim() !== query || isFetching

  return (
    <div ref={wrapperRef} className="relative w-full">
      <label htmlFor={`${listId}-input`} className="sr-only">
        Search for a city
      </label>
      <div className="glass flex items-center gap-2 !rounded-full px-4 py-2.5 transition focus-within:bg-white/20">
        <Search className="h-5 w-5 shrink-0 text-white/70" aria-hidden />
        <input
          id={`${listId}-input`}
          type="search"
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setActive(0) // new text, new suggestions: highlight the first one
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search city, e.g. Penang"
          autoComplete="off"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          className="w-full bg-transparent text-white placeholder:text-white/60 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {waiting && enabled && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-white/70" aria-hidden />}
        {text && (
          <button type="button" onClick={() => setText('')} aria-label="Clear search" className="rounded-full p-1 hover:bg-white/15">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute top-full right-0 left-0 z-30 mt-2 animate-rise overflow-hidden rounded-2xl bg-slate-900/90 shadow-2xl ring-1 ring-white/15 backdrop-blur-xl"
        >
          {isError && <li className="px-4 py-3 text-amber-200">Search is unavailable right now. Please try again.</li>}

          {!isError && !waiting && results.length === 0 && (
            <li className="px-4 py-3 text-white/70">No places match “{query}”. Check the spelling or try a nearby city.</li>
          )}

          {results.map((place, index) => (
            <li
              key={`${place.lat},${place.lon}`}
              role="option"
              aria-selected={index === active}
              onMouseEnter={() => setActive(index)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(place)}
              className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition ${index === active ? 'bg-white/15' : ''}`}
            >
              <MapPin className="h-4 w-4 shrink-0 text-sky-300" aria-hidden />
              <span>
                <span className="font-medium">{place.name}</span>
                {place.region && <span className="text-white/60">, {place.region}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
