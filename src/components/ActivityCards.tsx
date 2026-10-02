import type { Forecast } from '../api/openMeteo'
import { conditionsFrom, type Rating, rateActivities } from '../lib/activities'

const SCORE_STYLE: Record<Rating['score'], string> = {
  3: 'bg-emerald-400/20 text-emerald-100',
  2: 'bg-sky-400/20 text-sky-100',
  1: 'bg-amber-400/25 text-amber-100',
  0: 'bg-rose-500/25 text-rose-100',
}

interface Props {
  forecast: Forecast
  airQuality: number | null | undefined
}

/** "Is it a good time to…?": the forecast turned into everyday decisions. */
export function ActivityCards({ forecast, airQuality }: Props) {
  const ratings = rateActivities(conditionsFrom(forecast, airQuality))

  return (
    <section className="glass animate-rise p-5 [animation-delay:160ms] sm:p-6" aria-label="Activity forecast">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold tracking-wider text-white/70 uppercase">Good time to…?</h2>
        <span className="text-xs text-white/50">next 3 hours</span>
      </div>

      <ul className="mt-3 grid grid-cols-2 gap-2 sm:gap-3">
        {ratings.map((r) => (
          <li key={r.activity} className="flex items-center gap-2 rounded-2xl bg-white/10 p-2.5 transition hover:-translate-y-0.5 hover:bg-white/15 sm:gap-3 sm:p-3">
            <span className="text-2xl leading-none sm:text-3xl" role="img" aria-label={`${r.verdict}`}>
              {r.face}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">
                <span aria-hidden>{r.emoji}</span> {r.name}
              </p>
              <span className={`mt-0.5 inline-block rounded-md px-1.5 py-0.5 text-[11px] font-medium ${SCORE_STYLE[r.score]}`}>{r.verdict}</span>
              <p className="mt-0.5 text-xs leading-snug text-white/70">{r.reason}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
