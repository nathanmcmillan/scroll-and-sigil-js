export class Sector {
  constructor(bottom, floor, ceiling, top, floorTexture, ceilingTexture, vecs, lines) {
    this.bottom = bottom
    this.floor = floor
    this.ceiling = ceiling
    this.top = top
    this.floorTexture = floorTexture
    this.ceilingTexture = ceilingTexture
    this.vecs = vecs
    this.lines = lines
    this.triangles = []
    this.inside = []
    this.outside = null
  }

  hasFloor() {
    return this.floorTexture >= 0
  }

  hasCeiling() {
    return this.ceilingTexture >= 0
  }

  contains(x, z) {
    let odd = false
    let len = this.vecs.length
    let k = len - 1
    for (let i = 0; i < len; i++) {
      let a = this.vecs[i]
      let b = this.vecs[k]
      if (a.y > z != b.y > z) {
        let val = ((b.x - a.x) * (z - a.y)) / (b.y - a.y) + a.x
        if (x < val) {
          odd = !odd
        }
      }
      k = i
    }
    return odd
  }

  find(x, z) {
    let i = this.inside.length
    while (i--) {
      let inside = this.inside[i]
      if (inside.contains(x, z)) {
        return inside.find(x, z)
      }
    }
    return this
  }

  otherIsInside(sector) {
    // for debugging
    for (const inside of this.inside) {
      if (inside === sector) return true
      if (inside.otherIsInside(sector)) return true
    }
  }
}

function deleteNestedInside(set, inside) {
  for (const nested of inside.inside) {
    set.add(nested)
    deleteNestedInside(nested)
  }
}

export function sectorUpdateLines(sector, scale) {
  if (sector.lines.length === 0) return
  let plus, minus
  if (sector.outside) {
    plus = sector
    minus = sector.outside
  } else {
    plus = null
    minus = sector
  }
  let bottom = sector.bottom
  let floor = sector.floor
  let ceil = sector.ceiling
  let top = sector.top
  let uv = 0.0
  for (const line of sector.lines) {
    if (line.plus !== null && line.minus !== null) console.error('Line already linked to sectors')
    line.updateSectors(plus, minus)
    let x = line.a.x - line.b.x
    let y = line.a.y - line.b.y
    let st = uv + Math.sqrt(x * x + y * y) * scale
    if (line.top) line.top.update(ceil, top, uv, ceil * scale, st, top * scale)
    if (line.middle) line.middle.update(floor, ceil, uv, floor * scale, st, ceil * scale)
    if (line.bottom) line.bottom.update(bottom, floor, uv, bottom * scale, st, floor * scale)
    uv = st
  }
}

export function sectorInsideOutside(sectors) {
  for (const sector of sectors) {
    for (const other of sectors) {
      if (sector === other) {
        continue
      }
      let inside = 0
      let outside = 0
      for (const o of other.vecs) {
        let shared = false
        for (const s of sector.vecs) {
          if (s.eq(o)) {
            shared = true
            break
          }
        }
        if (shared) continue
        if (sector.contains(o.x, o.y)) inside++
        else outside++
      }
      if (outside === 0 && inside > 0) sector.inside.push(other)
    }
  }
  for (const sector of sectors) {
    let dead = new Set()
    for (const inside of sector.inside) {
      deleteNestedInside(dead, inside)
    }
    for (const other of dead) {
      let index = sector.inside.indexOf(other)
      if (index >= 0) sector.inside.splice(index, 1)
    }
    for (const inside of sector.inside) inside.outside = sector
  }
}
