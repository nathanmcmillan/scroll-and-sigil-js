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

// guiar = 49 distinct pitches
// piano = 88 distinct pitches

// 4 string E bass   freq 41.2 hz to  311 hz
// 6 string E guitar freq 82.4 hz to 1397 hz
// 88 key piano      freq 27.5 hz to 4186 hz

// C C# D Eb E F F# G G# A Bb B
const notes0 = [16.35, 17.32, 18.35, 19.45, 20.6, 21.83, 23.12, 24.5, 25.96, 27.5, 29.14, 30.87]
const notes1 = [32.7, 34.65, 36.71, 38.89, 41.2, 43.65, 46.25, 49.0, 51.91, 55.0, 58.27, 61.74]
const notes2 = [65.41, 69.3, 73.42, 77.78, 82.41, 87.31, 92.5, 98.0, 103.8, 110.0, 116.5, 123.5]
const notes3 = [130.8, 138.6, 146.8, 155.6, 164.8, 174.6, 185.0, 196.0, 207.7, 220.0, 233.1, 246.9]
const notes4 = [261.6, 277.2, 293.7, 311.1, 329.6, 349.2, 370.0, 392.0, 415.3, 440.0, 466.2, 493.9]
const notes5 = [523.3, 554.4, 587.3, 622.3, 659.3, 698.5, 740.0, 784.0, 830.6, 880.0, 932.3, 987.8]
const notes6 = [1047, 1109, 1175, 1245, 1319, 1397, 1480, 1568, 1661, 1760, 1865, 1976]
const notes7 = [2093, 2217, 2349, 2489, 2637, 2794, 2960, 3136, 3322, 3520, 3729, 3951]
const notes8 = [4186, 4435, 4699, 4978, 5274, 5588, 5920, 6272, 6645, 7040, 7459, 7902]

function notefun(octave, note) {
  while (note >= 12) {
    octave++
    note -= 12
  }
  if (octave == 0) return notes0[note]
  else if (octave == 1) return notes1[note]
  else if (octave == 2) return notes2[note]
  else if (octave == 3) return notes3[note]
  else if (octave == 4) return notes4[note]
  else if (octave == 5) return notes5[note]
  else if (octave == 6) return notes6[note]
  else if (octave == 7) return notes7[note]
  else return notes8[note]
}

// root is note A, octave 4
function diatonicfun(semitone = 0, root = 440) {
  return root * 2 ** (semitone / 12)
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
    this.transpose = 0 // each instrument should have a base frequency that can be set
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
        notes.push([2, 0, 57, 0])
      }
    }

    // need insert note in middle of track
    // need copy paste section of notes

    if (input.timerA(timestamp, INPUT_RATE)) {
      let row = this.noteR
      let track = this.tracks[this.trackIndex]
      let note = track.notes[this.noteC]
      if (row === 0) {
        if (note[row] > 0) {
          note[row]--
          // plain sawtooth: zzfx(...[1.52,0,174.6141,,,1,2,0])
          // violin: zzfx(...[1.98,0,261.6256,.03,1.85,.39,2,1.43,,,,,.34,.2,,,.06,.82,.01,.11]);
          zzfx(1, 0.05, 537, 0.02, 0.22, 1, 1.59, -6.98, 4.97, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 5)
        }
      } else {
        if (note[row] > 0) {
          note[row]--
          let pitch = notefun(0, note[row])
          console.log(note[row], '=>', pitch)
          zzfx(1, 0.05, pitch, 0.01, 0, 0.15, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 5)
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
          let pitch = notefun(0, note[row])
          console.log(note[row], '=>', pitch)
          zzfx(1, 0.05, pitch, 0.01, 0, 0.15, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 5)
        }
      }
    }

    if (input.pressX()) {
      this.play = true
      this.playAndCalculateNote()
    }

    if (input.pressY()) {
      let notes = this.tracks[this.trackIndex].notes
      notes.splice(this.noteC + 1, 0, [2, 0, 57, 0])
    }
  }

  export() {}
}
