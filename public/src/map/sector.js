class Sector {
  constructor() {
    this.bottom = 0.0
    this.floor = 0.0
    this.ceiling = 0.0
    this.top = 0.0
    this.floor_texture = -1
    this.ceiling_texture = -1
    this.vecs = []
    this.lines = []
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
