import * as In from '/src/input/input.js'

export class MusicEdit {
  constructor(width, height, scale) {
    this.width = width
    this.height = height
    this.scale = scale
    this.input = new In.Input()
    this.shadowInput = true
    this.doPaint = true
    this.hasUpdates = false
  }

  resize(width, height, scale) {
    this.width = width
    this.height = height
    this.scale = scale
    this.shadowInput = true
    this.doPaint = true
  }

  async load() {}

  update() {
    this.doPaint = false
    if (this.input.nothingOn()) {
      if (this.shadowInput) this.shadowInput = false
      else return
    } else this.shadowInput = true
    this.doPaint = true
    this.hasUpdates = false
  }

  export() {}
}
