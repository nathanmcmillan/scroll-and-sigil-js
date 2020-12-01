import {TwoWayMap} from '/src/util/collections.js'
import {exportSheetPixels, exportSheetToCanvas, PaintEdit} from '/src/editor/paint.js'
import {textureByName} from '/src/assets/assets.js'
import {drawTextSpecial, drawRectangle, drawHollowRectangle, drawImage, FONT_HEIGHT} from '/src/render/render.js'
import {identity, multiply} from '/src/math/matrix.js'
import {darkbluef, whitef} from '/src/editor/palette.js'
import * as In from '/src/input/input.js'

function newPixelsToTexture(gl, width, height, pixels) {
  let texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, width, height, 0, gl.RGB, gl.UNSIGNED_BYTE, pixels, 0)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.bindTexture(gl.TEXTURE_2D, null)
  return texture
}

function updatePixelsToTexture(gl, texture, width, height, pixels) {
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, width, height, gl.RGB, gl.UNSIGNED_BYTE, pixels, 0)
  gl.bindTexture(gl.TEXTURE_2D, null)
  return texture
}

export class PaintState {
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

    let painter = new PaintEdit(client.width, client.height)
    this.painter = painter

    let rows = painter.sheetRows
    let columns = painter.sheetColumns
    let pixels = exportSheetPixels(painter, 0)
    this.texture = newPixelsToTexture(client.gl, columns, rows, pixels)
  }

  resize(width, height, scale) {
    this.painter.resize(width, height, scale)
  }

  keyEvent(code, down) {
    if (this.keys.has(code)) this.painter.input.set(this.keys.get(code), down)
    if (down && code === 'Digit0') {
      let painter = this.painter
      let blob = painter.export()
      localStorage.setItem('paint-sheet', blob)
      console.info('saved to local storage!')
    } else if (down && code === 'Digit8') {
      let painter = this.painter
      let blob = painter.export()
      let download = document.createElement('a')
      download.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(blob)
      download.download = 'sheet' + painter.sheetIndex + '.image'
      download.click()
    } else if (down && code === 'Digit9') {
      let painter = this.painter
      let canvas = document.createElement('canvas')
      let context = canvas.getContext('2d')
      canvas.width = painter.sheetColumns
      canvas.height = painter.sheetRows
      let data = context.createImageData(canvas.width, canvas.height)
      exportSheetToCanvas(painter, painter.sheetIndex, data.data)
      context.putImageData(data, 0, 0)
      let blob = canvas.toDataURL('image/png')
      let download = document.createElement('a')
      download.href = blob
      download.download = 'sheet' + painter.sheetIndex + '.png'
      download.click()
    } else if (down && code === 'Digit7') {
      let button = document.createElement('input')
      button.type = 'file'
      button.onchange = (e) => {
        let file = e.target.files[0]
        console.log(file)
        let reader = new FileReader()
        if (file.type === 'image/png') {
          reader.readAsDataURL(file)
          reader.onload = (event) => {
            let content = event.target.result
            let image = new Image()
            image.src = content
            image.onload = () => {
              console.log(image)
            }
          }
        } else {
          reader.readAsText(file, 'UTF-8')
          reader.onload = (event) => {
            let content = event.target.result
            this.painter.read(content, 0)
            this.updateTexture()
          }
        }
      }
      button.click()
    }
  }

  mouseEvent(left, down) {
    if (left) this.painter.input.set(this.keys.get('Enter'), down)
  }

  mouseMove() {}

  async initialize(file) {
    await this.painter.load(file)
    this.updateTexture()
  }

  updateTexture() {
    let painter = this.painter
    let rows = painter.sheetRows
    let columns = painter.sheetColumns
    let pixels = exportSheetPixels(painter, 0)
    updatePixelsToTexture(this.client.gl, this.texture, columns, rows, pixels)
  }

  update(timestamp) {
    let painter = this.painter
    painter.update(timestamp)
    if (painter.hasUpdates) this.updateTexture()
  }

  render() {
    const painter = this.painter
    if (!painter.doPaint) return

    const client = this.client
    const gl = client.gl
    const rendering = client.rendering
    const view = this.view
    const projection = this.projection
    const scale = painter.scale

    let darkblue0 = darkbluef(0)
    let darkblue1 = darkbluef(1)
    let darkblue2 = darkbluef(2)

    gl.clearColor(darkblue0, darkblue1, darkblue2, 1.0)

    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.clear(gl.DEPTH_BUFFER_BIT)

    gl.disable(gl.CULL_FACE)
    gl.disable(gl.DEPTH_TEST)

    identity(view)
    multiply(projection, client.orthographic, view)

    let buffer = client.bufferColor
    buffer.zero()

    let fontHeight = scale * FONT_HEIGHT

    let thickness = scale
    let doubleThick = 2 * thickness
    let fourThick = 2 * doubleThick

    let canvasWidth = client.width
    let canvasHeight = client.height

    let brushSize = painter.brushSize
    let canvasZoom = painter.canvasZoom

    let posOffsetC = painter.positionOffsetC
    let posOffsetR = painter.positionOffsetR

    let posC = painter.positionC
    let posR = painter.positionR

    let paletteRows = painter.paletteRows
    let paletteColumns = painter.paletteColumns
    let palette = painter.paletteFloat

    let sheetRows = painter.sheetRows
    let sheetColumns = painter.sheetColumns
    let sheetIndex = painter.sheetIndex

    let rows = painter.canvasZoom
    let columns = painter.canvasZoom

    let magnify, top, left, width, height, box, x, y

    let black0 = 0.0
    let black1 = 0.0
    let black2 = 0.0

    let white0 = whitef(0)
    let white1 = whitef(1)
    let white2 = whitef(2)

    rendering.setProgram(1)
    rendering.setView(0, 0, canvasWidth, canvasHeight)
    rendering.updateUniformMatrix('u_mvp', projection)

    client.bufferGUI.zero()

    // sheet
    magnify = 2 * scale
    height = sheetRows * magnify
    top = canvasHeight - 100 - height
    left = painter.displaySheetLeft

    drawImage(client.bufferGUI, left, top, sheetColumns * magnify, height, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0)

    // view
    magnify = scale
    if (canvasZoom === 8) magnify *= 16
    if (canvasZoom === 16) magnify *= 8
    if (canvasZoom === 32) magnify *= 4
    if (canvasZoom === 64) magnify *= 2
    height = rows * magnify
    width = columns * magnify
    top = canvasHeight - 100 - height
    left = canvasWidth - 100 - width

    let sl = posOffsetC / sheetColumns
    let st = posOffsetR / sheetRows
    let sr = (posOffsetC + canvasZoom) / sheetColumns
    let sb = (posOffsetR + canvasZoom) / sheetRows

    drawImage(client.bufferGUI, left, top, width, height, 1.0, 1.0, 1.0, 1.0, sl, st, sr, sb)

    rendering.bindTexture(gl.TEXTURE0, this.texture)
    rendering.updateAndDraw(client.bufferGUI)

    rendering.setProgram(0)
    rendering.setView(0, 0, canvasWidth, canvasHeight)
    rendering.updateUniformMatrix('u_mvp', projection)

    // box around view
    drawHollowRectangle(buffer, left - thickness, top - thickness, width + doubleThick, height + doubleThick, thickness, black0, black1, black2, 1.0)
    drawHollowRectangle(buffer, left - doubleThick, top - doubleThick, width + fourThick, height + fourThick, thickness, white0, white1, white2, 1.0)

    // box around view focus
    x = left + posC * magnify
    y = top + height - posR * magnify

    box = magnify * brushSize

    drawHollowRectangle(buffer, x - thickness, y - thickness - box, box + doubleThick, box + doubleThick, thickness, black0, black1, black2, 1.0)
    drawHollowRectangle(buffer, x - doubleThick, y - doubleThick - box, box + fourThick, box + fourThick, thickness, white0, white1, white2, 1.0)

    // sheet
    magnify = 2 * scale
    height = sheetRows * magnify
    top = canvasHeight - 100 - height
    left = 100

    x = left + posOffsetC * magnify
    y = top + height - posOffsetR * magnify

    // box around sheet focus
    box = canvasZoom * magnify
    drawHollowRectangle(buffer, x - thickness, y - box - thickness, box + doubleThick, box + doubleThick, thickness, white0, white1, white2, 1.0)

    // box around sheet
    drawHollowRectangle(buffer, left - thickness, top - thickness, sheetColumns * magnify + doubleThick, height + doubleThick, thickness, white0, white1, white2, 1.0)

    // pallete
    magnify = 16 * scale

    top = canvasHeight - 100 - (8 + 2) * magnify
    left = canvasWidth - 100 - 8 * magnify
    for (let r = 0; r < paletteRows; r++) {
      for (let c = 0; c < paletteColumns; c++) {
        let x = left + c * magnify
        let y = top - r * magnify
        let index = (c + r * paletteColumns) * 3
        let red = palette[index]
        let green = palette[index + 1]
        let blue = palette[index + 2]
        drawRectangle(buffer, x, y, magnify, magnify, red, green, blue, 1.0)
      }
    }

    x = left + painter.paletteC * magnify
    y = top - painter.paletteR * magnify
    height = paletteRows * magnify

    // box around palette
    drawHollowRectangle(
      buffer,
      left - thickness,
      top - height + magnify - thickness,
      paletteColumns * magnify + doubleThick,
      height + doubleThick,
      thickness,
      black0,
      black1,
      black2,
      1.0
    )
    drawHollowRectangle(
      buffer,
      left - doubleThick,
      top - height + magnify - doubleThick,
      paletteColumns * magnify + fourThick,
      height + fourThick,
      thickness,
      white0,
      white1,
      white2,
      1.0
    )

    // box around palette focus
    drawHollowRectangle(buffer, x - thickness, y - thickness, magnify + doubleThick, magnify + doubleThick, thickness, black0, black1, black2, 1.0)
    drawHollowRectangle(buffer, x - doubleThick, y - doubleThick, magnify + fourThick, magnify + fourThick, thickness, white0, white1, white2, 1.0)

    // top bar
    drawRectangle(buffer, 0, canvasHeight - fontHeight, canvasWidth, fontHeight, 1.0, 241.0 / 255.0, 232.0 / 255.0, 1.0)

    rendering.updateAndDraw(buffer)

    // fonts
    rendering.setProgram(1)
    rendering.setView(0, 0, canvasWidth, canvasHeight)
    rendering.updateUniformMatrix('u_mvp', projection)

    client.bufferGUI.zero()

    let displayC = posC < 10 ? '0' + posC : '' + posC
    let displayR = posR < 10 ? '0' + posR : '' + posR
    let text = 'x = ' + displayC + ' y =' + displayR
    drawTextSpecial(client.bufferGUI, 10, canvasHeight - fontHeight, text, scale, white0, white1, white2)

    let displaySheet = '#' + sheetIndex < 10 ? '00' + sheetIndex : sheetIndex < 100 ? '0' + sheetIndex : '' + sheetIndex
    drawTextSpecial(client.bufferGUI, 10, canvasHeight - fontHeight * 3, displaySheet, scale, white0, white1, white2)

    let displaySize = 'brush size ' + brushSize
    drawTextSpecial(client.bufferGUI, 10, 10 + fontHeight * 2, displaySize, scale, white0, white1, white2)

    let displayZoom = 'canvas zoom ' + canvasZoom
    drawTextSpecial(client.bufferGUI, 10, 10, displayZoom, scale, white0, white1, white2)

    rendering.bindTexture(gl.TEXTURE0, textureByName('font').texture)
    rendering.updateAndDraw(client.bufferGUI)
  }
}
