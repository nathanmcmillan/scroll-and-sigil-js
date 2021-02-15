import {textureByName} from '../assets/assets.js'
import {identity, multiply} from '../math/matrix.js'
import {darkgreyf, red0f, red1f, red2f, darkpurple0f, darkpurple1f, darkpurple2f, lightgrey0f, lightgrey1f, lightgrey2f} from '../editor/palette.js'
import {decompress} from '../compress/huffman.js'
import {SfxEdit} from '../editor/sfx.js'
import {drawText, drawRectangle, FONT_6x6_WIDTH, FONT_6x6_HEIGHT_BASE} from '../render/render.js'
import {calcFontScale, calcTopBarHeight, calcBottomBarHeight, calcFontPad} from '../editor/editor-util.js'
import {renderDialogBox} from '../client/client-util.js'

export class SfxState {
  constructor(client) {
    this.client = client
    this.keys = client.keys

    this.view = new Float32Array(16)
    this.projection = new Float32Array(16)

    let sfx = new SfxEdit(this, client.width, client.height - client.top, client.scale, client.input)
    this.sfx = sfx
  }

  reset() {}

  resize(width, height, scale) {
    this.sfx.resize(width, height, scale)
  }

  keyEvent(code, down) {
    const sfx = this.sfx
    if (this.keys.has(code)) {
      sfx.input.set(this.keys.get(code), down)
      sfx.immediateInput()
    }
  }

  mouseEvent() {}

  mouseMove() {}

  async initialize() {
    await this.sfx.load()
  }

  eventCall(event) {
    if (event === 'start-export') this.exportPlain()
    else if (event === 'save-save') this.saveSheet()
    else if (event === 'start-open') this.importSheet()
    else if (event === 'start-save') this.saveSheet()
    else if (event === 'start-exit') this.returnToDashboard()
  }

  returnToDashboard() {
    this.client.openState('dashboard')
  }

  importSheet() {
    let button = document.createElement('input')
    button.type = 'file'
    button.onchange = (e) => {
      let file = e.target.files[0]
      console.info(file)
      let reader = new FileReader()
      if (file.name.endsWith('.huff')) {
        reader.readAsArrayBuffer(file)
        reader.onload = (event) => {
          let content = new Uint8Array(event.target.result)
          this.sfx.read(decompress(content), 0)
          this.updateTexture()
        }
      } else {
        reader.readAsText(file, 'UTF-8')
        reader.onload = (event) => {
          let content = event.target.result
          this.sfx.read(content, 0)
          this.updateTexture()
        }
      }
    }
    button.click()
  }

  saveSheet() {
    let blob = this.sfx.export()
    localStorage.setItem('sfx.txt', blob)
    console.info(blob)
    console.info('saved to local storage!')
  }

  exportPlain() {
    let blob = this.sfx.export()
    let download = document.createElement('a')
    download.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(blob)
    download.download = 'sfx.txt'
    download.click()
  }

  update(timestamp) {
    this.sfx.update(timestamp)
  }

  render() {
    const sfx = this.sfx
    if (!sfx.doPaint) return

    const client = this.client
    const gl = client.gl
    const rendering = client.rendering
    const view = this.view
    const projection = this.projection
    const scale = sfx.scale
    const width = client.width
    const height = client.height

    identity(view)
    multiply(projection, client.orthographic, view)

    const fontScale = calcFontScale(scale)
    const fontWidth = fontScale * FONT_6x6_WIDTH
    const fontHeight = fontScale * FONT_6x6_HEIGHT_BASE
    const fontPad = calcFontPad(fontHeight)
    const fontHeightAndPad = fontHeight + fontPad

    rendering.setProgram(0)
    rendering.setView(0, client.top, width, height)
    rendering.updateUniformMatrix('u_mvp', projection)

    gl.clearColor(darkgreyf(0), darkgreyf(1), darkgreyf(2), 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    gl.disable(gl.CULL_FACE)
    gl.disable(gl.DEPTH_TEST)

    // top and bottom bar

    client.bufferColor.zero()

    const topBarHeight = calcTopBarHeight(scale)
    drawRectangle(client.bufferColor, 0, height - topBarHeight, width, topBarHeight, red0f, red1f, red2f, 1.0)

    const bottomBarHeight = calcBottomBarHeight(scale)
    drawRectangle(client.bufferColor, 0, 0, width, bottomBarHeight, red0f, red1f, red2f, 1.0)

    rendering.updateAndDraw(client.bufferColor)

    // text

    rendering.setProgram(4)
    rendering.setView(0, 0, width, height)
    rendering.updateUniformMatrix('u_mvp', projection)

    // left top bar text

    client.bufferGUI.zero()

    let y = height - topBarHeight

    const leftTopBar = 'SOUND EFFECTS'
    drawText(client.bufferGUI, fontWidth, y, leftTopBar, fontScale, darkpurple0f, darkpurple1f, darkpurple2f, 1.0)

    // sound

    let x = 40
    y = 600

    for (let i = 0; i < sfx.parameters.length; i++) {
      let text = sfx.parameters[i] + ': ' + sfx.arguments[i]
      if (i === 1) text += 'hz'
      else if (i === 2) text += 'ms'
      drawText(client.bufferGUI, x, y, text, fontScale, lightgrey0f, lightgrey1f, lightgrey2f, 1.0)
      y -= fontHeightAndPad
    }

    // bottom bar text

    const bottomRightStatus = sfx.bottomRightStatus()
    if (bottomRightStatus)
      drawText(client.bufferGUI, width - (bottomRightStatus.length + 1) * fontWidth, 0, bottomRightStatus, fontScale, darkpurple0f, darkpurple1f, darkpurple2f, 1.0)

    rendering.bindTexture(gl.TEXTURE0, textureByName('tic-80-wide-font').texture)
    rendering.updateAndDraw(client.bufferGUI)

    // dialog box

    if (sfx.dialog != null) renderDialogBox(this, scale, sfx.dialog)
  }
}
