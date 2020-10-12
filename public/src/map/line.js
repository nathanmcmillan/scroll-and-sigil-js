import {Wall, ReferenceWall} from '/src/map/wall.js'

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

export class ReferenceLine {
  constructor(top, middle, bottom, a, b) {
    this.plus = null
    this.minus = null
    this.a = a
    this.b = b
    this.top = top >= 0 ? new ReferenceWall(this, top) : null
    this.middle = middle >= 0 ? new ReferenceWall(this, middle) : null
    this.bottom = bottom >= 0 ? new ReferenceWall(this, bottom) : null
  }

  updateSectors(plus, minus) {
    this.plus = plus
    this.minus = minus
  }

  static copy(line) {
    let top = line.top ? line.top.texture : -1
    let middle = line.middle ? line.middle.texture : -1
    let bottom = line.bottom ? line.bottom.texture : -1
    let copy = new ReferenceLine(top, middle, bottom, line.a, line.b)
    if (line.top) ReferenceWall.transfer(line.top, copy.top)
    if (line.middle) ReferenceWall.transfer(line.middle, copy.middle)
    if (line.bottom) ReferenceWall.transfer(line.bottom, copy.bottom)
    return copy
  }
}
