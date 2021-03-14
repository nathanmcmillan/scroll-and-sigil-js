import {exportPixels, exportToCanvas, PaintEdit, SPRITE_TOOL} from '../editor/paint.js'
import {textureByName} from '../assets/assets.js'
import {drawTextFont, drawRectangle, drawHollowRectangle, drawImage, drawTextFontSpecial} from '../render/render.js'
import {renderTouch} from '../client/render-touch.js'
import {spr, sprcol} from '../render/pico.js'
import {identity, multiply} from '../math/matrix.js'
import {flexBox, flexSolve} from '../gui/flex.js'
import {compress, decompress} from '../compress/huffman.js'
import {createPixelsToTexture} from '../webgl/webgl.js'
import {defaultFont, calcFontScale, calcThickness, calcTopBarHeight, calcBottomBarHeight} from '../editor/editor-util.js'
import {renderDialogBox, renderStatus, renderTextBox} from '../client/client-util.js'
import {
  black0f,
  black1f,
  black2f,
  white0f,
  white1f,
  white2f,
  silverf,
  lavenderf,
  redf,
  slatef,
  red0f,
  red1f,
  red2f,
  lavender0f,
  lavender1f,
  lavender2f,
  closestInPalette,
} from '../editor/palette.js'

function updatePixelsToTexture(gl, texture, width, height, pixels) {
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, width, height, gl.RGB, gl.UNSIGNED_BYTE, pixels, 0)
  gl.bindTexture(gl.TEXTURE_2D, null)
  return texture
}

function convertImageToText(palette, image) {
  const width = image.width
  const height = image.height

  let canvas = document.createElement('canvas')
  let context = canvas.getContext('2d')
  canvas.width = width
  canvas.height = height
  context.drawImage(image, 0, 0)
  let pixels = context.getImageData(0, 0, width, height).data

  let text = width + ' ' + height
  for (let h = 0; h < height; h++) {
    text += '\n'
    for (let c = 0; c < width; c++) {
      let index = (c + h * width) * 4
      let red = pixels[index]
      let green = pixels[index + 1]
      let blue = pixels[index + 2]
      text += closestInPalette(palette, red, green, blue) + ' '
    }
  }
  return text
}

export class PaintState {
  constructor(client) {
    this.client = client
    this.keys = client.keys

    this.view = new Float32Array(16)
    this.projection = new Float32Array(16)

    let paint = new PaintEdit(this, client.width, client.height - client.top, client.scale, client.input)
    this.paint = paint

    let rows = paint.sheetRows
    let columns = paint.sheetColumns
    let pixels = exportPixels(paint)

    let gl = client.gl
    this.texture = createPixelsToTexture(gl, columns, rows, pixels, gl.RGB, gl.NEAREST, gl.CLAMP_TO_EDGE).texture
  }

  reset() {
    this.paint.reset()
  }

  resize(width, height, scale) {
    this.paint.resize(width, height, scale)
  }

  keyEvent(code, down) {
    const paint = this.paint
    if (this.keys.has(code)) {
      paint.input.set(this.keys.get(code), down)
      paint.immediateInput()
    }
  }

  mouseEvent(left, down) {
    this.paint.input.mouseEvent(left, down)
  }

  mouseMove(x, y) {
    this.paint.input.mouseMove(x, y)
  }

  async initialize(file) {
    await this.paint.load(file)
    this.updateTexture()
  }

  eventCall(event) {
    if (event === 'export-plain text') this.exportPlain()
    else if (event === 'export-png') this.exportPng()
    else if (event === 'export-huffman') this.exportHuffman()
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
      if (file.type === 'image/png') {
        reader.readAsDataURL(file)
        reader.onload = (event) => {
          let content = event.target.result
          let image = new Image()
          image.src = content
          image.onload = () => {
            content = convertImageToText(this.paint.palette, image)
            this.paint.read(content)
            this.updateTexture()
          }
        }
      } else if (file.name.endsWith('.huff')) {
        reader.readAsArrayBuffer(file)
        reader.onload = (event) => {
          let content = new Uint8Array(event.target.result)
          this.paint.read(decompress(content))
          this.updateTexture()
        }
      } else {
        reader.readAsText(file, 'UTF-8')
        reader.onload = (event) => {
          let content = event.target.result
          this.paint.read(content)
          this.updateTexture()
        }
      }
    }
    button.click()
  }

  saveSheet() {
    let blob = this.paint.export()
    localStorage.setItem('paint.txt', blob)
    console.info(blob)
    console.info('saved to local storage!')
  }

  exportPlain() {
    let blob = this.paint.export()
    let download = document.createElement('a')
    download.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(blob)
    download.download = this.paint.name + '.txt'
    download.click()
  }

  exportHuffman() {
    let blob = compress(this.paint.export())
    let download = document.createElement('a')
    download.href = window.URL.createObjectURL(new Blob([blob], {type: 'application/octet-stream'}))
    download.download = this.paint.name + '.huff'
    download.click()
  }

  exportPng() {
    let paint = this.paint
    let canvas = document.createElement('canvas')
    let context = canvas.getContext('2d')
    canvas.width = paint.sheetColumns
    canvas.height = paint.sheetRows
    let data = context.createImageData(canvas.width, canvas.height)
    exportToCanvas(paint, data.data)
    context.putImageData(data, 0, 0)
    let blob = canvas.toDataURL('image/png')
    let download = document.createElement('a')
    download.href = blob
    download.download = this.paint.name + '.png'
    download.click()
  }

  updateTexture() {
    let paint = this.paint
    let rows = paint.sheetRows
    let columns = paint.sheetColumns
    let pixels = exportPixels(paint)
    updatePixelsToTexture(this.client.gl, this.texture, columns, rows, pixels)
  }

  update(timestamp) {
    let paint = this.paint
    paint.update(timestamp)
    if (paint.hasUpdates) this.updateTexture()
  }

  render() {
    const paint = this.paint
    if (!paint.doPaint) return

    const client = this.client
    const gl = client.gl
    const rendering = client.rendering
    const view = this.view
    const projection = this.projection
    const scale = paint.scale

    if (client.touch) renderTouch(client.touchRender)

    identity(view)
    multiply(projection, client.orthographic, view)

    const font = defaultFont()
    const fontScale = calcFontScale(scale)
    const fontWidth = fontScale * font.width
    const fontHeight = fontScale * font.base

    const thickness = calcThickness(scale)
    const doubleThick = 2 * thickness

    const width = client.width
    const height = client.height - client.top

    let brushSize = paint.brushSize
    let canvasZoom = paint.canvasZoom

    let posOffsetC = paint.positionOffsetC
    let posOffsetR = paint.positionOffsetR

    let posC = paint.positionC
    let posR = paint.positionR

    let paletteRows = paint.paletteRows
    let paletteColumns = paint.paletteColumns
    let palette = paint.paletteFloat

    let sheetRows = paint.sheetRows
    let sheetColumns = paint.sheetColumns

    let toolColumns = paint.toolColumns

    let magnify, top, left, boxWidth, boxHeight, box, x, y

    rendering.setProgram(1)
    rendering.setView(0, client.top, width, height)
    rendering.updateUniformMatrix('u_mvp', projection)

    gl.clearColor(slatef(0), slatef(1), slatef(2), 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    gl.disable(gl.CULL_FACE)
    gl.disable(gl.DEPTH_TEST)

    client.bufferGUI.zero()

    let sheetBox = paint.sheetBox
    let viewBox = paint.viewBox
    let miniBox = paint.miniBox
    let toolBox = paint.toolBox
    let paletteBox = paint.paletteBox

    // sheet

    magnify = 2 * scale
    left = sheetBox.x
    top = sheetBox.y
    boxWidth = sheetBox.width
    boxHeight = sheetBox.height

    drawImage(client.bufferGUI, left, top, boxWidth, boxHeight, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0)

    // mini view

    let sl = posOffsetC / sheetColumns
    let st = posOffsetR / sheetRows
    let sr = (posOffsetC + canvasZoom) / sheetColumns
    let sb = (posOffsetR + canvasZoom) / sheetRows

    drawImage(client.bufferGUI, miniBox.x, miniBox.y, miniBox.width, miniBox.height, 1.0, 1.0, 1.0, 1.0, sl, st, sr, sb)

    // view

    magnify = scale
    if (canvasZoom === 8) magnify *= 16
    if (canvasZoom === 16) magnify *= 8
    if (canvasZoom === 32) magnify *= 4
    if (canvasZoom === 64) magnify *= 2

    left = viewBox.x
    top = viewBox.y
    boxWidth = viewBox.width
    boxHeight = viewBox.height

    drawImage(client.bufferGUI, left, top, boxWidth, boxHeight, 1.0, 1.0, 1.0, 1.0, sl, st, sr, sb)

    rendering.bindTexture(gl.TEXTURE0, this.texture)
    rendering.updateAndDraw(client.bufferGUI)

    rendering.setProgram(0)
    rendering.setView(0, client.top, width, height)
    rendering.updateUniformMatrix('u_mvp', projection)

    // box around view

    client.bufferColor.zero()

    drawHollowRectangle(client.bufferColor, left - thickness, top - thickness, boxWidth + doubleThick, boxHeight + doubleThick, thickness, black0f, black1f, black2f, 1.0)

    // focus in view

    x = left + posC * magnify
    y = top + boxHeight - posR * magnify
    box = magnify * brushSize
    drawHollowRectangle(client.bufferColor, x, y - box, box, box, thickness, black0f, black1f, black2f, 1.0)
    drawHollowRectangle(client.bufferColor, x - thickness, y - thickness - box, box + doubleThick, box + doubleThick, thickness, white0f, white1f, white2f, 1.0)

    // selection in view

    if (paint.selectL !== null) {
      let selectX, selectY, selectWidth, selectHeight
      if (paint.selectR === null) {
        let l = paint.selectL
        let t = paint.selectT
        let r = posC + posOffsetC
        let b = posR + posOffsetR
        if (r < l) {
          let temp = l
          l = r
          r = temp
        }
        if (b < t) {
          let temp = t
          t = b
          b = temp
        }
        selectWidth = (r - l + 1) * magnify
        selectHeight = (b - t + 1) * magnify
        selectX = left + l * magnify
        selectY = top + boxHeight - t * magnify - selectHeight
      } else {
        selectWidth = (paint.selectR - paint.selectL + 1) * magnify
        selectHeight = (paint.selectB - paint.selectT + 1) * magnify
        selectX = left + paint.selectL * magnify
        selectY = top + boxHeight - paint.selectT * magnify - selectHeight
      }
      const rectWidth = selectWidth + doubleThick
      const rectHeight = selectHeight + doubleThick
      if (selectX < x + box && selectY < y + box) {
        selectX -= thickness
        selectY -= thickness
        drawRectangle(client.bufferColor, selectX, selectY, rectWidth, thickness, red0f, red1f, red2f, 1.0)
        drawRectangle(client.bufferColor, selectX, selectY, thickness, rectHeight, red0f, red1f, red2f, 1.0)
        drawRectangle(client.bufferColor, selectX + rectWidth - thickness, selectY, thickness, rectHeight, red0f, red1f, red2f, 1.0)
        drawRectangle(client.bufferColor, selectX, selectY + rectHeight - thickness, rectWidth, thickness, red0f, red1f, red2f, 1.0)
      }
    }

    // sheet

    magnify = 2 * scale
    left = sheetBox.x
    top = sheetBox.y
    boxWidth = sheetBox.width
    boxHeight = sheetBox.height

    // box around sheet

    drawHollowRectangle(client.bufferColor, left - thickness, top - thickness, boxWidth + doubleThick, boxHeight + doubleThick, thickness, black0f, black1f, black2f, 1.0)

    // sprites in sheet

    if (paint.tool === SPRITE_TOOL) {
      for (const sprite of paint.sprites) {
        const w = (sprite.r - sprite.l + 1) * magnify
        const h = (sprite.b - sprite.t + 1) * magnify
        x = left + sprite.l * magnify
        y = top + boxHeight - sprite.t * magnify - h
        drawHollowRectangle(client.bufferColor, x - thickness, y - thickness, w + doubleThick, h + doubleThick, thickness, lavender0f, lavender1f, lavender2f, 1.0)
      }
    }

    // focus in sheet

    x = left + posOffsetC * magnify
    y = top + boxHeight - posOffsetR * magnify
    box = canvasZoom * magnify
    drawHollowRectangle(client.bufferColor, x - thickness, y - thickness - box, box + doubleThick, box + doubleThick, thickness, white0f, white1f, white2f, 1.0)

    // selection in sheet

    if (paint.selectL !== null) {
      let selectionWidth, selectionHeight
      if (paint.selectR === null) {
        let l = paint.selectL
        let t = paint.selectT
        let r = posC + posOffsetC
        let b = posR + posOffsetR
        if (r < l) {
          let temp = l
          l = r
          r = temp
        }
        if (b < t) {
          let temp = t
          t = b
          b = temp
        }
        selectionWidth = (r - l + 1) * magnify
        selectionHeight = (b - t + 1) * magnify
        x = left + l * magnify
        y = top + boxHeight - t * magnify - selectionHeight
      } else {
        selectionWidth = (paint.selectR - paint.selectL + 1) * magnify
        selectionHeight = (paint.selectB - paint.selectT + 1) * magnify
        x = left + paint.selectL * magnify
        y = top + boxHeight - paint.selectT * magnify - selectionHeight
      }
      drawHollowRectangle(client.bufferColor, x - thickness, y - thickness, selectionWidth + doubleThick, selectionHeight + doubleThick, thickness, red0f, red1f, red2f, 1.0)
    }

    // pallete

    magnify = 16 * scale
    boxWidth = paletteBox.width
    boxHeight = paletteBox.height
    left = paletteBox.x
    top = paletteBox.y
    for (let r = 0; r < paletteRows; r++) {
      for (let c = 0; c < paletteColumns; c++) {
        let x = left + c * magnify
        let y = top + boxHeight - (r + 1) * magnify
        let index = (c + r * paletteColumns) * 3
        let red = palette[index]
        let green = palette[index + 1]
        let blue = palette[index + 2]
        drawRectangle(client.bufferColor, x, y, magnify, magnify, red, green, blue, 1.0)
      }
    }

    // box around palette

    drawHollowRectangle(client.bufferColor, left - thickness, top - thickness, boxWidth + doubleThick, boxHeight + doubleThick, thickness, black0f, black1f, black2f, 1.0)

    // focus in palette

    x = left + paint.paletteC * magnify
    y = top + boxHeight - (paint.paletteR + 1) * magnify
    drawHollowRectangle(client.bufferColor, x, y, magnify, magnify, thickness, black0f, black1f, black2f, 1.0)
    drawHollowRectangle(client.bufferColor, x - thickness, y - thickness, magnify + doubleThick, magnify + doubleThick, thickness, white0f, white1f, white2f, 1.0)

    // top and bottom bar

    const topBarHeight = calcTopBarHeight(scale)
    drawRectangle(client.bufferColor, 0, height - topBarHeight, width, topBarHeight, redf(0), redf(1), redf(2), 1.0)

    const bottomBarHeight = calcBottomBarHeight(scale)
    drawRectangle(client.bufferColor, 0, 0, width, bottomBarHeight, redf(0), redf(1), redf(2), 1.0)

    rendering.updateAndDraw(client.bufferColor)

    // special textures

    rendering.setProgram(3)
    rendering.setView(0, client.top, width, height)
    rendering.updateUniformMatrix('u_mvp', projection)

    client.bufferGUI.zero()

    // tools

    let toolMagnify = 16 * scale
    let toolLeft = toolBox.x
    let toolTop = toolBox.y
    y = toolTop
    for (let c = 0; c < toolColumns; c++) {
      let x = toolLeft + c * toolMagnify
      if (c === paint.tool) {
        spr(client.bufferGUI, c, 1.0, 1.0, x, y - 2 * scale, toolMagnify, toolMagnify)
      } else {
        sprcol(client.bufferGUI, c, 1.0, 1.0, x, y - 2 * scale, toolMagnify, toolMagnify, lavenderf(0), lavenderf(1), lavenderf(2), 1.0)
      }
    }

    rendering.bindTexture(gl.TEXTURE0, textureByName('editor-sprites').texture)
    rendering.updateAndDraw(client.bufferGUI)

    // text

    rendering.setProgram(4)
    rendering.setView(0, client.top, width, height)
    rendering.updateUniformMatrix('u_mvp', projection)

    client.bufferGUI.zero()

    let displayC = '' + (posC + posOffsetC)
    let displayR = '' + (posR + posOffsetR)
    while (displayC.length < 3) displayC = '0' + displayC
    while (displayR.length < 3) displayR = '0' + displayR
    let text = 'x:' + displayC + ' y:' + displayR
    let posBox = flexBox(fontWidth * text.length, fontHeight)
    posBox.funX = 'center'
    posBox.fromX = viewBox
    posBox.funY = 'above'
    posBox.fromY = viewBox
    flexSolve(0, 0, posBox)
    drawTextFont(client.bufferGUI, posBox.x, posBox.y, text, fontScale, silverf(0), silverf(1), silverf(2), 1.0, font)

    let displaySheet = paint.name
    let sheetNumBox = flexBox(fontWidth * displaySheet.length, fontHeight)
    sheetNumBox.funX = 'align-left'
    sheetNumBox.fromX = sheetBox
    sheetNumBox.funY = 'above'
    sheetNumBox.fromY = sheetBox
    flexSolve(0, 0, sheetNumBox)
    drawTextFont(client.bufferGUI, sheetNumBox.x, sheetNumBox.y, displaySheet, fontScale, silverf(0), silverf(1), silverf(2), 1.0, font)

    let spriteIndex = posOffsetC / 8 + 2 * posOffsetR
    let displayIndex = ' index:' + (spriteIndex < 10 ? '00' + spriteIndex : spriteIndex < 100 ? '0' + spriteIndex : '' + spriteIndex)
    let positionBox = flexBox(fontWidth * displayIndex.length, fontHeight)
    positionBox.funX = 'align-right'
    positionBox.fromX = sheetBox
    positionBox.funY = 'above'
    positionBox.fromY = sheetBox
    flexSolve(0, 0, positionBox)
    drawTextFont(client.bufferGUI, positionBox.x, positionBox.y, displayIndex, fontScale, silverf(0), silverf(1), silverf(2), 1.0, font)

    //  status text

    renderStatus(client, width, height, font, fontWidth, fontScale, topBarHeight, paint)

    rendering.bindTexture(gl.TEXTURE0, textureByName(font.name).texture)
    rendering.updateAndDraw(client.bufferGUI)

    // dialog box or text box

    if (paint.dialog !== null) renderDialogBox(this, scale, font, paint.dialog)
    else if (paint.activeTextBox) {
      const box = paint.textBox
      renderTextBox(this, scale, font, box, 200, 200)

      client.bufferGUI.zero()
      drawTextFontSpecial(client.bufferGUI, 200, 500, box.text, fontScale, white0f, white1f, white2f, font)
      rendering.updateAndDraw(client.bufferGUI)
    }
  }
}
