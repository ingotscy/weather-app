import { useEffect, useState } from 'react'

/**
 * useState that is remembered in the browser (localStorage).
 * Storage can be unavailable (private mode, blocked): the app then still works,
 * it just doesn't remember.
 */
export function useStoredState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored === null ? initial : (JSON.parse(stored) as T)
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Not critical: preferences just won't persist.
    }
  }, [key, value])

  return [value, setValue] as const
}
