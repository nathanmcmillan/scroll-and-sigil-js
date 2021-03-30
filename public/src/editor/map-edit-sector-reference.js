import { textureIndexForName } from '../assets/assets.js'
import { triggerExport } from '../world/trigger.js'

let REF_SECTOR_UID = 0

export class SectorReference {
  constructor(bottom, floor, ceiling, top, floorTexture, ceilingTexture, flags, trigger, vecs, lines) {
    this.uid = REF_SECTOR_UID++
    this.bottom = bottom
    this.floor = floor
    this.ceiling = ceiling
    this.top = top
    this.floorTexture = floorTexture
    this.ceilingTexture = ceilingTexture
    this.flags = flags
    this.trigger = trigger
    this.vecs = vecs
    this.lines = lines
    this.triangles = []
    this.inside = []
    this.outside = null
    this.neighbors = []
    this.view = []
    this.liquid = this.flags && (this.flags.includes('lava') || this.flags.includes('water'))
    this.special = this.liquid ? 1 : 0
  }

  copy(dest) {
    dest.uid = this.uid
    dest.bottom = this.bottom
    dest.floor = this.floor
    dest.ceiling = this.ceiling
    dest.top = this.top
    dest.floorTexture = this.floorTexture
    dest.ceilingTexture = this.ceilingTexture
    dest.flags = this.flags
    dest.trigger = this.trigger
    dest.liquid = this.liquid
    dest.special = this.special
  }

  floorRenderHeight() {
    if (this.liquid) return this.floor + this.special
    return this.floor
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
    const len = this.vecs.length
    let k = len - 1
    for (let i = 0; i < len; i++) {
      const a = this.vecs[i]
      const b = this.vecs[k]
      if (a.y > z !== b.y > z) {
        const val = ((b.x - a.x) * (z - a.y)) / (b.y - a.y) + a.x
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
      const inside = this.inside[i]
      if (inside.contains(x, z)) {
        return inside.find(x, z)
      }
    }
    return this
  }

  otherIsInside(sector) {
    for (let i = 0; i < this.inside.length; i++) {
      const inside = this.inside[i]
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
    if (this.flags) content += ` flags ${this.flags.join(' ')} end`
    if (this.trigger) content += ` trigger ${triggerExport(this.trigger)} end`
    return content
  }
}
