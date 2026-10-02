import { useQuery } from '@tanstack/react-query'
import { getAirQuality, getForecast } from '../api/openMeteo'
import type { Place } from '../lib/place'

const TEN_MINUTES = 10 * 60 * 1000

/**
 * Weather for a place, cached by TanStack Query: switching back to a city you
 * already viewed is instant, and data refreshes itself after 10 minutes.
 */
export function useForecast(place: Place) {
  return useQuery({
    queryKey: ['forecast', place.lat.toFixed(3), place.lon.toFixed(3)],
    queryFn: ({ signal }) => getForecast(place.lat, place.lon, signal),
    staleTime: TEN_MINUTES,
    refetchInterval: TEN_MINUTES,
    retry: 1,
  })
}

/**
 * Same as useForecast, but the place may still be empty (compare screen slots).
 * Shares the cache with useForecast, so a city you already viewed shows instantly.
 */
export function useOptionalForecast(place: Place | null) {
  return useQuery({
    queryKey: ['forecast', place?.lat.toFixed(3), place?.lon.toFixed(3)],
    queryFn: ({ signal }) => getForecast(place!.lat, place!.lon, signal),
    enabled: place !== null,
    staleTime: TEN_MINUTES,
    refetchInterval: TEN_MINUTES,
    retry: 1,
  })
}

/** Air quality is a "nice to have": if it fails, the rest of the screen still works. */
export function useAirQuality(place: Place) {
  return useQuery({
    queryKey: ['air-quality', place.lat.toFixed(3), place.lon.toFixed(3)],
    queryFn: ({ signal }) => getAirQuality(place.lat, place.lon, signal),
    staleTime: TEN_MINUTES,
    retry: 0,
  })
}
