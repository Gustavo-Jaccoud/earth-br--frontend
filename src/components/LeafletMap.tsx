import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { LonLat } from '@/lib/api'
import { pathCrossesItself } from '@/lib/geo'

/** Semi-arid Northeast Brazil — default view when nothing else is known. */
const DEFAULT_CENTER: [number, number] = [-9.5, -39.5]

const PIN = L.divIcon({
  className: '',
  html: '<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;background:#2f7d32;border:3px solid #fff;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 22],
})

/** Numbered handle of a drawn corner; 30 px so it is easy to grab with a finger. */
const cornerIcon = (n: number) =>
  L.divIcon({
    className: '',
    html: `<div style="width:30px;height:30px;border-radius:50%;background:#fff;border:3px solid #1e7a4c;color:#0f3d2a;font:700 14px/24px system-ui,sans-serif;text-align:center;box-shadow:0 2px 6px rgba(0,0,0,.45);cursor:grab">${n}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  })

export type MapOverlay = { url: string; bounds: [[number, number], [number, number]]; opacity?: number }

export type BaseLayer = 'map' | 'satellite'

const BASE_LABEL: Record<BaseLayer, string> = { map: 'Map', satellite: 'Satellite' }
const BASE_KEY = 'earth-br-basemap'

function savedBase(): BaseLayer {
  try {
    return localStorage.getItem(BASE_KEY) === 'satellite' ? 'satellite' : 'map'
  } catch {
    return 'map'
  }
}

function tiles(base: BaseLayer) {
  if (base === 'map') {
    return L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    })
  }
  // Sentinel-2 mosaic: tiles exist up to zoom 14; beyond that Leaflet enlarges them. Note the {y}/{x} order.
  return L.tileLayer('https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2020_3857/default/g/{z}/{y}/{x}.jpg', {
    maxZoom: 19,
    maxNativeZoom: 14,
    attribution: '<a href="https://s2maps.eu">Sentinel-2 cloudless by EOX IT Services GmbH</a> (contains modified Copernicus Sentinel data 2020)',
  })
}

/** Line colours per base layer: dark green reads well on the street map, bright yellow/white on imagery. */
const STYLE = {
  map: { outline: '#2f7d32', fill: 0.15, reference: '#3f4a43', invalid: '#b42318' },
  satellite: { outline: '#ffe04a', fill: 0.08, reference: '#ffffff', invalid: '#ff8a7a' },
} as const

const outlineStyle = (base: BaseLayer): L.PathOptions => ({ color: STYLE[base].outline, weight: 3, fillOpacity: STYLE[base].fill })
const referenceStyle = (base: BaseLayer): L.PathOptions => ({ color: STYLE[base].reference, weight: 1.5, dashArray: '6 6', fill: false, interactive: false })
const drawStyle = (base: BaseLayer, invalid: boolean): L.PathOptions => ({
  color: invalid ? STYLE[base].invalid : STYLE[base].outline,
  weight: 3,
  fillOpacity: STYLE[base].fill + 0.07,
  dashArray: invalid ? '8 6' : undefined,
  interactive: false,
})

const FIT: L.FitBoundsOptions = { padding: [24, 24], maxZoom: 16 }

const toLatLngs = (ring: LonLat[]) => ring.map(([lon, lat]) => [lat, lon] as [number, number])

type Props = {
  /** Outline to draw and fit, as a GeoJSON ring ([lon, lat] pairs). */
  polygon?: LonLat[]
  /** Secondary outline drawn thin and dashed, without fill (e.g. the query square behind a field). Fitted together with `polygon`. */
  reference?: LonLat[] | null
  /** Marker position, [lat, lon]. */
  pin?: [number, number] | null
  /** Initial centre, [lat, lon], used when there is no polygon or pin. */
  center?: [number, number]
  zoom?: number
  /** Called with (lat, lon) when the user clicks/taps the map. Enables the crosshair cursor. Ignored while `draw` is on. */
  onPick?: (lat: number, lon: number) => void
  /** Image overlay (e.g. a backend map layer period). */
  overlay?: MapOverlay | null
  /** Disable pan/zoom (thumbnails). Also hides the Map/Satellite switch. */
  interactive?: boolean
  /**
   * Drawing mode: each click/tap adds a corner to `vertices`; corners can be dragged.
   * Controlled — the parent keeps `vertices` (open list of [lon, lat] corners) and gets every change.
   */
  draw?: boolean
  vertices?: LonLat[]
  onVerticesChange?: (vertices: LonLat[]) => void
  /** Called when a click or drag is refused because the new side would cross one already drawn. */
  onDrawRejected?: () => void
  /** Draws the outline being drawn as invalid (e.g. its closing side crosses another one). */
  drawInvalid?: boolean
  /** Moves the view to this point ([lat, lon]) whenever it changes, without placing a marker. */
  focus?: [number, number] | null
  /** Base layer shown first. Defaults to the one last chosen on this device (interactive maps) or the street map. */
  defaultBase?: BaseLayer
  className?: string
  label: string
}

/** Interactive map (Leaflet) with a street-map / Sentinel-2 satellite switch. */
export default function LeafletMap({
  polygon,
  reference,
  pin,
  center,
  zoom = 13,
  onPick,
  overlay,
  interactive = true,
  draw = false,
  vertices,
  onVerticesChange,
  onDrawRejected,
  drawInvalid = false,
  focus,
  defaultBase,
  className,
  label,
}: Props) {
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const layers = useRef<{ base?: L.TileLayer; polygon?: L.Polygon; reference?: L.Polygon; pin?: L.Marker; overlay?: L.ImageOverlay; drawing?: L.LayerGroup }>({})
  /** Bounds last framed, and whether the user has since moved the map themselves. */
  const fit = useRef<{ bounds?: L.LatLngBounds; byUser: boolean }>({ byUser: false })
  const [base, setBase] = useState<BaseLayer>(() => defaultBase ?? (interactive ? savedBase() : 'map'))

  // Latest props for the Leaflet event handlers, which are bound once.
  const live = useRef({ onPick, draw, vertices: vertices ?? [], onVerticesChange, onDrawRejected, base })
  live.current = { onPick, draw, vertices: vertices ?? [], onVerticesChange, onDrawRejected, base }

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
    m.on('click', (e) => {
      const now = live.current
      if (!now.draw) return now.onPick?.(e.latlng.lat, e.latlng.lng)
      const last = now.vertices[now.vertices.length - 1]
      // A double click/tap lands twice on the same spot: keep one corner.
      if (last && m.latLngToContainerPoint([last[1], last[0]]).distanceTo(e.containerPoint) < 8) return
      const next: LonLat[] = [...now.vertices, [e.latlng.lng, e.latlng.lat]]
      if (pathCrossesItself(next)) return now.onDrawRejected?.()
      now.onVerticesChange?.(next)
    })
    map.current = m
    // The container can get its final size after the map is created (styles arriving late, layout changes):
    // re-measure, and re-frame the outline while the user has not moved the map themselves.
    const touched = () => (fit.current.byUser = true)
    const userEvents = ['pointerdown', 'wheel', 'keydown'] as const
    userEvents.forEach((type) => el.current?.addEventListener(type, touched, { passive: true }))
    const sizes = new ResizeObserver(() => {
      m.invalidateSize({ animate: false })
      if (fit.current.bounds && !fit.current.byUser) m.fitBounds(fit.current.bounds, { ...FIT, animate: false })
    })
    sizes.observe(el.current)
    const node = el.current
    return () => {
      sizes.disconnect()
      userEvents.forEach((type) => node.removeEventListener(type, touched))
      m.remove()
      map.current = null
      layers.current = {}
    }
    // The map is created once; later prop changes are applied by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Base layer: only the tiles are swapped, so the view and everything drawn on the map stay.
  useEffect(() => {
    const m = map.current
    if (!m) return
    layers.current.base?.remove()
    layers.current.base = tiles(base).addTo(m)
    layers.current.polygon?.setStyle(outlineStyle(base))
    layers.current.reference?.setStyle(referenceStyle(base))
  }, [base])

  const ring = polygon ? JSON.stringify(polygon) : ''
  const referenceRing = reference ? JSON.stringify(reference) : ''
  useEffect(() => {
    const m = map.current
    if (!m) return
    layers.current.polygon?.remove()
    layers.current.polygon = undefined
    layers.current.reference?.remove()
    layers.current.reference = undefined
    let bounds: L.LatLngBounds | undefined
    if (reference && reference.length > 2) {
      layers.current.reference = L.polygon(toLatLngs(reference), referenceStyle(live.current.base)).addTo(m)
      bounds = layers.current.reference.getBounds()
    }
    if (polygon && polygon.length > 2) {
      const shape = L.polygon(toLatLngs(polygon), outlineStyle(live.current.base)).addTo(m)
      layers.current.polygon = shape
      bounds = bounds ? bounds.extend(shape.getBounds()) : shape.getBounds()
    }
    fit.current.bounds = bounds
    if (bounds) m.fitBounds(bounds, FIT)
    // `ring` and `referenceRing` are the serialised outlines.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ring, referenceRing])

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

  const focusLat = focus?.[0]
  const focusLon = focus?.[1]
  useEffect(() => {
    const m = map.current
    if (m && focusLat !== undefined && focusLon !== undefined) m.setView([focusLat, focusLon], Math.max(m.getZoom(), 15))
  }, [focusLat, focusLon])

  const overlayKey = overlay ? `${overlay.url}|${overlay.bounds.join(',')}|${overlay.opacity ?? 0.7}` : ''
  useEffect(() => {
    const m = map.current
    if (!m) return
    layers.current.overlay?.remove()
    layers.current.overlay = undefined
    if (overlay) layers.current.overlay = L.imageOverlay(overlay.url, overlay.bounds, { opacity: overlay.opacity ?? 0.7 }).addTo(m)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overlayKey])

  // While drawing, a double click must not zoom: it would also add a corner.
  useEffect(() => {
    const m = map.current
    if (!m || !interactive) return
    if (draw) m.doubleClickZoom.disable()
    else m.doubleClickZoom.enable()
  }, [draw, interactive])

  // Outline being drawn: numbered, draggable corners joined by a closed shape.
  const corners = draw && vertices ? JSON.stringify(vertices) : ''
  useEffect(() => {
    const m = map.current
    if (!m) return
    layers.current.drawing?.remove()
    layers.current.drawing = undefined
    if (!draw || !vertices || vertices.length === 0) return
    const group = L.layerGroup().addTo(m)
    layers.current.drawing = group
    const style = drawStyle(base, drawInvalid)
    const shape = vertices.length > 2 ? L.polygon(toLatLngs(vertices), style).addTo(group) : L.polyline(toLatLngs(vertices), style).addTo(group)
    vertices.forEach(([lon, lat], i) => {
      const handle = L.marker([lat, lon], { icon: cornerIcon(i + 1), draggable: true, keyboard: false, title: `Corner ${i + 1} — drag to adjust`, zIndexOffset: 1000 }).addTo(group)
      const moved = (): LonLat[] => {
        const at = handle.getLatLng()
        return vertices.map((v, j) => (j === i ? [at.lng, at.lat] : v))
      }
      handle.on('drag', () => shape.setLatLngs(toLatLngs(moved())))
      handle.on('dragend', () => {
        const next = moved()
        if (pathCrossesItself(next)) {
          handle.setLatLng([lat, lon])
          shape.setLatLngs(toLatLngs(vertices))
          live.current.onDrawRejected?.()
        } else live.current.onVerticesChange?.(next)
      })
    })
    // `corners` is the serialised list of corners.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [corners, draw, drawInvalid, base])

  const choose = (b: BaseLayer) => {
    setBase(b)
    try {
      localStorage.setItem(BASE_KEY, b)
    } catch {
      /* the choice just is not remembered */
    }
  }

  return (
    <div className={className} style={{ position: 'relative', minHeight: 120, zIndex: 0 }}>
      <div ref={el} role="application" aria-label={label} style={{ position: 'absolute', inset: 0, cursor: draw || onPick ? 'crosshair' : undefined }} />
      {interactive && (
        <div role="group" aria-label="Map background" className="absolute right-2.5 top-2.5 z-[1000] flex overflow-hidden rounded-full border border-line bg-surface shadow-md">
          {(['map', 'satellite'] as const).map((b) => (
            <button
              key={b}
              type="button"
              aria-pressed={base === b}
              onClick={() => choose(b)}
              className={
                'min-h-10 px-3.5 text-[14px] font-bold focus-visible:outline-2 focus-visible:-outline-offset-2 ' +
                (base === b ? 'bg-primary text-on-primary focus-visible:outline-on-primary' : 'text-ink hover:bg-tint focus-visible:outline-primary')
              }
            >
              {BASE_LABEL[b]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
