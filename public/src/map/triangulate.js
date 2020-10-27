import {Float} from '/src/math/vector.js'
import {Triangle} from '/src/map/triangle.js'

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

function polygonSort(n, o) {
  let a = n.vec
  let b = o.vec
  if (a.y > b.y) return -1
  if (a.y < b.y) return 1
  if (a.x > b.x) return 1
  if (a.x < b.x) return -1
  return 0
}

function stringifyPoint(point) {
  return JSON.stringify(point, (key, value) => {
    if (key === 'previous' || key === 'merge') return
    if (key === 'vec') return {x: value.x, y: value.y}
    if (key === 'next' || key == 'diagonal') {
      if (value === null) return null
      else return {index: value.index, point: value.point}
    } else return value
  })
}

class Vertex {
  constructor(vec) {
    this.vec = vec
    this.next = null
  }
}

function stringifyVert(vert) {
  return JSON.stringify(vert, (key, value) => {
    if (key === 'next') {
      if (value === null) return null
      else return {vec: value.vec}
    } else return value
  })
}

function clockwiseReflex(a, b, c) {
  return (b.x - c.x) * (a.y - b.y) - (a.x - b.x) * (b.y - c.y) > 0.0
}

function counterClockwiseReflex(a, b, c) {
  return (b.x - a.x) * (c.y - b.y) - (c.x - b.x) * (b.y - a.y) > 0.0
}

function interiorCounter(a, b, c) {
  let angle = Math.atan2(b.y - a.y, b.x - a.x) - Math.atan2(b.y - c.y, b.x - c.x)
  if (angle < 0.0) angle += 2.0 * Math.PI
  else if (angle >= 2.0 * Math.PI) angle -= 2.0 * Math.PI
  return angle
}

function clockwiseInterior(a, b, c) {
  let angle = Math.atan2(b.y - c.y, b.x - c.x) - Math.atan2(b.y - a.y, b.x - a.x)
  if (angle < 0.0) angle += 2.0 * Math.PI
  else if (angle >= 2.0 * Math.PI) angle -= 2.0 * Math.PI
  return angle
}

function interior(a, b, c) {
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
      console.log('continuing with adjacent...', JSON.stringify(p.vec), JSON.stringify(t.vec), JSON.stringify(v.vec))
      let a, c
      let b = t.vec
      if (v.next === t) {
        a = v.vec
        c = p.vec
        console.log('v ---> t')
      } else {
        a = p.vec
        c = v.vec
        console.log('t ---> v')
      }
      console.log('reflex', JSON.stringify(a), JSON.stringify(b), JSON.stringify(c), '---', clockwiseReflex(a, b, c))
      if (!clockwiseReflex(a, b, c)) {
        stack.push(t)
      } else {
        do {
          add(sector, floor, scale, triangles, a, b, c)
          console.log('add (X)', JSON.stringify(a), JSON.stringify(b), JSON.stringify(c))
          t = stack.pop()
          if (stack.length === 0) break
          p = stack[stack.length - 1]
          console.log('continuing with adjacent (2)...', JSON.stringify(p.vec), JSON.stringify(t.vec), JSON.stringify(v.vec))
          b = t.vec
          if (v.next === t) {
            a = v.vec
            c = p.vec
            console.log('v ---> t')
          } else if (t.next === v) {
            a = p.vec
            c = v.vec
            console.log('t ---> v')
          } else if (p.next === v) {
            a = v.vec
            c = p.vec
            console.log('p ---> v')
          } else if (t.next === p) {
            a = p.vec
            c = v.vec
            console.log('t ---> p')
          } else {
            console.warn('Unexpected adjacency case')
            a = p.vec
            c = v.vec
          }
          console.log('reflex (2)', JSON.stringify(a), JSON.stringify(b), JSON.stringify(c), '---', clockwiseReflex(a, b, c))
        } while (clockwiseReflex(a, b, c))
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

function monotone(sector, floor, scale, starting, triangles) {
  console.log('monotone')
  for (const start of starting) {
    console.log(' ', stringifyPoint(start))
  }
  let verts = []
  for (const start of starting) {
    let previous = null
    let current = start
    let protect = 100
    while (true) {
      let vec = current.vec
      let next = current.next
      if (--protect <= 0) throw 'Too many triangulation iterations'
      verts.push(new Vertex(current.vec))
      if (current.diagonal) {
        let diagonal = current.diagonal
        if (previous === null) {
          let sort = polygonSort(next, diagonal)
          console.log('sort (A)', JSON.stringify(vec), JSON.stringify(next.vec), JSON.stringify(diagonal.vec), '=>', sort)
          if (sort >= 0) current = next
          else current = diagonal
          // console.log('angle (A)', JSON.stringify(vec), JSON.stringify(next.vec), JSON.stringify(diagonal.vec), vec.angle(next.vec), vec.angle(diagonal.vec))
          // if (vec.angle(next.vec) < vec.angle(diagonal.vec)) current = next
          // else current = diagonal
        } else if (previous === diagonal.vec) {
          console.warn('Monotone previous === diagonal.vec')
          current = next
        } else {
          let original = clockwiseInterior(previous, vec, next.vec)
          let other = clockwiseInterior(previous, vec, diagonal.vec)
          console.log('interior (B)', JSON.stringify(previous), JSON.stringify(vec), JSON.stringify(next.vec), original)
          console.log('interior (B)', JSON.stringify(previous), JSON.stringify(vec), JSON.stringify(diagonal.vec), other)
          current = original < other ? next : diagonal
        }
      } else {
        current = next
      }
      if (current === start) break
      previous = vec
    }
    clip(sector, floor, scale, triangles, verts)
    console.log('##########')
    verts.length = 0
  }
}

function classify(points) {
  console.log('classify')
  let monotone = []
  let merge = []
  let split = []
  for (const current of points) {
    let vec = current.vec
    let previous = current.previous.vec
    let next = current.next.vec
    let reflex = clockwiseReflex(previous, vec, next)
    if (reflex) {
      // for a colinear top we need   (previous.y <= vec.y && next.y < vec.y)
      // but for an 'L' shape we need (previous.y < vec.y && next.y < vec.y)
      let above = previous.y < vec.y && next.y <= vec.y
      console.log(' ', stringifyPoint(current), 'reflex', reflex, 'above', above)
      if (above) monotone.push(current)
    } else {
      let above = previous.y <= vec.y && next.y < vec.y
      let below = previous.y >= vec.y && next.y > vec.y
      console.log(' ', stringifyPoint(current), 'reflex', reflex, 'above', above, 'below', below)
      if (above) {
        split.push(current)
      } else if (below) {
        merge.push(current)
      }
    }
  }
  for (const mono of monotone) console.log('start', JSON.stringify(mono.vec))
  for (const point of merge) {
    let vec = point.vec
    for (let k = point.index + 1; k < points.length; k++) {
      let diagonal = points[k]
      if (!safeDiagonal(points, vec, diagonal.vec)) continue
      if (point.diagonal !== null) console.error('Merge point diagonal already exists:', stringifyPoint(point.diagonal))
      if (diagonal.diagonal !== null) console.error('Merge diagonal diagonal already exists:', stringifyPoint(diagonal.diagonal))
      point.merge = true
      point.diagonal = diagonal
      diagonal.diagonal = point
      console.log('merge', stringifyPoint(point))
      // monotone.push(point) // Only needed for collinear, should actually be a split in that case?
      break
    }
  }
  for (const point of split) {
    let vec = point.vec
    for (let k = point.index - 1; k >= 0; k--) {
      let diagonal = points[k]
      if (!safeDiagonal(points, vec, diagonal.vec)) continue
      if (point.diagonal !== null) console.error('Merge point diagonal already exists:', stringifyPoint(point.diagonal))
      if (diagonal.diagonal !== null) console.error('Merge diagonal diagonal already exists:', stringifyPoint(diagonal.diagonal))
      if (diagonal.merge) break
      point.diagonal = diagonal
      diagonal.diagonal = point
      console.log('split', stringifyPoint(point))
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
  let starting = classify(polygons)
  monotone(sector, floor, scale, starting, triangles)
}

export function sectorTriangulate(sector, scale) {
  floorCeil(sector, true, scale, sector.triangles)
  floorCeil(sector, false, scale, sector.triangles)
}

export function sectorTriangulateForEditor(sector, scale) {
  // sectorTriangulate(sector, scale)
  floorCeil(sector, null, scale, sector.view)
}
