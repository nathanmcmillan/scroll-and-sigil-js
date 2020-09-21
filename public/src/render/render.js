export function index3(b) {
  let pos = b.indexPosition
  let offset = b.indexOffset
  let indices = b.indices

  indices[pos] = offset
  indices[pos + 1] = offset + 1
  indices[pos + 2] = offset + 2

  b.indexPosition = pos + 3
  b.indexOffset = offset + 3
}

export function index4(b) {
  let pos = b.indexPosition
  let offset = b.indexOffset
  let indices = b.indices

  indices[pos] = offset
  indices[pos + 1] = offset + 1
  indices[pos + 2] = offset + 2
  indices[pos + 3] = offset + 2
  indices[pos + 4] = offset + 3
  indices[pos + 5] = offset

  b.indexPosition = pos + 6
  b.indexOffset = offset + 4
}

export function screen(b, x, y, width, height) {
  let pos = b.vertexPosition
  let vertices = b.vertices

  vertices[pos] = x
  vertices[pos + 1] = y
  vertices[pos + 2] = x + width
  vertices[pos + 3] = y
  vertices[pos + 4] = x + width
  vertices[pos + 5] = y + height
  vertices[pos + 6] = x
  vertices[pos + 7] = y + height

  b.vertexPosition = pos + 8
  index4(b)
}

export function rectangle(b, x, y, width, height, red, green, blue, alpha) {
  let pos = b.vertexPosition
  let vertices = b.vertices

  vertices[pos] = x
  vertices[pos + 1] = y
  vertices[pos + 2] = red
  vertices[pos + 3] = green
  vertices[pos + 4] = blue
  vertices[pos + 5] = alpha

  vertices[pos + 6] = x + width
  vertices[pos + 7] = y
  vertices[pos + 8] = red
  vertices[pos + 9] = green
  vertices[pos + 10] = blue
  vertices[pos + 11] = alpha

  vertices[pos + 12] = x + width
  vertices[pos + 13] = y + height
  vertices[pos + 14] = red
  vertices[pos + 15] = green
  vertices[pos + 16] = blue
  vertices[pos + 17] = alpha

  vertices[pos + 18] = x
  vertices[pos + 19] = y + height
  vertices[pos + 20] = red
  vertices[pos + 21] = green
  vertices[pos + 22] = blue
  vertices[pos + 23] = alpha

  b.vertexPosition = pos + 24
  index4(b)
}

export function drawImage(b, x, y, width, height, red, green, blue, alpha, left, top, right, bottom) {
  let pos = b.vertexPosition
  let vertices = b.vertices

  vertices[pos] = x
  vertices[pos + 1] = y
  vertices[pos + 2] = red
  vertices[pos + 3] = green
  vertices[pos + 4] = blue
  vertices[pos + 5] = alpha
  vertices[pos + 6] = left
  vertices[pos + 7] = bottom

  vertices[pos + 8] = x + width
  vertices[pos + 9] = y
  vertices[pos + 10] = red
  vertices[pos + 11] = green
  vertices[pos + 12] = blue
  vertices[pos + 13] = alpha
  vertices[pos + 14] = right
  vertices[pos + 15] = bottom

  vertices[pos + 16] = x + width
  vertices[pos + 17] = y + height
  vertices[pos + 18] = red
  vertices[pos + 19] = green
  vertices[pos + 20] = blue
  vertices[pos + 21] = alpha
  vertices[pos + 22] = right
  vertices[pos + 23] = top

  vertices[pos + 24] = x
  vertices[pos + 25] = y + height
  vertices[pos + 26] = red
  vertices[pos + 27] = green
  vertices[pos + 28] = blue
  vertices[pos + 29] = alpha
  vertices[pos + 30] = left
  vertices[pos + 31] = top

  b.vertexPosition = pos + 32
  index4(b)
}

export function drawSprite(b, x, y, z, sprite, sine, cosine) {
  let pos = b.vertexPosition
  let vertices = b.vertices

  sine = sprite.halfWidth * sine
  cosine = sprite.halfWidth * cosine

  vertices[pos] = x - cosine
  vertices[pos + 1] = y
  vertices[pos + 2] = z + sine
  vertices[pos + 3] = sprite.left
  vertices[pos + 4] = sprite.bottom
  vertices[pos + 5] = sine
  vertices[pos + 6] = 0.0
  vertices[pos + 7] = cosine

  vertices[pos + 8] = x + cosine
  vertices[pos + 9] = y
  vertices[pos + 10] = z - sine
  vertices[pos + 11] = sprite.right
  vertices[pos + 12] = sprite.bottom
  vertices[pos + 13] = sine
  vertices[pos + 14] = 0.0
  vertices[pos + 15] = cosine

  vertices[pos + 16] = x + cosine
  vertices[pos + 17] = y + sprite.height
  vertices[pos + 18] = z - sine
  vertices[pos + 19] = sprite.right
  vertices[pos + 20] = sprite.top
  vertices[pos + 21] = sine
  vertices[pos + 22] = 0.0
  vertices[pos + 23] = cosine

  vertices[pos + 24] = x - cosine
  vertices[pos + 25] = y + sprite.height
  vertices[pos + 26] = z + sine
  vertices[pos + 27] = sprite.left
  vertices[pos + 28] = sprite.top
  vertices[pos + 29] = sine
  vertices[pos + 30] = 0.0
  vertices[pos + 31] = cosine

  b.vertexPosition = pos + 32
  index4(b)
}
