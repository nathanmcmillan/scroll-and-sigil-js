const FLOAT_PRECISION = 0.00000001

export class Float {
  static eq(x, y) {
    return Math.abs(x - y) < FLOAT_PRECISION
  }

  static zero(x) {
    return Math.abs(x) < FLOAT_PRECISION
  }
}

export class Vector2 {
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
    let magnitude = Math.sqrt(x * x + y * y)
    return new Vector2(x / magnitude, y / magnitude)
  }

  angle(b) {
    let angle = Math.atan2(this.y - b.y, this.x - b.x)
    if (angle < 0.0) {
      angle += 2.0 * Math.PI
    }
    return angle
  }
}

export class Vector3 {
  constructor(x, y, z) {
    this.x = x
    this.y = y
    this.z = z
  }

  eq(b) {
    return Float.eq(this.x, b.x) && Float.eq(this.y, b.y) && Float.eq(this.z, b.z)
  }

  normalize() {
    let magnitude = (this.x * this.x + this.y * this.y + this.z * this.z).sqrt()
    let multiple = 1.0 / magnitude
    this.x *= multiple
    this.y *= multiple
    this.z *= multiple
  }

  cross(b) {
    return new Vector3(this.y * b.z - this.z * b.y, this.z * b.x - this.x * b.z, this.x * b.y - this.y * b.x)
  }
}
