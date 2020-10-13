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

  export() {
    return `${this.x} ${this.y}`
  }

  static copy(vec) {
    return new VectorReference(vec.x, vec.y)
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

  static copy(thing) {
    return new ThingReference(thing.entity, thing.x, thing.z)
  }
}
