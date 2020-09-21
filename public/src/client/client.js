import {Game} from '/src/game/game.js'
import {fetchText, fetchImage} from '/src/client/net.js'
import {Buffer} from '/src/webgl/buffer.js'
import {createTexture, compileProgram} from '/src/webgl/webgl.js'
import {Renderer} from '/src/webgl/renderer.js'
import {drawWall, drawTriangle} from '/src/client/render.js'
import {drawImage, drawSprite} from '/src/render/render.js'
import {identity, multiply, orthographic, perspective, rotateX, rotateY, translate} from '/src/math/matrix.js'
import {Sprite} from '/src/render/sprite.js'

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
    this.rendering = null
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
    orthographic(this.orthographic, 0.0, width, 0.0, height, 0.0, 1.0)
    let fov = 60.0
    let ratio = width / height
    let near = 0.01
    let far = 50.0
    perspective(this.perspective, fov, near, far, ratio)
  }

  getSectorBuffer(texture) {
    let buffer = this.bufferSectors.get(texture)
    if (buffer == null) {
      buffer = new Buffer(3, 0, 2, 3, 4 * 800, 36 * 800)
      this.rendering.makeVAO(buffer)
      this.bufferSectors.set(texture, buffer)
    }
    return buffer
  }

  sectorRender(sector) {
    for (const line of sector.lines) {
      let wall = line.top
      if (wall != null) {
        let buffer = this.getSectorBuffer(wall.texture)
        drawWall(buffer, wall)
      }
      wall = line.middle
      if (wall != null) {
        let buffer = this.getSectorBuffer(wall.texture)
        drawWall(buffer, wall)
      }
      wall = line.bottom
      if (wall != null) {
        let buffer = this.getSectorBuffer(wall.texture)
        drawWall(buffer, wall)
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

    let grass = fetchImage('/textures/tiles/grass.png')
    let stone = fetchImage('/textures/tiles/stone.png')
    let plank = fetchImage('/textures/tiles/plank.png')
    let baron = fetchImage('/textures/baron.png')
    let color2d = fetchText('/shaders/color2d.glsl')
    let texture2d = fetchText('/shaders/texture2d.glsl')
    let texture3d = fetchText('/shaders/texture3d.glsl')

    grass = await grass
    stone = await stone
    plank = await plank
    baron = await baron
    color2d = await color2d
    texture2d = await texture2d
    texture3d = await texture3d

    this.textures[0] = createTexture(gl, grass, gl.NEAREST, gl.REPEAT)
    this.textures[1] = createTexture(gl, stone, gl.NEAREST, gl.REPEAT)
    this.textures[2] = createTexture(gl, plank, gl.NEAREST, gl.REPEAT)
    this.textures[3] = createTexture(gl, baron, gl.NEAREST, gl.CLAMP_TO_EDGE)

    this.rendering = new Renderer(gl)
    this.bufferGUI = new Buffer(2, 4, 2, 0, 4 * 800, 36 * 800)
    this.bufferSprites = new Buffer(3, 0, 2, 3, 4 * 800, 36 * 800)

    let rendering = this.rendering

    rendering.insertProgram(0, compileProgram(gl, color2d))
    rendering.insertProgram(1, compileProgram(gl, texture2d))
    rendering.insertProgram(2, compileProgram(gl, texture3d))

    let world = this.game.world

    for (const sector of world.sectors) {
      this.sectorRender(sector)
    }

    for (const buffer of this.bufferSectors.values()) {
      rendering.updateVAO(buffer, gl.STATIC_DRAW)
    }

    rendering.makeVAO(this.bufferGUI)
    rendering.makeVAO(this.bufferSprites)

    drawImage(this.bufferGUI, 0.0, 0.0, 64.0, 64.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0)
    rendering.updateVAO(this.bufferGUI, gl.STATIC_DRAW)
  }

  update() {
    this.game.update()

    let input = this.game.input
    let camera = this.game.camera

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

    let target = this.game.world.things[0]
    camera.updateOrbit(target)
  }

  render() {
    const gl = this.gl
    const rendering = this.rendering

    rendering.setProgram(2)
    rendering.setView(0, 0, this.width, this.height)

    gl.enable(gl.CULL_FACE)
    gl.enable(gl.DEPTH_TEST)

    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.clear(gl.DEPTH_BUFFER_BIT)

    let camera = this.game.camera

    let view = new Array(16)
    let projection = new Array(16)

    identity(view)
    rotateX(view, Math.sin(camera.rx), Math.cos(camera.rx))
    rotateY(view, Math.sin(camera.ry), Math.cos(camera.ry))
    translate(view, -camera.x, -camera.y, -camera.z)
    multiply(projection, this.perspective, view)
    rendering.updateUniformMatrix('u_mvp', projection)
    for (const [index, buffer] of this.bufferSectors) {
      rendering.bindTexture(gl.TEXTURE0, this.textures[index].texture)
      rendering.bindAndDraw(buffer)
    }
    rendering.bindTexture(gl.TEXTURE0, this.textures[0].texture)
    let b = this.bufferSprites
    b.zero()
    let sprite = new Sprite(0, 0, 32, 32, 0, 0, 1.0, 1.0, 1.0)
    let sine = Math.sin(-camera.ry)
    let cosine = Math.cos(-camera.ry)
    drawSprite(b, 2.0, 0.0, 1.0, sprite, sine, cosine)
    rendering.updateAndDraw(b)

    rendering.setProgram(1)
    rendering.setView(0, 0, this.width, this.height)

    gl.disable(gl.CULL_FACE)
    gl.disable(gl.DEPTH_TEST)

    identity(view)
    multiply(projection, this.orthographic, view)
    rendering.updateUniformMatrix('u_mvp', projection)
    rendering.bindTexture(gl.TEXTURE0, this.textures[0].texture)
    rendering.bindAndDraw(this.bufferGUI)
  }
}
