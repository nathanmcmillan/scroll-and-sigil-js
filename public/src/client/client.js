import {Game} from '/src/game/game.js'
import {fetchText, fetchImage} from '/src/client/net.js'
import {Buffer} from '/src/webgl/buffer.js'
import {createTexture, compileProgram} from '/src/webgl/webgl.js'
import {Renderer} from '/src/webgl/renderer.js'
import {drawWall, drawFloorCeil} from '/src/client/render-sector.js'
import {orthographic, perspective} from '/src/math/matrix.js'
import {saveSound, saveMusic, pauseMusic, resumeMusic} from '/src/assets/sounds.js'
import {saveEntity, saveTexture, waitForResources, createNewTexturesAndSpriteSheets} from '/src/assets/assets.js'
import {EditorState} from '/src/client/editor-state.js'
// import {GameState} from '/src/client/game-state.js'

export class Client {
  constructor(canvas, gl) {
    this.width = canvas.width
    this.height = canvas.height
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
    this.rendering = null
    this.bufferGUI = null
    this.bufferColor = null
    this.sectorBuffers = new Map()
    this.spriteBuffers = new Map()
    this.music = null
    this.state = null
  }

  keyEvent(code, down) {
    this.keyboard.set(code, down)
    this.state.keyEvent(code, down)
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

  pause() {
    pauseMusic()
  }

  resume() {
    resumeMusic()
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
    let far = 200.0
    perspective(this.perspective, fov, near, far, ratio)
    this.state.resize(width, height)
  }

  getSectorBuffer(texture) {
    let buffer = this.sectorBuffers.get(texture)
    if (buffer == null) {
      buffer = new Buffer(3, 0, 2, 3, 4 * 800, 36 * 800)
      this.rendering.makeVAO(buffer)
      this.sectorBuffers.set(texture, buffer)
    }
    return buffer
  }

  getSpriteBuffer(texture) {
    let buffer = this.spriteBuffers.get(texture)
    if (buffer == null) {
      buffer = new Buffer(3, 0, 2, 3, 4 * 800, 36 * 800)
      this.rendering.makeVAO(buffer)
      this.spriteBuffers.set(texture, buffer)
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
      drawFloorCeil(buffer, triangle)
    }
  }

  async initialize() {
    const gl = this.gl

    saveEntity('baron', '/entities/monster/baron.wad')
    saveEntity('tree', '/entities/doodad/tree.wad')
    saveEntity('plasma', '/entities/missile/plasma.wad')
    saveEntity('blood', '/entities/particle/blood.wad')
    saveEntity('plasma-explosion', '/entities/particle/plasma-explosion.wad')
    saveEntity('medkit', '/entities/item/medkit.wad')

    gl.clearColor(0.0, 0.0, 0.0, 1.0)
    gl.depthFunc(gl.LEQUAL)
    gl.cullFace(gl.BACK)
    gl.disable(gl.BLEND)

    saveMusic('vampire-killer', '/music/vampire-killer.wav')

    saveSound('baron-scream', '/sounds/baron-scream.wav')
    saveSound('baron-melee', '/sounds/baron-melee.wav')
    saveSound('baron-missile', '/sounds/baron-missile.wav')
    saveSound('baron-pain', '/sounds/baron-pain.wav')
    saveSound('baron-death', '/sounds/baron-death.wav')
    saveSound('plasma-impact', '/sounds/plasma-impact.wav')

    let color2d = fetchText('/shaders/color2d.glsl')
    let texture2d = fetchText('/shaders/texture2d.glsl')
    let texture3d = fetchText('/shaders/texture3d.glsl')

    let grass = fetchImage('/textures/tiles/grass.png')
    let stone = fetchImage('/textures/tiles/stone.png')
    let plank = fetchImage('/textures/tiles/plank.png')

    let sky = fetchImage('/textures/sky.png')
    let font = fetchImage('/textures/font.png')
    let cursor = fetchImage('/textures/cursor.png')

    await waitForResources()
    createNewTexturesAndSpriteSheets((image) => {
      return createTexture(gl, image, gl.NEAREST, gl.CLAMP_TO_EDGE)
    })

    grass = await grass
    stone = await stone
    plank = await plank

    sky = await sky
    font = await font
    cursor = await cursor

    color2d = await color2d
    texture2d = await texture2d
    texture3d = await texture3d

    saveTexture('grass', createTexture(gl, grass, gl.NEAREST, gl.REPEAT))
    saveTexture('stone', createTexture(gl, stone, gl.NEAREST, gl.REPEAT))
    saveTexture('plank', createTexture(gl, plank, gl.NEAREST, gl.REPEAT))

    saveTexture('sky', createTexture(gl, sky, gl.NEAREST, gl.REPEAT))
    saveTexture('font', createTexture(gl, font, gl.NEAREST, gl.CLAMP_TO_EDGE))
    saveTexture('cursor', createTexture(gl, cursor, gl.NEAREST, gl.CLAMP_TO_EDGE))

    await this.game.mapper()

    this.rendering = new Renderer(gl)
    this.bufferGUI = new Buffer(2, 4, 2, 0, 4 * 800, 36 * 800)
    this.bufferColor = new Buffer(2, 4, 0, 0, 4 * 1600, 36 * 1600)

    let rendering = this.rendering

    rendering.insertProgram(0, compileProgram(gl, color2d))
    rendering.insertProgram(1, compileProgram(gl, texture2d))
    rendering.insertProgram(2, compileProgram(gl, texture3d))

    let world = this.game.world

    for (const sector of world.sectors) {
      this.sectorRender(sector)
    }

    for (const buffer of this.sectorBuffers.values()) {
      rendering.updateVAO(buffer, gl.STATIC_DRAW)
    }

    rendering.makeVAO(this.bufferGUI)
    rendering.makeVAO(this.bufferColor)

    this.state = new EditorState(this) // new GameState(this)
    this.state.initialize()
  }

  update() {
    this.state.update()
  }

  render() {
    this.state.render()
  }
}
