# Skycast: weather at a glance

A weather app built around one idea:

> **Answer the user's real question in 3 seconds: what's it like now, will it rain later, and what's the week looking like, for the places I care about.**

## Run it

**With Docker** (recommended, needs only Docker):

```bash
docker compose up -d --build
```

Open **http://localhost:3000**. The unit tests run during the image build, so a broken build never produces an image.

**For development** (needs Node 20+):

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # unit tests (Vitest)
npm run build    # production build in dist/
```

No API keys or environment variables are needed.

## Features

| The user's question | Feature |
|---|---|
| What's it like now? | Current temperature, animated icon, feels-like, high/low; UV index, air quality, sunrise/sunset, humidity, wind; **local time label** ("Local time 7:08 pm · GMT+9 · 6:08 pm your time") |
| Can I go out and…? | **Activity forecast** for the next 3 hours: running, cycling, gardening, laundry, each with 😀 🙂 😐 😟 and the main reason ("Rain likely: keep it inside") |
| Will it rain later? | A one-line answer ("Rain likely from 5 pm (80%)") + the next 24 hours with rain chance |
| What's the week like? | 7-day forecast with a temperature-range bar on a shared weekly scale |
| For the places I care about | City search with suggestions (state + country shown), "Use my location" (**automatic** when permission was already granted), recent places, shareable link, **forecast poster image** (current, rain outlook, 6 hours, 5 days, activities, QR code) and the device's share menu |
| Here or there? | **Compare two places**: side by side (swipe on phones), each with local time, temperature, condition, high/low, rain chance, UV and rain outlook, plus **"the short answer"**: "☂ Drier today: London (4% vs 100%)" · "🌡 Warmer now: Kuala Lumpur (+15°)". Search inside the compare screen; link keeps both places. |
| …in 3 seconds | One screen; background matches the weather and day/night; °C/°F remembered; loading placeholders; clear error and empty states with a way forward |

**Deliberately not included (yet):** comparing 3+ places, a "show times in my timezone" toggle, radar maps, severe-weather alerts/notifications, accounts/sync, minute-by-minute rain. See the plan for the reasoning and phase 2.

## Technical decisions

| Decision | Why |
|---|---|
| **Open-Meteo** for forecast, search and air quality; **BigDataCloud** for "coordinates → place name" | Both need **no API key** and allow browser calls (CORS). A frontend-only app can't hide a key, so nothing secret ships. |
| **React + TypeScript + Vite + Tailwind CSS** | Fast to build and run; outputs plain static files. |
| **TanStack Query** | Caching (switching back to a city is instant), one automatic retry, background refresh every 10 minutes. Retries pause while the tab is hidden (saves battery and data). |
| **Place stored in the URL** (`?name=…` or `?view=compare&aname=…&bname=…`) | Refresh keeps the city or comparison, the Back button works, links and QR codes can be shared. |
| **Compare limited to 2 places** | "A vs B" is how people decide; it fits side by side on tablets and as a 2-card swipe on phones, with fewer edge cases. Each card loads on its own, so one failing city doesn't break the other. |
| **Units converted on the client** | °C/°F switches instantly, no new request. |
| **Times shown in the place's local time**, clearly labelled | Like Apple/Google Weather ("rain at 3 pm" means 3 pm there); the label adds the viewer's own time for comparison. Times are read as text, so they never shift with the viewer's timezone. |
| **Activity ratings as plain rules** (`src/lib/activities.ts`) | Explainable and unit-tested: start at "Great", each concern (rain, heat, wind, UV, air) lowers it; the worst concern is shown as the reason. |
| **Share poster drawn on a canvas** (`src/lib/forecastPoster.ts`) | Screenshot libraries often mis-render blur effects and animated icons; drawing it ourselves gives the same result in every browser. |
| **Credits behind an ⓘ button** | Keeps the screen clean while giving the credit Open-Meteo's free licence (CC BY 4.0) requires. |
| **Animated icons vendored** (Meteocons, MIT) in `public/icons/` | No dependency on a CDN at runtime. |
| **Docker:** Node builds and tests → **Nginx** serves | 74 MB image; long-term caching for hashed assets, gzip, single-page-app fallback. |

## Project structure

```
src/
  api/openMeteo.ts      all outside calls (search, forecast, air quality, reverse lookup)
  lib/                  pure logic: weather codes → label/icon/theme, units, formatting,
                        URL ↔ place, rain outlook, timezone label, activity ratings,
                        compare link + verdict, forecast poster (+ unit tests)
  hooks/                weather data (TanStack Query), my location, recent places,
                        remembered settings, place in the URL
  components/           SearchBox, CurrentWeather, HourlyForecast, DailyForecast,
                        DetailsGrid, ActivityCards, CompareView, SharePanel, AboutButton,
                        Welcome, Sky (background), status views
public/icons/           Meteocons animated SVG icons (MIT licence, see LICENSE.txt)
docker/nginx.conf       static file server config
```

## Reliability

| Situation | What the user sees |
|---|---|
| First visit | Welcome screen: "Use my location", search, popular cities |
| Typo / unknown city | "No places match '…'. Check the spelling or try a nearby city." |
| Location access refused | A friendly note suggesting search instead |
| Network or service down | "We couldn't load the weather" + **Try again** (after one automatic retry) |
| Air quality unavailable | That tile shows "No data for this place"; everything else still works |
| Browser storage blocked | The app works; it just doesn't remember recent places/units |

## Accessibility

Keyboard-usable search (↑ ↓ Enter Esc), labelled buttons, screen-reader text for icons, good contrast on glass cards, and CSS animations switched off for "reduce motion" users.

## Credits

Weather data: [Open-Meteo](https://open-meteo.com) (CC BY 4.0) · Reverse geocoding: [BigDataCloud](https://www.bigdatacloud.com) · Icons: [Meteocons](https://github.com/basmilius/weather-icons) by Bas Milius (MIT).
