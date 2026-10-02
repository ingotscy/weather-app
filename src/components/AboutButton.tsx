import { Info, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

/**
 * Small ⓘ button in the corner. Keeps the screen clean while still giving the
 * credit Open-Meteo's free licence (CC BY 4.0) requires.
 */
export function AboutButton() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (event: MouseEvent) => !ref.current?.contains(event.target as Node) && setOpen(false)
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onClick)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="fixed right-4 bottom-4 z-40 sm:right-6 sm:bottom-6">
      {open && (
        <div role="dialog" aria-label="About Skycast" className="absolute right-0 bottom-14 w-72 animate-rise rounded-2xl bg-slate-900/95 p-4 text-sm shadow-2xl ring-1 ring-white/15">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold">About Skycast</p>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="-mt-1 -mr-1 rounded-full p-1 hover:bg-white/10">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1 text-white/70">What's it like now, will it rain later, and how does the week look, for the places you care about.</p>
          <ul className="mt-3 space-y-1.5 text-white/80">
            <li>
              Weather &amp; air quality:{' '}
              <a href="https://open-meteo.com" target="_blank" rel="noreferrer" className="underline hover:text-white">
                Open-Meteo
              </a>{' '}
              (CC BY 4.0)
            </li>
            <li>
              Place names:{' '}
              <a href="https://www.bigdatacloud.com" target="_blank" rel="noreferrer" className="underline hover:text-white">
                BigDataCloud
              </a>
            </li>
            <li>
              Icons:{' '}
              <a href="https://github.com/basmilius/weather-icons" target="_blank" rel="noreferrer" className="underline hover:text-white">
                Meteocons
              </a>{' '}
              by Bas Milius (MIT)
            </li>
          </ul>
          <p className="mt-3 text-xs text-white/50">Activity ratings are simple rules of thumb, not medical advice.</p>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="About and credits"
        aria-expanded={open}
        className="glass !rounded-full p-2.5 text-white/80 transition hover:-translate-y-0.5 hover:text-white"
      >
        <Info className="h-5 w-5" />
      </button>
    </div>
  )
}
