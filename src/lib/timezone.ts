/**
 * All forecast times are shown in the searched place's own local time (like
 * Apple/Google Weather). These helpers label that clearly and show the
 * viewer's own time next to it.
 */

/** 19800 → "GMT+5:30", 32400 → "GMT+9", 0 → "GMT". */
export function formatOffset(offsetSeconds: number): string {
  if (offsetSeconds === 0) return 'GMT'

  const sign = offsetSeconds > 0 ? '+' : '-'
  const totalMinutes = Math.abs(offsetSeconds) / 60
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return `GMT${sign}${hours}${minutes ? `:${String(minutes).padStart(2, '0')}` : ''}`
}

/** Clock time at a UTC offset, e.g. "6:42 pm". */
export function clockAtOffset(nowMs: number, offsetSeconds: number): string {
  const shifted = new Date(nowMs + offsetSeconds * 1000)
  const hours = shifted.getUTCHours()
  const minutes = String(shifted.getUTCMinutes()).padStart(2, '0')
  const suffix = hours < 12 ? 'am' : 'pm'
  const h12 = hours % 12 === 0 ? 12 : hours % 12

  return `${h12}:${minutes} ${suffix}`
}

/** The viewer's own UTC offset in seconds (e.g. Malaysia → 28800). */
export function viewerOffsetSeconds(nowMs: number = Date.now()): number {
  return -new Date(nowMs).getTimezoneOffset() * 60
}

/**
 * "Local time 6:42 pm · GMT+9 · 5:42 pm your time"
 * (the "your time" part is left out when both are in the same timezone).
 */
export function localTimeLabel(nowMs: number, placeOffsetSeconds: number, viewerOffset = viewerOffsetSeconds(nowMs)): string {
  const local = `Local time ${clockAtOffset(nowMs, placeOffsetSeconds)} · ${formatOffset(placeOffsetSeconds)}`
  if (placeOffsetSeconds === viewerOffset) return local

  return `${local} · ${clockAtOffset(nowMs, viewerOffset)} your time`
}
