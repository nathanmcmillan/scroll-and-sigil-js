import {Game} from '/src/game/game.js'
import {fetchText, fetchImage} from '/src/client/net.js'
import {Buffer} from '/src/webgl/buffer.js'
import {createTexture, compileProgram} from '/src/webgl/webgl.js'
import {Renderer} from '/src/webgl/renderer.js'
import * as Matrix from '/src/math/matrix.js'
import {drawWall, drawTriangle} from '/src/client/render.js'

export class Client {
  constructor(canvas, gl) {
    this.width = 0
    this.height = 0
    this.canvas = canvas
    this.gl = gl
    this.keyboard = new Map()
    this.mouseLeft = false
    this.mouseRight = false
    this.mouseX = 0
    this.mouseY = 0
    this.game = new Game()
    this.orthographic = new Array(16)
    this.perspective = new Array(16)
    this.textures = []
    this.programs = []
    this.renderer = null
    this.bufferGUI = null
    this.bufferSectors = new Map()
  }

  keyEvent(code, down) {
    this.keyboard[code] = down
    switch (code) {
      case 'KeyW':
        break
      case 'ArrowLeft':
        this.game.input.lookLeft = down
        break
      case 'ArrowRight':
        this.game.input.lookRight = down
        break
      case 'ArrowUp':
        this.game.input.lookUp = down
        break
      case 'ArrowDown':
        this.game.input.lookDown = down
        break
    }
  }

  keyUp(event) {
    this.keyEvent(event.code, false)
  }

  keyDown(event) {
    this.keyEvent(event.code, true)
  }

  mouseUp(event) {
    if (event.button === 0) {
      this.mouseLeft = false
    } else if (event.button === 2) {
      this.mouseRight = false
    }
  }

  mouseDown(event) {
    if (event.button === 0) {
      this.mouseLeft = true
    } else if (event.button === 2) {
      this.mouseRight = true
    }
  }

  mouseMove(event) {
    this.mouseX = event.clientX
    this.mouseY = event.clientY
  }

  resize(width, height) {
    this.width = width
    this.height = height
    this.canvas.width = width
    this.canvas.height = height
    Matrix.orthographic(this.orthographic, 0.0, width, 0.0, height, 0.0, 1.0)
    let fov = 60.0
    let ratio = width / height
    let near = 0.01
    let far = 50.0
    Matrix.perspective(this.perspective, fov, near, far, ratio)
  }

  getSectorBuffer(texture) {
    let buffer = this.bufferSectors.get(texture.texture)
    if (buffer == null) {
      buffer = new Buffer(3, 0, 2, 3, 4 * 800, 36 * 800)
      this.renderer.makeVAO(buffer)
      this.bufferSectors.set(texture.texture, buffer)
    }
    return buffer
  }

  sectorRender(sector) {
    for (const line of sector.lines) {
      if (line.top != null) {
        let buffer = this.getSectorBuffer(line.top.texture)
        drawWall(buffer, line.top)
      }
      if (line.middle != null) {
        let buffer = this.getSectorBuffer(line.middle.texture)
        drawWall(buffer, line.middle)
      }
      if (line.bottom != null) {
        let buffer = this.getSectorBuffer(line.bottom.texture)
        drawWall(buffer, line.bottom)
      }
    }
    for (const triangle of sector.triangles) {
      let buffer = this.getSectorBuffer(triangle.texture)
      drawTriangle(buffer, triangle)
    }
  }

  async initialize() {
    const gl = this.gl

    gl.clearColor(0.0, 0.0, 0.0, 1.0)
    gl.depthFunc(gl.LEQUAL)
    gl.cullFace(gl.BACK)
    gl.disable(gl.BLEND)

    let plank = fetchImage('/textures/tiles/planks.png')
    let baron = fetchImage('/textures/baron.png')
    let color2d = fetchText('/shaders/color2d.glsl')
    let texture2d = fetchText('/shaders/texture2d.glsl')
    let texture3d = fetchText('/shaders/texture3d.glsl')

    plank = await plank
    baron = await baron
    color2d = await color2d
    texture2d = await texture2d
    texture3d = await texture3d

    this.textures[0] = createTexture(gl, plank, gl.NEAREST, gl.REPEAT)
    this.textures[1] = createTexture(gl, baron, gl.NEAREST, gl.CLAMP_TO_EDGE)

    this.programs[0] = compileProgram(gl, color2d)
    this.programs[1] = compileProgram(gl, texture2d)
    this.programs[2] = compileProgram(gl, texture3d)

    this.renderer = new Renderer(gl)

    let world = this.game.world

    for (const sector of world.sectors) {
      this.sectorRender(sector)
    }
  }

  update() {
    this.game.update()

    let input = this.input
    let camera = this.camera

    if (input.lookLeft) {
      camera.ry -= 0.05
      if (camera.ry < 0.0) camera.ry += 2.0 * Math.PI
    }

    if (input.lookRight) {
      camera.ry += 0.05
      if (camera.ry >= 2.0 * Math.PI) camera.ry -= 2.0 * Math.PI
    }

    if (input.lookUp) {
      camera.rx -= 0.05
      if (camera.rx < 0.0) camera.rx += 2.0 * Math.PI
    }

    if (input.lookDown) {
      camera.rx += 0.05
      if (camera.rx >= 2.0 * Math.PI) camera.rx -= 2.0 * Math.PI
    }

    // let target = &this.game.world.things[0];
    // camera.updateOrbit(target);
  }

  render() {
    const gl = this.gl
    const renderer = this.renderer

    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.clear(gl.DEPTH_BUFFER_BIT)

    gl.disable(gl.CULL_FACE)
    gl.disable(gl.DEPTH_TEST)

    renderer.setProgram(2)
    renderer.setView(0, 0, this.width, this.height)
    let view = new Array(16)
    let projection = new Array(16)
    Matrix.identity(view)
    Matrix.multiply(projection, this.orthographic, view)
    renderer.updateUniformMatrix('u_mvp', projection)
    renderer.bindTexture(gl.TEXTURE0, this.textures[0].texture)
    renderer.bindAndDraw(this.bufferGUI)
  }
}
