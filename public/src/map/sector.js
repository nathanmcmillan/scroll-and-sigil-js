export class Sector {
  constructor(bottom, floor, ceiling, top, floor_texture, ceiling_texture, vecs, lines) {
    this.bottom = bottom
    this.floor = floor
    this.ceiling = ceiling
    this.top = top
    this.floor_texture = floor_texture
    this.ceiling_texture = ceiling_texture
    this.vecs = vecs
    this.lines = lines
    this.triangles = []
    this.inside = []
    this.outside = null
  }

  hasFloor() {
    return this.floor_texture >= 0
  }

  hasCeiling() {
    return this.ceiling_texture >= 0
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
        if (shared) {
          continue
        }
        if (sector.contains(o.x, o.y)) {
          inside++
        } else {
          outside++
        }
      }
      if (outside === 0 && inside > 0) {
        sector.inside.push(other)
      }
    }
  }
  for (const sector of sectors) {
    let dead = new Set()
    for (const inside of sector.inside) {
      for (const nested of inside.inside) {
        dead.add(nested)
      }
    }
    for (const other of dead) {
      sector.inside.splice(sector.inside.indexOf(other), 1)
    }
    for (const inside of sector.inside) {
      inside.outside = sector
    }
  }
}
