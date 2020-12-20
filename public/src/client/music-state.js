import {MusicEdit} from '/src/editor/music.js'
import {textureByName} from '/src/assets/assets.js'
import {drawText, drawTextSpecial, drawRectangle, FONT_WIDTH, FONT_HEIGHT} from '/src/render/render.js'
import {spr, sprcol} from '/src/render/pico.js'
import {identity, multiply} from '/src/math/matrix.js'
import {whitef, redf, darkpurplef, darkgreyf} from '/src/editor/palette.js'
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
    else if (down && code === 'Digit1') {
      this.client.openState('dashboard')
    }
  }

  mouseEvent() {}

  mouseMove() {}

  async initialize() {
    await this.music.load()
  }

  update(timestamp) {
    let music = this.music
    music.update(timestamp)
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

    let track = music.tracks[music.trackIndex]
    let notes = track.notes

    let text = track.name
    let posBox = flexBox(fontWidth * text.length, fontHeight)
    posBox.argX = 20
    posBox.argY = 20
    flexSolve(canvasWidth, canvasHeight, posBox)
    drawTextSpecial(client.bufferGUI, posBox.x, posBox.y, text, fontScale, whitef(0), whitef(1), whitef(2), 1.0)

    const fontHalfWidth = Math.floor(0.5 * fontWidth)
    const noteRows = music.noteRows
    const noteC = music.noteC
    const noteR = music.noteR

    let x = 20
    let y = canvasHeight - 150
    let noteWidth = Math.floor(2 * fontWidth)
    let noteHeight = fontHeight + scale

    for (let c = 0; c < notes.length; c++) {
      let note = notes[c]
      for (let r = 1; r < noteRows; r++) {
        let num = note[r]
        let pitch = num === 0 ? '-' : '' + num
        let pos = x + c * noteWidth
        if (pitch >= 10) pos -= fontHalfWidth
        if (c === noteC && r === noteR) drawTextSpecial(client.bufferGUI, pos, y - r * noteHeight, pitch, fontScale, redf(0), redf(1), redf(2), 1.0)
        else drawTextSpecial(client.bufferGUI, pos, y - r * noteHeight, pitch, fontScale, whitef(0), whitef(1), whitef(2), 1.0)
      }
    }

    let tempoText = 'Tempo:' + music.tempo
    drawTextSpecial(client.bufferGUI, 20, canvasHeight - fontHeight * 3, tempoText, fontScale, whitef(0), whitef(1), whitef(2), 1.0)

    let topBarText = ' File Edit View Help'
    drawTextSpecial(client.bufferGUI, 0, canvasHeight - topBarHeight + pad, topBarText, fontScale, whitef(0), whitef(1), whitef(2), 1.0)

    let topBarSwitch = 'HCLPSM '
    let width = topBarSwitch.length * fontWidth
    drawText(client.bufferGUI, canvasWidth - width, canvasHeight - topBarHeight + pad, topBarSwitch, fontScale, darkpurplef(0), darkpurplef(1), darkpurplef(2), 1.0)

    let infoText
    infoText = noteR === 0 ? '(x)Duration down (z)Duration up ' : '(z)Pitch down (x)Pitch up '
    infoText += '(-)Delete note '
    infoText += music.play ? '(c)Stop' : '(c)Play'
    drawTextSpecial(client.bufferGUI, 20, 100, infoText, scale, whitef(0), whitef(1), whitef(2), 1.0)

    rendering.bindTexture(gl.TEXTURE0, textureByName('tic-80-wide-font').texture)
    rendering.updateAndDraw(client.bufferGUI)

    client.bufferGUI.zero()

    const r = 0
    for (let c = 0; c < notes.length; c++) {
      let note = notes[c]
      let duration = 33 + note[r]
      let pos = x + c * noteWidth

      sprcol(client.bufferGUI, duration, 1.0, 1.0, pos, y + noteHeight - scale, 8 * scale, 8 * scale, 0.0, 0.0, 0.0, 1.0)

      if (c === noteC && r === noteR) sprcol(client.bufferGUI, duration, 1.0, 1.0, pos, y + noteHeight, 8 * scale, 8 * scale, redf(0), redf(1), redf(2), 1.0)
      else spr(client.bufferGUI, duration, 1.0, 1.0, pos, y + noteHeight, 8 * scale, 8 * scale)
    }

    rendering.bindTexture(gl.TEXTURE0, textureByName('editor-sprites').texture)
    rendering.updateAndDraw(client.bufferGUI)
  }
}
