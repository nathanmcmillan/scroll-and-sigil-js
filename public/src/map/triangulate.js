import {Float} from '/src/math/vector.js'
import {Triangle} from '/src/map/triangle.js'

class PolygonTriangle {
  constructor(point) {
    this.index = -1
    this.merge = false
    this.perimeter = false
    this.point = point
    this.previous = []
    this.next = []
  }
}

function triangleContains(triangle, point) {
  let odd = false
  let k = 2
  for (let i = 0; i < 3; i++) {
    let a = triangle[i]
    let b = triangle[k]
    if (a.y > point.y != b.y > point.y) {
      let val = ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
      if (point.x < val) {
        odd = !odd
      }
    }
    k = i
  }
  return odd
}

function polygonRemove(polygons, point) {
  let i = polygons.length
  while (i--) {
    if (point.eq(polygons[i].point)) {
      polygons.splice(i, 1)
      return
    }
  }
}

function interiorAngle(a, b, c) {
  let one = Math.atan2(a.y - b.y, a.x - b.x)
  let two = Math.atan2(b.y - c.y, b.x - c.x)
  let interior = two - one
  if (interior < 0.0) {
    interior += 2.0 * Math.PI
  }
  return interior
}

function validTriangle(vecs, a, b, c) {
  if (interiorAngle(a, b, c) > Math.PI) {
    return false
  }
  let triangle = [a, b, c]
  for (const vec of vecs) {
    if (vec.eq(a) || vec.eq(b) || vec.eq(c)) {
      continue
    }
    if (triangleContains(triangle, vec)) {
      return false
    }
  }
  return true
}

function lineIntersect(a, b, c, d) {
  let a1 = b.y - a.y
  let b1 = a.x - b.x
  let c1 = b.x * a.y - a.x * b.y
  let r3 = a1 * c.x + b1 * c.y + c1
  let r4 = a1 * d.x + b1 * d.y + c1
  if (!Float.zero(r3) && !Float.zero(r4) && r3 * r4 >= 0.0) {
    return false
  }
  let a2 = d.y - c.y
  let b2 = c.x - d.x
  let c2 = d.x * c.y - c.x * d.y
  let r1 = a2 * a.x + b2 * a.y + c2
  let r2 = a2 * b.x + b2 * b.y + c2
  if (!Float.zero(r1) && !Float.zero(r2) && r1 * r2 >= 0.0) {
    return false
  }
  let denominator = a1 * b2 - a2 * b1
  if (Float.zero(denominator)) {
    return false
  }
  return true
}

function validPolygon(polygons, a, b) {
  for (const polygon of polygons) {
    let c = polygon.point
    let d = polygon.previous[0].point
    if (!a.eq(c) && !a.eq(d) && !b.eq(c) && !b.eq(d) && lineIntersect(a, b, c, d)) {
      return false
    }
  }
  return true
}

function clip(sector, floor, scale, triangles, vecs) {
  let i = 0
  let size = vecs.length
  while (size > 3) {
    let plus = i == size - 1 ? 0 : i + 1
    let minus = i == 0 ? size - 1 : i - 1
    let next = vecs[plus]
    let previous = vecs[minus]
    let current = vecs[i]
    if (validTriangle(vecs, previous, current, next)) {
      let triangle = null
      if (floor) {
        triangle = new Triangle(sector.floor, sector.floor_texture, previous, current, next, floor, scale)
      } else {
        triangle = new Triangle(sector.ceiling, sector.ceiling_texture, next, current, previous, floor, scale)
      }
      triangles.push(triangle)
      vecs.splice(i, 1)
      size--
    } else {
      i++
    }
    if (i == size) i = 0
  }
  let triangle = null
  if (floor) {
    triangle = new Triangle(sector.floor, sector.floor_texture, vecs[0], vecs[1], vecs[2], floor, scale)
  } else {
    triangle = new Triangle(sector.ceiling, sector.ceiling_texture, vecs[2], vecs[1], vecs[0], floor, scale)
  }
  triangles.push(triangle)
}

function clipAll(sector, floor, scale, monotone, triangles) {
  let vecs = []
  for (const start of monotone) {
    let next = start.next[0]
    let current = start
    while (true) {
      let a = next.point
      let b = current.point
      vecs.push(b)
      let angle = Number.MAX_VALUE
      let previous = null
      for (const poly of current.previous) {
        let c = poly.point
        let angleA = Math.atan2(a.x - b.x, a.y - b.y)
        let angleB = Math.atan2(b.x - c.x, b.y - c.y)
        let interior = angleB - angleA + Math.PI
        if (interior < 0.0) {
          interior += 2.0 * Math.PI
        }
        if (interior > 2.0 * Math.PI) {
          interior -= 2.0 * Math.PI
        }
        if (interior < angle) {
          previous = poly
          angle = interior
        }
      }
      polygonRemove(current.next, a)
      polygonRemove(current.previous, previous.point)
      if (previous == start) {
        break
      }
      next = current
      current = previous
    }
    clip(sector, floor, scale, triangles, vecs)
    vecs.length = 0
  }
}

function classify(polygons, monotone) {
  let merge = []
  let split = []
  for (const current of polygons) {
    let point = current.point
    let previous = current.previous[0].point
    let next = current.next[0].point
    let reflex = interiorAngle(previous, point, next) > Math.PI
    let above = previous.y < point.y && next.y <= point.y
    let below = previous.y >= point.y && next.y >= point.y
    let collinear = Float.eq(next.y, point.y)
    if (reflex) {
      if (above) {
        monotone.push(current)
      }
    } else if (!collinear) {
      if (above) {
        split.push(current)
      } else if (below) {
        merge.push(current)
      }
    }
  }
  for (const polygon of merge) {
    let point = polygon.point
    for (let k = polygon.index + 1; k < polygons.length; k++) {
      let diagonal = polygons[k]
      if (validPolygon(polygons, point, diagonal.point)) {
        polygon.merge = true
        polygon.next.push(diagonal)
        polygon.previous.push(diagonal)
        diagonal.next.push(polygon)
        diagonal.previous.push(polygon)
        break
      }
    }
  }
  for (const polygon of split) {
    let point = polygon.point
    for (let k = polygon.index - 1; k >= 0; k--) {
      let diagonal = polygons[k]
      if (validPolygon(polygons, point, diagonal.point)) {
        if (!polygon.merge) {
          monotone.push(diagonal)
          polygon.next.push(diagonal)
          polygon.previous.push(diagonal)
          diagonal.next.push(polygon)
          diagonal.previous.push(polygon)
        }
        break
      }
    }
  }
}

function cullVectors(polygons) {
  let remaining = polygons.slice()
  let dead = new Set()
  let holding = new Set()
  let pending = new Set()
  while (remaining.length > 0) {
    let start = remaining[0]
    let current = start
    while (true) {
      current.perimeter = true
      remaining.splice(remaining.indexOf(current), 1)
      while (current.next.length != 1) {
        let next = current.next[1]
        pending.add(next)
        current.next.splice(1, 1)
      }
      while (current.previous.length != 1) {
        current.previous.splice(1, 1)
      }
      current = current.next[0]
      if (current == start) {
        break
      }
    }
    while (pending.size > 0) {
      for (const polygon of pending) {
        dead.add(pending)
        for (const next of polygon.next) {
          if (!next.perimeter) {
            if (!pending.has(next) && !dead.has(next)) {
              holding.add(next)
            }
          }
        }
      }
      pending.clear()
      for (const polygon in holding) pending.add(polygon)
      holding.clear()
    }
    for (const polygon of dead) {
      polygons.filter((poly) => poly != polygon)
      remaining.filter((poly) => poly != polygon)
    }
    dead.clear()
    holding.clear()
    pending.clear()
  }
}

function polygonFind(polygons, point) {
  for (const polygon of polygons) {
    if (point.eq(polygon.point)) {
      return polygon
    }
  }
  return null
}

function populateReferences(sector, polygons, clockwise) {
  const len = sector.vecs.length
  for (let i = 0; i < len; i++) {
    let p = i == 0 ? len - 1 : i - 1
    let n = i == len - 1 ? 0 : i + 1
    if (!clockwise) {
      let t = p
      p = n
      n = t
    }
    let next = polygonFind(polygons, sector.vecs[n])
    let previous = polygonFind(polygons, sector.vecs[p])
    let original = polygonFind(polygons, sector.vecs[i])
    if (original.previous.length == 0) {
      original.previous.push(previous)
    } else {
      let point = original.point
      let existing = original.previous[0].point
      if (previous.point.angle(point) < existing.angle(point)) {
        original.previous.unshift(previous)
      }
    }
    if (original.next.length == 0) {
      original.next.push(next)
    } else {
      let point = original.point
      let existing = original.next[0].point
      if (next.point.angle(point) < existing.angle(point)) {
        original.next.unshift(next)
      }
    }
  }
}

function pointCompare(a, b) {
  return a.y < b.y || (Float.eq(a.y, b.y) && a.x > b.x)
}

function polygonInsert(polygons, point) {
  let polygon = new PolygonTriangle(point)
  let len = polygons.length
  for (let i = 0; i < len; i++) {
    let vec = polygons[i].point
    if (!pointCompare(point, vec)) {
      polygons.splice(i, 0, polygon)
      return
    }
  }
  polygons.push(polygon)
}

function populateVectors(sector, polygons) {
  for (const point of sector.vecs) {
    let exists = false
    for (const polygon of polygons) {
      if (point.eq(polygon.point)) {
        exists = true
        break
      }
    }
    if (!exists) {
      polygonInsert(polygons, point)
    }
  }
}

function skip(sector, floor) {
  if (floor) {
    return !sector.hasFloor()
  }
  return !sector.hasCeiling()
}

function populate(sector, floor, polygons) {
  for (let inner of sector.inside) {
    if (skip(inner, floor)) {
      continue
    }
    populateVectors(inner, polygons)
  }
  for (let inner of sector.inside) {
    if (skip(inner, floor)) {
      continue
    }
    populateReferences(inner, polygons, false)
  }
  cullVectors(polygons)
  populateVectors(sector, polygons)
  populateReferences(sector, polygons, true)
  for (let i = 0; i < polygons.length; i++) {
    polygons[i].index = i
  }
}

function surface(sector, floor, scale) {
  if (skip(sector, floor)) {
    return
  }
  let polygons = []
  let monotone = []
  populate(sector, floor, polygons)
  classify(polygons, monotone)
  clipAll(sector, floor, scale, monotone, sector.triangles)
}

export function triangulate(sector, scale) {
  surface(sector, true, scale)
  surface(sector, false, scale)
}
