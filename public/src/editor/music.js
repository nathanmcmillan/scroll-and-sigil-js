/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { soundList } from '../assets/sounds.js'
import { fetchText } from '../client/net.js'
import { Dialog } from '../gui/dialog.js'
import { BUTTON_A, BUTTON_B, BUTTON_X, BUTTON_Y } from '../input/input.js'
import { read_synth_wad } from '../sound/audio.js'
import { export_synth_parameters, FREQ, LENGTH, new_synth_parameters, NOTES, SUSTAIN, synth, synthTime, VOLUME, WAVE, WAVEFORMS } from '../sound/synth.js'
import { wad_parse } from '../wad/wad.js'

const INPUT_RATE = 128

const DEFAULT_NOTE_LENGTH = 3

const PITCH_ROWS = 3
const NOTE_START = 4
export const NOTE_ROWS = PITCH_ROWS + 1

const MUSIC_SLICE = 500

export const MUSIC_SCALE_LIST = [
  'Major',
  'Minor',
  'Pentatonic Major',
  'Pentatonic Minor',
  'Harmonic Major',
  'Harmonic Minor',
  'Melodic Minor',
  'Augmented',
  'Blues',
  'Whole Tone',
  'Algerian',
]

export const MUSIC_SCALE = new Map()

MUSIC_SCALE.set('Major', [2, 2, 1, 2, 2, 2, 1])
MUSIC_SCALE.set('Minor', [2, 1, 2, 2, 1, 2, 2])
MUSIC_SCALE.set('Pentatonic Major', [2, 2, 3, 2, 3])
MUSIC_SCALE.set('Pentatonic Minor', [3, 2, 2, 3, 2])
MUSIC_SCALE.set('Harmonic Major', [2, 2, 1, 2, 1, 3, 1])
MUSIC_SCALE.set('Harmonic Minor', [2, 1, 2, 2, 1, 3, 1])
MUSIC_SCALE.set('Melodic Minor', [2, 1, 2, 2, 2, 2, 1])
MUSIC_SCALE.set('Augmented', [3, 1, 3, 1, 3, 1])
MUSIC_SCALE.set('Blues', [3, 2, 1, 1, 3, 2])
MUSIC_SCALE.set('Whole Tone', [2, 2, 2, 2, 2, 2])
MUSIC_SCALE.set('Algerian', [2, 1, 3, 1, 1, 3, 1, 2, 1, 2])

export function musicScale(root, mode) {
  const steps = MUSIC_SCALE.get(mode)
  const out = [root]
  let index = NOTES.indexOf(root)
  for (let i = 0; i < steps.length; i++) {
    index += steps[i]
    if (index >= NOTES.length) index -= NOTES.length
    out.push(NOTES[index])
  }
  return out
}

function newNote() {
  return [DEFAULT_NOTE_LENGTH, 0, 49, 0, 0]
}

class Track {
  constructor(name) {
    this.name = name
    this.tuning = 0
    this.parameters = new_synth_parameters()
    this.notes = []
    this.c = 0
    this.r = 2
    this.save = 0
    this.i = 0
  }
}

function defaultTrack() {
  const track = new Track('Untitled')
  track.parameters[WAVE] = WAVEFORMS.indexOf('Sine')
  track.parameters[SUSTAIN] = 1.0
  track.parameters[VOLUME] = 0.5
  track.notes.push(newNote())
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

    this.maxDuration = 6
    this.maxPitch = 99

    this.play = false
    this.musicOrigin = 0
    this.noteTime = 0
    this.musicTime = 0
    this.musicFrom = 0
    this.musicTo = 0

    this.name = ''
    this.tempo = 0
    this.scaleRoot = ''
    this.scaleMode = ''

    this.track = null
    this.tracks = []

    this.sounds = []

    this.dialog = null
    this.dialogStack = []

    this.startMenuDialog = new Dialog('Start', null, ['Name', 'New', 'Open', 'Save', 'Export', 'Exit'])
    this.trackDialog = new Dialog('Track', null, ['Switch Track', 'Instrument', 'Tuning', 'Mute', 'New Track', 'Delete Track', 'Tempo', 'Signature'])
    this.noteDialog = new Dialog('Note', null, ['Insert Note', 'Delete Note'])
    this.tuningDialog = new Dialog('Tuning', 'Tuning', [''])
    this.tempoDialog = new Dialog('Tempo', 'Tempo', [''])
    this.signatureDialog = new Dialog('Signature', 'Music Signature', ['Root Note', 'Music Scale'])
    this.rootNoteDialog = new Dialog('Root', 'Root Note', null)
    this.scaleDialog = new Dialog('Scale', 'Music Scale', null)
    this.switchDialog = new Dialog('Switch', 'Track', null)
    this.instrumentDialog = new Dialog('Instrument', 'Instrument', null)
    this.askToSaveDialog = new Dialog('Ask', 'Save Current File?', ['Save', 'Export', 'No'])
    this.deleteOkDialog = new Dialog('Delete', 'Delete Current Track?', ['Continue', 'Cancel'])
    this.saveOkDialog = new Dialog('Ok', 'File Saved', ['Ok'])
    this.errorOkDialog = new Dialog('Error', null, ['Ok'])

    this.clear()
  }

  clear() {
    this.play = false
    this.musicOrigin = 0
    this.noteTime = 0
    this.musicTime = 0
    this.musicFrom = 0
    this.musicTo = 0

    this.name = 'Untitled'
    this.tempo = 120
    this.scaleRoot = 'C'
    this.scaleMode = 'Major'

    this.track = defaultTrack()
    this.tracks.length = 0
    this.tracks.push(this.track)
  }

  reset() {
    this.dialogResetAll()
  }

  handleDialog(event) {
    if (event === 'Ask-No') {
      const poll = this.dialogStack[0]
      if (poll === 'Start-New') this.clear()
      else this.parent.eventCall(poll)
      this.dialogEnd()
    } else if (event === 'Ask-Save') {
      const poll = this.dialogStack[0]
      if (poll === 'Start-Exit') {
        this.parent.eventCall('Start-Save')
        this.dialogStack.push(event)
        this.dialog = this.saveOkDialog
        this.forcePaint = true
      } else this.dialogEnd()
    } else if (event === 'Ask-Export') {
      const poll = this.dialogStack[0]
      if (poll === 'Start-Exit') {
        this.parent.eventCall('Start-Export')
        this.parent.eventCall('Start-Exit')
      }
      this.dialogEnd()
    } else if (event === 'Start-Name') {
      this.textBox.reset(this.name)
      this.askName = true
      this.dialogEnd()
    } else if (event === 'Start-Save') {
      this.parent.eventCall(event)
      this.dialog = this.saveOkDialog
      this.forcePaint = true
    } else if (event === 'Start-New' || event === 'Start-Open' || event === 'Start-Exit') {
      this.dialogStack.push(event)
      this.dialog = this.askToSaveDialog
      this.forcePaint = true
    } else if (event === 'Start-Export') {
      this.parent.eventCall(event)
      this.dialogEnd()
    } else if (event === 'Ok-Ok') {
      const poll = this.dialogStack[0]
      if (poll === 'Start-Exit') this.parent.eventCall(poll)
      this.dialogEnd()
    } else if (event === 'Error-Ok') {
      this.dialogEnd()
    } else if (event === 'Note-Insert Note') {
      const notes = this.track.notes
      notes.splice(this.track.c + 1, 0, newNote())
      this.track.c++
      this.dialogEnd()
    } else if (event === 'Note-Delete Note') {
      const notes = this.track.notes
      if (notes.length > 1) {
        notes.splice(this.track.c, 1)
        this.track.c = Math.min(this.track.c, this.track.notes.length - 1)
      }
      this.dialogEnd()
    } else if (event === 'Track-Instrument') {
      const sounds = soundList()
      const options = []
      for (const [name, value] of sounds) {
        if (!(value instanceof Audio)) options.push(name)
      }
      this.instrumentDialog.options = options
      this.dialog = this.instrumentDialog
      this.forcePaint = true
    } else if (event === 'Track-New Track') {
      this.track = defaultTrack()
      this.tracks.push(this.track)
      this.dialogEnd()
    } else if (event === 'Track-Delete Track') {
      this.dialog = this.deleteOkDialog
      this.forcePaint = true
    } else if (event === 'Delete-Continue') {
      if (this.tracks.length === 1) {
        this.track = defaultTrack()
        this.tracks[0] = this.track
      } else {
        const index = this.tracks.indexOf(this.track)
        if (index >= 0) {
          this.tracks.splice(index, 1)
          this.track = this.tracks[Math.min(index, this.tracks.length - 1)]
        }
      }
      this.dialogEnd()
    } else if (event === 'Track-Switch Track') {
      const options = new Array(this.tracks.length)
      for (let i = 0; i < options.length; i++) options[i] = this.tracks[i].name
      this.switchDialog.options = options
      this.dialog = this.switchDialog
      this.forcePaint = true
    } else if (event.startsWith('Switch-')) {
      this.track = this.tracks[this.switchDialog.pos]
      this.dialogEnd()
    } else if (event === 'Track-Tuning') {
      this.tuningDialog.options[0] = '' + this.track.tuning
      this.dialog = this.tuningDialog
      this.forcePaint = true
    } else if (event === 'Track-Tempo') {
      this.tempoDialog.options[0] = '' + this.tempo
      this.dialog = this.tempoDialog
      this.forcePaint = true
    } else if (event === 'Track-Signature') {
      this.dialog = this.signatureDialog
      this.forcePaint = true
    } else if (event === 'Signature-Root Note') {
      this.dialog = this.rootNoteDialog
      this.dialog.options = NOTES
      this.forcePaint = true
    } else if (event === 'Signature-Music Scale') {
      this.dialog = this.scaleDialog
      this.dialog.options = MUSIC_SCALE_LIST
      this.forcePaint = true
    } else if (event.startsWith('Root-')) {
      this.scaleRoot = NOTES[this.dialog.pos]
      this.dialogEnd()
    } else if (event.startsWith('Scale-')) {
      this.scaleMode = MUSIC_SCALE_LIST[this.dialog.pos]
      this.dialogEnd()
    } else if (event.startsWith('Instrument-')) {
      const sounds = soundList()
      const parameters = sounds.get(this.dialog.options[this.dialog.pos]).parameters
      for (let i = 0; i < parameters.length; i++) this.track.parameters[i] = parameters[i]
      this.dialogEnd()
    } else {
      this.dialogEnd()
    }
  }

  handleDialogSpecial(left) {
    const event = this.dialog.id
    if (event === 'Tuning') {
      const track = this.track
      let tuning = track.tuning
      if (left) {
        if (tuning > -12) tuning--
      } else if (tuning < 12) tuning++
      this.dialog.options[0] = '' + tuning
      track.tuning = tuning
    } else if (event === 'Tempo') {
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
    this.signatureDialog.reset()
    this.rootNoteDialog.reset()
    this.scaleDialog.reset()
    this.switchDialog.reset()
    this.instrumentDialog.reset()
    this.askToSaveDialog.reset()
    this.deleteOkDialog.reset()
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
      this.track = this.tracks[0]
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

  duration(note) {
    if (note === 0) return (240 / this.tempo) * 1000
    else if (note === 1) return (120 / this.tempo) * 1000
    else if (note === 2) return (60 / this.tempo) * 1000
    else if (note === 3) return (30 / this.tempo) * 1000
    else if (note === 4) return (15 / this.tempo) * 1000
    else return (7.5 / this.tempo) * 1000
  }

  playRowNote(row) {
    for (const sound of this.sounds) sound.stop()
    this.sounds.length = 0
    const track = this.track
    const note = track.notes[track.c]
    const parameters = track.parameters.slice()
    parameters[LENGTH] = this.duration(note[0])
    if (row === 0) {
      for (let r = 1; r < NOTE_ROWS; r++) {
        const num = note[r]
        if (num === 0) continue
        parameters[FREQ] = num + track.tuning
        this.sounds.push(synth(parameters))
      }
    } else {
      const num = note[row]
      if (num > 0) {
        parameters[FREQ] = num + track.tuning
        this.sounds.push(synth(parameters))
      }
    }
  }

  calcMusicTime() {
    const tracks = this.tracks
    const size = tracks.length
    for (let t = 0; t < size; t++) {
      const track = tracks[t]
      track.i = 0
      const notes = track.notes
      const count = notes.length
      let time = 0
      for (let n = 0; n < count; n++) {
        const note = notes[n]
        note[NOTE_START] = time
        time += this.duration(note[0])
      }
    }
  }

  timeAtNote() {
    const track = this.track
    const note = track.notes[track.c]
    return note[NOTE_START]
  }

  playNote(track, note, when) {
    const parameters = track.parameters.slice()
    parameters[LENGTH] = this.duration(note[0])
    for (let r = 1; r < NOTE_ROWS; r++) {
      const num = note[r]
      if (num === 0) continue
      parameters[FREQ] = num + track.tuning
      this.sounds.push(synth(parameters, when))
    }
  }

  calcNoteTime(timestamp) {
    const track = this.track
    const note = track.notes[track.c]
    this.noteTime = timestamp + this.duration(note[0])
  }

  playMusic(timestamp) {
    if (timestamp < this.musicTime) return

    const origin = this.musicOrigin
    const start = this.musicFrom
    const end = this.musicTo

    const tracks = this.tracks
    const size = tracks.length
    for (let t = 0; t < size; t++) {
      const track = tracks[t]
      const notes = track.notes
      const count = notes.length
      for (let n = track.i; n < count; n++) {
        const note = notes[n]
        const current = note[NOTE_START]
        if (current < start) continue
        else if (current >= end) {
          track.i = n
          break
        }
        const when = origin + current / 1000.0
        this.playNote(track, note, when)
      }
    }

    this.musicTime += MUSIC_SLICE
    this.musicFrom = this.musicTo
    this.musicTo += MUSIC_SLICE
  }

  beginMusic(timestamp) {
    this.play = true
    this.track.saved = this.track.c
    this.calcMusicTime()
    this.musicTime = timestamp
    this.musicFrom = this.timeAtNote()
    this.musicTo = this.musicFrom + MUSIC_SLICE * 2
    this.musicOrigin = synthTime() - this.musicFrom / 1000.0
    this.playMusic(timestamp)
    this.calcNoteTime(timestamp)
  }

  topLeftStatus() {
    return 'MUSIC - ' + this.name.toUpperCase()
  }

  topRightStatus() {
    const track = this.track
    return 'TRACK ' + track.name.toUpperCase() + ' TUNING ' + track.tuning + ' TEMPO ' + this.tempo
  }

  bottomLeftStatus() {
    return null
  }

  bottomRightStatus() {
    const input = this.input
    let content = null
    if (this.track.r === 0) content = input.name(BUTTON_A) + '/DURATION UP ' + input.name(BUTTON_Y) + '/DURATION DOWN '
    else content = input.name(BUTTON_A) + '/PITCH UP ' + input.name(BUTTON_Y) + '/PITCH DOWN '
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

  updatePlay(timestamp) {
    const input = this.input

    if (input.pressX()) {
      for (const sound of this.sounds) sound.stop()
      this.sounds.length = 0
      this.track.c = this.track.saved
      this.play = false
      this.doPaint = true
      return
    }

    this.playMusic(timestamp)

    if (timestamp >= this.noteTime) {
      this.doPaint = true
      this.track.c++
      if (this.track.c === this.track.notes.length) {
        this.sounds.length = 0
        this.track.c = this.track.saved
        this.play = false
      } else this.calcNoteTime(timestamp)
    } else this.doPaint = false
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
      if (this.track.r > 0) this.track.r--
    } else if (input.timerStickDown(timestamp, INPUT_RATE)) {
      if (this.track.r < NOTE_ROWS - 1) this.track.r++
    }

    if (input.timerStickLeft(timestamp, INPUT_RATE)) {
      if (this.track.c > 0) this.track.c--
    } else if (input.timerStickRight(timestamp, INPUT_RATE)) {
      this.track.c++
      const notes = this.track.notes
      if (this.track.c === notes.length) {
        notes.push(newNote())
      }
    }

    if (input.timerA(timestamp, INPUT_RATE)) {
      const track = this.track
      const row = track.r
      const note = track.notes[track.c]
      if (row === 0) {
        if (input.leftTrigger()) note[row] = this.maxDuration - 1
        else if (note[row] < this.maxDuration - 1) note[row]++
      } else {
        if (input.leftTrigger()) note[row] = Math.min(note[row] + 12, this.maxPitch)
        else if (note[row] < this.maxPitch) note[row]++
      }
      this.playRowNote(this.track.r)
    } else if (input.timerY(timestamp, INPUT_RATE)) {
      const track = this.track
      const row = track.r
      const note = track.notes[track.c]
      if (row === 0) {
        if (input.leftTrigger()) note[row] = 0
        else if (note[row] > 0) note[row]--
      } else {
        if (input.leftTrigger()) note[row] = Math.max(note[row] - 12, 0)
        else if (note[row] > 0) note[row]--
      }
      this.playRowNote(this.track.r)
    }

    if (input.pressB()) this.playRowNote(0)

    if (input.pressX()) {
      this.beginMusic(timestamp)
    }

    if (input.pressRightTrigger()) {
      this.dialog = this.noteDialog
      return
    }
  }

  export() {
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
        for (let r = 0; r < NOTE_ROWS; r++) {
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
