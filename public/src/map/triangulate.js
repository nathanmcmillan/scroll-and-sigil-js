class Triangulate {
  static skip(sector, floor) {
    if (floor) {
      return !sector.hasFloor()
    }
    return !sector.hasCeiling()
  }
  static populate(sector, floor, polygons) {}
  static surface(sector, floor, scale, triangles) {
    if (Triangulate.skip(sector, floor)) {
      return
    }
    let polygons = []
    Triangulate.populate(sector, floor, polygons)
  }
  static build(sector, scale) {
    let triangles = []
    Triangulate.surface(sector, true, scale, triangles)
    Triangulate.surface(sector, true, scale, triangles)
    sector.updateTriangles(triangles)
  }
}
