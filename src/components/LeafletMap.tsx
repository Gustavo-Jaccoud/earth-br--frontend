import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { LonLat } from '@/lib/api'

/** Semi-arid Northeast Brazil — default view when nothing else is known. */
const DEFAULT_CENTER: [number, number] = [-9.5, -39.5]

const PIN = L.divIcon({
  className: '',
  html: '<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;background:#2f7d32;border:3px solid #fff;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 22],
})

export type MapOverlay = { url: string; bounds: [[number, number], [number, number]]; opacity?: number }

type Props = {
  /** Outline to draw and fit, as a GeoJSON ring ([lon, lat] pairs). */
  polygon?: LonLat[]
  /** Marker position, [lat, lon]. */
  pin?: [number, number] | null
  /** Initial centre, [lat, lon], used when there is no polygon or pin. */
  center?: [number, number]
  zoom?: number
  /** Called with (lat, lon) when the user clicks/taps the map. Enables the crosshair cursor. */
  onPick?: (lat: number, lon: number) => void
  /** Image overlay (e.g. a backend map layer period). */
  overlay?: MapOverlay | null
  /** Disable pan/zoom (thumbnails). */
  interactive?: boolean
  className?: string
  label: string
}

/** Interactive map (Leaflet + OpenStreetMap tiles). */
export default function LeafletMap({ polygon, pin, center, zoom = 13, onPick, overlay, interactive = true, className, label }: Props) {
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const layers = useRef<{ polygon?: L.Polygon; pin?: L.Marker; overlay?: L.ImageOverlay }>({})
  const pick = useRef(onPick)
  pick.current = onPick

  useEffect(() => {
    if (!el.current) return
    const m = L.map(el.current, {
      center: center ?? DEFAULT_CENTER,
      zoom: center ? zoom : 6,
      zoomControl: interactive,
      dragging: interactive,
      scrollWheelZoom: false,
      doubleClickZoom: interactive,
      touchZoom: interactive,
      boxZoom: interactive,
      keyboard: interactive,
      attributionControl: true,
    })
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(m)
    m.on('click', (e) => pick.current?.(e.latlng.lat, e.latlng.lng))
    map.current = m
    return () => {
      m.remove()
      map.current = null
      layers.current = {}
    }
    // The map is created once; later prop changes are applied by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const ring = polygon ? JSON.stringify(polygon) : ''
  useEffect(() => {
    const m = map.current
    if (!m) return
    layers.current.polygon?.remove()
    layers.current.polygon = undefined
    if (polygon && polygon.length > 2) {
      const shape = L.polygon(
        polygon.map(([lon, lat]) => [lat, lon] as [number, number]),
        { color: '#2f7d32', weight: 3, fillOpacity: 0.15 },
      ).addTo(m)
      layers.current.polygon = shape
      m.fitBounds(shape.getBounds(), { padding: [24, 24], maxZoom: 16 })
    }
    // `ring` is the serialised polygon.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ring])

  const pinLat = pin?.[0]
  const pinLon = pin?.[1]
  useEffect(() => {
    const m = map.current
    if (!m) return
    layers.current.pin?.remove()
    layers.current.pin = undefined
    if (pinLat !== undefined && pinLon !== undefined) {
      layers.current.pin = L.marker([pinLat, pinLon], { icon: PIN, interactive: false }).addTo(m)
      if (!polygon) m.setView([pinLat, pinLon], Math.max(m.getZoom(), 12))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinLat, pinLon])

  const overlayKey = overlay ? `${overlay.url}|${overlay.bounds.join(',')}|${overlay.opacity ?? 0.7}` : ''
  useEffect(() => {
    const m = map.current
    if (!m) return
    layers.current.overlay?.remove()
    layers.current.overlay = undefined
    if (overlay) layers.current.overlay = L.imageOverlay(overlay.url, overlay.bounds, { opacity: overlay.opacity ?? 0.7 }).addTo(m)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overlayKey])

  return <div ref={el} role="application" aria-label={label} className={className} style={{ cursor: onPick ? 'crosshair' : undefined, minHeight: 120, zIndex: 0 }} />
}
