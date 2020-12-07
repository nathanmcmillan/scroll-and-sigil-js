import {fetchText} from '/src/client/net.js'
import {newPalette, newPaletteFloat} from '/src/editor/palette.js'
import {flexBox, flexSolve, flexSize} from '/src/flex/flex.js'
import {FONT_WIDTH, FONT_HEIGHT} from '/src/render/render.js'

export const PENCIL_TOOL = 0
export const ERASE_TOOL = 1
export const TOOL_COUNT = 2

export const DESCRIBE_TOOL = new Array(TOOL_COUNT)
DESCRIBE_TOOL[PENCIL_TOOL] = 'Pencil'
DESCRIBE_TOOL[ERASE_TOOL] = 'Eraser'

const INPUT_RATE = 128

export class PaintEdit {
  constructor(width, height, scale, input) {
    this.width = width
    this.height = height
    this.scale = scale
    this.input = input
    this.shadowInput = true
    this.doPaint = true
    this.hasUpdates = false
    this.canUpdate = true

    this.paletteRows = 4
    this.paletteColumns = 4
    this.palette = newPalette()
    this.paletteFloat = newPaletteFloat(this.palette)

    this.sheetRows = 128
    this.sheetColumns = 128

    this.sheet = new Uint8Array(this.sheetRows * this.sheetColumns)
    let i = this.sheet.length
    while (i--) this.sheet[i] = 0
    this.sheets = [this.sheet]

    this.paletteC = 0
    this.paletteR = 0

    this.sheetIndex = 0

    this.brushSize = 1
    this.canvasZoom = 8

    this.positionOffsetC = 0
    this.positionOffsetR = 0

    this.positionC = 0
    this.positionR = 0

    this.toolColumns = 3

    this.sheetBox = null
    this.viewBox = null
    this.toolBox = null
    this.paletteBox = null

    this.resize(width, height, scale)
  }

  resize(width, height, scale) {
    this.width = width
    this.height = height
    this.scale = scale
    this.shadowInput = true
    this.doPaint = true

    this.plan()
  }

  plan() {
    const width = this.width
    const height = this.height
    const scale = this.scale
    const canvasZoom = this.canvasZoom
    const sheetRows = this.sheetRows
    const sheetColumns = this.sheetColumns
    const paletteRows = this.paletteRows
    const paletteColumns = this.paletteColumns
    const toolColumns = this.toolColumns
    const fontWidth = this.scale * FONT_WIDTH
    const fontHeight = this.scale * FONT_HEIGHT

    let magnify = 2 * scale
    let sheetBox = flexBox(magnify * sheetColumns, magnify * sheetRows)
    sheetBox.rightSpace = 4 * fontWidth
    sheetBox.funX = '%'
    sheetBox.argX = 5
    // sheetBox.argX = Math.floor(0.5 * width - 0.5 * (magnify * sheetColumns + canvasZoom * magnify))
    sheetBox.funY = 'center'
    this.sheetBox = sheetBox

    magnify = scale
    if (canvasZoom === 8) magnify *= 16
    if (canvasZoom === 16) magnify *= 8
    if (canvasZoom === 32) magnify *= 4
    if (canvasZoom === 64) magnify *= 2
    let viewBox = flexBox(canvasZoom * magnify, canvasZoom * magnify)
    viewBox.bottomSpace = 2 * fontHeight
    viewBox.funX = 'right-of'
    viewBox.fromX = sheetBox
    viewBox.funY = 'align-top'
    viewBox.fromY = sheetBox
    this.viewBox = viewBox

    let toolBox = flexBox(toolColumns * fontWidth, 2 * fontHeight)
    toolBox.bottomSpace = 2 * fontHeight
    toolBox.funX = 'center'
    toolBox.fromX = viewBox
    toolBox.funY = 'below'
    toolBox.fromY = viewBox
    this.toolBox = toolBox

    magnify = 16 * scale
    let paletteBox = flexBox(paletteColumns * magnify, paletteRows * magnify)
    paletteBox.funX = 'center'
    paletteBox.fromX = toolBox
    paletteBox.funY = 'below'
    paletteBox.fromY = toolBox
    this.paletteBox = paletteBox

    flexSolve(width, height, sheetBox, viewBox, toolBox, paletteBox)

    console.log(flexSize(sheetBox, viewBox, toolBox, paletteBox))

    // let canvas = flexBox(x, y)
    // flexResolve()
  }

  read(content, into) {
    let image = content.split('\n')
    let index = 0

    let dimensions = image[index].split(' ')
    let width = parseInt(dimensions[0])
    let height = parseInt(dimensions[1])
    index++

    const sheet = this.sheets[into]
    const rows = this.sheetRows
    const columns = this.sheetColumns

    if (height > rows) height = rows
    if (width > columns) width = columns

    for (let h = 0; h < height; h++) {
      let row = image[index].split(' ')
      for (let c = 0; c < width; c++) {
        sheet[c + h * columns] = parseInt(row[c])
      }
      index++
    }

    this.shadowInput = true
    this.doPaint = true
  }

  async load(file) {
    let image = null
    if (file === null) image = localStorage.getItem('paint-sheet')
    else image = await fetchText(file)
    if (image === null || image === undefined) return
    this.read(image, 0)
  }

  update(timestamp) {
    this.doPaint = false
    if (this.input.nothingOn()) {
      if (this.shadowInput) this.shadowInput = false
      else return
    } else this.shadowInput = true
    this.doPaint = true
    this.hasUpdates = false

    let input = this.input

    if (input.leftTrigger()) {
      const move = 8

      if (input.timerLeftUp(timestamp, INPUT_RATE)) {
        this.positionOffsetR -= move
        if (this.positionOffsetR < 0) this.positionOffsetR = 0
        this.canUpdate = true
      }

      if (input.timerLeftDown(timestamp, INPUT_RATE)) {
        this.positionOffsetR += move
        if (this.positionOffsetR + this.canvasZoom >= this.sheetRows) this.positionOffsetR = this.sheetRows - this.canvasZoom
        this.canUpdate = true
      }

      if (input.timerLeftLeft(timestamp, INPUT_RATE)) {
        this.positionOffsetC -= move
        if (this.positionOffsetC < 0) this.positionOffsetC = 0
        this.canUpdate = true
      }

      if (input.timerLeftRight(timestamp, INPUT_RATE)) {
        this.positionOffsetC += move
        if (this.positionOffsetC + this.canvasZoom >= this.sheetColumns) this.positionOffsetC = this.sheetColumns - this.canvasZoom
        this.canUpdate = true
      }
    } else {
      if (input.timerLeftUp(timestamp, INPUT_RATE)) {
        this.paletteR--
        if (this.paletteR < 0) this.paletteR = 0
        this.canUpdate = true
      }

      if (input.timerLeftDown(timestamp, INPUT_RATE)) {
        this.paletteR++
        if (this.paletteR >= this.paletteRows) this.paletteR = this.paletteRows - 1
        this.canUpdate = true
      }

      if (input.timerLeftLeft(timestamp, INPUT_RATE)) {
        this.paletteC--
        if (this.paletteC < 0) this.paletteC = 0
        this.canUpdate = true
      }

      if (input.timerLeftRight(timestamp, INPUT_RATE)) {
        this.paletteC++
        if (this.paletteC >= this.paletteColumns) this.paletteC = this.paletteColumns - 1
        this.canUpdate = true
      }
    }

    if (input.leftTrigger()) {
      if (input.timerRightLeft(timestamp, INPUT_RATE)) {
        this.brushSize--
        if (this.brushSize < 1) this.brushSize = 1
        this.canUpdate = true
      }

      if (input.timerRightRight(timestamp, INPUT_RATE)) {
        this.brushSize++
        if (this.brushSize > 4) this.brushSize = 4
        if (this.positionR + this.brushSize >= this.canvasZoom) this.positionR = this.canvasZoom - this.brushSize
        if (this.positionC + this.brushSize > this.canvasZoom) this.positionC = this.canvasZoom - this.brushSize
        this.canUpdate = true
      }
    } else if (input.rightTrigger()) {
      if (input.timerRightLeft(timestamp, INPUT_RATE)) {
        this.canvasZoom /= 2
        if (this.canvasZoom < 8) this.canvasZoom = 8
        if (this.positionR + this.brushSize >= this.canvasZoom) this.positionR = this.canvasZoom - this.brushSize
        if (this.positionC + this.brushSize > this.canvasZoom) this.positionC = this.canvasZoom - this.brushSize
        this.canUpdate = true
      }

      if (input.timerRightRight(timestamp, INPUT_RATE)) {
        this.canvasZoom *= 2
        if (this.canvasZoom > 64) this.canvasZoom = 64
        if (this.positionOffsetR + this.canvasZoom >= this.sheetRows) this.positionOffsetR = this.sheetRows - this.canvasZoom
        if (this.positionOffsetC + this.canvasZoom >= this.sheetColumns) this.positionOffsetC = this.sheetColumns - this.canvasZoom
        this.canUpdate = true
      }
    } else {
      if (input.timerRightUp(timestamp, INPUT_RATE)) {
        this.positionR--
        if (this.positionR < 0) this.positionR = 0
        this.canUpdate = true
      }

      if (input.timerRightDown(timestamp, INPUT_RATE)) {
        this.positionR++
        if (this.positionR + this.brushSize >= this.canvasZoom) this.positionR = this.canvasZoom - this.brushSize
        this.canUpdate = true
      }

      if (input.timerRightLeft(timestamp, INPUT_RATE)) {
        this.positionC--
        if (this.positionC < 0) this.positionC = 0
        this.canUpdate = true
      }

      if (input.timerRightRight(timestamp, INPUT_RATE)) {
        this.positionC++
        if (this.positionC + this.brushSize >= this.canvasZoom) this.positionC = this.canvasZoom - this.brushSize
        this.canUpdate = true
      }
    }

    if (input.a()) {
      if (this.canUpdate) {
        let columns = this.sheetColumns
        let index = this.positionC + this.positionOffsetC + (this.positionR + this.positionOffsetR) * columns
        let paletteIndex = this.paletteC + this.paletteR * this.paletteColumns
        for (let h = 0; h < this.brushSize; h++) {
          for (let c = 0; c < this.brushSize; c++) {
            this.sheet[c + h * columns + index] = paletteIndex
          }
        }
        this.hasUpdates = true
        this.canUpdate = false
      }
    }
  }

  export() {
    let rows = this.sheetRows
    let columns = this.sheetColumns
    let content = columns + ' ' + rows
    let sheet = this.sheet
    for (let r = 0; r < rows; r++) {
      content += '\n'
      for (let c = 0; c < columns; c++) {
        let index = c + r * columns
        content += sheet[index] + ' '
      }
    }
    return content
  }
}

export function exportSheetPixels(painter, index) {
  let sheet = painter.sheets[index]
  let rows = painter.sheetRows
  let columns = painter.sheetColumns
  let palette = painter.palette
  let pixels = new Uint8Array(rows * columns * 3)
  for (let r = 0; r < rows; r++) {
    let row = r * columns
    for (let c = 0; c < columns; c++) {
      let i = c + row
      let p = sheet[i] * 3
      i *= 3
      pixels[i] = palette[p]
      pixels[i + 1] = palette[p + 1]
      pixels[i + 2] = palette[p + 2]
    }
  }
  return pixels
}

export function exportSheetToCanvas(painter, index, out) {
  let sheet = painter.sheets[index]
  let rows = painter.sheetRows
  let columns = painter.sheetColumns
  let palette = painter.palette
  for (let r = 0; r < rows; r++) {
    let row = r * columns
    for (let c = 0; c < columns; c++) {
      let i = c + row
      let p = sheet[i] * 3
      i *= 4
      if (p === 0) {
        out[i] = 0
        out[i + 1] = 0
        out[i + 2] = 0
        out[i + 3] = 0
      } else {
        out[i] = palette[p]
        out[i + 1] = palette[p + 1]
        out[i + 2] = palette[p + 2]
        out[i + 3] = 255
      }
    }
  }
}
