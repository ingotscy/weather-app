import { useEffect, useState } from 'react'

/** The current time, refreshed every 30 s so "Updated x min ago" and clocks stay true. */
export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(timer)
  }, [intervalMs])

  return now
}
