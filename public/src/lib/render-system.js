class RenderSystem {
  constructor() {
    this.v = []
    this.mv = []
    this.mvp = []

    this.programId
    this.programName
    this.mvpIds = new Map()
    this.uniforms = new Map()
    this.textureIds = new Map()
    this.shaders = new Map()
    this.textures = new Map()
  }
  SetTexture(gl, name) {
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.textures.get(name))
    gl.uniform1i(this.textureIds.get(this.programName), 0)
  }
  SetTextureDirect(gl, textureId) {
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, textureId)
    gl.uniform1i(this.textureIds.get(this.programName), 0)
  }
  SetIndexTextureDirect(gl, unit, name, textureId) {
    gl.activeTexture(gl.TEXTURE0 + unit)
    gl.bindTexture(gl.TEXTURE_2D, textureId)
    let loc = this.uniforms.get(this.programName).get(name)
    if (!loc) {
      loc = gl.getUniformLocation(this.programId, name)
      this.uniforms.get(this.programName).set(name, loc)
    }
    gl.uniform1i(loc, unit)
  }
  SetProgram(gl, name) {
    this.programId = this.shaders.get(name)
    this.programName = name
    gl.useProgram(this.programId)
  }
  SetUniformVec2(gl, name, x, y) {
    let loc = this.uniforms.get(this.programName).get(name)
    if (!loc) {
      loc = gl.getUniformLocation(this.programId, name)
      this.uniforms.get(this.programName).set(name, loc)
    }
    gl.uniform2f(loc, x, y)
  }
  SetUniformMatrix4(gl, name, matrix) {
    let loc = this.uniforms.get(this.programName).get(name)
    if (!loc) {
      loc = gl.getUniformLocation(this.programId, name)
      this.uniforms.get(this.programName).set(name, loc)
    }
    gl.uniformMatrix4fv(loc, false, matrix)
  }
  static SetFrameBuffer(gl, fbo) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
  }
  static SetView(gl, x, y, width, height) {
    gl.viewport(x, y, width, height)
    gl.scissor(x, y, width, height)
  }
  static BindVao(gl, buffer) {
    gl.bindVertexArray(buffer.vao)
  }
  static UpdateVao(gl, buffer) {
    gl.bindVertexArray(buffer.vao)
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer.vbo)
    gl.bufferData(gl.ARRAY_BUFFER, buffer.vertices, gl.STATIC_DRAW)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer.ebo)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, buffer.indices, gl.STATIC_DRAW)
  }
  static BindAndDraw(gl, buffer) {
    gl.bindVertexArray(buffer.vao)
    gl.drawElements(gl.TRIANGLES, buffer.index_pos, gl.UNSIGNED_INT, 0)
  }
  static DrawRange(gl, start, count) {
    gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_INT, start)
  }
  static UpdateAndDraw(gl, buffer) {
    if (buffer.vertexPos == 0) return
    gl.bindVertexArray(buffer.vao)
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer.vbo)
    gl.bufferData(gl.ARRAY_BUFFER, buffer.vertices, gl.DYNAMIC_DRAW)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer.ebo)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, buffer.indices, gl.DYNAMIC_DRAW)
    gl.drawElements(gl.TRIANGLES, buffer.index_pos, gl.UNSIGNED_INT, 0)
  }
  SetOrthographic(orthographic, x, y) {
    Matrix.Identity(this.mv)
    Matrix.Translate(this.mv, x, y, -1)
    Matrix.Multiply(this.mvp, orthographic, this.mv)
  }
  SetPerspective(perspective, x, y, z, rx, ry) {
    Matrix.Identity(this.v)
    Matrix.RotateX(this.v, rx)
    Matrix.RotateY(this.v, ry)
    Matrix.TranslateFromView(this.mv, this.v, x, y, z)
    Matrix.Multiply(this.mvp, perspective, this.mv)
  }
  UpdateMvp(gl) {
    gl.uniformMatrix4fv(this.mvpIds.get(this.programName), false, this.mvp)
  }
  static MakeVao(gl, buffer, position, color, texture) {
    buffer.vao = gl.createVertexArray()
    buffer.vbo = gl.createBuffer()
    buffer.ebo = gl.createBuffer()
    gl.bindVertexArray(buffer.vao)
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer.vbo)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer.ebo)

    let stride = (position + color + texture) * 4
    let index = 0
    let offset = 0
    if (position > 0) {
      gl.vertexAttribPointer(index, position, gl.FLOAT, false, stride, offset)
      gl.enableVertexAttribArray(index)
      index++
      offset += position * 4
    }
    if (color > 0) {
      gl.vertexAttribPointer(index, color, gl.FLOAT, false, stride, offset)
      gl.enableVertexAttribArray(index)
      index++
      offset += color * 4
    }
    if (texture > 0) {
      gl.vertexAttribPointer(index, texture, gl.FLOAT, false, stride, offset)
      gl.enableVertexAttribArray(index)
    }
  }
  static UpdateFrameBuffer(gl, frame) {
    for (let i = 0; i < frame.format.length; i++) {
      gl.bindTexture(gl.TEXTURE_2D, frame.textures[i])
      gl.texImage2D(gl.TEXTURE_2D, 0, frame.internalFormat[i], frame.width, frame.height, 0, frame.format[i], frame.type[i], null)
    }
    if (frame.depth) {
      gl.bindTexture(gl.TEXTURE_2D, frame.depthTexture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH24_STENCIL8, frame.width, frame.height, 0, gl.DEPTH_STENCIL, gl.UNSIGNED_INT_24_8, null)
    }
  }
  static TextureFrameBuffer(gl, frame) {
    for (let i = 0; i < frame.format.length; i++) {
      frame.textures[i] = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, frame.textures[i])
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      if (frame.linear) {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      } else {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
      }
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, frame.textures[i], 0)
      frame.drawBuffers[i] = gl.COLOR_ATTACHMENT0 + i
    }
    gl.drawBuffers(frame.drawBuffers)
    if (frame.depth) {
      frame.depthTexture = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, frame.depthTexture)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.TEXTURE_2D, frame.depthTexture, 0)
    }
    RenderSystem.UpdateFrameBuffer(gl, frame)

    let status = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      console.error('framebuffer error:', status)
    }
  }
  static MakeFrameBuffer(gl, frame) {
    frame.fbo = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, frame.fbo)
    RenderSystem.TextureFrameBuffer(gl, frame)
  }
  async makeProgram(gl, name) {
    let file = await Net.Request('shaders/' + name + '.glsl')
    let parts = file.split('===========================================================')
    let vertex = parts[0]
    let fragment = parts[1].trim()
    let program = RenderSystem.CompileProgram(gl, vertex, fragment)
    this.shaders.set(name, program)
    this.uniforms.set(name, new Map())
    this.mvpIds.set(name, gl.getUniformLocation(program, 'u_mvp'))
    this.textureIds.set(name, gl.getUniformLocation(program, 'u_texture0'))
  }
  async makeImage(gl, name, wrap) {
    let texture = gl.createTexture()
    texture.image = new Image()
    texture.image.src = 'images/' + name + '.png'

    await new Promise(function (resolve) {
      texture.image.onload = resolve
    })

    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap)
    gl.bindTexture(gl.TEXTURE_2D, null)

    this.textures.set(name, texture)
  }
  static CompileProgram(gl, v, f) {
    let vert = RenderSystem.CompileShader(gl, v, gl.VERTEX_SHADER)
    let frag = RenderSystem.CompileShader(gl, f, gl.FRAGMENT_SHADER)
    let program = gl.createProgram()
    gl.attachShader(program, vert)
    gl.attachShader(program, frag)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(v + ', ' + f)
      console.error(gl.getProgramInfoLog(program))
    }
    return program
  }
  static CompileShader(gl, source, type) {
    let shader = gl.createShader(type)
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(source)
      console.error(gl.getShaderInfoLog(shader))
    }
    return shader
  }
}
