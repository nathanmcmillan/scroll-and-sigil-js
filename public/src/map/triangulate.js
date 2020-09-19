class PolygonTriangle {
  constructor(point) {
    this.merge = false
    this.perimeter = false
    this.point = point
    this.previous = []
    this.next = []
  }
}

class Triangulate {
  static polygonRemove(polygons, point) {
    for (let i = 0; i < polygons.length; i++) {
      if (point.eq(polygons[i].point)) {
        polygons.splice(i, 1)
        return
      }
    }
  }
  static clip(sector, floor, scale, triangles, vecs) {
    let i = 0
    while (vecs.length > 3) {
      let plus = i == size - 1 ? 0 : i + 1
      let minus = i == 0 ? size - 1 : i - 1
      let next = vecs[plus]
      let previous = vecs[minus]
      let current = vecs[i]
      if (Triangulate.validTriangle(vecs, previous, current, next)) {
        let triangle = null
        if (floor) {
          triangle = new Triangle(sector.floor, sector.floor_texture, previous, current, next, floor, scale)
        } else {
          triangle = new Triangle(sector.ceiling, sector.ceiling_texture, next, current, previous, floor, scale)
        }
        triangles.push(triangle)
        vecs.splice(i, 1)
      } else {
        i++
      }
      if (i == vecs.length) i = 0
    }
    let triangle = null
    if (floor) {
      triangle = new Triangle(sector.floor, sector.floor_texture, vecs[0], vecs[1], vecs[2], floor, scale)
    } else {
      triangle = new Triangle(sector.ceiling, sector.ceiling_texture, vecs[2], vecs[1], vecs[0], floor, scale)
    }
    triangles.push(triangle)
  }
  static clipAll(sector, floor, scale, monotone, triangles) {
    let vecs = []
    for (let start of monotone) {
      let next = start.next[0]
      let current = start
      while (true) {
        let a = next.point
        let b = current.point
        vecs.push(b)
        let angle = Number.MAX_VALUE
        let previous = null
        for (let previous of current.previous) {
          let c = previous.point
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
            previous = previous
            angle = interior
          }
        }
        Triangulate.polygonRemove(current.next, a)
        Triangulate.polygonRemove(current.previous, previous.point)
        if (previous == start) {
          break
        }
        next = current
        current = previous
      }
      Triangulate.clip(sector, floor, scale, triangles, vecs)
      vecs.clear()
    }
  }
  static classify(polygons, monotone) {
    let merge = []
    let split = []
    for (let polygon of polygons) {
    }
  }
  static cullVectors(polygons) {
    let cull = []
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
          polygon.next.splice(1, 1)
        }
        while (polygon.previous.length != 1) {
          polygon.previous.splice(1, 1)
        }
        current = current.next[0]
        if (current == start) {
          break
        }
      }
      while (pending.size > 0) {
        for (let polygon of pending) {
          dead.add(pending)
          for (let next of polygon.next) {
            if (!next.perimeter) {
              if (!pending.has(next) && !dead.has(next)) {
                holding.add(next)
              }
            }
          }
        }
        pending.clear()
        for (let polygon in holding) pending.add(polygon)
        holding.clear()
      }
      for (let polygon of dead) {
        remaining.filter((poly) => poly != polygon)
        cull.push(polygon)
      }
      dead.clear()
      holding.clear()
      pending.clear()
    }
    for (let polygon of cull) {
      polygons.filter((poly) => poly != polygon)
    }
  }
  static polygonFind(polygons, point) {
    for (let polygon of polygons) {
      if (point.eq(polygon.point)) {
        return polygon
      }
    }
    return null
  }
  static populateReferences(sector, polygons, clockwise) {
    const len = sector.vecs.length
    for (let i = 0; i < len; i++) {
      let p = i == 0 ? len - 1 : i - 1
      let n = i == len - 1 ? 0 : i + 1
      if (!clockwise) {
        let t = p
        p = n
        n = t
      }
      let next = Triangulate.polygonFind(polygons, sector.vecs[n])
      let previous = Triangulate.polygonFind(polygons, sector.vecs[p])
      let original = Triangulate.polygonFind(polygons, sector.vecs[i])
      if (original.previous.length == 0) {
        original.previous.push(previous)
      } else {
        let point = original.point
        let existing = original.previous[0].point
        if (previous.point.angle(point) < existing.point(point)) {
          original.previous.splice(previous, 0, 1)
        }
      }
      if (original.next.length == 0) {
        original.next.push(next)
      } else {
        let point = original.point
        let existing = original.next[0].point
        if (next.point.angle(point) < existing.point(point)) {
          original.next.splice(next, 0, 1)
        }
      }
    }
  }
  static polygonInsert(polygons, point) {
    let polygon = new PolygonTriangle(point)
    for (let i = 0; i < polygons.length; i++) {
      let e = polygons[i].point
      if (point.y < e.y || (Float.eq(point.y, e.y) && point.x > e.x)) {
        polygons.splice(i, 0, polygon)
        return
      }
    }
    polygons.push(polygon)
  }

  static populateVectors(sector, polygons) {
    for (let point of sector.vecs) {
      console.log(point)
      let exists = false
      for (let polygon of polygons) {
        if (point.eq(polygon.point)) {
          exists = true
          break
        }
      }
      if (!exists) {
        Triangulate.polygonInsert(polygons, point)
      }
    }
  }
  static skip(sector, floor) {
    if (floor) {
      return !sector.hasFloor()
    }
    return !sector.hasCeiling()
  }
  static populate(sector, floor, polygons) {
    for (let inner of sector.inside) {
      if (Triangulate.skip(inner, floor)) {
        continue
      }
      Triangulate.populateVectors(inner, polygons)
    }
    for (let inner of sector.inside) {
      if (Triangulate.skip(inner, floor)) {
        continue
      }
      Triangulate.populateReferences(inner, polygons, false)
    }
    Triangulate.cullVectors(polygons)
    Triangulate.populateVectors(sector, polygons)
    Triangulate.populateReferences(sector, polygons, true)
  }
  static surface(sector, floor, scale, triangles) {
    if (Triangulate.skip(sector, floor)) {
      return
    }
    let polygons = []
    Triangulate.populate(sector, floor, polygons)
    let monotone = []
    Triangulate.classify(polygons, monotone)
    Triangulate.clipAll(sector, floor, scale, monotone, triangles)
  }
  static build(sector, scale) {
    let triangles = []
    Triangulate.surface(sector, true, scale, triangles)
    Triangulate.surface(sector, true, scale, triangles)
    sector.updateTriangles(triangles)
    console.log(sector)
  }
}
