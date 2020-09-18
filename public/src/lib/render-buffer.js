class RenderBuffer {
  constructor() {
    this.position
    this.color
    this.texture
    this.vao
    this.vbo
    this.ebo
    this.vertexPos
    this.index_pos
    this.index_offset
    this.vertices
    this.indices
  }
  static Init(gl, position, color, texture, vertex_limit, index_limit) {
    let buffer = new RenderBuffer()
    buffer.position = position
    buffer.color = color
    buffer.texture = texture
    buffer.vertexPos = 0
    buffer.index_pos = 0
    buffer.index_offset = 0
    buffer.vertices = new Float32Array(vertex_limit * (position + color + texture))
    buffer.indices = new Uint32Array(index_limit)
    RenderSystem.MakeVao(gl, buffer, position, color, texture)
    return buffer
  }
  static InitCopy(gl, source) {
    let buffer = new RenderBuffer()
    buffer.vertices = new Float32Array(source.vertexPos)
    buffer.indices = new Uint32Array(source.index_pos)
    RenderBuffer.Copy(source, buffer)
    RenderSystem.MakeVao(gl, buffer, source.position, source.color, source.texture)
    RenderSystem.UpdateVao(gl, buffer)
    return buffer
  }
  static Copy(from, to) {
    for (let i = 0; i < from.vertexPos; i++) to.vertices[i] = from.vertices[i]
    for (let i = 0; i < from.index_pos; i++) to.indices[i] = from.indices[i]

    to.vertexPos = from.vertexPos
    to.index_pos = from.index_pos
    to.index_offset = from.index_offset
  }
  static Expand(gl, buffer) {
    let vertices = buffer.vertices
    let indices = buffer.vertices

    buffer.vertices = new Float32Array(buffer.vertices.length * 2)
    buffer.indices = new Uint32Array(buffer.indices.length * 2)

    for (let i = 0; i < buffer.vertexPos; i++) buffer.vertices[i] = vertices[i]
    for (let i = 0; i < buffer.index_pos; i++) buffer.indices[i] = indices[i]

    RenderSystem.UpdateVao(gl, buffer)

    return buffer
  }
  Zero() {
    this.vertexPos = 0
    this.index_pos = 0
    this.index_offset = 0
  }
}
