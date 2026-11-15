/**
 * Small planar-geometry helpers for field outlines.
 * Same flat local approximation as the backend: degrees → metres with 111 320 m/degree,
 * longitude scaled by cos(latitude). Good enough at field scale.
 */
import { METERS_PER_DEGREE, type LonLat, type Polygon } from '@/lib/api'

/** Corners (open list, no repeated last point) → closed GeoJSON polygon. */
export function ringToPolygon(vertices: LonLat[]): Polygon {
  return { type: 'Polygon', coordinates: [[...vertices, vertices[0]]] }
}

/** Area in hectares of an outline given as corners (open or closed ring). */
export function ringAreaHa(ring: LonLat[]): number {
  if (ring.length < 3) return 0
  let twice = 0
  let latSum = 0
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i]
    const [x2, y2] = ring[(i + 1) % ring.length]
    twice += x1 * y2 - x2 * y1
    latSum += y1
  }
  const lat = latSum / ring.length
  const m2 = (Math.abs(twice) / 2) * METERS_PER_DEGREE ** 2 * Math.cos((lat * Math.PI) / 180)
  return m2 / 10_000
}

const cross = (a: LonLat, b: LonLat, c: LonLat) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
const within = (a: LonLat, b: LonLat, p: LonLat) => Math.min(a[0], b[0]) <= p[0] && p[0] <= Math.max(a[0], b[0]) && Math.min(a[1], b[1]) <= p[1] && p[1] <= Math.max(a[1], b[1])

/** True when segments ab and cd touch or cross. */
function segmentsMeet(a: LonLat, b: LonLat, c: LonLat, d: LonLat) {
  const d1 = cross(c, d, a)
  const d2 = cross(c, d, b)
  const d3 = cross(a, b, c)
  const d4 = cross(a, b, d)
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return true
  return (d1 === 0 && within(c, d, a)) || (d2 === 0 && within(c, d, b)) || (d3 === 0 && within(a, b, c)) || (d4 === 0 && within(a, b, d))
}

function crosses(points: LonLat[], closed: boolean) {
  const n = points.length
  const segments = closed ? n : n - 1
  for (let i = 0; i < segments; i++) {
    for (let j = i + 2; j < segments; j++) {
      // The first and last sides of a closed ring share a corner — that is not a crossing.
      if (closed && i === 0 && j === segments - 1) continue
      if (segmentsMeet(points[i], points[i + 1], points[j], points[(j + 1) % n])) return true
    }
  }
  return false
}

/** True when the line through the corners, in order and left open, crosses itself. */
export const pathCrossesItself = (vertices: LonLat[]) => vertices.length > 3 && crosses(vertices, false)

/** True when the outline closed back to its first corner crosses itself. `vertices` is the open list of corners. */
export const ringCrossesItself = (vertices: LonLat[]) => vertices.length > 3 && crosses(vertices, true)

/**
 * True when two outlines are different enough to be told apart on a map: some corner of one is
 * farther than 5 % of the other's diagonal from every corner of it.
 */
export function ringsDifferVisibly(a: LonLat[], b: LonLat[]): boolean {
  if (a.length < 3 || b.length < 3) return false
  const lat = a[0][1]
  const kx = Math.cos((lat * Math.PI) / 180)
  const dist = (p: LonLat, q: LonLat) => Math.hypot((p[0] - q[0]) * kx, p[1] - q[1])
  const xs = b.map((p) => p[0])
  const ys = b.map((p) => p[1])
  const diagonal = Math.hypot((Math.max(...xs) - Math.min(...xs)) * kx, Math.max(...ys) - Math.min(...ys))
  const farthest = (from: LonLat[], to: LonLat[]) => Math.max(...from.map((p) => Math.min(...to.map((q) => dist(p, q)))))
  return Math.max(farthest(a, b), farthest(b, a)) > diagonal * 0.05
}
