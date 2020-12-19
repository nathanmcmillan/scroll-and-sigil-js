import {MusicEdit} from '/src/editor/music.js'
import {textureByName} from '/src/assets/assets.js'
import {drawText, drawTextSpecial, drawRectangle, drawHollowRectangle, drawImage, FONT_WIDTH, FONT_HEIGHT} from '/src/render/render.js'
import {identity, multiply} from '/src/math/matrix.js'
import {blackf, whitef, redf, darkpurplef, darkgreyf} from '/src/editor/palette.js'
import {flexBox, flexSolve} from '/src/flex/flex.js'

export class MusicState {
  constructor(client) {
    this.client = client
    this.keys = client.keys

    this.view = new Float32Array(16)
    this.projection = new Float32Array(16)

    let music = new MusicEdit(client.width, client.height, client.scale, client.input)
    this.music = music
  }

  resize(width, height, scale) {
    this.music.resize(width, height, scale)
  }

  keyEvent(code, down) {
    if (this.keys.has(code)) this.music.input.set(this.keys.get(code), down)
  }

  mouseEvent() {}

  mouseMove() {}

  async initialize() {
    await this.music.load()
  }

  update() {
    let music = this.music
    music.update()
  }

  render() {
    const music = this.music
    if (!music.doPaint) return

    const client = this.client
    const gl = client.gl
    const rendering = client.rendering
    const view = this.view
    const projection = this.projection
    const scale = music.scale

    gl.clearColor(darkgreyf(0), darkgreyf(1), darkgreyf(2), 1.0)

    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.clear(gl.DEPTH_BUFFER_BIT)

    gl.disable(gl.CULL_FACE)
    gl.disable(gl.DEPTH_TEST)

    identity(view)
    multiply(projection, client.orthographic, view)

    let buffer = client.bufferColor
    buffer.zero()

    const fontScale = Math.floor(1.5 * scale)
    const fontWidth = fontScale * FONT_WIDTH
    const fontHeight = fontScale * FONT_HEIGHT

    const thickness = scale
    const doubleThick = 2 * thickness
    const fourThick = 2 * doubleThick
    const pad = 2 * scale

    let canvasWidth = client.width
    let canvasHeight = client.height

    rendering.setProgram(0)
    rendering.setView(0, 0, canvasWidth, canvasHeight)
    rendering.updateUniformMatrix('u_mvp', projection)

    client.bufferGUI.zero()

    // top bar
    let topBarHeight = fontHeight + 2 * pad
    drawRectangle(buffer, 0, canvasHeight - topBarHeight, canvasWidth, topBarHeight, redf(0), redf(1), redf(2), 1.0)

    rendering.updateAndDraw(buffer)

    // text
    rendering.setProgram(3)
    rendering.setView(0, 0, canvasWidth, canvasHeight)
    rendering.updateUniformMatrix('u_mvp', projection)

    client.bufferGUI.zero()

    let text = 'Guitar'
    let posBox = flexBox(fontWidth * text.length, fontHeight)
    posBox.funX = 'center'
    posBox.argY = 20
    flexSolve(canvasWidth, canvasHeight, posBox)
    drawTextSpecial(client.bufferGUI, posBox.x, posBox.y, text, fontScale, whitef(0), whitef(1), whitef(2), 1.0)

    let topBarText = ' File Edit View Help'
    drawTextSpecial(client.bufferGUI, 0, canvasHeight - topBarHeight + pad, topBarText, fontScale, whitef(0), whitef(1), whitef(2), 1.0)

    let topBarSwitch = 'HCLPSM '
    let width = topBarSwitch.length * fontWidth
    drawText(client.bufferGUI, canvasWidth - width, canvasHeight - topBarHeight + pad, topBarSwitch, fontScale, darkpurplef(0), darkpurplef(1), darkpurplef(2), 1.0)

    rendering.bindTexture(gl.TEXTURE0, textureByName('tic-80-wide-font').texture)
    rendering.updateAndDraw(client.bufferGUI)
  }
}
