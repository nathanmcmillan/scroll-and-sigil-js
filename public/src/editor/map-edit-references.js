import {textureIndexForName} from '../assets/assets.js'
import {Float} from '../math/vector.js'

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
    return `${this.x.toFixed(4)} ${this.y.toFixed(4)}`
  }
}

export class LineReference {
  constructor(bottom, middle, top, a, b, type, trigger) {
    this.plus = null
    this.minus = null
    this.a = a
    this.b = b
    this.type = type
    this.trigger = trigger
    this.bottom = new WallReference(this, bottom)
    this.middle = new WallReference(this, middle)
    this.top = new WallReference(this, top)
    this.index = 0
  }

  updateSectors(plus, minus, scale) {
    this.plus = plus
    this.minus = minus

    let x = this.a.x - this.b.x
    let y = this.a.y - this.b.y
    let uv = 0.0
    let st = uv + Math.sqrt(x * x + y * y) * scale

    if (this.top.use()) {
      let flip = false
      let a = this.a
      let b = this.b
      let ceiling = null
      let top = null
      if (plus) {
        ceiling = plus.ceiling
        top = plus.top
      }
      if (minus) {
        if (ceiling === null) {
          ceiling = minus.ceiling
          top = minus.top
        } else if (ceiling < minus.ceiling) {
          ceiling = minus.ceiling
          top = minus.top
        }
      }
      if (ceiling >= top) console.warn(`invalid top wall: ceiling := ${ceiling}, top := ${top}`)
      if (flip) {
        let temp = a
        a = b
        b = temp
      }
      this.top.update(ceiling, top, uv, ceiling * scale, st, top * scale, a, b)
    }

    if (this.middle.use()) {
      let flip = false
      let a = this.a
      let b = this.b
      let floor = null
      let ceiling = null
      if (plus) {
        floor = plus.floor
        ceiling = plus.ceiling
      }
      if (minus) {
        if (floor === null) {
          floor = minus.floor
          ceiling = minus.ceiling
        } else if (floor < minus.floor) {
          floor = minus.floor
          ceiling = minus.ceiling
        }
      }
      if (floor >= ceiling) console.warn(`invalid middle wall: floor := ${floor}, ceiling := ${ceiling}`)
      if (flip) {
        let temp = a
        a = b
        b = temp
      }
      this.middle.update(floor, ceiling, uv, floor * scale, st, ceiling * scale, a, b)
    }

    if (this.bottom.use()) {
      let flip = false
      let a = this.a
      let b = this.b
      let bottom = null
      let floor = null
      if (plus) {
        bottom = plus.bottom
        floor = plus.floor
      }
      if (minus) {
        if (bottom === null) {
          bottom = minus.bottom
          floor = minus.floor
        } else {
          if (minus.floor > floor) floor = minus.floor
          if (minus.bottom < bottom) bottom = minus.bottom
          flip = true
        }
      }
      if (bottom >= floor) console.warn(`invalid bottom wall: bottom := ${bottom}, floor := ${floor}`)
      if (flip) {
        let temp = a
        a = b
        b = temp
      }
      this.bottom.update(bottom, floor, uv, bottom * scale, st, floor * scale, a, b)
    }
  }

  has(vec) {
    return this.a === vec || this.b === vec
  }

  other(vec) {
    if (this.a === vec) return this.b
    if (this.b === vec) return this.a
    return null
  }

  topTextureName() {
    return this.top.textureName()
  }

  middleTextureName() {
    return this.middle.textureName()
  }

  bottomTextureName() {
    return this.bottom.textureName()
  }

  topOffset() {
    return this.top.offset
  }

  middleOffset() {
    return this.middle.offset
  }

  bottomOffset() {
    return this.bottom.offset
  }

  export() {
    let content = `${this.a.index} ${this.b.index}`
    content += ` ${this.topTextureName()}`
    content += ` ${this.middleTextureName()}`
    content += ` ${this.bottomTextureName()}`
    content += ` ${this.topOffset()}`
    content += ` ${this.middleOffset()}`
    content += ` ${this.bottomOffset()}`
    if (this.type) content += ` ${this.type}`
    if (this.trigger) content += ` ${this.trigger.export()}`
    return content
  }

  static copy(line) {
    let top = line.top ? line.top.texture : -1
    let middle = line.middle ? line.middle.texture : -1
    let bottom = line.bottom ? line.bottom.texture : -1
    let copy = new LineReference(bottom, middle, top, line.a, line.b, line.type, line.trigger)
    WallReference.transfer(line.bottom, copy.bottom)
    WallReference.transfer(line.middle, copy.middle)
    WallReference.transfer(line.top, copy.top)
    return copy
  }
}

export class WallReference {
  constructor(line, texture) {
    this.line = line
    this.a = null
    this.b = null
    this.normal = null
    this.texture = texture
    this.offset = 0
    this.floor = 0.0
    this.ceiling = 0.0
    this.u = 0.0
    this.v = 0.0
    this.s = 0.0
    this.t = 0.0
  }

  valid() {
    return this.a && this.b && this.texture
  }

  use() {
    return this.texture
  }

  update(floor, ceiling, u, v, s, t, a, b) {
    this.floor = floor
    this.ceiling = ceiling
    this.u = u
    this.v = v
    this.s = s
    this.t = t
    this.a = a
    this.b = b
    this.normal = a.normal(b)
  }

  textureName() {
    return this.use() ? this.texture : 'none'
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
  constructor(bottom, floor, ceiling, top, floorTexture, ceilingTexture, type, trigger, vecs, lines) {
    this.bottom = bottom
    this.floor = floor
    this.ceiling = ceiling
    this.top = top
    this.floorTexture = floorTexture
    this.ceilingTexture = ceilingTexture
    this.type = type
    this.trigger = trigger
    this.vecs = vecs
    this.lines = lines
    this.triangles = []
    this.inside = []
    this.outside = null
    this.neighbors = []
    this.view = []
  }

  hasFloor() {
    return this.floorTexture
  }

  hasCeiling() {
    return this.ceilingTexture
  }

  getFloorTexture() {
    return textureIndexForName(this.floorTexture)
  }

  getCeilingTexture() {
    return textureIndexForName(this.ceilingTexture)
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
    for (const inside of this.inside) {
      if (inside === sector) return true
      if (inside.otherIsInside(sector)) return true
    }
  }

  floorTextureName() {
    return this.hasFloor() ? this.floorTexture : 'none'
  }

  ceilingTextureName() {
    return this.hasCeiling() ? this.ceilingTexture : 'none'
  }

  refreshFloorTexture() {
    for (const triangle of this.triangles) {
      if (triangle.normal > 0.0) triangle.texture = this.getFloorTexture()
    }
  }

  refreshCeilingTexture() {
    for (const triangle of this.triangles) {
      if (triangle.normal < 0.0) triangle.texture = this.getCeilingTexture()
    }
  }

  export() {
    let content = `${this.bottom} ${this.floor} ${this.ceiling} ${this.top}`
    content += ` ${this.floorTextureName()}`
    content += ` ${this.ceilingTextureName()}`
    content += ` ${this.vecs.length}`
    for (const vec of this.vecs) content += ` ${vec.index}`
    content += ` ${this.lines.length}`
    for (const line of this.lines) content += ` ${line.index}`
    if (this.type) content += ` ${this.type}`
    if (this.trigger) content += ` ${this.trigger.export()}`
    return content
  }
}

export class ThingReference {
  constructor(entity, x, z) {
    this.x = x
    this.y = 0.0
    this.z = z
    this.entity = null
    this.setEntity(entity)
  }

  setEntity(entity) {
    this.box = entity.box()
    this.height = entity.height()
    this.texture = textureIndexForName(entity.get('sprite'))
    this.animations = entity.animations()
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
    return `${this.x} ${this.z} ${this.entity.get('_wad')}`
  }
}
