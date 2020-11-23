import * as In from '/src/editor/editor-input.js'

export const PENCIL_TOOL = 0
export const ERASE_TOOL = 1
export const TOOL_COUNT = 2

export const DESCRIBE_TOOL = new Array(TOOL_COUNT)
DESCRIBE_TOOL[PENCIL_TOOL] = 'Pencil'
DESCRIBE_TOOL[ERASE_TOOL] = 'Eraser'

export class Painter {
  constructor(width, height) {
    this.width = width
    this.height = height
    this.input = new In.EditorInput()
    this.zoom = 1
    this.shadowInput = true
    this.doPaint = true

    this.paletteRows = 2
    this.paletteColumns = 8
    this.palette = new Float32Array(this.paletteRows * this.paletteColumns * 3)

    this.sheetRows = 128
    this.sheetColumns = 128
    this.sheet = new Uint8Array(this.sheetRows * this.sheetColumns)
    let i = this.sheet.length
    while (i--) this.sheet[i] = 2
    this.sheets = [this.sheet]

    this.rows = 8
    this.columns = 8
    this.matrix = new Uint8Array(this.rows * this.columns)
    i = this.matrix.length
    while (i--) this.matrix[i] = 1

    this.paletteC = 0
    this.paletteR = 0

    this.sheetIndex = 0

    this.positionC = 0
    this.positionR = 0

    setPalette(this.palette)
  }

  resize(width, height) {
    this.width = width
    this.height = height
  }

  async load() {}

  update() {
    this.doPaint = false
    if (this.input.nothingOn()) {
      if (this.shadowInput) this.shadowInput = false
      else return
    } else this.shadowInput = true
    this.doPaint = true

    let input = this.input
    if (input.buttonA()) {
      input.in[In.BUTTON_A] = false

      let index = this.positionC + this.positionR * this.columns
      let paletteIndex = this.paletteC + this.paletteR * this.paletteColumns
      this.matrix[index] = paletteIndex
    }

    if (input.moveForward()) {
      input.in[In.MOVE_FORWARD] = false
      this.positionR--
      if (this.positionR < 0) this.positionR = 0
    }

    if (input.moveBackward()) {
      input.in[In.MOVE_BACKWARD] = false
      this.positionR++
      if (this.positionR >= this.rows) this.positionR = this.rows - 1
    }

    if (input.moveLeft()) {
      input.in[In.MOVE_LEFT] = false
      this.positionC--
      if (this.positionC < 0) this.positionC = 0
    }

    if (input.moveRight()) {
      input.in[In.MOVE_RIGHT] = false
      this.positionC++
      if (this.positionC >= this.columns) this.positionC = this.columns - 1
    }

    if (input.lookUp()) {
      input.in[In.LOOK_UP] = false
      this.paletteR--
      if (this.paletteR < 0) this.paletteR = 0
    }

    if (input.lookDown()) {
      input.in[In.LOOK_DOWN] = false
      this.paletteR++
      if (this.paletteR >= this.paletteRows) this.paletteR = this.paletteRows - 1
    }

    if (input.lookLeft()) {
      input.in[In.LOOK_LEFT] = false
      this.paletteC--
      if (this.paletteC < 0) this.paletteC = 0
    }

    if (input.lookRight()) {
      input.in[In.LOOK_RIGHT] = false
      this.paletteC++
      if (this.paletteC >= this.paletteColumns) this.paletteC = this.paletteColumns - 1
    }
  }

  export() {
    let rows = this.rows
    let columns = this.columns
    let content = columns + ' ' + rows
    let matrix = this.matrix
    for (let r = 0; r < rows; r++) {
      content += '\n'
      for (let c = 0; c < columns; c++) {
        let index = c + r * columns
        content += matrix[index] + ' '
      }
    }
    return content
  }
}

function setPalette(palette) {
  let index = 0

  palette[index] = 0.0
  palette[index + 1] = 0.0
  palette[index + 2] = 0.0
  index += 3

  palette[index] = 29.0 / 255.0
  palette[index + 1] = 43.0 / 255.0
  palette[index + 2] = 83.0 / 255.0
  index += 3

  palette[index] = 126.0 / 255.0
  palette[index + 1] = 37.0 / 255.0
  palette[index + 2] = 83.0 / 255.0
  index += 3

  palette[index] = 0.0 / 255.0
  palette[index + 1] = 135.0 / 255.0
  palette[index + 2] = 81.0 / 255.0
  index += 3

  palette[index] = 171.0 / 255.0
  palette[index + 1] = 82.0 / 255.0
  palette[index + 2] = 54.0 / 255.0
  index += 3

  palette[index] = 95.0 / 255.0
  palette[index + 1] = 87.0 / 255.0
  palette[index + 2] = 79.0 / 255.0
  index += 3

  palette[index] = 194.0 / 255.0
  palette[index + 1] = 195.0 / 255.0
  palette[index + 2] = 199.0 / 255.0
  index += 3

  palette[index] = 255.0 / 255.0
  palette[index + 1] = 241.0 / 255.0
  palette[index + 2] = 232.0 / 255.0
  index += 3

  palette[index] = 255.0 / 255.0
  palette[index + 1] = 0.0 / 255.0
  palette[index + 2] = 77.0 / 255.0
  index += 3

  palette[index] = 255.0 / 255.0
  palette[index + 1] = 163.0 / 255.0
  palette[index + 2] = 0.0 / 255.0
  index += 3

  palette[index] = 255.0 / 255.0
  palette[index + 1] = 236.0 / 255.0
  palette[index + 2] = 39.0 / 255.0
  index += 3

  palette[index] = 0.0 / 255.0
  palette[index + 1] = 228.0 / 255.0
  palette[index + 2] = 54.0 / 255.0
  index += 3

  palette[index] = 41.0 / 255.0
  palette[index + 1] = 173.0 / 255.0
  palette[index + 2] = 255.0 / 255.0
  index += 3

  palette[index] = 131.0 / 255.0
  palette[index + 1] = 118.0 / 255.0
  palette[index + 2] = 156.0 / 255.0
  index += 3

  palette[index] = 255.0 / 255.0
  palette[index + 1] = 119.0 / 255.0
  palette[index + 2] = 168.0 / 255.0
  index += 3

  palette[index] = 255.0 / 255.0
  palette[index + 1] = 204.0 / 255.0
  palette[index + 2] = 170.0 / 255.0
}
