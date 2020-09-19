class Wall {
  constructor(a, b, texture) {
    this.a = a
    this.b = b
    this.normal = a.normal(b)
    this.texture = texture
    this.floor = 0.0
    this.ceiling = 0.0
    this.uv = [0.0, 0.0, 0.0, 0.0]
  }
  update(floor, ceiling, uv) {
    this.floor = floor
    this.ceiling = ceiling
    this.uv = uv
  }
}
