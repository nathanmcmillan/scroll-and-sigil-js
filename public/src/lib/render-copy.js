class RenderCopy {
  constructor(position, color, texture, vertex_limit, index_limit) {
    this.position = position
    this.color = color
    this.texture = texture
    this.vertexPos
    this.index_pos
    this.index_offset
    this.vertices = new Float32Array(vertex_limit * (position + color + texture))
    this.indices = new Uint32Array(index_limit)
  }
  Zero() {
    this.vertexPos = 0
    this.index_pos = 0
    this.index_offset = 0
  }
}
