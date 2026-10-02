/**
 * A place the user picked. Stored in the URL (so refresh and share links work)
 * and in the browser (recent places).
 */
export interface Place {
  name: string
  region?: string // e.g. "Pulau Pinang, Malaysia"
  lat: number
  lon: number
}

/** Roughly within `km` of each other (1° ≈ 111 km; good enough at city scale). */
function within(a: Place, b: Place, km: number): boolean {
  const degrees = km / 111
  return Math.abs(a.lat - b.lat) < degrees && Math.abs(a.lon - b.lon) < degrees
}

/**
 * Same place to the user if:
 * - within ~5 km (e.g. the search result for "George Town" and the user's GPS
 *   position in George Town, a few hundred metres apart), or
 * - same name within ~30 km (two spots in a big city like Kuala Lumpur).
 * Towns that only share a name (Springfield, IL vs Springfield, MA) stay separate.
 */
export function samePlace(a: Place, b: Place): boolean {
  if (within(a, b, 5)) return true

  return a.name.trim().toLowerCase() === b.name.trim().toLowerCase() && within(a, b, 30)
}

export function placeToSearch(place: Place): string {
  const params = new URLSearchParams({
    name: place.name,
    lat: place.lat.toFixed(4),
    lon: place.lon.toFixed(4),
  })
  if (place.region) params.set('region', place.region)

  return `?${params.toString()}`
}

/** Reads a place from "?name=…&lat=…&lon=…"; null if missing or invalid. */
export function placeFromSearch(search: string): Place | null {
  const params = new URLSearchParams(search)
  const name = params.get('name')
  const rawLat = params.get('lat')
  const rawLon = params.get('lon')
  if (!name || !rawLat || !rawLon) return null

  const lat = Number(rawLat)
  const lon = Number(rawLon)
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return null
  }

  return { name, lat, lon, region: params.get('region') ?? undefined }
}
