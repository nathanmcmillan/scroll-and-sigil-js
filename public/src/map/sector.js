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
