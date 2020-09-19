const FLOAT_PRECISION = 0.00000001

class Float {
  static eq(x, y) {
    return Math.abs(x - y) < FLOAT_PRECISION
  }

  static zero(x) {
    return Math.abs(x) < FLOAT_PRECISION
  }
}

class Vector2 {
  constructor(x, y) {
    this.x = x
    this.y = y
  }

  eq(b) {
    return Float.eq(this.x, b.x) && Float.eq(this.y, b.y)
  }

  normal(b) {
    let x = this.y - b.y
    let y = -(this.x - b.x)
    let m = Math.sqrt(x * x + y * y)
    return new Vector2(x / m, y / m)
  }

  angle(b) {
    let angle = Math.atan2(this.y - b.y, this.x - b.x)
    if (angle < 0.0) {
      angle += 2.0 * Math.PI
    }
    return angle
  }
}

export {Float, Vector2}
