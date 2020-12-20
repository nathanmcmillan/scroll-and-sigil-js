// import {fetchText} from '/src/client/net.js'
// import {newPalette, newPaletteFloat} from '/src/editor/palette.js'
// import {flexBox, flexSolve, flexSize} from '/src/flex/flex.js'
// import {FONT_WIDTH, FONT_HEIGHT} from '/src/render/render.js'

import {zzfx} from '/src/external/zzfx.js'

const INPUT_RATE = 128
// const HISTORY_LIMIT = 50

class Track {
  constructor(name) {
    this.name = name
    this.instrument = null
    this.notes = [[2, 1, 0, 0]]
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

    this.pitcheRows = 3
    this.noteRows = this.pitcheRows + 1
    this.maxDuration = 6

    this.noteC = 0
    this.noteR = 0

    this.tempo = 120
    this.transpose = 0
    this.play = false
    this.timer = 0
    this.hold = 0

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

  playAndCalculateNote() {
    let note = this.tracks[this.trackIndex].notes[this.noteC]
    zzfx(1, 0.05, 129, 0.01, 0, 0.15, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 5)
    this.timer = 0
    this.hold = (this.tempo / 16) * (1 + note[0])
  }

  updatePlay() {
    let input = this.input

    if (input.pressX()) {
      this.play = false
      this.doPaint = true
      return
    }

    if (this.timer >= this.hold) {
      this.doPaint = true
      this.noteC++
      if (this.noteC === this.tracks[this.trackIndex].notes.length) {
        this.noteC = 0
        this.play = false
      } else {
        this.playAndCalculateNote()
      }
    } else {
      this.timer++
      this.doPaint = false
    }
  }

  update(timestamp) {
    if (this.play) {
      this.updatePlay()
      return
    }

    this.doPaint = false
    if (this.input.nothingOn()) {
      if (this.shadowInput) this.shadowInput = false
      else return
    } else this.shadowInput = true
    this.doPaint = true

    let input = this.input

    if (input.timerLeftUp(timestamp, INPUT_RATE)) {
      if (this.noteR > 0) this.noteR--
    } else if (input.timerLeftDown(timestamp, INPUT_RATE)) {
      if (this.noteR < this.noteRows - 1) this.noteR++
    }

    if (input.timerLeftLeft(timestamp, INPUT_RATE)) {
      if (this.noteC > 0) this.noteC--
    } else if (input.timerLeftRight(timestamp, INPUT_RATE)) {
      this.noteC++
      let notes = this.tracks[this.trackIndex].notes
      if (this.noteC === notes.length) {
        notes.push([2, 0, 0, 0])
      }
    }

    if (input.timerA(timestamp, INPUT_RATE)) {
      let row = this.noteR
      let track = this.tracks[this.trackIndex]
      let note = track.notes[this.noteC]
      if (row === 0) {
        if (note[row] > 0) {
          note[row]--
          zzfx(1, 0.05, 537, 0.02, 0.22, 1, 1.59, -6.98, 4.97, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 5)
        }
      } else {
        if (note[row] > 0) {
          note[row]--
          zzfx(1, 0.05, 129, 0.01, 0, 0.15, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 5)
        }
      }
    } else if (input.timerB(timestamp, INPUT_RATE)) {
      let row = this.noteR
      let track = this.tracks[this.trackIndex]
      let note = track.notes[this.noteC]
      if (row === 0) {
        if (note[row] < this.maxDuration - 1) {
          note[row]++
          zzfx(1, 0.05, 537, 0.02, 0.22, 1, 1.59, -6.98, 4.97, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 5)
        }
      } else {
        if (note[row] < 99) {
          note[row]++
          zzfx(1, 0.05, 129, 0.01, 0, 0.15, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 5)
        }
      }
    }

    if (input.pressX()) {
      this.play = true
      this.playAndCalculateNote()
    }
  }

  export() {}
}
