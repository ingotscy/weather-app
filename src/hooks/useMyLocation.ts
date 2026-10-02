import { useCallback, useEffect, useState } from 'react'
import { nameForCoordinates } from '../api/openMeteo'
import type { Place } from '../lib/place'

type Status = 'idle' | 'locating' | 'error'

/** "Use my location": asks the browser for coordinates, then finds a place name. */
export function useMyLocation(onFound: (place: Place) => void) {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  const locate = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setStatus('error')
      setError("Your browser can't share your location. Search for a city instead.")
      return
    }

    setStatus('locating')
    setError(null)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const place = await nameForCoordinates(position.coords.latitude, position.coords.longitude)
        setStatus('idle')
        onFound(place)
      },
      (err) => {
        setStatus('error')
        setError(
          err.code === err.PERMISSION_DENIED
            ? 'Location access was blocked. You can allow it in your browser settings, or search for a city instead.'
            : "We couldn't find your location. Please search for a city instead.",
        )
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 },
    )
  }, [onFound])

  const dismissError = useCallback(() => {
    setStatus('idle')
    setError(null)
  }, [])

  return { locate, locating: status === 'locating', error, dismissError }
}

/**
 * If the user already allowed location access before, use it straight away
 * (zero taps) whenever no place is selected. The browser tells us the
 * permission state without asking again; where it can't (older browsers), the
 * welcome screen simply shows as usual.
 */
export function useAutoLocate(active: boolean, locate: () => void) {
  useEffect(() => {
    if (!active || !navigator.permissions?.query) return

    let cancelled = false
    navigator.permissions
      .query({ name: 'geolocation' as PermissionName })
      .then((status) => {
        if (!cancelled && status.state === 'granted') locate()
      })
      .catch(() => {
        // Permission check not supported: keep the welcome screen.
      })

    return () => {
      cancelled = true
    }
  }, [active, locate])
}
