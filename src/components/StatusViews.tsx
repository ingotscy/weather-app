import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react'

/** Placeholder shapes while the forecast loads, so the layout doesn't jump. */
export function WeatherSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]" aria-busy="true" aria-label="Loading weather">
      <div className="space-y-4">
        <div className="skeleton h-64" />
        <div className="skeleton h-48" />
      </div>
      <div className="space-y-4">
        <div className="skeleton h-44" />
        <div className="skeleton h-80" />
      </div>
    </div>
  )
}

interface ErrorProps {
  message: string
  onRetry: () => void
}

/** A friendly error with a way forward: never a blank screen. */
export function ErrorState({ message, onRetry }: ErrorProps) {
  const offline = typeof navigator !== 'undefined' && !navigator.onLine
  const Icon = offline ? WifiOff : AlertTriangle

  return (
    <div className="glass mx-auto max-w-md animate-rise p-8 text-center" role="alert">
      <Icon className="mx-auto h-12 w-12 text-amber-200" aria-hidden />
      <h2 className="mt-4 text-xl font-semibold">{offline ? "You're offline" : "We couldn't load the weather"}</h2>
      <p className="mt-2 text-white/80">
        {offline ? 'Check your internet connection and try again.' : message}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-medium text-slate-900 transition hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
      >
        <RefreshCw className="h-4 w-4" aria-hidden /> Try again
      </button>
    </div>
  )
}
