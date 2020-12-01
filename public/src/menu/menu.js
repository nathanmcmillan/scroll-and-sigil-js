import * as In from '/src/input/input.js'

const INPUT_RATE = 128

export class MainMenu {
  constructor(width, height) {
    this.width = width
    this.height = height
    this.scale = 1
    this.input = new In.Input()
    this.shadowInput = true
    this.doPaint = true
    this.hasUpdates = false

    this.menuR = 0
  }

  resize(width, height, scale) {
    this.width = width
    this.height = height
    this.scale = scale
    this.shadowInput = true
    this.doPaint = true
  }

  async load() {}

  update(timestamp) {
    this.doPaint = false
    if (this.input.nothingOn()) {
      if (this.shadowInput) this.shadowInput = false
      else return
    } else this.shadowInput = true
    this.doPaint = true
    this.hasUpdates = false

    let input = this.input

    if (input.timerMoveForward(timestamp, INPUT_RATE)) {
      this.positionR--
      if (this.positionR < 0) this.positionR = 0
      this.canUpdate = true
    }

    if (input.timerMoveBackward(timestamp, INPUT_RATE)) {
      this.positionR++
      if (this.positionR + this.brushSize >= this.canvasZoom) this.positionR = this.canvasZoom - this.brushSize
      this.canUpdate = true
    }

    if (input.timerMoveLeft(timestamp, INPUT_RATE)) {
      this.positionC--
      if (this.positionC < 0) this.positionC = 0
      this.canUpdate = true
    }

    if (input.timerMoveRight(timestamp, INPUT_RATE)) {
      this.positionC++
      if (this.positionC + this.brushSize >= this.canvasZoom) this.positionC = this.canvasZoom - this.brushSize
      this.canUpdate = true
    }
  }

  export() {}
}
