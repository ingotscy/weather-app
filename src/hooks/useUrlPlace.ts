import { useCallback, useEffect, useState } from 'react'
import { compareFromSearch, compareToSearch, type Slots } from '../lib/compare'
import { type Place, placeFromSearch, placeToSearch } from '../lib/place'

interface UrlState {
  place: Place | null // single-place view (?name=…&lat=…&lon=…)
  compare: Slots | null // compare view (?view=compare&aname=…&bname=…)
}

function read(): UrlState {
  const search = window.location.search
  return { place: placeFromSearch(search), compare: compareFromSearch(search) }
}

/**
 * What's on screen lives in the URL, so a refresh keeps it, the browser's
 * Back button works, and links can be shared.
 */
export function useUrlState() {
  const [state, setState] = useState<UrlState>(read)

  useEffect(() => {
    const onPopState = () => setState(read())
    window.addEventListener('popstate', onPopState)

    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const setPlace = useCallback((next: Place | null) => {
    window.history.pushState(null, '', next ? placeToSearch(next) : window.location.pathname)
    setState(read())
  }, [])

  /** `replace` updates the current history entry (picking places) instead of adding one. */
  const setCompare = useCallback((slots: Slots, replace = false) => {
    const url = compareToSearch(slots)
    if (replace) window.history.replaceState(null, '', url)
    else window.history.pushState(null, '', url)
    setState(read())
  }, [])

  return { ...state, setPlace, setCompare }
}

export function shareUrlFor(place: Place): string {
  return `${window.location.origin}${window.location.pathname}${placeToSearch(place)}`
}
