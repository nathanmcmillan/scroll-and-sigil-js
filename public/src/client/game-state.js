import { textureByIndex, textureByName } from '../assets/assets.js'
import { renderLoadingInProgress } from '../client/render-loading.js'
import { drawDecal } from '../client/render-sector.js'
import { renderTouch } from '../client/render-touch.js'
import { Game } from '../game/game.js'
import { identity, multiply, multiplyVector3, rotateX, rotateY, translate } from '../math/matrix.js'
import { drawRectangle, drawSprite, drawText, TIC_FONT_HEIGHT, TIC_FONT_WIDTH } from '../render/render.js'
import { animal } from '../sound/animal.js'
import { speech } from '../sound/speech.js'
import { bufferZero } from '../webgl/buffer.js'
import {
  rendererBindAndDraw,
  rendererBindTexture,
  rendererSetProgram,
  rendererSetView,
  rendererUpdateAndDraw,
  rendererUpdateUniformMatrix,
  rendererUpdateVAO,
} from '../webgl/renderer.js'

function drawTextSpecial(b, x, y, text, scale, red, green, blue) {
  drawText(b, x + scale, y - scale, text, scale, 0.0, 0.0, 0.0, 1.0)
  drawText(b, x, y, text, scale, red, green, blue, 1.0)
}

export class GameState {
  constructor(client) {
    this.client = client
    this.keys = client.keys

    this.game = new Game(this, client.input)
    this.events = []
    this.loading = true

    this.view = new Float32Array(16)
    this.projection = new Float32Array(16)

    if (true) {
      const text = 'scrol and sigil'
      const base = 60
      const speed = 1.5
      speech(text, base, speed)
    }

    if (false) {
      const text = 'scroll and sigil'
      const pitch = 1.0
      const shorten = false
      animal(text, pitch, shorten)
    }
  }

  resize() {}

  keyEvent(code, down) {
    if (this.keys.has(code)) this.game.input.set(this.keys.get(code), down)
  }

  mouseEvent() {}

  mouseMove() {}

  async initialize(file) {
    await this.load(file)
  }

  async load(file) {
    await this.game.load(file)

    const world = this.game.world
    const client = this.client
    const gl = client.gl

    for (const buffer of client.sectorBuffers.values()) bufferZero(buffer)
    for (const sector of world.sectors) client.sectorRender(sector)
    for (const buffer of client.sectorBuffers.values()) rendererUpdateVAO(client.rendering, buffer, gl.STATIC_DRAW)

    this.loading = false
  }

  notify(type, args) {
    switch (type) {
      case 'map':
        this.events.push([type, args])
        return
      case 'death':
        return
    }
  }

  doEvent(event) {
    const type = event[0]
    const args = event[1]
    switch (type) {
      case 'map':
        this.loading = true
        this.load('./pack/' + this.client.pack + '/maps/' + args + '.txt')
        return
    }
  }

  update() {
    if (this.loading) return

    this.game.update()

    const events = this.events
    let e = events.length
    if (e > 0) {
      while (e--) this.doEvent(events[e])
      events.length = 0
    }
  }

  render() {
    const client = this.client
    const view = this.view
    const projection = this.projection

    if (this.loading) {
      renderLoadingInProgress(client, view, projection)
      return
    }

    const gl = client.gl
    const rendering = client.rendering
    const game = this.game
    const scale = client.scale
    const width = client.width
    const height = client.height - client.top
    const world = game.world
    const camera = game.camera

    const fontWidth = scale * TIC_FONT_WIDTH
    const fontHeight = scale * TIC_FONT_HEIGHT

    const pad = 10.0

    if (client.touch) renderTouch(client.touchRender)

    // sky box

    rendererSetProgram(rendering, 'texture3d-rgb')
    rendererSetView(rendering, 0, client.top, width, height)

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    gl.disable(gl.CULL_FACE)
    gl.disable(gl.DEPTH_TEST)

    identity(view)
    rotateX(view, Math.sin(camera.rx), Math.cos(camera.rx))
    rotateY(view, Math.sin(camera.ry), Math.cos(camera.ry))
    translate(view, 0.0, 0.0, 0.0)
    multiply(projection, client.perspective, view)
    rendererUpdateUniformMatrix(rendering, 'u_mvp', projection)

    const sky = textureByName('sky-box-1')
    rendererBindTexture(rendering, gl.TEXTURE0, sky.texture)
    rendererBindAndDraw(rendering, client.bufferSky)

    // render world

    gl.enable(gl.CULL_FACE)
    gl.enable(gl.DEPTH_TEST)

    identity(view)
    rotateX(view, Math.sin(camera.rx), Math.cos(camera.rx))
    rotateY(view, Math.sin(camera.ry), Math.cos(camera.ry))
    translate(view, -camera.x, -camera.y, -camera.z)
    multiply(projection, client.perspective, view)
    rendererUpdateUniformMatrix(rendering, 'u_mvp', projection)

    const projection3d = projection.slice()

    for (const [index, buffer] of client.sectorBuffers) {
      rendererBindTexture(rendering, gl.TEXTURE0, textureByIndex(index).texture)
      rendererBindAndDraw(rendering, buffer)
    }

    const buffers = client.spriteBuffers
    for (const buffer of buffers.values()) bufferZero(buffer)

    const sine = Math.sin(-camera.ry)
    const cosine = Math.cos(-camera.ry)

    const things = world.things
    let t = world.thingCount
    while (t--) {
      const thing = things[t]
      const buffer = client.getSpriteBuffer(thing.stamp.texture)
      drawSprite(buffer, thing.x, thing.y, thing.z, thing.stamp.sprite, sine, cosine)
    }

    const missiles = world.missiles
    let m = world.missileCount
    while (m--) {
      const missile = missiles[m]
      const buffer = client.getSpriteBuffer(missile.stamp.texture)
      drawSprite(buffer, missile.x, missile.y, missile.z, missile.stamp.sprite, sine, cosine)
    }

    const particles = world.particles
    let p = world.particleCount
    while (p--) {
      const particle = particles[p]
      const buffer = client.getSpriteBuffer(particle.stamp.texture)
      drawSprite(buffer, particle.x, particle.y, particle.z, particle.stamp.sprite, sine, cosine)
    }

    for (const [index, buffer] of buffers) {
      if (buffer.indexPosition === 0) continue
      rendererBindTexture(rendering, gl.TEXTURE0, textureByIndex(index).texture)
      rendererUpdateAndDraw(rendering, buffer, gl.DYNAMIC_DRAW)
    }

    const decals = world.decals
    let d = decals.length
    if (d > 0) {
      for (const buffer of buffers.values()) {
        bufferZero(buffer)
      }

      gl.depthMask(false)
      gl.enable(gl.POLYGON_OFFSET_FILL)
      gl.polygonOffset(-1, -1)

      while (d--) {
        const decal = decals[d]
        const buffer = client.getSpriteBuffer(decal.texture)
        drawDecal(buffer, decal)
      }

      for (const [index, buffer] of buffers) {
        if (buffer.indexPosition === 0) continue
        rendererBindTexture(rendering, gl.TEXTURE0, textureByIndex(index).texture)
        rendererUpdateAndDraw(rendering, buffer, gl.DYNAMIC_DRAW)
      }

      gl.depthMask(true)
      gl.disable(gl.POLYGON_OFFSET_FILL)
    }

    rendererSetProgram(rendering, 'texture2d-font')
    rendererSetView(rendering, 0, client.top, width, height)

    gl.disable(gl.CULL_FACE)
    gl.disable(gl.DEPTH_TEST)

    identity(view)
    multiply(projection, client.orthographic, view)
    rendererUpdateUniformMatrix(rendering, 'u_mvp', projection)

    bufferZero(client.bufferGUI)

    const hero = game.hero

    // overlay

    if (game.cinema) {
      const black = 60.0
      rendererSetProgram(rendering, 'color2d')
      rendererSetView(rendering, 0, client.top, width, height)
      rendererUpdateUniformMatrix(rendering, 'u_mvp', projection)
      bufferZero(client.bufferColor)
      drawRectangle(client.bufferColor, 0.0, 0.0, width, black, 0.0, 0.0, 0.0, 1.0)
      drawRectangle(client.bufferColor, 0.0, height - black, width, black, 0.0, 0.0, 0.0, 1.0)
      rendererUpdateAndDraw(rendering, client.bufferColor)
    } else if (hero.menu) {
      const menu = hero.menu
      const page = menu.page
      if (page === 'inventory') {
        let x = Math.floor(0.5 * width)
        let text = 'Outfit'
        drawTextSpecial(client.bufferGUI, x, height - pad - fontHeight, text, scale, 1.0, 0.0, 0.0)
        if (hero.outfit) {
          text = hero.outfit.name
          drawTextSpecial(client.bufferGUI, x, height - pad - 2.0 * fontHeight, text, scale, 1.0, 0.0, 0.0)
        } else {
          drawTextSpecial(client.bufferGUI, x, height - pad - 2.0 * fontHeight, 'None', scale, 1.0, 0.0, 0.0)
        }
        x += (text.length + 1) * fontWidth
        text = 'Headpiece'
        drawTextSpecial(client.bufferGUI, x, height - pad - fontHeight, text, scale, 1.0, 0.0, 0.0)
        if (hero.headpiece) {
          text = hero.headpiece.name
          drawTextSpecial(client.bufferGUI, x, height - pad - 2.0 * fontHeight, text, scale, 1.0, 0.0, 0.0)
        } else {
          drawTextSpecial(client.bufferGUI, x, height - pad - 2.0 * fontHeight, 'None', scale, 1.0, 0.0, 0.0)
        }
        x += (text.length + 1) * fontWidth
        text = 'Weapon'
        if (hero.weapon) {
          text = hero.weapon.name
          drawTextSpecial(client.bufferGUI, x, height - pad - 2.0 * fontHeight, text, scale, 1.0, 0.0, 0.0)
        } else {
          drawTextSpecial(client.bufferGUI, x, height - pad - 2.0 * fontHeight, 'None', scale, 1.0, 0.0, 0.0)
        }
        drawTextSpecial(client.bufferGUI, x, height - pad - fontHeight, text, scale, 1.0, 0.0, 0.0)
        let y = height - pad - fontHeight
        drawTextSpecial(client.bufferGUI, pad, y, 'Inventory', scale, 1.0, 0.0, 0.0)
        let index = 0
        for (const item of hero.inventory) {
          y -= fontHeight
          if (index === hero.menuRow) drawTextSpecial(client.bufferGUI, pad, y, item.name, scale, 1.0, 1.0, 0.0)
          else drawTextSpecial(client.bufferGUI, pad, y, item.name, scale, 1.0, 0.0, 0.0)
          index++
        }
        rendererBindTexture(rendering, gl.TEXTURE0, textureByName('tic-80-wide-font').texture)
        rendererUpdateAndDraw(rendering, client.bufferGUI)
      }
    } else {
      if (hero.interaction) {
        const interaction = hero.interaction
        const interactionWith = hero.interactionWith
        drawTextSpecial(client.bufferGUI, pad, height - pad - fontHeight, interactionWith.name, scale, 1.0, 0.0, 0.0)
        let y = Math.floor(0.5 * height)
        for (const option of interaction.keys()) {
          drawTextSpecial(client.bufferGUI, pad, y, option, scale, 1.0, 0.0, 0.0)
          y += fontHeight
        }
      } else {
        if (hero.nearby) {
          const thing = hero.nearby
          const text = thing.isItem ? 'COLLECT' : 'SPEAK'
          const vec = [thing.x, thing.y + thing.height, thing.z]
          const position = []
          multiplyVector3(position, projection3d, vec)
          position[0] /= position[2]
          position[1] /= position[2]
          position[0] = 0.5 * ((position[0] + 1.0) * width)
          position[1] = 0.5 * ((position[1] + 1.0) * height)
          position[0] = Math.floor(position[0])
          position[1] = Math.floor(position[1])
          drawTextSpecial(client.bufferGUI, position[0], position[1], text, scale, 1.0, 0.0, 0.0)
        }
        if (hero.combat) {
          let text = ''
          for (let i = 0; i < hero.health; i++) text += 'x'
          const x = pad
          let y = pad
          drawTextSpecial(client.bufferGUI, x, y, text, scale, 1.0, 0.0, 0.0)
          text = ''
          y += fontHeight
          for (let i = 0; i < hero.stamina; i++) text += 'x'
          drawTextSpecial(client.bufferGUI, x, y, text, scale, 0.0, 1.0, 0.0)
        }
      }
      if (client.bufferGUI.indexPosition > 0) {
        rendererBindTexture(rendering, gl.TEXTURE0, textureByName('tic-80-wide-font').texture)
        rendererUpdateAndDraw(rendering, client.bufferGUI)
      }
    }
  }
}
