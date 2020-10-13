import {textureNameFromIndex} from '/src/assets/assets.js'

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

  export() {
    let content = `${this.bottom} ${this.floor} ${this.ceiling} ${this.top}`
    content += ` ${this.hasFloor() ? textureNameFromIndex(this.floor_texture) : 'none'}`
    content += ` ${this.hasCeiling() ? textureNameFromIndex(this.ceiling_texture) : 'none'}`
    content += ` ${this.vecs.length}`
    for (const vec of this.vecs) {
      content += ` ${vec.index}`
    }
    content += ` ${this.lines.length}`
    for (const line of this.lines) {
      content += ` ${line.index}`
    }
    return content
  }
}

export function sectorInsideOutside(sectors) {
  for (const sector of sectors) {
    for (const other of sectors) {
      if (sector === other) {
        continue
      }
      let contains = true
      for (const o of other.vecs) {
        for (const s of sector.vecs) {
          if (s.eq(o)) {
            contains = false
            break
          }
        }
        if (!contains) {
          break
        }
        if (!sector.contains(o.x, o.y)) {
          contains = false
          break
        }
      }
      if (contains) {
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
