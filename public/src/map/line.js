import {Wall} from '/src/map/wall.js'

export class Line {
  constructor(top, middle, bottom, a, b) {
    this.plus = null
    this.minus = null
    this.a = a
    this.b = b
    this.normal = a.normal(b)
    this.top = top >= 0 ? new Wall(a, b, top) : null
    this.middle = middle >= 0 ? new Wall(a, b, middle) : null
    this.bottom = bottom >= 0 ? new Wall(a, b, bottom) : null
  }

  updateSectors(plus, minus) {
    this.plus = plus
    this.minus = minus
  }
}
