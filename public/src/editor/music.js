// import {fetchText} from '/src/client/net.js'
// import {newPalette, newPaletteFloat} from '/src/editor/palette.js'
// import {flexBox, flexSolve, flexSize} from '/src/flex/flex.js'
// import {FONT_WIDTH, FONT_HEIGHT} from '/src/render/render.js'

import {zzfx} from '/src/external/zzfx.js'

const INPUT_RATE = 128
// const HISTORY_LIMIT = 50

class Note {
  constructor() {
    this.pitch0 = 0
    this.pitch1 = 1
    this.pitch2 = 0
    this.length = 0
  }
}

class Track {
  constructor(name) {
    this.name = name
    this.instrument = null
    this.notes = [new Note()]
  }
}

export class MusicEdit {
  constructor(width, height, scale, input) {
    this.width = width
    this.height = height
    this.scale = scale
    this.input = input
    this.shadowInput = true
    this.doPaint = true

    // this.staveRows = 3
    // this.staveColumns = 32

    // this.staveC = 0
    // this.staveR = 0

    this.noteIndex = 0

    this.tempo = 120
    this.transpose = 0

    let guitar = new Track('Guitar')

    this.tracks = [guitar]
    this.trackIndex = 0
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

    if (input.timerLeftUp(timestamp, INPUT_RATE)) {
      this.staveR--
      if (this.staveR < 0) this.staveR = 0
    }

    if (input.timerLeftDown(timestamp, INPUT_RATE)) {
      this.staveR++
      if (this.staveR >= this.staveRows) this.staveR = this.staveRows - 1
    }

    if (input.timerLeftLeft(timestamp, INPUT_RATE)) {
      this.staveC--
      if (this.staveC < 0) this.staveC = 0
    }

    if (input.timerLeftRight(timestamp, INPUT_RATE)) {
      this.staveC++
      if (this.staveC >= this.staveColumns) this.staveC = this.staveColumns - 1
    }

    if (input.timerA(timestamp, INPUT_RATE)) {
      let track = this.tracks[this.trackIndex]
      let index = this.staveC + this.staveR * this.staveColumns
      let note = track.staves[0].notes[index]
      if (note > 0) {
        track.staves[0].notes[index] = note - 1
        zzfx(1, 0.05, 129, 0.01, 0, 0.15, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 5)
      }
    } else if (input.timerB(timestamp, INPUT_RATE)) {
      let track = this.tracks[this.trackIndex]
      let index = this.staveC + this.staveR * this.staveColumns
      let note = track.staves[0].notes[index]
      if (note < 99) {
        track.staves[0].notes[index] = note + 1
        zzfx(1, 0.05, 129, 0.01, 0, 0.15, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 5)
      }
    }
  }

  export() {}
}
