class FrameBuffer {
  constructor() {
    this.fbo
    this.internalFormat
    this.format
    this.type
    this.width
    this.height
    this.linear
    this.depth
    this.depthTexture
    this.textures = []
    this.drawBuffers = []
  }
  static Make(gl, width, height, internalFormat, format, type, linear, depth) {
    let frame = new FrameBuffer()
    frame.set(width, height, internalFormat, format, type, linear, depth)
    RenderSystem.MakeFrameBuffer(gl, frame)
    return frame
  }
  set(width, height, internalFormat, format, type, linear, depth) {
    if (format.length !== internalFormat.length || format.length !== type.length) {
      throw new Error('framebuffer invalid')
    }
    this.internalFormat = internalFormat
    this.format = format
    this.type = type
    this.width = width
    this.height = height
    this.linear = linear === 'linear'
    this.depth = depth === 'depth'
  }
  Resize(gl, width, height) {
    this.width = width
    this.height = height
    RenderSystem.SetFrameBuffer(gl, this.fbo)
    RenderSystem.UpdateFrameBuffer(gl, this)
  }
}
