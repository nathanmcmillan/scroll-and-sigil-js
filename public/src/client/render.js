import {index3, index4} from '/src/render/render.js'

export function drawWall(b, wall) {
  let pos = b.vertexPosition
  let vertices = b.vertices

  vertices[pos] = wall.a.x
  vertices[pos + 1] = wall.ceiling
  vertices[pos + 2] = wall.a.y
  vertices[pos + 3] = wall.u
  vertices[pos + 4] = wall.t
  vertices[pos + 5] = wall.normal.x
  vertices[pos + 6] = 0.0
  vertices[pos + 7] = wall.normal.y

  vertices[pos + 8] = wall.a.x
  vertices[pos + 9] = wall.floor
  vertices[pos + 10] = wall.a.y
  vertices[pos + 11] = wall.u
  vertices[pos + 12] = wall.v
  vertices[pos + 13] = wall.normal.x
  vertices[pos + 14] = 0.0
  vertices[pos + 15] = wall.normal.y

  vertices[pos + 16] = wall.b.x
  vertices[pos + 17] = wall.floor
  vertices[pos + 18] = wall.b.y
  vertices[pos + 19] = wall.s
  vertices[pos + 20] = wall.v
  vertices[pos + 21] = wall.normal.x
  vertices[pos + 22] = 0.0
  vertices[pos + 23] = wall.normal.y

  vertices[pos + 24] = wall.b.x
  vertices[pos + 25] = wall.ceiling
  vertices[pos + 26] = wall.b.y
  vertices[pos + 27] = wall.s
  vertices[pos + 28] = wall.t
  vertices[pos + 29] = wall.normal.x
  vertices[pos + 30] = 0.0
  vertices[pos + 31] = wall.normal.y

  b.vertexPosition = pos + 32
  index4(b)
}

export function drawTriangle(b, triangle) {
  let pos = b.vertexPosition
  let vertices = b.vertices

  vertices[pos] = triangle.c.x
  vertices[pos + 1] = triangle.height
  vertices[pos + 2] = triangle.c.y
  vertices[pos + 3] = triangle.uvc.x
  vertices[pos + 4] = triangle.uvc.y
  vertices[pos + 5] = 0.0
  vertices[pos + 6] = triangle.normal
  vertices[pos + 7] = 0.0

  vertices[pos + 8] = triangle.b.x
  vertices[pos + 9] = triangle.height
  vertices[pos + 10] = triangle.b.y
  vertices[pos + 11] = triangle.uvb.x
  vertices[pos + 12] = triangle.uvb.y
  vertices[pos + 13] = 0.0
  vertices[pos + 14] = triangle.normal
  vertices[pos + 15] = 0.0

  vertices[pos + 16] = triangle.a.x
  vertices[pos + 17] = triangle.height
  vertices[pos + 18] = triangle.a.y
  vertices[pos + 19] = triangle.uva.x
  vertices[pos + 20] = triangle.uva.y
  vertices[pos + 21] = 0.0
  vertices[pos + 22] = triangle.normal
  vertices[pos + 23] = 0.0

  b.vertexPosition = pos + 24
  index3(b)
}
