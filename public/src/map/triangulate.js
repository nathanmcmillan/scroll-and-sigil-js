import {Float} from '/src/math/vector.js'
import {Triangle} from '/src/map/triangle.js'

function stringifyPoint(point) {
  return JSON.stringify(point, (key, value) => {
    if (key === 'next' || key === 'previous' || key == 'diagonal') {
      if (value === null) return null
      else return {index: value.index, point: value.point}
    } else return value
  })
}

function stringifyVert(vert) {
  return JSON.stringify(vert, (key, value) => {
    if (key === 'next') {
      if (value === null) return null
      else return {vec: value.vec}
    } else return value
  })
}

function polygonSort(n, o) {
  let a = n.vec
  let b = o.vec
  if (a.y > b.y) return -1
  if (a.y < b.y) return 1
  if (a.x > b.x) return 1
  if (a.x < b.x) return -1
  return 0
}

class PolygonTriangle {
  constructor(vec) {
    this.index = -1
    this.merge = false
    this.vec = vec
    this.previous = null
    this.next = null
    this.diagonal = null
  }
}

class Vertex {
  constructor(vec) {
    this.vec = vec
    this.next = null
  }
}

function interiorCounter(a, b, c) {
  let angle = Math.atan2(b.y - a.y, b.x - a.x) - Math.atan2(b.y - c.y, b.x - c.x)
  if (angle < 0.0) angle += 2.0 * Math.PI
  else if (angle >= 2.0 * Math.PI) angle -= 2.0 * Math.PI
  return angle
}

function interiorClock(a, b, c) {
  let angle = Math.atan2(b.y - c.y, b.x - c.x) - Math.atan2(b.y - a.y, b.x - a.x)
  if (angle < 0.0) angle += 2.0 * Math.PI
  else if (angle >= 2.0 * Math.PI) angle -= 2.0 * Math.PI
  return angle
}

function interiorClip(a, b, c) {
  if (a.x < b.x) return interiorClock(a, b, c)
  return interiorCounter(a, b, c)
}

function interior2(a, b, c) {
  let angle = Math.atan2(b.y - c.y, b.x - c.x) - Math.atan2(a.y - b.y, a.x - b.x)
  if (angle < 0.0) angle += 2.0 * Math.PI
  else if (angle >= 2.0 * Math.PI) angle -= 2.0 * Math.PI
  return angle
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

function safeDiagonal(polygon, a, b) {
  for (const point of polygon) {
    let c = point.vec
    let d = point.previous.vec
    if (a === c || a === d || b === c || b === d) continue
    if (lineIntersect(a, b, c, d)) return false
  }
  return true
}

function add(sector, floor, scale, triangles, a, b, c) {
  let triangle = null
  if (floor) triangle = new Triangle(sector.floor, sector.floor_texture, a, b, c, floor, scale)
  else triangle = new Triangle(sector.ceiling, sector.ceiling_texture, c, b, a, floor, scale)
  triangles.push(triangle)
}

function adjacent(a, b) {
  return a.next === b || b.next === a
}

function clip(sector, floor, scale, triangles, verts) {
  console.log('clip')
  let size = verts.length
  if (size === 3) {
    add(sector, floor, scale, triangles, verts[0].vec, verts[1].vec, verts[2].vec)
    return
  }
  for (let i = 0; i < size; i++) {
    let vert = verts[i]
    if (i + 1 == size) vert.next = verts[0]
    else vert.next = verts[i + 1]
    console.log(' ', stringifyVert(vert))
  }
  verts.sort(polygonSort)
  let stack = [verts[0], verts[1]]
  for (let k = 2; k < size; k++) {
    let t = stack.pop()
    let v = verts[k]
    console.log('adjacent', JSON.stringify(v.vec), JSON.stringify(t.vec), '---', adjacent(v, t))
    if (adjacent(v, t)) {
      let p = stack[stack.length - 1]
      console.log('interior', JSON.stringify(p.vec), JSON.stringify(t.vec), JSON.stringify(v.vec), '---', interiorClip(p.vec, t.vec, v.vec))
      if (interiorClip(p.vec, t.vec, v.vec) >= Math.PI) {
        stack.push(t)
      } else {
        do {
          add(sector, floor, scale, triangles, p.vec, t.vec, v.vec)
          console.log('add (X)', JSON.stringify(p.vec), JSON.stringify(t.vec), JSON.stringify(v.vec))
          t = stack.pop()
          if (stack.length === 0) break
          p = stack[stack.length - 1]
        } while (interiorClip(p.vec, t.vec, v.vec) < Math.PI)
        stack.push(t)
      }
    } else {
      let o = t
      let p = stack[stack.length - 1]
      while (stack.length > 0) {
        add(sector, floor, scale, triangles, p.vec, t.vec, v.vec)
        console.log('add (Y)', JSON.stringify(p.vec), JSON.stringify(t.vec), JSON.stringify(v.vec))
        t = stack.pop()
        if (stack.length === 0) break
        p = stack[stack.length - 1]
      }
      stack.push(o)
    }
    stack.push(v)
    console.log('k is', k, 'len is', size, 'stack is')
    for (const vert of stack) {
      console.log(' ', JSON.stringify(vert.vec))
    }
  }
}

function triangulate(sector, floor, scale, monotone, triangles) {
  console.log('monotone')
  for (const mono of monotone) {
    console.log(' ', stringifyPoint(mono))
  }
  let verts = []
  for (const start of monotone) {
    let current = start
    let protect = 100
    let diagonal = true
    while (true) {
      if (--protect <= 0) throw 'Too many triangulation iterations'
      if (current === null) {
        console.error(start)
        throw 'Current triangulation point should not be null'
      }
      verts.push(new Vertex(current.vec))
      if (diagonal) {
        diagonal = false
        current = current.next
      } else {
        if (current.diagonal) {
          current = current.diagonal
          diagonal = true
        } else current = current.next
      }
      if (current === start) break
    }
    clip(sector, floor, scale, triangles, verts)
    verts.length = 0
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
    let previous = current.previous.vec
    let next = current.next.vec
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
    let vec = point.vec
    for (let k = point.index + 1; k < points.length; k++) {
      let diagonal = points[k]
      if (Float.eq(vec.y, diagonal.vec.y)) continue
      if (!safeDiagonal(points, vec, diagonal.vec)) continue
      if (point.diagonal !== null) throw 'Merge point diagonal already exists'
      if (diagonal.diagonal !== null) throw 'Merge diagonal diagonal already exists'
      point.merge = true
      point.diagonal = diagonal
      diagonal.diagonal = point
      console.log('merge', stringifyPoint(point), 'diagonal', stringifyPoint(diagonal))
      break
    }
  }
  for (const point of split) {
    let vec = point.vec
    for (let k = point.index - 1; k >= 0; k--) {
      let diagonal = points[k]
      if (Float.eq(vec.y, diagonal.vec.y)) continue
      if (!safeDiagonal(points, vec, diagonal.vec)) continue
      if (point.diagonal !== null) throw 'Merge point diagonal already exists'
      if (diagonal.diagonal !== null) throw 'Merge diagonal diagonal already exists'
      if (diagonal.merge) break
      point.diagonal = diagonal
      diagonal.diagonal = point
      console.log('split', stringifyPoint(point), 'diagonal', stringifyPoint(diagonal))
      monotone.push(diagonal)
      break
    }
  }
  return monotone
}

function find(points, vec) {
  for (const point of points) {
    if (vec === point.vec) {
      return point
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
    if (original.previous === null) {
      original.previous = previous
    } else {
      let point = original.vec
      let angle = original.previous.vec.angle(point)
      if (previous.vec.angle(point) < angle) {
        original.previous = previous
      }
    }
    if (original.next === null) {
      original.next = next
    } else {
      let point = original.vec
      let angle = original.next.vec.angle(point)
      if (next.vec.angle(point) < angle) {
        original.next = next
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
  points.sort(polygonSort)
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
  triangulate(sector, floor, scale, monotone, triangles)
}

export function sectorTriangulate(sector, scale) {
  floorCeil(sector, true, scale, sector.triangles)
  floorCeil(sector, false, scale, sector.triangles)
}

export function sectorTriangulateForEditor(sector, scale) {
  // sectorTriangulate(sector, scale)
  floorCeil(sector, null, scale, sector.view)
}
