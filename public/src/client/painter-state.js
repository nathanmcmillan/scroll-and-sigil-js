import {TwoWayMap} from '/src/util/collections.js'
import {Painter} from '/src/editor/painter.js'
import {textureByName} from '/src/assets/assets.js'
import {drawText, drawRectangle, drawHollowRectangle, FONT_HEIGHT} from '/src/render/render.js'
import {identity, multiply} from '/src/math/matrix.js'
import * as In from '/src/editor/editor-input.js'

function drawTextSpecial(b, x, y, text, scale, red, green, blue) {
  drawText(b, x + scale, y - scale, text, scale, 0.0, 0.0, 0.0, 1.0)
  drawText(b, x, y, text, scale, red, green, blue, 1.0)
}

// texture *create_texture_pixels(int width, int height, GLint clamp, GLint interpolate, GLint internal_format, GLint format, GLint type, const void *pixels) {
//   GLuint id;
//   gen(&id, clamp, interpolate);
//   glTexImage2D(GL_TEXTURE_2D, 0, internal_format, width, height, 0, format, type, pixels);
//   glBindTexture(GL_TEXTURE_2D, 0);
//   return texture_init("", id, width, height);
// }

// function pixelsToTexture(width,height,format,pixels) {

// }

export class PainterState {
  constructor(client) {
    this.client = client

    let keys = new TwoWayMap()
    keys.set('KeyW', In.MOVE_FORWARD)
    keys.set('KeyA', In.MOVE_LEFT)
    keys.set('KeyS', In.MOVE_BACKWARD)
    keys.set('KeyD', In.MOVE_RIGHT)
    keys.set('KeyQ', In.MOVE_UP)
    keys.set('KeyE', In.MOVE_DOWN)
    keys.set('ArrowLeft', In.LOOK_LEFT)
    keys.set('ArrowRight', In.LOOK_RIGHT)
    keys.set('ArrowUp', In.LOOK_UP)
    keys.set('ArrowDown', In.LOOK_DOWN)
    keys.set('Enter', In.BUTTON_A)
    keys.set('KeyC', In.BUTTON_B)
    keys.set('KeyN', In.BUTTON_X)
    keys.set('KeyM', In.BUTTON_Y)
    keys.set('KeyI', In.OPEN_MENU)
    keys.set('KeyM', In.OPEN_TOOL_MENU)
    keys.set('KeyV', In.SWITCH_MODE)
    keys.set('KeyZ', In.ZOOM_IN)
    keys.set('KeyX', In.ZOOM_OUT)
    keys.set('KeyU', In.UNDO)
    keys.set('KeyR', In.REDO)
    keys.set('KeyG', In.SNAP_TO_GRID)
    keys.set('ShiftLeft', In.LEFT_TRIGGER)
    keys.set('ShiftRight', In.RIGHT_TRIGGER)

    this.keys = keys

    this.view = new Float32Array(16)
    this.projection = new Float32Array(16)

    this.painter = new Painter(client.width, client.height)
  }

  resize(width, height) {
    this.painter.resize(width, height)
  }

  keyEvent(code, down) {
    if (this.keys.has(code)) {
      this.painter.input.set(this.keys.get(code), down)
    }
    if (down && code === 'Digit0') {
      console.log(this.painter.export())
    }
  }

  async initialize(file) {
    await this.painter.load(file)
  }

  update() {
    this.painter.update()
  }

  render() {
    const painter = this.painter
    if (!painter.doPaint) return

    const client = this.client
    const gl = client.gl
    const rendering = client.rendering
    const view = this.view
    const projection = this.projection

    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.clear(gl.DEPTH_BUFFER_BIT)

    gl.disable(gl.CULL_FACE)
    gl.disable(gl.DEPTH_TEST)

    identity(view)
    multiply(projection, client.orthographic, view)

    rendering.setProgram(0)
    rendering.setView(0, 0, client.width, client.height)
    rendering.updateUniformMatrix('u_mvp', projection)

    let buffer = client.bufferColor
    buffer.zero()

    let scale = 2.0
    let fontHeight = scale * FONT_HEIGHT

    let posC = painter.positionC
    let posR = painter.positionR

    let paletteRows = painter.paletteRows
    let paletteColumns = painter.paletteColumns
    let palette = painter.palette

    let sheetRows = painter.sheetRows
    let sheetColumns = painter.sheetColumns
    let sheetIndex = painter.sheetIndex
    let sheet = painter.sheets[sheetIndex]

    let rows = painter.rows
    let columns = painter.columns
    let matrix = painter.matrix

    // matrix
    let top = 300
    let left = 50
    let magnify = 32
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < columns; c++) {
        let x = left + c * magnify
        let y = top - r * magnify
        let index = c + r * columns
        let paletteIndex = matrix[index] * 3
        let red = palette[paletteIndex]
        let green = palette[paletteIndex + 1]
        let blue = palette[paletteIndex + 2]
        drawRectangle(buffer, x, y, magnify, magnify, red, green, blue, 1.0)
      }
    }

    let x = left + posC * magnify
    let y = top - posR * magnify
    drawHollowRectangle(buffer, x, y, magnify, magnify, 2.0, 1.0, 1.0, 1.0, 1.0)

    let height = rows * magnify
    drawHollowRectangle(buffer, left, top - height + magnify, columns * magnify, height, 2.0, 1.0, 1.0, 1.0, 1.0)

    // sheet
    top = client.height - 100
    left = 340
    magnify = 2
    for (let r = 0; r < sheetRows; r++) {
      for (let c = 0; c < sheetColumns; c++) {
        let x = left + c * magnify
        let y = top - r * magnify
        let index = c + r * sheetColumns
        let paletteIndex = sheet[index] * 3
        let red = palette[paletteIndex]
        let green = palette[paletteIndex + 1]
        let blue = palette[paletteIndex + 2]
        drawRectangle(buffer, x, y, magnify, magnify, red, green, blue, 1.0)
      }
    }

    height = sheetRows * magnify
    drawHollowRectangle(buffer, left, top - height + magnify, sheetColumns * magnify, height, 2.0, 1.0, 1.0, 1.0, 1.0)

    // pallete
    top = 70
    left = 400
    magnify = 32
    for (let r = 0; r < paletteRows; r++) {
      for (let c = 0; c < paletteColumns; c++) {
        let x = left + c * magnify
        let y = top - r * magnify
        let index = (c + r * columns) * 3
        let red = palette[index]
        let green = palette[index + 1]
        let blue = palette[index + 2]
        drawRectangle(buffer, x, y, magnify, magnify, red, green, blue, 1.0)
      }
    }

    x = left + painter.paletteC * magnify
    y = top - painter.paletteR * magnify
    drawHollowRectangle(buffer, x, y, magnify, magnify, 2.0, 1.0, 1.0, 1.0, 1.0)

    height = paletteRows * magnify
    drawHollowRectangle(buffer, left, top - height + magnify, paletteColumns * magnify, height, 2.0, 1.0, 1.0, 1.0, 1.0)

    // top bar
    drawRectangle(buffer, 0, client.height - fontHeight, client.width, fontHeight, 1.0, 241.0 / 255.0, 232.0 / 255.0, 1.0)

    rendering.updateAndDraw(buffer)

    rendering.setProgram(1)
    rendering.setView(0, 0, client.width, client.height)
    rendering.updateUniformMatrix('u_mvp', projection)

    client.bufferGUI.zero()

    let displayC = posC < 10 ? '0' + posC : '' + posC
    let displayR = posR < 10 ? '0' + posR : '' + posR
    let text = 'x = ' + displayC + ' y =' + displayR
    drawTextSpecial(client.bufferGUI, 10, client.height - fontHeight, text, 2.0, 1.0, 1.0, 1.0)

    let displaySheet = '#' + sheetIndex < 10 ? '00' + sheetIndex : sheetIndex < 100 ? '0' + sheetIndex : '' + sheetIndex
    drawTextSpecial(client.bufferGUI, 10, client.height - fontHeight * 3, displaySheet, 2.0, 1.0, 1.0, 1.0)

    drawTextSpecial(client.bufferGUI, 10, 10, 'painter', 2.0, 1.0, 1.0, 1.0)

    rendering.bindTexture(gl.TEXTURE0, textureByName('font').texture)
    rendering.updateAndDraw(client.bufferGUI)
  }
}
