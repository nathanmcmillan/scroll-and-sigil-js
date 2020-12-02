import * as In from '/src/input/input.js'

const INPUT_RATE = 128

export class Home {
  constructor(width, height, scale) {
    this.width = width
    this.height = height
    this.scale = scale
    this.input = new In.Input()
    this.shadowInput = true
    this.doPaint = true

    this.row = 0
    this.yes = false
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

    let input = this.input

    if (input.timerMoveForward(timestamp, INPUT_RATE)) {
      this.row--
      if (this.row < 0) this.row = 0
    }

    if (input.timerMoveBackward(timestamp, INPUT_RATE)) {
      this.row++
      if (this.row > 2) this.row = 2
    }

    if (input.pressButtonA()) this.yes = true
  }
}
