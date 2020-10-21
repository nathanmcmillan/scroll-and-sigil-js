import {Float} from '/src/math/vector.js'
import {Triangle} from '/src/map/triangle.js'

function stringifyPoint(point) {
  return JSON.stringify(point, (key, value) => {
    if (key === 'next' || key === 'previous') return value.id
    else return value
  })
}

class PolygonTriangle {
  constructor(vec) {
    this.index = -1
    this.merge = false
    this.perimeter = false
    this.vec = vec
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

// TODO This is the good one... But it doesn't work with the legacy code
// function interior(a, b, c) {
//   let angle = Math.atan2(b.y - a.y, b.x - a.x) - Math.atan2(b.y - c.y, b.x - c.x)
//   if (angle < 0.0) angle += 2.0 * Math.PI
//   else if (angle >= 2.0 * Math.PI) angle -= 2.0 * Math.PI
//   return angle
// }

function interior2(a, b, c) {
  let angle = Math.atan2(a.y - b.y, a.x - b.x) - Math.atan2(b.y - c.y, b.x - c.x)
  if (angle < 0.0) angle += 2.0 * Math.PI
  else if (angle >= 2.0 * Math.PI) angle -= 2.0 * Math.PI
  return angle
}

function interior3(a, b, c) {
  let angle = Math.atan2(a.x - b.x, a.y - b.y) - Math.atan2(b.x - c.x, b.y - c.y) + Math.PI
  if (angle < 0.0) angle += 2.0 * Math.PI
  else if (angle >= 2.0 * Math.PI) angle -= 2.0 * Math.PI
  return angle
}

function validTriangle(vecs, a, b, c) {
  if (interior2(a, b, c) > Math.PI) return false
  let triangle = [a, b, c]
  for (const vec of vecs) {
    if (vec === a || vec === b || vec === c) continue
    if (triangleContains(triangle, vec)) return false
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

function validPolygon(polygon, a, b) {
  for (const point of polygon) {
    let c = point.vec
    let d = point.previous[0].vec
    if (a !== c && a !== d && b !== c && b !== d && lineIntersect(a, b, c, d)) {
      return false
    }
  }
  return true
}

function clip(sector, floor, scale, triangles, vecs) {
  console.log('clip', vecs)
  let i = 0
  let size = vecs.length
  let protect = 200
  while (size > 3) {
    if (--protect <= 0) throw 'Too many clip iterations'
    let plus = i + 1 == size ? 0 : i + 1
    let minus = i == 0 ? size - 1 : i - 1
    let next = vecs[plus]
    let previous = vecs[minus]
    let current = vecs[i]
    console.log('clip', next, previous, current)
    if (validTriangle(vecs, previous, current, next)) {
      let triangle = null
      if (floor) triangle = new Triangle(sector.floor, sector.floor_texture, previous, current, next, floor, scale)
      else triangle = new Triangle(sector.ceiling, sector.ceiling_texture, next, current, previous, floor, scale)
      triangles.push(triangle)
      vecs.splice(i, 1)
      size--
    } else {
      i++
    }
    if (i == size) i = 0
  }
  let triangle = null
  if (floor) triangle = new Triangle(sector.floor, sector.floor_texture, vecs[0], vecs[1], vecs[2], floor, scale)
  else triangle = new Triangle(sector.ceiling, sector.ceiling_texture, vecs[2], vecs[1], vecs[0], floor, scale)
  triangles.push(triangle)
}

function clipAll(sector, floor, scale, monotone, triangles) {
  console.log('clip all', monotone)
  let vecs = []
  for (const start of monotone) {
    if (start.next.length === 0) {
      console.error(start)
      throw 'Start next list should not be empty'
    }
    let next = start.next[0]
    let current = start
    while (true) {
      let a = next.vec
      let b = current.vec
      vecs.push(b)
      let best = Number.MAX_VALUE
      let previous = null
      for (const poly of current.previous) {
        let c = poly.vec
        let angle = interior3(a, b, c)
        console.log('clip all interior', a, b, c, '=>', (180.0 * angle) / Math.PI)
        if (Float.zero(angle)) throw 'Interior angle should not be zero'
        if (angle < best) {
          previous = poly
          best = angle
        }
      }
      current.next.splice(current.next.indexOf(next), 1)
      current.previous.splice(current.previous.indexOf(previous), 1)
      // if (current.next.length === 0) {
      //   console.error(`current ${stringifyPoint(current)} next ${stringifyPoint(next)}`)
      //   throw 'Current clipped next list should not be empty'
      // }
      // if (current.previous.length === 0) {
      //   console.error(`current ${stringifyPoint(current)} previous ${stringifyPoint(previous)}`)
      //   throw 'Current clipped previous list should not be empty'
      // }
      if (previous === start) break
      next = current
      current = previous
    }
    clip(sector, floor, scale, triangles, vecs)
    vecs.length = 0
  }
}

function classify(points) {
  console.log('classify')
  let monotone = []
  let merge = []
  let split = []
  for (const current of points) {
    console.log(' ', stringifyPoint(current))
    let vec = current.vec
    let previous = current.previous[0].vec
    let next = current.next[0].vec
    let reflex = interior2(previous, vec, next) > Math.PI
    let above = previous.y < vec.y && next.y <= vec.y
    let below = previous.y >= vec.y && next.y >= vec.y
    let collinear = Float.eq(next.y, vec.y)
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
  for (const point of merge) {
    console.log('  merge', stringifyPoint(point))
    let vec = point.vec
    for (let k = point.index + 1; k < points.length; k++) {
      let diagonal = points[k]
      if (!validPolygon(points, vec, diagonal.vec)) continue
      point.merge = true
      if (point.next.indexOf(diagonal) >= 0) throw 'Point next already has diagonal'
      if (point.previous.indexOf(diagonal) >= 0) {
        console.warn(`Point ${stringifyPoint(point)} previous already has diagonal ${stringifyPoint(diagonal)}`)
        // throw `Point ${stringifyPoint(point)} previous already has diagonal ${stringifyPoint(diagonal)}`
      }
      point.next.push(diagonal)
      point.previous.push(diagonal)
      if (diagonal.next.indexOf(point) >= 0) {
        console.warn(`Diagonal ${stringifyPoint(diagonal)} next already has point ${stringifyPoint(point)}`)
        // throw 'Diagonal next already has point'
      }
      if (diagonal.previous.indexOf(point) >= 0) throw 'Diagonal previous already has point'
      diagonal.next.push(point)
      diagonal.previous.push(point)
      break
    }
  }
  for (const point of split) {
    let vec = point.vec
    for (let k = point.index - 1; k >= 0; k--) {
      let diagonal = points[k]
      if (!validPolygon(points, vec, diagonal.vec)) continue
      if (diagonal.merge) break
      if (diagonal.next.indexOf(point) >= 0) throw 'Diagonal next already has point'
      if (diagonal.previous.indexOf(point) >= 0) throw 'Diagonal previous already has point'
      diagonal.next.push(point)
      diagonal.previous.push(point)
      if (point.next.indexOf(diagonal) >= 0) throw 'Point next already has diagonal'
      if (point.previous.indexOf(diagonal) >= 0) throw 'Point previous already has diagonal'
      point.next.push(diagonal)
      point.previous.push(diagonal)
      monotone.push(diagonal)
      break
    }
  }
  return monotone
}

function cullVectors(points) {
  console.log('cull vectors')
  let remaining = points.slice()
  let dead = new Set()
  let holding = new Set()
  let pending = new Set()
  let protect = 1000
  while (remaining.length > 0) {
    if (--protect <= 0) throw 'Too many cull iterations (A)'
    let start = remaining[0]
    let current = start
    while (true) {
      console.log('  culling', JSON.parse(JSON.stringify(current.vec)))
      if (--protect <= 0) throw 'Too many cull iterations (B)'
      current.perimeter = true
      let remove = remaining.indexOf(current)
      if (remove < 0) throw 'Did not find current point in remaining set'
      remaining.splice(remove, 1)
      while (current.next.length > 1) {
        if (--protect <= 0) throw 'Too many cull iterations (C)'
        console.warn(`splicing current ${stringifyPoint(current)} next ${stringifyPoint(current.next)}`)
        pending.add(current.next.splice(1, 1)[0])
      }
      while (current.previous.length > 1) {
        if (--protect <= 0) throw 'Too many cull iterations (D)'
        console.warn(`splicing current ${stringifyPoint(current)} previous ${stringifyPoint(current.previous)}`)
        current.previous.splice(1, 1)
      }
      if (current.previous[0].vec === current.next[0].vec) {
        throw 'Current and previous points should not be the same'
      }
      current = current.next[0]
      if (current === start) break
    }
    while (pending.size > 0) {
      if (--protect <= 0) throw 'Too many cull iterations (E)'
      for (const point of pending) {
        dead.add(pending)
        for (const next of point.next) {
          if (!next.perimeter && !pending.has(next) && !dead.has(next)) {
            holding.add(next)
          }
        }
      }
      pending.clear()
      for (const point in holding) pending.add(point)
      holding.clear()
    }
    for (const point of dead) {
      points.splice(points.indexOf(point), 1)
      remaining.splice(remaining.indexOf(point), 1)
    }
    dead.clear()
    holding.clear()
    pending.clear()
  }
}

function find(polygons, point) {
  for (const polygon of polygons) {
    if (point === polygon.vec) {
      return polygon
    }
  }
  return null
}

function populateReferences(sector, points, clockwise) {
  const len = sector.vecs.length
  for (let i = 0; i < len; i++) {
    let p = i == 0 ? len - 1 : i - 1
    let n = i == len - 1 ? 0 : i + 1
    if (!clockwise) {
      let t = p
      p = n
      n = t
    }
    let next = find(points, sector.vecs[n])
    let previous = find(points, sector.vecs[p])
    let original = find(points, sector.vecs[i])
    if (original.previous.length == 0) {
      original.previous.push(previous)
    } else {
      let point = original.vec
      let angle = original.previous[0].vec.angle(point)
      if (previous.vec.angle(point) < angle) {
        if (original.previous.indexOf(previous) >= 0) throw 'Duplicate previous reference'
        original.previous.unshift(previous)
        if (original.previous.length > 1) console.warn('original.previous.length > 1', original.vec)
      }
    }
    if (original.next.length == 0) {
      original.next.push(next)
    } else {
      let point = original.vec
      let angle = original.next[0].vec.angle(point)
      if (next.vec.angle(point) < angle) {
        if (original.next.indexOf(next) >= 0) throw 'Duplicate next reference'
        original.next.unshift(next)
        if (original.next.length > 1) console.warn('original.next.length > 1', original.vec)
      }
    }
  }
}

function populateVectors(sector, points) {
  for (const vec of sector.vecs) {
    let exists = false
    for (const point of points) {
      if (vec === point.vec) {
        exists = true
        break
      }
    }
    if (!exists) points.push(new PolygonTriangle(vec))
  }
  points.sort((n, o) => {
    let a = n.vec
    let b = o.vec
    if (a.y > b.y) return -1
    if (a.y < b.y) return 1
    if (a.x > b.x) return 1
    if (a.x < b.x) return -1
    return 0
  })
}

function skip(sector, floor) {
  if (floor === null) return false
  if (floor) return !sector.hasFloor()
  return !sector.hasCeiling()
}

function populate(sector, floor) {
  let polygons = []
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
  return polygons
}

function floorCeil(sector, floor, scale, triangles) {
  if (skip(sector, floor)) return
  let polygons = populate(sector, floor)
  let monotone = classify(polygons)
  clipAll(sector, floor, scale, monotone, triangles)
}

export function sectorTriangulate(sector, scale) {
  floorCeil(sector, true, scale, sector.triangles)
  floorCeil(sector, false, scale, sector.triangles)
}

export function sectorTriangulateForEditor(sector, scale) {
  // sectorTriangulate(sector, scale)
  floorCeil(sector, null, scale, sector.view)
}
