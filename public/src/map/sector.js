class Sector {
  constructor(bottom, floor, ceiling, top, floor_texture, ceiling_texture, vecs, lines) {
    this.bottom = bottom
    this.floor = floor
    this.ceiling = ceiling
    this.top = top
    this.floor_texture = floor_texture
    this.ceiling_texture = ceiling_texture
    this.vecs = vecs
    this.lines = lines
    this.triangles = []
    this.inside = []
    this.outside = null
  }
  hasFloor() {
    return this.floor_texture >= 0
  }
  hasCeiling() {
    return this.ceiling_texture >= 0
  }
  updateTriangles(triangles) {
    this.triangles = triangles
  }
}
