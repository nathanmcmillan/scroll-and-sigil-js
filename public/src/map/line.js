import { Wall } from '../map/wall.js'

export class Line {
  constructor(top, middle, bottom, a, b, flags, trigger) {
    this.plus = null
    this.minus = null
    this.a = a
    this.b = b
    this.flags = flags
    this.trigger = trigger
    this.normal = this.a.normal(this.b)
    this.top = top >= 0 ? new Wall(top) : null
    this.middle = middle >= 0 ? new Wall(middle) : null
    this.bottom = bottom >= 0 ? new Wall(bottom) : null
    this.physical = this.middle !== null
  }

  updateSectorsForLine(scale) {
    const plus = this.plus
    const minus = this.minus
    const a = this.a
    const b = this.b
    const x = a.x - b.x
    const y = a.y - b.y
    const uv = 0.0
    const st = uv + Math.sqrt(x * x + y * y) * scale

    if (this.top) {
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
      if (ceiling >= top) console.error(`Invalid top wall: ceiling := ${ceiling}, top := ${top}`)
      this.top.update(ceiling, top, uv, ceiling * scale, st, top * scale, a, b)
    }

    if (this.middle) {
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
      if (floor >= ceiling) console.error(`Invalid middle wall: floor := ${floor}, ceiling := ${ceiling}`)
      this.middle.update(floor, ceiling, uv, floor * scale, st, ceiling * scale, a, b)
    }

    if (this.bottom) {
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
        }
      }
      if (bottom >= floor) console.error(`Invalid bottom wall: bottom := ${bottom}, floor := ${floor}`)
      this.bottom.update(bottom, floor, uv, bottom * scale, st, floor * scale, a, b)
    }
  }
}
