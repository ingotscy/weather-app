import { Check, Copy, Download, Loader2, Share2, X } from 'lucide-react'
import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import type { Forecast } from '../api/openMeteo'
import { conditionsFrom } from '../lib/activities'
import { renderForecastPoster } from '../lib/forecastPoster'
import type { Place } from '../lib/place'
import type { Unit } from '../lib/units'

interface Props {
  place: Place
  url: string
  summary: string // e.g. "31° · Thunderstorm"
  forecast: Forecast
  airQuality: number | null | undefined
  unit: Unit
  onClose: () => void
}

/**
 * Share a place: a forecast poster (image with all the essentials + QR code),
 * the link, and the device's own share menu where available.
 */
export function SharePanel({ place, url, summary, forecast, airQuality, unit, onClose }: Props) {
  const [poster, setPoster] = useState<{ blob: Blob; preview: string } | null>(null)
  const [failed, setFailed] = useState(false)
  const [copied, setCopied] = useState(false)
  const canShare = typeof navigator.share === 'function'
  const fileName = `weather-${place.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`

  // Draw the poster once when the panel opens.
  useEffect(() => {
    let cancelled = false
    let previewUrl: string | null = null

    QRCode.toDataURL(url, { width: 440, margin: 1, color: { dark: '#1e1b4b', light: '#ffffff' } })
      .then((qrDataUrl) =>
        renderForecastPoster({ place, forecast, conditions: conditionsFrom(forecast, airQuality), unit, qrDataUrl, nowMs: Date.now() }),
      )
      .then((blob) => {
        if (cancelled) return
        previewUrl = URL.createObjectURL(blob)
        setPoster({ blob, preview: previewUrl })
      })
      .catch(() => !cancelled && setFailed(true))

    return () => {
      cancelled = true
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [place, forecast, airQuality, unit, url])

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copy this link:', url)
    }
  }

  const download = () => {
    if (!poster) return
    const link = document.createElement('a')
    link.href = URL.createObjectURL(poster.blob)
    link.download = fileName
    link.click()
    // Free the memory a moment later: revoking immediately can cancel the download in Firefox/Safari.
    setTimeout(() => URL.revokeObjectURL(link.href), 10_000)
  }

  const nativeShare = async () => {
    const text = `Weather in ${place.name}: ${summary}`
    try {
      // Share the poster too, where the device supports sharing files (most phones).
      if (poster) {
        const file = new File([poster.blob], fileName, { type: 'image/png' })
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ title: `Weather in ${place.name}`, text, url, files: [file] })
          return
        }
      }
      await navigator.share({ title: `Weather in ${place.name}`, text, url })
    } catch {
      // The user closed the share sheet: nothing to do.
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-4 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-title"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-sm animate-rise overflow-y-auto rounded-3xl bg-slate-900/95 p-5 text-white shadow-2xl ring-1 ring-white/15"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 id="share-title" className="text-lg font-semibold">
              Share {place.name}
            </h2>
            <p className="text-sm text-white/65">{summary}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
          {poster ? (
            <img src={poster.preview} alt={`Forecast poster for ${place.name}`} className="block aspect-[4/5] w-full" />
          ) : (
            <div className="flex aspect-[4/5] w-full items-center justify-center text-sm text-white/60">
              {failed ? (
                "Couldn't create the image. You can still copy the link."
              ) : (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating image…
                </>
              )}
            </div>
          )}
        </div>
        <p className="mt-2 text-center text-xs text-white/55">The QR code opens the live forecast</p>

        <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/10 p-1.5 pl-3">
          <span className="min-w-0 flex-1 truncate text-sm text-white/80">{url}</span>
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:bg-white/90"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        <div className={`mt-3 grid gap-2 ${canShare ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <button
            type="button"
            onClick={download}
            disabled={!poster}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-medium transition hover:bg-white/25 disabled:opacity-60"
          >
            <Download className="h-4 w-4" /> Download image
          </button>
          {canShare && (
            <button
              type="button"
              onClick={nativeShare}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-medium transition hover:bg-indigo-400"
            >
              <Share2 className="h-4 w-4" /> Share…
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
