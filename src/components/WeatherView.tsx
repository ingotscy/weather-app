import { useState } from 'react'
import { ApiError } from '../api/openMeteo'
import { useNow } from '../hooks/useNow'
import { useAirQuality, useForecast } from '../hooks/useWeather'
import { shareUrlFor } from '../hooks/useUrlPlace'
import type { Place } from '../lib/place'
import { formatTemp, type Unit } from '../lib/units'
import { describeWeather } from '../lib/weatherCodes'
import { ActivityCards } from './ActivityCards'
import { CurrentWeather } from './CurrentWeather'
import { DailyForecast } from './DailyForecast'
import { DetailsGrid } from './DetailsGrid'
import { HourlyForecast } from './HourlyForecast'
import { SharePanel } from './SharePanel'
import { Sky } from './Sky'
import { ErrorState, WeatherSkeleton } from './StatusViews'

interface Props {
  place: Place
  unit: Unit
}

export function WeatherView({ place, unit }: Props) {
  const forecast = useForecast(place)
  const airQuality = useAirQuality(place)
  const [sharing, setSharing] = useState(false)
  const now = useNow()

  if (forecast.isPending) {
    return (
      <>
        <Sky theme="welcome" />
        <WeatherSkeleton />
      </>
    )
  }

  if (forecast.isError) {
    const message = forecast.error instanceof ApiError ? forecast.error.message : 'Something went wrong. Please try again.'
    return (
      <>
        <Sky theme="welcome" />
        <ErrorState message={message} onRetry={() => forecast.refetch()} />
      </>
    )
  }

  const data = forecast.data
  const weather = describeWeather(data.current.weatherCode, data.current.isDay)
  const summary = `${formatTemp(data.current.temperature, unit)} · ${weather.label}`

  return (
    <>
      <Sky theme={weather.theme} isDay={data.current.isDay} />

      {/*
        Phone: one column in order of importance
        (now → next 24 h → week → details → activities).
        Details come before activities because they explain the ratings
        (e.g. "UV very high" is why gardening is only "Fair").
        Laptop: two columns. The column wrappers use `contents` on phones so their
        children join the single column and `order-*` can rearrange them.
      */}
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[1.1fr_1fr] lg:items-start">
        <div className="contents lg:block lg:space-y-4">
          <div className="order-1">
            <CurrentWeather
              place={place}
              forecast={data}
              unit={unit}
              updatedAt={forecast.dataUpdatedAt}
              now={now}
              refreshing={forecast.isFetching}
              onRefresh={() => {
                forecast.refetch()
                airQuality.refetch()
              }}
              onShare={() => setSharing(true)}
            />
          </div>
          <div className="order-4">
            <DetailsGrid forecast={data} airQuality={airQuality.data} unit={unit} />
          </div>
          <div className="order-5">
            <ActivityCards forecast={data} airQuality={airQuality.data} />
          </div>
        </div>
        <div className="contents min-w-0 lg:block lg:space-y-4">
          <div className="order-2 min-w-0">
            <HourlyForecast hours={data.hourly} current={data.current} unit={unit} />
          </div>
          <div className="order-3">
            <DailyForecast days={data.daily} unit={unit} />
          </div>
        </div>
      </div>

      {sharing && (
        <SharePanel
          place={place}
          url={shareUrlFor(place)}
          summary={summary}
          forecast={data}
          airQuality={airQuality.data}
          unit={unit}
          onClose={() => setSharing(false)}
        />
      )}
    </>
  )
}
