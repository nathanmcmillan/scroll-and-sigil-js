import {textureNameFromIndex, textureIndexForName} from '/src/assets/assets.js'
import {animationMap} from '/src/entity/entity.js'
import {Float} from '/src/math/vector.js'

export class VectorReference {
  constructor(x, y) {
    this.x = x
    this.y = y
    this.index = 0
  }

  eq(b) {
    return Float.eq(this.x, b.x) && Float.eq(this.y, b.y)
  }

  normal(b) {
    let x = this.y - b.y
    let y = -(this.x - b.x)
    let magnitude = Math.sqrt(x * x + y * y)
    return new VectorReference(x / magnitude, y / magnitude)
  }

  angle(b) {
    let angle = Math.atan2(this.y - b.y, this.x - b.x)
    if (angle < 0.0) angle += 2.0 * Math.PI
    return angle
  }

  export() {
    return `${this.x} ${this.y}`
  }
}

export class LineReference {
  constructor(top, middle, bottom, a, b) {
    this.a = a
    this.b = b
    this.top = top >= 0 ? new WallReference(this, top) : null
    this.middle = middle >= 0 ? new WallReference(this, middle) : null
    this.bottom = bottom >= 0 ? new WallReference(this, bottom) : null
    this.index = 0
    this.done = false
  }

  has(vec) {
    return this.a === vec || this.b === vec
  }

  other(vec) {
    if (this.a === vec) return this.b
    if (this.b === vec) return this.a
    return null
  }

  export() {
    let content = `${this.a.index} ${this.b.index}`
    content += ` ${this.top ? textureNameFromIndex(this.top.texture) : 'none'}`
    content += ` ${this.middle ? textureNameFromIndex(this.middle.texture) : 'none'}`
    content += ` ${this.bottom ? textureNameFromIndex(this.bottom.texture) : 'none'}`
    return content
  }

  static copy(line) {
    let top = line.top ? line.top.texture : -1
    let middle = line.middle ? line.middle.texture : -1
    let bottom = line.bottom ? line.bottom.texture : -1
    let copy = new LineReference(top, middle, bottom, line.a, line.b)
    if (line.top) WallReference.transfer(line.top, copy.top)
    if (line.middle) WallReference.transfer(line.middle, copy.middle)
    if (line.bottom) WallReference.transfer(line.bottom, copy.bottom)
    return copy
  }
}

export class WallReference {
  constructor(line, texture) {
    this.line = line
    this.texture = texture
    this.floor = 0.0
    this.ceiling = 0.0
    this.u = 0.0
    this.v = 0.0
    this.s = 0.0
    this.t = 0.0
  }

  update(floor, ceiling, u, v, s, t) {
    this.floor = floor
    this.ceiling = ceiling
    this.u = u
    this.v = v
    this.s = s
    this.t = t
  }

  static transfer(src, dest) {
    dest.floor = src.floor
    dest.ceiling = src.ceiling
    dest.u = src.u
    dest.v = src.v
    dest.s = src.s
    dest.t = src.t
  }
}

export class SectorReference {
  constructor(bottom, floor, ceiling, top, floorTexture, ceilingTexture, vecs, lines) {
    this.bottom = bottom
    this.floor = floor
    this.ceiling = ceiling
    this.top = top
    this.floor_texture = floorTexture
    this.ceiling_texture = ceilingTexture
    this.vecs = vecs
    this.lines = lines
    this.triangles = []
    this.inside = []
    this.outside = null
    this.view = []
    this.index = 0
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

export class ThingReference {
  constructor(entity, x, z) {
    this.x = x
    this.y = 0.0
    this.z = z
    this.box = parseFloat(entity.get('box'))
    this.height = parseFloat(entity.get('height'))
    this.texture = textureIndexForName(entity.get('sprite'))
    this.animations = animationMap(entity)
    if (Array.isArray(this.animations)) {
      this.sprite = this.animations[0]
    } else if (this.animations instanceof Map) {
      this.animation = this.animations.values().next().value
      this.sprite = this.animation[0]
    } else {
      this.sprite = this.animations
    }
    this.entity = entity
  }

  export() {
    return `${this.x} ${this.z} ${this.entity.get('name')}`
  }
}
