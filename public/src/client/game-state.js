import {TwoWayMap} from '/src/util/collections.js'
import {Game} from '/src/game/game.js'
import {drawDecal} from '/src/client/render-sector.js'
import {drawImage, drawSprite, drawText} from '/src/render/render.js'
import {identity, multiply, rotateX, rotateY, translate} from '/src/math/matrix.js'
import {textureByName, textureByIndex} from '/src/assets/assets.js'
import * as In from '/src/game/input.js'

export class GameState {
  constructor(client) {
    this.client = client
    this.game = new Game(this)
    this.events = []
    this.loading = true

    let keys = new TwoWayMap()
    keys.set('Enter', In.BUTTON_START)
    keys.set('Backslash', In.BUTTON_SELECT)
    keys.set('KeyW', In.LEFT_STICK_UP)
    keys.set('KeyS', In.LEFT_STICK_DOWN)
    keys.set('KeyA', In.LEFT_STICK_LEFT)
    keys.set('KeyD', In.LEFT_STICK_RIGHT)
    keys.set('KeyI', In.RIGHT_STICK_UP)
    keys.set('KeyK', In.RIGHT_STICK_DOWN)
    keys.set('KeyJ', In.RIGHT_STICK_LEFT)
    keys.set('KeyL', In.RIGHT_STICK_RIGHT)
    keys.set('ArrowUp', In.RIGHT_STICK_UP)
    keys.set('ArrowDown', In.RIGHT_STICK_DOWN)
    keys.set('ArrowLeft', In.RIGHT_STICK_LEFT)
    keys.set('ArrowRight', In.RIGHT_STICK_RIGHT)
    keys.set('Key0', In.DPAD_UP)
    keys.set('Key1', In.DPAD_DOWN)
    keys.set('Key2', In.DPAD_LEFT)
    keys.set('Key3', In.DPAD_RIGHT)
    keys.set('KeyH', In.BUTTON_A)
    keys.set('KeyU', In.BUTTON_B)
    keys.set('KeyO', In.BUTTON_X)
    keys.set('KeyP', In.BUTTON_Y)
    keys.set('KeyQ', In.LEFT_STICK_CLICK)
    keys.set('KeyE', In.RIGHT_STICK_CLICK)
    keys.set('KeyZ', In.LEFT_TRIGGER)
    keys.set('KeyM', In.RIGHT_TRIGGER)
    keys.set('KeyX', In.LEFT_BUMPER)
    keys.set('KeyN', In.RIGHT_BUMPER)

    this.keys = keys
  }

  resize() {}

  keyEvent(code, down) {
    if (this.keys.has(code)) {
      this.game.input.set(this.keys.get(code), down)
    }
  }

  async initialize(file) {
    await this.load(file)
  }

  async load(file) {
    await this.game.load(file)

    const world = this.game.world
    const client = this.client
    const gl = client.gl

    for (const buffer of client.sectorBuffers.values()) buffer.zero()
    for (const sector of world.sectors) client.sectorRender(sector)
    for (const buffer of client.sectorBuffers.values()) client.rendering.updateVAO(buffer, gl.STATIC_DRAW)

    this.loading = false
  }

  handle(event) {
    let trigger = event[0]
    let params = event[1]
    switch (trigger) {
      case 'hero-goto-map':
        this.loading = true
        this.load('/maps/' + params + '.map')
        return
    }
  }

  update() {
    if (this.loading) return
    this.game.update()
    for (const event of this.events) this.handle(event)
    this.events.length = 0
  }

  renderLoadInProgress() {
    const client = this.client
    const gl = client.gl
    const rendering = client.rendering

    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.clear(gl.DEPTH_BUFFER_BIT)

    let view = new Array(16)
    let projection = new Array(16)

    rendering.setProgram(1)
    rendering.setView(0, 0, client.width, client.height)

    gl.disable(gl.CULL_FACE)
    gl.disable(gl.DEPTH_TEST)

    identity(view)
    multiply(projection, client.orthographic, view)
    rendering.updateUniformMatrix('u_mvp', projection)

    client.bufferGUI.zero()
    let text = 'Loading. Please wait...'
    drawText(client.bufferGUI, 12.0, 8.0, text, 2.0, 0.0, 0.0, 0.0, 1.0)
    drawText(client.bufferGUI, 10.0, 10.0, text, 2.0, 1.0, 0.0, 0.0, 1.0)
    rendering.bindTexture(gl.TEXTURE0, textureByName('font').texture)
    rendering.updateAndDraw(client.bufferGUI)
  }

  render() {
    if (this.loading) {
      this.renderLoadInProgress()
      return
    }

    const game = this.game
    const world = game.world
    const client = this.client
    const gl = client.gl
    const rendering = client.rendering

    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.clear(gl.DEPTH_BUFFER_BIT)

    let view = new Array(16)
    let projection = new Array(16)

    let camera = game.camera

    rendering.setProgram(1)
    rendering.setView(0, 0, client.width, client.height)

    identity(view)
    multiply(projection, client.orthographic, view)
    rendering.updateUniformMatrix('u_mvp', projection)

    client.bufferGUI.zero()

    let sky = textureByName('sky')
    let turnX = client.width * 2.0
    let skyX = (camera.ry / (2.0 * Math.PI)) * turnX
    if (skyX >= turnX) skyX -= turnX
    let skyHeight = 2.0 * sky.height
    let skyY = client.height - skyHeight

    drawImage(client.bufferGUI, -skyX, skyY, turnX * 2.0, skyHeight, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 2.0, 1.0)

    rendering.bindTexture(gl.TEXTURE0, sky.texture)
    rendering.updateAndDraw(client.bufferGUI)

    rendering.setProgram(2)
    rendering.setView(0, 0, client.width, client.height)

    gl.enable(gl.CULL_FACE)
    gl.enable(gl.DEPTH_TEST)

    identity(view)
    rotateX(view, Math.sin(camera.rx), Math.cos(camera.rx))
    rotateY(view, Math.sin(camera.ry), Math.cos(camera.ry))
    translate(view, -camera.x, -camera.y, -camera.z)
    multiply(projection, client.perspective, view)
    rendering.updateUniformMatrix('u_mvp', projection)

    for (const [index, buffer] of client.sectorBuffers) {
      rendering.bindTexture(gl.TEXTURE0, textureByIndex(index).texture)
      rendering.bindAndDraw(buffer)
    }

    let buffers = client.spriteBuffers
    for (const buffer of buffers.values()) {
      buffer.zero()
    }

    let sine = Math.sin(-camera.ry)
    let cosine = Math.cos(-camera.ry)

    let things = world.things
    let t = world.thingCount
    while (t--) {
      let thing = things[t]
      let buffer = client.getSpriteBuffer(thing.texture)
      drawSprite(buffer, thing.x, thing.y, thing.z, thing.sprite, sine, cosine)
    }

    let missiles = world.missiles
    let m = world.missileCount
    while (m--) {
      let missile = missiles[m]
      let buffer = client.getSpriteBuffer(missile.texture)
      drawSprite(buffer, missile.x, missile.y, missile.z, missile.sprite, sine, cosine)
    }

    let particles = world.particles
    let p = world.particleCount
    while (p--) {
      let particle = particles[p]
      let buffer = client.getSpriteBuffer(particle.texture)
      drawSprite(buffer, particle.x, particle.y, particle.z, particle.sprite, sine, cosine)
    }

    for (const [index, buffer] of buffers) {
      if (buffer.indexPosition === 0) continue
      rendering.bindTexture(gl.TEXTURE0, textureByIndex(index).texture)
      rendering.updateAndDraw(buffer, gl.DYNAMIC_DRAW)
    }

    let d = world.decalCount
    if (d > 0) {
      for (const buffer of buffers.values()) {
        buffer.zero()
      }

      gl.depthMask(false)
      gl.enable(gl.POLYGON_OFFSET_FILL)
      gl.polygonOffset(-1, -1)

      let decals = world.decals
      while (d--) {
        let decal = decals[d]
        let buffer = client.getSpriteBuffer(decal.texture)
        drawDecal(buffer, decal)
      }

      for (const [index, buffer] of buffers) {
        if (buffer.indexPosition === 0) continue
        rendering.bindTexture(gl.TEXTURE0, textureByIndex(index).texture)
        rendering.updateAndDraw(buffer, gl.DYNAMIC_DRAW)
      }

      gl.depthMask(true)
      gl.disable(gl.POLYGON_OFFSET_FILL)
    }

    rendering.setProgram(1)
    rendering.setView(0, 0, client.width, client.height)

    gl.disable(gl.CULL_FACE)
    gl.disable(gl.DEPTH_TEST)

    identity(view)
    multiply(projection, client.orthographic, view)
    rendering.updateUniformMatrix('u_mvp', projection)

    client.bufferGUI.zero()
    drawText(client.bufferGUI, 12.0, 8.0, 'Scroll and Sigil', 2.0, 0.0, 0.0, 0.0, 1.0)
    drawText(client.bufferGUI, 10.0, 10.0, 'Scroll and Sigil', 2.0, 1.0, 0.0, 0.0, 1.0)
    rendering.bindTexture(gl.TEXTURE0, textureByName('font').texture)
    rendering.updateAndDraw(client.bufferGUI)
  }

  notify(trigger, params) {
    switch (trigger) {
      case 'hero-goto-map':
        this.events.push([trigger, params])
        return
      case 'hero-dead-goto-menu':
        return
    }
    console.warn('Unknown notification:', trigger, params)
  }
}
