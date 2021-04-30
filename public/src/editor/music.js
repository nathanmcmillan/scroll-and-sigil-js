/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { fetchText } from '../client/net.js'
import { Dialog } from '../gui/dialog.js'
import { BUTTON_A, BUTTON_B, BUTTON_X, BUTTON_Y } from '../input/input.js'
import { read_synth_wad } from '../sound/audio.js'
import { export_synth_parameters, FREQ, LENGTH, new_synth_parameters, SUSTAIN, synth, synthTime, VOLUME, WAVE, WAVEFORMS } from '../sound/synth.js'
import { wad_parse } from '../wad/wad.js'

const INPUT_RATE = 128

const DEFAULT_NOTE_LENGTH = 4

class Track {
  constructor(name) {
    this.name = name
    this.tuning = 0
    this.parameters = new_synth_parameters()
    this.notes = []
    this.c = 0
    this.r = 0
  }
}

function defaultTrack() {
  const track = new Track('Untitled')
  track.parameters[WAVE] = WAVEFORMS.indexOf('Sine')
  track.parameters[SUSTAIN] = 1.0
  track.parameters[VOLUME] = 0.5
  track.notes.push([DEFAULT_NOTE_LENGTH, 0, 49, 0])
  return track
}

export function lengthName(num) {
  switch (num) {
    case 0:
      return 'Whole'
    case 1:
      return 'Half'
    case 2:
      return 'Quarter'
    case 3:
      return 'Eigth'
    case 4:
      return 'Sixteenth'
    case 5:
      return 'Thirty Second'
    default:
      return null
  }
}

export class MusicEdit {
  constructor(parent, width, height, scale, input) {
    this.parent = parent
    this.width = width
    this.height = height
    this.scale = scale
    this.input = input
    this.shadowInput = true
    this.doPaint = true
    this.forcePaint = false

    this.pitcheRows = 3
    this.noteRows = this.pitcheRows + 1
    this.maxDuration = 6
    this.maxPitch = 99

    this.noteC = 0 // TODO: MOVE THIS TO TRACK
    this.noteR = 0

    this.play = false
    this.noteTimestamp = 0

    this.name = ''
    this.tempo = 0

    this.tracks = []
    this.trackIndex = 0

    this.sounds = []

    this.dialog = null
    this.dialogStack = []

    this.startMenuDialog = new Dialog('start', null, ['name', 'new', 'open', 'save', 'export', 'exit'])
    this.trackDialog = new Dialog('track', null, ['switch track', 'edit', 'tuning', 'new track', 'delete track', 'tempo'])
    this.noteDialog = new Dialog('note', null, ['insert note', 'delete note'])
    this.tuningDialog = new Dialog('tuning', 'tuning', [''])
    this.tempoDialog = new Dialog('tempo', 'tempo', [''])
    this.switchDialog = new Dialog('switch', 'track', null)
    this.askToSaveDialog = new Dialog('ask', 'save current file?', ['save', 'export', 'no'])
    this.saveOkDialog = new Dialog('ok', 'file saved', ['ok'])
    this.errorOkDialog = new Dialog('error', null, ['ok'])

    this.clear()
  }

  clear() {
    this.noteC = 0
    this.noteR = 2

    this.play = false
    this.noteTimestamp = 0

    this.name = 'Untitled'
    this.tempo = 120

    this.tracks.length = 0
    this.tracks.push(defaultTrack())
    this.trackIndex = 0
  }

  reset() {
    this.dialogResetAll()
  }

  handleDialog(event) {
    if (event === 'ask-no') {
      const poll = this.dialogStack[0]
      if (poll === 'start-new') this.clear()
      else this.parent.eventCall(poll)
      this.dialogEnd()
    } else if (event === 'ask-save') {
      const poll = this.dialogStack[0]
      if (poll === 'start-exit') {
        this.parent.eventCall('start-save')
        this.dialogStack.push(event)
        this.dialog = this.saveOkDialog
        this.forcePaint = true
      } else this.dialogEnd()
    } else if (event === 'ask-export') {
      const poll = this.dialogStack[0]
      if (poll === 'start-exit') {
        this.parent.eventCall('start-export')
        this.parent.eventCall('start-exit')
      }
      this.dialogEnd()
    } else if (event === 'start-name') {
      this.textBox.reset(this.name)
      this.askName = true
      this.dialogEnd()
    } else if (event === 'start-save') {
      this.parent.eventCall(event)
      this.dialog = this.saveOkDialog
      this.forcePaint = true
    } else if (event === 'start-new' || event === 'start-open' || event === 'start-exit') {
      this.dialogStack.push(event)
      this.dialog = this.askToSaveDialog
      this.forcePaint = true
    } else if (event === 'start-export') {
      this.parent.eventCall(event)
      this.dialogEnd()
    } else if (event === 'ok-ok') {
      const poll = this.dialogStack[0]
      if (poll === 'start-exit') this.parent.eventCall(poll)
      this.dialogEnd()
    } else if (event === 'error-ok') {
      this.dialogEnd()
    } else if (event === 'note-insert note') {
      const notes = this.tracks[this.trackIndex].notes
      notes.splice(this.noteC + 1, 0, [DEFAULT_NOTE_LENGTH, 0, 49, 0])
      this.noteC++
      this.dialogEnd()
    } else if (event === 'note-delete note') {
      const notes = this.tracks[this.trackIndex].notes
      if (notes.length > 1) notes.splice(this.noteC, 1)
      this.dialogEnd()
    } else if (event === 'track-new track') {
      this.tracks.push(defaultTrack())
      this.trackIndex = this.tracks.length - 1
      console.debug(this.tracks, '//', this.trackIndex)
      this.dialogEnd()
    } else if (event === 'track-delete track') {
      if (this.tracks.length > 1) {
        this.tracks.splice(this.trackIndex, 1)
        this.trackIndex = Math.min(this.trackIndex, this.tracks.length - 1)
      }
      this.dialogEnd()
    } else if (event === 'track-switch track') {
      this.dialogStack.push(event)
      const options = new Array(this.tracks.length)
      for (let i = 0; i < this.tracks.length; i++) options[i] = this.tracks[i].name
      this.switchDialog.options = options
      this.dialog = this.switchDialog
      this.forcePaint = true
    } else if (event.startsWith('switch-')) {
      const dash = event.indexOf('-')
      const track = event.substring(dash + 1)
      for (let i = 0; i < this.tracks.length; i++) {
        if (this.tracks[i].name === track) {
          this.trackIndex = i
          break
        }
      }
      this.dialogEnd()
    } else if (event === 'track-tuning') {
      this.dialogStack.push(event)
      const track = this.tracks[this.trackIndex]
      this.tuningDialog.options[0] = '' + track.tuning
      this.dialog = this.tuningDialog
      this.forcePaint = true
    } else if (event === 'track-tempo') {
      this.dialogStack.push(event)
      this.tempoDialog.options[0] = '' + this.tempo
      this.dialog = this.tempoDialog
      this.forcePaint = true
    }
  }

  handleDialogSpecial(left) {
    const event = this.dialog.id
    if (event === 'tuning') {
      const track = this.tracks[this.trackIndex]
      let tuning = track.tuning
      if (left) {
        if (tuning > -12) tuning--
      } else if (tuning < 12) tuning++
      this.dialog.options[0] = '' + tuning
      track.tuning = tuning
    } else if (event === 'tempo') {
      let tempo = this.tempo
      if (left) {
        if (tempo > 60) tempo--
      } else if (tempo < 240) tempo++
      this.dialog.options[0] = '' + tempo
      this.tempo = tempo
    }
  }

  dialogResetAll() {
    this.startMenuDialog.reset()
    this.trackDialog.reset()
    this.noteDialog.reset()
    this.tuningDialog.reset()
    this.tempoDialog.reset()
    this.switchDialog.reset()
    this.askToSaveDialog.reset()
    this.saveOkDialog.reset()
    this.errorOkDialog.reset()
  }

  dialogEnd() {
    this.dialogResetAll()
    this.dialog = null
    this.dialogStack.length = 0
    this.forcePaint = true
  }

  resize(width, height, scale) {
    this.width = width
    this.height = height
    this.scale = scale
    this.shadowInput = true
    this.doPaint = true
  }

  read(content) {
    this.clear()

    try {
      const wad = wad_parse(content)

      this.name = wad.get('music')
      this.tempo = parseInt(wad.get('tempo'))

      this.tracks.length = 0

      for (const data of wad.get('tracks')) {
        const name = data.get('name')
        const parameters = data.get('parameters')
        const notes = data.get('notes')
        const track = new Track(name)
        track.tuning = parseInt(data.get('tuning'))
        read_synth_wad(track.parameters, parameters)
        for (const note of notes) {
          const a = parseInt(note[0])
          const b = parseInt(note[1])
          const c = parseInt(note[2])
          const d = parseInt(note[3])
          track.notes.push([a, b, c, d])
        }
        this.tracks.push(track)
      }
    } catch (e) {
      console.error(e)
      this.clear()
      this.errorOkDialog.title = 'Failed reading file'
      this.dialog = this.errorOkDialog
    }

    this.shadowInput = true
    this.doPaint = true
  }

  async load(file) {
    let content = null
    if (file) content = await fetchText(file)
    else content = localStorage.getItem('music')
    if (content === null || content === undefined) return this.clear()
    this.read(content)
  }

  noteSeconds(duration) {
    // 16 ms tick update
    // timestamp is in milliseconds
    // tempo = 120
    // 30 whole notes per minute | 1 whole note === 2 seconds
    // 60 half notes per minute | 1 half note === 1 second
    // 120 quarter notes per minute | 1 quarter note ===  0.5 seconds
    // 240 eight notes per minute
    // 480 sixteenth notes per minute
    // 960 thirty-second notes per minute
    let length = 0
    if (duration === 0) length = this.tempo * 4
    else if (duration === 1) length = this.tempo * 2
    else if (duration === 2) length = this.tempo
    else if (duration === 3) length = this.tempo / 2
    else if (duration === 4) length = this.tempo / 4
    else if (duration === 5) length = this.tempo / 8
    return length / 60
  }

  playOneNote(row) {
    for (const sound of this.sounds) sound.stop()
    this.sounds.length = 0
    const track = this.tracks[this.trackIndex]
    const note = track.notes[this.noteC]
    const length = this.noteSeconds(note[0]) * 1000
    if (row === 0) {
      for (let r = 1; r < this.noteRows; r++) {
        const num = note[r]
        if (num === 0) continue
        const parameters = track.parameters.slice()
        parameters[FREQ] = num + track.tuning
        parameters[LENGTH] = length
        this.sounds.push(synth(parameters))
      }
    } else {
      const num = note[row]
      if (num > 0) {
        const parameters = track.parameters.slice()
        parameters[FREQ] = num + track.tuning
        parameters[LENGTH] = length
        this.sounds.push(synth(parameters))
      }
    }
  }

  playAndCalculateNote(timestamp) {
    const time = synthTime()
    const when = time + (1.0 / 1000.0) * 16.0
    const track = this.tracks[this.trackIndex]
    const note = track.notes[this.noteC]
    const length = this.noteSeconds(note[0]) * 1000
    for (let r = 1; r < this.noteRows; r++) {
      const num = note[r]
      if (num === 0) continue
      const parameters = track.parameters.slice()
      parameters[FREQ] = num + track.tuning
      parameters[LENGTH] = length
      this.sounds.push(synth(parameters, when))
    }
    this.noteTimestamp = timestamp + length
  }

  updatePlay(timestamp) {
    const input = this.input
    if (input.pressX()) {
      for (const sound of this.sounds) sound.stop()
      this.sounds.length = 0
      this.play = false
      this.doPaint = true
      return
    }
    if (timestamp >= this.noteTimestamp) {
      this.doPaint = true
      this.noteC++
      if (this.noteC === this.tracks[this.trackIndex].notes.length) {
        this.sounds.length = 0
        this.play = false
        this.noteC = 0
      } else {
        this.playAndCalculateNote(timestamp)
      }
    } else {
      this.doPaint = false
    }
  }

  topLeftStatus() {
    return 'MUSIC'
  }

  topRightStatus() {
    const track = this.tracks[this.trackIndex]
    return 'TRACK ' + track.name.toUpperCase() + ' TUNING ' + track.tuning + ' TEMPO ' + this.tempo
  }

  bottomLeftStatus() {
    return null
  }

  bottomRightStatus() {
    const input = this.input
    let content = null
    if (this.noteR === 0) content = input.name(BUTTON_A) + '/DURATION UP ' + input.name(BUTTON_Y) + '/DURATION DOWN '
    else content = input.name(BUTTON_A) + '/PITCH UP ' + input.name(BUTTON_Y) + 'PITCH DOWN '
    content += input.name(BUTTON_B) + '/NOTE '
    content += input.name(BUTTON_X) + (this.play ? '/STOP' : '/START')
    return content
  }

  immediate() {}

  events() {
    if (this.dialog === null) return
    const input = this.input
    if (input.pressB()) {
      this.dialog = null
      this.dialogStack.length = 0
      this.forcePaint = true
    }
    if (input.pressA() || input.pressStart() || input.pressSelect()) {
      const id = this.dialog.id
      const option = this.dialog.options[this.dialog.pos]
      this.handleDialog(id + '-' + option)
    }
  }

  update(timestamp) {
    this.events()

    if (this.play) {
      this.updatePlay(timestamp)
      return
    }

    if (this.forcePaint) {
      this.doPaint = true
      this.forcePaint = false
    } else this.doPaint = false
    if (this.input.nothingOn()) {
      if (this.shadowInput) this.shadowInput = false
      else return
    } else this.shadowInput = true
    this.doPaint = true

    const input = this.input

    if (this.dialog !== null) {
      if (input.timerStickUp(timestamp, INPUT_RATE)) {
        if (this.dialog.pos > 0) this.dialog.pos--
      } else if (input.timerStickDown(timestamp, INPUT_RATE)) {
        if (this.dialog.pos < this.dialog.options.length - 1) this.dialog.pos++
      } else if (input.timerStickLeft(timestamp, INPUT_RATE)) this.handleDialogSpecial(true)
      else if (input.timerStickRight(timestamp, INPUT_RATE)) this.handleDialogSpecial(false)
      return
    }

    if (input.pressStart()) {
      this.dialog = this.startMenuDialog
      return
    }

    if (input.pressSelect()) {
      this.dialog = this.trackDialog
      return
    }

    if (input.timerStickUp(timestamp, INPUT_RATE)) {
      if (this.noteR > 0) this.noteR--
    } else if (input.timerStickDown(timestamp, INPUT_RATE)) {
      if (this.noteR < this.noteRows - 1) this.noteR++
    }

    if (input.timerStickLeft(timestamp, INPUT_RATE)) {
      if (this.noteC > 0) this.noteC--
    } else if (input.timerStickRight(timestamp, INPUT_RATE)) {
      this.noteC++
      const notes = this.tracks[this.trackIndex].notes
      if (this.noteC === notes.length) {
        notes.push([DEFAULT_NOTE_LENGTH, 0, 49, 0])
      }
    }

    if (input.timerA(timestamp, INPUT_RATE)) {
      const row = this.noteR
      const track = this.tracks[this.trackIndex]
      const note = track.notes[this.noteC]
      if (row === 0) {
        if (input.leftTrigger()) note[row] = 0
        else if (note[row] > 0) note[row]--
      } else {
        if (input.leftTrigger()) note[row] = Math.min(note[row] + 12, this.maxPitch)
        else if (note[row] < this.maxPitch) note[row]++
      }
      this.playOneNote(this.noteR)
    } else if (input.timerY(timestamp, INPUT_RATE)) {
      const row = this.noteR
      const track = this.tracks[this.trackIndex]
      const note = track.notes[this.noteC]
      if (row === 0) {
        if (input.leftTrigger()) note[row] = this.maxDuration - 1
        else if (note[row] < this.maxDuration - 1) note[row]++
      } else {
        if (input.leftTrigger()) note[row] = Math.max(note[row] - 12, 0)
        else if (note[row] > 0) note[row]--
      }
      this.playOneNote(this.noteR)
    }

    if (input.pressB()) this.playOneNote(0)

    if (input.pressX()) {
      this.play = true
      this.playAndCalculateNote(timestamp)
    }

    if (input.pressRightTrigger()) {
      this.dialog = this.noteDialog
      return
    }
  }

  export() {
    const noteRows = this.noteRows
    const tracks = this.tracks
    let content = 'music = ' + this.name
    content += '\ntempo = ' + this.tempo
    content += '\ntracks ['
    for (const track of tracks) {
      const notes = track.notes
      content += '\n  {\n    name = ' + track.name
      content += '\n    tuning = ' + track.tuning
      const synth = export_synth_parameters(track.parameters).split('\n')
      content += '\n'
      for (const parameter of synth) {
        content += '    ' + parameter + '\n'
      }
      content += '    notes ['
      for (let c = 0; c < notes.length; c++) {
        const note = notes[c]
        if (c % 20 === 0) content += '\n      '
        else content += ' '
        content += '['
        for (let r = 0; r < noteRows; r++) {
          if (r !== 0) content += ' '
          content += note[r]
        }
        content += ']'
      }
      content += '\n    ]\n  }'
    }
    content += '\n]'
    return content
  }
}
