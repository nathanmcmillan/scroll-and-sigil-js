import {fetchText} from '/src/client/net.js'

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
    this.palette = new Uint8Array(this.paletteRows * this.paletteColumns * 3)
    this.paletteFloat = new Float32Array(this.paletteRows * this.paletteColumns * 3)

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

    setPalette(this.palette)
    setPaletteFloat(this.palette, this.paletteFloat)
  }

  resize(width, height, scale) {
    this.width = width
    this.height = height
    this.scale = scale
    this.shadowInput = true
    this.doPaint = true

    let sheetMagnify = 2 * scale
    let sheetWidth = this.sheetColumns * sheetMagnify
    let sheetHeight = this.sheetRows * sheetMagnify

    let minimumWidth = sheetWidth
    let minimumHeight = sheetHeight

    let middle = 0.5 * width
    let center = 0.5 * height

    this.canvasLeft = Math.floor(middle - 0.5 * minimumWidth)
    this.canvasWidth = minimumWidth

    this.canvasTop = Math.floor(center - 0.5 * minimumHeight)
    this.canvasHeight = minimumHeight

    // this.displaySheetLeft = this.canvasLeft
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
        this.positionR--
        if (this.positionR < 0) this.positionR = 0
        this.canUpdate = true
      }

      if (input.timerLeftDown(timestamp, INPUT_RATE)) {
        this.positionR++
        if (this.positionR + this.brushSize >= this.canvasZoom) this.positionR = this.canvasZoom - this.brushSize
        this.canUpdate = true
      }

      if (input.timerLeftLeft(timestamp, INPUT_RATE)) {
        this.positionC--
        if (this.positionC < 0) this.positionC = 0
        this.canUpdate = true
      }

      if (input.timerLeftRight(timestamp, INPUT_RATE)) {
        this.positionC++
        if (this.positionC + this.brushSize >= this.canvasZoom) this.positionC = this.canvasZoom - this.brushSize
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
        this.paletteR--
        if (this.paletteR < 0) this.paletteR = 0
        this.canUpdate = true
      }

      if (input.timerRightDown(timestamp, INPUT_RATE)) {
        this.paletteR++
        if (this.paletteR >= this.paletteRows) this.paletteR = this.paletteRows - 1
        this.canUpdate = true
      }

      if (input.timerRightLeft(timestamp, INPUT_RATE)) {
        this.paletteC--
        if (this.paletteC < 0) this.paletteC = 0
        this.canUpdate = true
      }

      if (input.timerRightRight(timestamp, INPUT_RATE)) {
        this.paletteC++
        if (this.paletteC >= this.paletteColumns) this.paletteC = this.paletteColumns - 1
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

function setPalette(palette) {
  let index = 0

  palette[index] = 0
  palette[index + 1] = 0
  palette[index + 2] = 0
  index += 3

  palette[index] = 29
  palette[index + 1] = 43
  palette[index + 2] = 83
  index += 3

  palette[index] = 126
  palette[index + 1] = 37
  palette[index + 2] = 83
  index += 3

  palette[index] = 0
  palette[index + 1] = 135
  palette[index + 2] = 81
  index += 3

  palette[index] = 171
  palette[index + 1] = 82
  palette[index + 2] = 54
  index += 3

  palette[index] = 95
  palette[index + 1] = 87
  palette[index + 2] = 79
  index += 3

  palette[index] = 194
  palette[index + 1] = 195
  palette[index + 2] = 199
  index += 3

  palette[index] = 255
  palette[index + 1] = 241
  palette[index + 2] = 232
  index += 3

  palette[index] = 255
  palette[index + 1] = 0
  palette[index + 2] = 77
  index += 3

  palette[index] = 255
  palette[index + 1] = 163
  palette[index + 2] = 0
  index += 3

  palette[index] = 255
  palette[index + 1] = 236
  palette[index + 2] = 39
  index += 3

  palette[index] = 0
  palette[index + 1] = 228
  palette[index + 2] = 54
  index += 3

  palette[index] = 41
  palette[index + 1] = 173
  palette[index + 2] = 255
  index += 3

  palette[index] = 131
  palette[index + 1] = 118
  palette[index + 2] = 156
  index += 3

  palette[index] = 255
  palette[index + 1] = 119
  palette[index + 2] = 168
  index += 3

  palette[index] = 255
  palette[index + 1] = 204
  palette[index + 2] = 170
}

function setPaletteFloat(source, destination) {
  let i = source.length
  while (i--) destination[i] = source[i] / 255.0
}
