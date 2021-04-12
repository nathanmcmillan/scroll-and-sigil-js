import { fetchText } from '../client/net.js'
import { Dialog } from '../gui/dialog.js'
import { diatonic, pulse, SEMITONES, waveFromName, WAVE_LIST } from '../sound/synth.js'
import { dusk0, dusk1, dusk2, silver0, silver1, silver2 } from './palette.js'

// TODO: Every sound effect needs to be chainable e.g. (noise for 1s + sine for 1s + etc)

export const WAVE_INDEX = 0
export const FREQUENCY_INDEX = 1
export const DURATION_INDEX = 2
export const VOLUME_INDEX = 3
export const CYCLE_INDEX = 13

const INPUT_RATE = 128

export class SfxEdit {
  constructor(parent, width, height, scale, input) {
    this.parent = parent
    this.width = width
    this.height = height
    this.scale = scale
    this.input = input
    this.shadowInput = true
    this.doPaint = true
    this.forcePaint = false

    this.row = 0

    this.name = 'untitled'

    this.waveGroup = ['wave', 'cycle']
    this.freqGroup = ['freq', 'speed', 'accel', 'jerk']
    this.volumeGroup = ['attack', 'decay', 'sustain', 'length', 'release']
    this.modulateGroup = ['tremolo', 'modulation', 'noise', 'bit crush', 'delay', 'tremolo']

    this.parameters = ['Wave', 'Frequency', 'Duration', 'Volume', 'Attack', 'Delay', 'Sustain', 'Release', 'Modulation', 'Noise', 'Bit Crush', 'Delay', 'Tremolo', 'Pulse Cycle']
    this.arguments = [0, 49, 1000.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.5]

    this.visualWidth = 200
    this.visualHeight = 80
    this.visualPixels = new Uint8Array(this.visualWidth * this.visualHeight * 3)
    for (let p = 0; p < this.visualPixels.length; p += 3) {
      this.visualPixels[p] = silver0
      this.visualPixels[p + 1] = silver1
      this.visualPixels[p + 2] = silver2
    }
    this.refreshPixels = false

    this.sounds = []

    this.dialog = null
    this.dialogStack = []

    this.startMenuDialog = new Dialog('start', null, ['name', 'new', 'open', 'save', 'export', 'exit'])
    this.askToSaveDialog = new Dialog('ask', 'save current file?', ['save', 'export', 'no'])
    this.saveOkDialog = new Dialog('ok', 'file saved', ['ok'])
    this.errorOkDialog = new Dialog('error', null, ['ok'])
  }

  clear() {}

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
    }
  }

  handleDialogSpecial() {}

  dialogResetAll() {
    this.startMenuDialog.reset()
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
      const sfx = content.split('\n')
      let x = 0
      for (let i = 1; i < sfx.length; i++) {
        if (sfx[i] === 'end sound') break
        const line = sfx[i].split(' ')
        const value = line[line.length - 1]
        this.arguments[x] = parseFloat(value)
        x++
      }
    } catch (e) {
      console.error(e)
      this.errorOkDialog.title = 'Failed reading file'
      this.dialog = this.errorOkDialog
    }

    this.shadowInput = true
    this.doPaint = true
  }

  async load(file) {
    let content = null
    if (file) content = await fetchText(file)
    else content = localStorage.getItem('sfx.txt')
    if (content === null || content === undefined) return this.clear()
    this.read(content)
  }

  topLeftStatus() {
    return 'SOUND EFFECTS'
  }

  topRightStatus() {
    return null
  }

  bottomLeftStatus() {
    return null
  }

  bottomRightStatus() {
    return 'A/INCREASE B/DECREASE X/PLAY'
  }

  immediateInput() {
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
    if (this.forcePaint) {
      this.doPaint = true
      this.forcePaint = false
    } else this.doPaint = false
    if (this.input.nothingOn()) {
      if (this.shadowInput) this.shadowInput = false
      else return
    } else this.shadowInput = true
    this.doPaint = true
    this.refreshPixels = false

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

    if (input.pressX()) {
      for (const sound of this.sounds) sound.stop()
      this.sounds.length = 0
      const waveform = waveFromName(WAVE_LIST[this.arguments[WAVE_INDEX]].toLowerCase())
      const pitch = diatonic(this.arguments[FREQUENCY_INDEX] - SEMITONES)
      const seconds = this.arguments[DURATION_INDEX]
      const amplitude = this.arguments[VOLUME_INDEX]
      let source
      if (waveform === pulse) {
        const cycle = this.arguments[CYCLE_INDEX]
        source = waveform(amplitude, pitch, cycle, seconds / 1000.0)
      } else {
        source = waveform(amplitude, pitch, seconds / 1000.0)
      }
      this.sounds.push(source)
      this.updatePixels(source)
    }

    if (input.timerStickUp(timestamp, INPUT_RATE)) {
      if (this.row > 0) this.row--
    } else if (input.timerStickDown(timestamp, INPUT_RATE)) {
      if (this.row < this.parameters.length - 1) this.row++
    }

    if (input.timerStickLeft(timestamp, INPUT_RATE)) {
      const row = this.row
      if (row === WAVE_INDEX) {
        if (this.arguments[row] > 0) this.arguments[row]--
      } else if (row === FREQUENCY_INDEX) {
        if (this.arguments[row] > 0) this.arguments[row]--
      } else if (row === DURATION_INDEX) {
        if (this.arguments[row] > 16) this.arguments[row] -= 16
      } else if (row === CYCLE_INDEX) {
        if (this.arguments[row] > 0.1) this.arguments[row] -= 0.05
      } else {
        if (this.arguments[row] > 0.2) this.arguments[row] -= 0.2
      }
    } else if (input.timerStickRight(timestamp, INPUT_RATE)) {
      const row = this.row
      if (row === WAVE_INDEX) {
        if (this.arguments[row] < WAVE_LIST.length - 1) this.arguments[row]++
      } else if (row === FREQUENCY_INDEX) {
        if (this.arguments[row] < 99) this.arguments[row]++
      } else if (row === DURATION_INDEX) {
        if (this.arguments[row] < 8172) this.arguments[row] += 16
      } else if (row === CYCLE_INDEX) {
        if (this.arguments[row] < 0.95) this.arguments[row] += 0.05
      } else {
        if (this.arguments[row] < 10.0) this.arguments[row] += 0.2
      }
    }
  }

  updatePixels(source) {
    const data = source.buffer.getChannelData(0)
    const samples = data.length
    const width = this.visualWidth
    const height = this.visualHeight
    // const middle = Math.floor(0.5 * height)
    const pixels = this.visualPixels
    const size = pixels.length
    for (let p = 0; p < size; p += 3) {
      pixels[p] = silver0
      pixels[p + 1] = silver1
      pixels[p + 2] = silver2
    }
    // let min = Number.MAX_VALUE
    // let max = -Number.MAX_VALUE
    // for (let s = 0; s < samples; s++) {
    //   const sample = data[s]
    //   if (sample < min) min = sample
    //   if (sample > max) max = sample
    // }
    // const range = max - min

    const parition = Math.floor(samples / width)
    console.debug('partition =', parition)
    let n = 0
    let e = parition

    for (let c = 0; c < width; c++) {
      // const slice = Math.floor((c / width) * samples)
      // const normalized = (data[slice] - min) / range
      // const r = Math.floor(height * normalized)

      // let min = Number.MAX_VALUE
      // let max = -Number.MAX_VALUE
      // for (let s = n; s < e; s++) {
      //   const sample = data[s]
      //   if (sample < min) min = sample
      //   if (sample > max) max = sample
      // }

      let pos = 0
      let neg = 0
      let posc = 0
      let negc = 0
      for (let s = n; s < e; s++) {
        const sample = data[s]
        if (sample > 0) {
          pos += sample
          posc++
        } else {
          neg += sample
          negc++
        }
      }
      if (posc > 0) pos /= posc
      if (negc > 0) neg /= negc

      // const range = max - min
      // const slice = Math.floor((c / width) * samples)
      // const normalized = (data[slice] - min) / range
      // const r = Math.floor(0.5 * height + (normalized - 0.5) * height)

      let b = Math.floor(height - (pos + 1.0) * 0.5 * height)
      let t = Math.floor(height - (neg + 1.0) * 0.5 * height)
      if (b < 0) b = 0
      if (t >= height) t = height - 1

      for (let r = b; r < t; r++) {
        const i = (c + r * width) * 3
        pixels[i] = dusk0
        pixels[i + 1] = dusk1
        pixels[i + 2] = dusk2
      }

      n = e
      e += parition
      if (e > samples) e = samples
    }
    this.refreshPixels = true
  }

  export() {
    let content = `sound ${this.name}\n`
    for (let i = 0; i < this.parameters.length; i++) {
      content += `${this.parameters[i].toLowerCase().replace(' ', '_')} ${this.arguments[i]}\n`
    }
    content += 'end sound\n'
    return content
  }
}
