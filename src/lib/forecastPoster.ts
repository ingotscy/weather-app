/**
 * Draws a shareable "forecast poster" (1080×1350, the portrait size social
 * apps display best): current weather, rain outlook, next 6 hours, 5 days,
 * activities and a QR code to the live forecast.
 *
 * We draw it ourselves on a canvas instead of screenshotting the page:
 * screenshot libraries often mis-render blur effects and animated icons,
 * while a canvas gives the same result in every browser.
 */
import type { Forecast } from '../api/openMeteo'
import { rateActivities, type Conditions } from './activities'
import { formatHour, formatWeekday } from './format'
import type { Place } from './place'
import { rainOutlook } from './rainOutlook'
import { localTimeLabel } from './timezone'
import { formatTemp, type Unit } from './units'
import { describeWeather, iconUrl, type Theme } from './weatherCodes'

const WIDTH = 1080
const HEIGHT = 1350
const PAD = 64
const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
const EMOJI_FONT = '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif'

// Same colours as the on-screen sky backgrounds (index.css).
const SKY: Record<`${Theme}-${'day' | 'night'}`, [string, string, string]> = {
  'clear-day': ['#2563eb', '#3b82f6', '#f59e0b'],
  'cloudy-day': ['#475569', '#64748b', '#94a3b8'],
  'fog-day': ['#57657a', '#7b8798', '#a3adbb'],
  'rain-day': ['#1e3a5f', '#334e6e', '#56708c'],
  'snow-day': ['#3b6ea8', '#5b8ac0', '#8fb3dc'],
  'storm-day': ['#1e1b4b', '#3b2a6b', '#475569'],
  'clear-night': ['#020617', '#0f1e4a', '#1e3a8a'],
  'cloudy-night': ['#0b1120', '#1e293b', '#334155'],
  'fog-night': ['#111827', '#283342', '#3d4757'],
  'rain-night': ['#050b16', '#13233a', '#24384f'],
  'snow-night': ['#0f172a', '#23324a', '#3c5272'],
  'storm-night': ['#030014', '#1e1440', '#312e81'],
}

export interface PosterInput {
  place: Place
  forecast: Forecast
  conditions: Conditions
  unit: Unit
  qrDataUrl: string
  nowMs: number
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null) // a missing icon shouldn't stop the poster
    img.src = src
  })
}

function panel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, alpha = 0.14) {
  ctx.save()
  ctx.fillStyle = `rgba(255,255,255,${alpha})`
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, 32)
  ctx.fill()
  ctx.restore()
}

function text(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  { size, weight = 400, alpha = 1, align = 'left', maxWidth, font = FONT }: { size: number; weight?: number; alpha?: number; align?: CanvasTextAlign; maxWidth?: number; font?: string },
) {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = align
  ctx.font = `${weight} ${size}px ${font}`
  ctx.fillText(value, x, y, maxWidth)
  ctx.restore()
}

export async function renderForecastPoster({ place, forecast, conditions, unit, qrDataUrl, nowMs }: PosterInput): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')

  const { current } = forecast
  const now = describeWeather(current.weatherCode, current.isDay)
  const hours = forecast.hourly.slice(0, 6)
  const days = forecast.daily.slice(0, 5)

  // Load every icon first, in parallel.
  const iconNames = [now.icon, ...hours.map((h, i) => (i === 0 ? now.icon : describeWeather(h.weatherCode, h.isDay).icon)), ...days.map((d) => describeWeather(d.weatherCode, true).icon)]
  const icons = new Map<string, HTMLImageElement | null>()
  await Promise.all([...new Set(iconNames)].map(async (name) => icons.set(name, await loadImage(iconUrl(name)))))
  const qr = await loadImage(qrDataUrl)
  const drawIcon = (name: string, x: number, y: number, size: number) => {
    const img = icons.get(name)
    if (img) ctx.drawImage(img, x, y, size, size)
  }

  // Background: the same sky as the app.
  const [c1, c2, c3] = SKY[`${now.theme}-${current.isDay ? 'day' : 'night'}`]
  const gradient = ctx.createLinearGradient(0, 0, WIDTH * 0.6, HEIGHT)
  gradient.addColorStop(0, c1)
  gradient.addColorStop(0.55, c2)
  gradient.addColorStop(1, c3)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  // Place and local time.
  text(ctx, place.name, PAD, 118, { size: 64, weight: 700, maxWidth: WIDTH - PAD * 2 })
  if (place.region) text(ctx, place.region, PAD, 166, { size: 32, alpha: 0.8, maxWidth: WIDTH - PAD * 2 })
  text(ctx, localTimeLabel(nowMs, forecast.utcOffsetSeconds), PAD, 210, { size: 26, alpha: 0.7, maxWidth: WIDTH - PAD * 2 })

  // Now.
  drawIcon(now.icon, PAD - 16, 228, 240)
  text(ctx, formatTemp(current.temperature, unit), 300, 398, { size: 156, weight: 300 })
  text(ctx, now.label, 306, 452, { size: 40, weight: 600, maxWidth: WIDTH - 306 - PAD })
  const today = forecast.daily[0]
  text(ctx, `Feels like ${formatTemp(current.feelsLike, unit)} · H ${formatTemp(today.max, unit)} · L ${formatTemp(today.min, unit)}`, 306, 500, { size: 30, alpha: 0.8, maxWidth: WIDTH - 306 - PAD })

  // Rain outlook in words.
  panel(ctx, PAD, 540, WIDTH - PAD * 2, 76, 0.18)
  text(ctx, `☂  ${rainOutlook(forecast.hourly)}`, PAD + 32, 590, { size: 30, weight: 600, maxWidth: WIDTH - PAD * 2 - 64 })

  // Next 6 hours.
  panel(ctx, PAD, 644, WIDTH - PAD * 2, 236)
  const colWidth = (WIDTH - PAD * 2) / 6
  hours.forEach((h, i) => {
    const cx = PAD + colWidth * i + colWidth / 2
    const isNow = i === 0
    text(ctx, isNow ? 'Now' : formatHour(h.time), cx, 692, { size: 26, alpha: 0.8, align: 'center' })
    drawIcon(isNow ? now.icon : describeWeather(h.weatherCode, h.isDay).icon, cx - 48, 702, 96)
    text(ctx, formatTemp(isNow ? current.temperature : h.temperature, unit), cx, 830, { size: 34, weight: 600, align: 'center' })
    text(ctx, `💧${h.rainChance}%`, cx, 864, { size: 24, alpha: 0.85, align: 'center', font: `${EMOJI_FONT}, ${FONT}` })
  })

  // Next 5 days (left) and QR code (right).
  const listWidth = 620
  panel(ctx, PAD, 908, listWidth, 300)
  days.forEach((d, i) => {
    const y = 960 + i * 56
    const weather = describeWeather(d.weatherCode, true)
    text(ctx, formatWeekday(d.date, i), PAD + 32, y, { size: 30, weight: 600 })
    drawIcon(weather.icon, PAD + 150, y - 40, 56)
    text(ctx, `💧${d.rainChance}%`, PAD + 230, y, { size: 24, alpha: 0.85, font: `${EMOJI_FONT}, ${FONT}` })
    text(ctx, `${formatTemp(d.min, unit)}  –  ${formatTemp(d.max, unit)}`, PAD + listWidth - 32, y, { size: 30, weight: 600, align: 'right' })
  })

  const qrX = PAD + listWidth + 28
  const qrPanelWidth = WIDTH - PAD - qrX
  panel(ctx, qrX, 908, qrPanelWidth, 300, 1)
  if (qr) ctx.drawImage(qr, qrX + (qrPanelWidth - 220) / 2, 926, 220, 220)
  ctx.save()
  ctx.fillStyle = '#1e1b4b'
  ctx.textAlign = 'center'
  ctx.font = `600 22px ${FONT}`
  ctx.fillText('Scan for the live forecast', qrX + qrPanelWidth / 2, 1182, qrPanelWidth - 24)
  ctx.restore()

  // Activities.
  const ratings = rateActivities(conditions)
  const chipWidth = (WIDTH - PAD * 2 - 3 * 16) / 4
  ratings.forEach((r, i) => {
    const x = PAD + i * (chipWidth + 16)
    panel(ctx, x, 1234, chipWidth, 64, 0.16)
    text(ctx, `${r.face} ${r.emoji} ${r.name}`, x + chipWidth / 2, 1276, {
      size: 26,
      weight: 600,
      align: 'center',
      maxWidth: chipWidth - 20,
      font: `${EMOJI_FONT}, ${FONT}`,
    })
  })

  text(ctx, 'Skycast · weather at a glance', WIDTH / 2, 1328, { size: 20, alpha: 0.6, align: 'center' })

  return new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Image failed'))), 'image/png'))
}
