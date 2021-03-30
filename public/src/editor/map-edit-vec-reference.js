import { floatEq } from '../math/vector.js'

export class VectorReference {
  constructor(x, y) {
    this.x = x
    this.y = y
    this.index = 0
  }

  eq(b) {
    return floatEq(this.x, b.x) && floatEq(this.y, b.y)
  }

  normal(b) {
    const x = this.y - b.y
    const y = -(this.x - b.x)
    const magnitude = Math.sqrt(x * x + y * y)
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
