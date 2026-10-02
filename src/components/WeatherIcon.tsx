import { iconUrl } from '../lib/weatherCodes'

interface Props {
  icon: string
  label: string
  className?: string
}

/** Animated Meteocons SVG (MIT licence, by Bas Milius). */
export function WeatherIcon({ icon, label, className = 'h-12 w-12' }: Props) {
  return <img src={iconUrl(icon)} alt={label} title={label} className={className} draggable={false} />
}
