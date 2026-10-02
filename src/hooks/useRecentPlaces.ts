import { useCallback } from 'react'
import { type Place, samePlace } from '../lib/place'
import { useStoredState } from './useStoredState'

const MAX_RECENT = 6

/** The last few places the user looked at, most recent first. */
export function useRecentPlaces() {
  const [places, setPlaces] = useStoredState<Place[]>('weather.recentPlaces', [])

  const add = useCallback(
    (place: Place) => setPlaces((current) => [place, ...current.filter((p) => !samePlace(p, place))].slice(0, MAX_RECENT)),
    [setPlaces],
  )

  const remove = useCallback(
    (place: Place) => setPlaces((current) => current.filter((p) => !samePlace(p, place))),
    [setPlaces],
  )

  return { places, add, remove }
}
