import {Float} from '../math/vector.js'
import {Triangle} from '../map/triangle.js'

const debug = true

const debugFloor = false
const debugCeiling = false
const debugEditor = true

let debugIsForFloor = false
let debugIsForCeiling = false
let debugIsForEditor = false

function doDebug() {
  return debug && ((debugFloor && debugIsForFloor) || (debugCeiling && debugIsForCeiling) || (debugEditor && debugIsForEditor))
}

function stringifyVec(vec) {
  return JSON.stringify(vec, (key, value) => {
    if (key === 'index') return
    else return value
  })
}

class PolygonTriangle {
  constructor(vec) {
    this.index = -1
    this.start = false
    this.merge = false
    this.vec = vec
    this.previous = null
    this.next = null
    this.diagonals = []
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
    if (key === 'next') {
      if (value === null) return null
      else return {index: value.index, point: value.point}
    } else if (key == 'diagonals') {
      if (value === null) return null
      else return []
    } else return value
  })
}

class Start {
  constructor(a, b) {
    this.a = a
    this.b = b
  }
}

function stringifyStart(start) {
  return JSON.stringify(start, (key, value) => {
    if (key === 'a' || key == 'b') return {x: value.vec.x, y: value.vec.y}
    return value
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

function clockwiseInterior(a, b, c) {
  let angle = Math.atan2(b.y - c.y, b.x - c.x) - Math.atan2(b.y - a.y, b.x - a.x)
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
  if (!Float.zero(r3) && !Float.zero(r4) && r3 * r4 >= 0.0) return false
  let a2 = d.y - c.y
  let b2 = c.x - d.x
  let c2 = d.x * c.y - c.x * d.y
  let r1 = a2 * a.x + b2 * a.y + c2
  let r2 = a2 * b.x + b2 * b.y + c2
  if (!Float.zero(r1) && !Float.zero(r2) && r1 * r2 >= 0.0) return false
  let denominator = a1 * b2 - a2 * b1
  if (Float.zero(denominator)) return false
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
  if (floor) triangle = new Triangle(sector.floor, sector.getFloorTexture(), c, b, a, floor, scale)
  else triangle = new Triangle(sector.ceiling, sector.getCeilingTexture(), a, b, c, floor, scale)
  triangles.push(triangle)
}

function adjacent(a, b) {
  return a.next === b || b.next === a
}

function clip(sector, floor, scale, triangles, verts) {
  let size = verts.length
  if (size === 3) {
    if (doDebug()) console.debug('no clip')
    add(sector, floor, scale, triangles, verts[0].vec, verts[1].vec, verts[2].vec)
    return
  }
  if (doDebug()) console.debug('^ start clip')
  for (let i = 0; i < size; i++) {
    let vert = verts[i]
    if (i + 1 == size) vert.next = verts[0]
    else vert.next = verts[i + 1]
    if (doDebug()) console.debug(' ', stringifyVert(vert))
  }
  verts.sort(polygonSort)
  let stack = [verts[0], verts[1]]
  for (let k = 2; k < size; k++) {
    let current = verts[k]
    let pop = stack.pop()
    if (doDebug()) console.debug(`is current := ${stringifyVec(current.vec)} and pop := ${stringifyVec(pop.vec)} adjacent: ${adjacent(current, pop)}`)
    if (adjacent(current, pop)) {
      let peek = stack[stack.length - 1]
      if (doDebug()) console.debug('@ using:', stringifyVec(peek.vec), stringifyVec(pop.vec), stringifyVec(current.vec))
      let a, c
      let b = pop.vec
      if (current.next === pop) {
        if (doDebug()) console.debug('current.next === pop')
        a = current.vec
        c = peek.vec
      } else {
        if (doDebug()) console.debug('pop.next === current')
        a = peek.vec
        c = current.vec
      }
      if (doDebug()) console.debug('is', stringifyVec(a), stringifyVec(b), stringifyVec(c), 'reflex:', clockwiseReflex(a, b, c))
      if (clockwiseReflex(a, b, c)) {
        do {
          add(sector, floor, scale, triangles, a, b, c)
          if (doDebug()) console.debug('add (X)', stringifyVec(a), stringifyVec(b), stringifyVec(c))
          pop = stack.pop()
          if (stack.length === 0) break
          peek = stack[stack.length - 1]
          if (doDebug()) console.debug(`do peek := ${stringifyVec(peek.vec)}, pop := ${stringifyVec(pop.vec)}, current := ${stringifyVec(current.vec)}`)
          b = pop.vec
          if (current.next === pop) {
            if (doDebug()) console.debug('current.next === pop')
            a = current.vec
            c = peek.vec
          } else if (pop.next === current) {
            if (doDebug()) console.debug('pop.next === current')
            a = peek.vec
            c = current.vec
          } else if (current.next === peek) {
            if (doDebug()) console.debug('current.next === peek')
            a = peek.vec
            c = current.vec
          } else if (peek.next === current) {
            if (doDebug()) console.debug('peek.next === current')
            a = current.vec
            c = peek.vec
          } else if (pop.next === peek) {
            if (doDebug()) console.debug('pop.next === peek')
            a = peek.vec
            c = current.vec
          } else if (peek.next === pop) {
            if (doDebug()) console.debug('peek.next === pop')
            a = current.vec
            c = peek.vec
          } else {
            console.error('unknown adjacency case')
            a = peek.vec
            c = current.vec
          }
          if (doDebug()) console.debug('while is', stringifyVec(a), stringifyVec(b), stringifyVec(c), 'reflex:', clockwiseReflex(a, b, c))
        } while (clockwiseReflex(a, b, c))
      }
      stack.push(pop)
    } else {
      const save = pop
      let peek = stack[stack.length - 1]
      while (stack.length > 0) {
        if (clockwiseReflex(peek.vec, pop.vec, current.vec)) {
          add(sector, floor, scale, triangles, peek.vec, pop.vec, current.vec)
          if (doDebug()) console.debug('add (Y) peek, pop, current :=', stringifyVec(peek.vec), stringifyVec(pop.vec), stringifyVec(current.vec))
        } else {
          add(sector, floor, scale, triangles, current.vec, pop.vec, peek.vec)
          if (doDebug()) console.debug('add (Z) current, pop, peek :=', stringifyVec(current.vec), stringifyVec(pop.vec), stringifyVec(peek.vec))
        }
        pop = stack.pop()
        if (stack.length === 0) break
        peek = stack[stack.length - 1]
      }
      stack.push(save)
    }
    stack.push(current)
    if (doDebug()) console.debug(`k := ${k}, len := ${size}, stack :=`)
    for (const vert of stack) {
      if (doDebug()) console.debug(' ', stringifyVec(vert.vec))
    }
  }
}

function monotone(sector, floor, scale, starting, triangles) {
  if (doDebug()) console.debug('monotone')
  let verts = []
  for (const start of starting) {
    if (doDebug()) console.debug('begin monotone polygon starting with', stringifyStart(start))
    let initial = start.a
    let current = start.b
    let previous = initial.vec
    verts.push(new Vertex(previous))
    let protect = 100
    while (true) {
      if (--protect <= 0) throw 'Too many triangulation iterations'
      let vec = current.vec
      let next = current.next
      verts.push(new Vertex(current.vec))
      if (current.diagonals.length > 0) {
        let best = next
        let angle = clockwiseInterior(previous, vec, next.vec)
        if (doDebug()) console.debug('interior (O)', stringifyVec(previous), stringifyVec(vec), stringifyVec(next.vec), angle)
        for (const diagonal of current.diagonals) {
          if (previous === diagonal.vec) continue
          let other = clockwiseInterior(previous, vec, diagonal.vec)
          if (doDebug()) console.debug('interior (D)', stringifyVec(previous), stringifyVec(vec), stringifyVec(diagonal.vec), other)
          if (other < angle) {
            best = diagonal
            angle = other
          }
        }
        current = best
      } else {
        if (doDebug()) console.debug('next (N)')
        current = next
      }
      if (current === initial) break
      previous = vec
    }
    clip(sector, floor, scale, triangles, verts)
    if (doDebug()) console.debug('end monotone')
    verts.length = 0
  }
}

function classify(points) {
  if (doDebug()) console.debug('classify')
  let monotone = []
  let merge = []
  let split = []
  for (const current of points) {
    let vec = current.vec
    let previous = current.previous.vec
    let next = current.next.vec
    let reflex = clockwiseReflex(previous, vec, next)
    if (reflex) {
      let above = previous.y < vec.y && next.y <= vec.y
      if (doDebug()) console.debug(' ', stringifyPoint(current), 'reflex', reflex, 'above', above)
      if (above) {
        current.start = true
        monotone.push(new Start(current, current.next))
      }
    } else {
      let above = previous.y <= vec.y && next.y < vec.y
      let below = previous.y >= vec.y && next.y > vec.y
      if (doDebug()) console.debug(' ', stringifyPoint(current), 'reflex', reflex, 'above', above, 'below', below)
      if (above) {
        split.push(current)
      } else if (below) {
        merge.push(current)
      }
    }
  }
  for (const mono of monotone) if (doDebug()) console.debug('start', stringifyStart(mono))
  for (const point of merge) {
    let vec = point.vec
    for (let k = point.index + 1; k < points.length; k++) {
      let diagonal = points[k]
      if (!safeDiagonal(points, vec, diagonal.vec)) continue
      point.merge = true
      point.diagonals.push(diagonal)
      diagonal.diagonals.push(point)
      if (doDebug()) console.debug('merge', stringifyVec(point.vec), 'with', stringifyVec(diagonal.vec))
      break
    }
  }
  for (const point of split) {
    let vec = point.vec
    for (let k = point.index - 1; k >= 0; k--) {
      let diagonal = points[k]
      if (!safeDiagonal(points, vec, diagonal.vec)) continue
      if (diagonal.merge) break
      point.diagonals.push(diagonal)
      diagonal.diagonals.push(point)
      if (doDebug()) console.debug('split', stringifyVec(point.vec), 'with', stringifyVec(diagonal.vec))
      if (diagonal.start) {
        monotone.push(new Start(diagonal, point))
      } else {
        if (diagonal.vec.x > vec.x) monotone.push(new Start(point, diagonal))
        else monotone.push(new Start(diagonal, point))
      }
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
      if (debug) console.warn('Double previous reference')
    }
    if (original.next === null) {
      original.next = next
    } else {
      let point = original.vec
      let angle = original.next.vec.angle(point)
      if (next.vec.angle(point) < angle) {
        original.next = next
      }
      if (debug) console.warn('Double next reference')
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
    if (skip(inner, floor)) continue // this should be removed? there's overdrawing
    populateVectors(inner, polygons)
  }
  for (let inner of sector.inside) {
    if (skip(inner, floor)) continue // this should be removed? there's overdrawing
    populateReferences(inner, polygons, false)
  }
  populateVectors(sector, polygons)
  populateReferences(sector, polygons, true)
  for (let i = 0; i < polygons.length; i++) polygons[i].index = i
  return polygons
}

function floorCeil(sector, floor, scale, triangles) {
  if (skip(sector, floor)) return
  let polygons = populate(sector, floor)
  let starting = classify(polygons)
  monotone(sector, floor, scale, starting, triangles)
}

export function sectorTriangulate(sector, scale) {
  debugIsForFloor = true
  floorCeil(sector, true, scale, sector.triangles)
  debugIsForFloor = false
  debugIsForCeiling = true
  floorCeil(sector, false, scale, sector.triangles)
  debugIsForCeiling = false
}

export function sectorTriangulateForEditor(sector, scale) {
  if (doDebug()) console.debug('^ start compute triangles for sector -----------------------------------------')
  sectorTriangulate(sector, scale)
  debugIsForEditor = true
  floorCeil(sector, null, scale, sector.view)
  debugIsForEditor = false
}
