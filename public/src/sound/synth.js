import { newAudioContext } from '../sound/web-audio-context.js'

export const SYNTH_RATE = 44100

export const SEMITONES = 49

export const WAVE = 0
export const CYCLE = 1
export const FREQ = 2
export const SPEED = 3
export const ACCEL = 4
export const JERK = 5
export const ATTACK = 6
export const DECAY = 7
export const SUSTAIN = 8
export const LENGTH = 9
export const RELEASE = 10
export const VOLUME = 11
export const PARAMETER_COUNT = 12

const rate = 1.0 / SYNTH_RATE
const pi = Math.PI
const tau = 2.0 * pi
const context = newAudioContext()

// todo: envelope
// attack
// decay
// sustain
// release

// todo: combined wave forms

// todo:
// slide
// pitch jump
// modulation
// repeat time
// extra noise
// bit crush
// delay
// tremolo

// gain
// overdrive / distortion  (clipping)
// compression
// low pass filter
// high pass filter

export function synthTime() {
  return context.currentTime
}

function algoPureNoise(data, amplitude) {
  const len = data.length
  for (let i = 0; i < len; i++) {
    data[i] = amplitude * (2.0 * Math.random() - 1.0)
  }
}

function algoNoiseFrequency(data, amplitude, frequency) {
  const len = data.length
  const increment = tau * frequency * rate
  let phase = 0
  for (let i = 0; i < len; i++) {
    phase += increment
    if (phase > tau) {
      data[i] = amplitude * (2.0 * Math.random() - 1.0)
      phase -= tau
    }
  }
}

function algoSine(data, amplitude, frequency) {
  const len = data.length
  const increment = tau * frequency * rate
  let phase = 0
  for (let i = 0; i < len; i++) {
    data[i] = amplitude * Math.sin(phase)
    phase += increment
    if (phase > tau) phase -= tau
  }
}

function algoSquare(data, amplitude, frequency) {
  const len = data.length
  const increment = tau * frequency * rate
  let phase = 0
  for (let i = 0; i < len; i++) {
    data[i] = phase < pi ? amplitude : -amplitude
    phase += increment
    if (phase > tau) phase -= tau
  }
}

function algoPulse(data, amplitude, frequency, cycle) {
  const len = data.length
  const interval = tau * cycle
  const increment = tau * frequency * rate
  let phase = 0
  for (let i = 0; i < len; i++) {
    data[i] = phase < interval ? amplitude : -amplitude
    phase += increment
    if (phase > tau) phase -= tau
  }
}

function algoTriangle(data, amplitude, frequency) {
  const len = data.length
  const increment = tau * frequency * rate
  const cycle = (2.0 * amplitude) / pi
  let phase = 0
  for (let i = 0; i < len; i++) {
    if (phase < pi) data[i] = -amplitude + cycle * phase
    else data[i] = 3 * amplitude - cycle * phase
    phase += increment
    if (phase > tau) phase -= tau
  }
}

// function algoPureSawtooth(data, parameters) {
//   const frequency = diatonic(parameters[FREQ] - SEMITONES)
//   const amplitude = parameters[VOLUME]

//   const len = data.length
//   const increment = tau * frequency * rate
//   let phase = 0
//   for (let i = 0; i < len; i++) {
//     data[i] = amplitude - (amplitude / pi) * phase
//     phase += increment
//     if (phase > tau) phase -= tau
//   }
// }

function algoSawtooth(data, parameters) {
  const amplitude = parameters[VOLUME]

  let frequency = diatonic(parameters[FREQ] - SEMITONES)
  let speed = parameters[SPEED]
  let acceleration = parameters[ACCEL] / 1000
  const jerk = parameters[JERK] / 1000 / 1000

  const size = data.length
  let phase = 0
  for (let i = 0; i < size; i++) {
    data[i] = amplitude - (amplitude / pi) * phase
    const increment = tau * frequency * rate
    phase += increment
    if (phase > tau) phase -= tau
    frequency += speed
    speed += acceleration
    acceleration += jerk
  }
}

function create(amplitude, frequency, parameters, seconds, algo, when = 0) {
  const buffer = context.createBuffer(1, Math.ceil(SYNTH_RATE * seconds), SYNTH_RATE)
  const data = buffer.getChannelData(0)
  algo(data, amplitude, frequency, parameters)
  const source = context.createBufferSource()
  source.buffer = buffer
  source.connect(context.destination)
  source.start(when)
  return source
}

export function pure(amplitude, frequency, seconds, when = 0) {
  return create(amplitude, frequency, null, seconds, algoPureNoise, when)
}

export function noise(amplitude, frequency, seconds, when = 0) {
  return create(amplitude, frequency, null, seconds, algoNoiseFrequency, when)
}

export function sine(amplitude, frequency, seconds, when = 0) {
  return create(amplitude, frequency, null, seconds, algoSine, when)
}

export function square(amplitude, frequency, seconds, when = 0) {
  return create(amplitude, frequency, null, seconds, algoSquare, when)
}

export function pulse(amplitude, frequency, cycle, seconds, when = 0) {
  return create(amplitude, frequency, cycle, seconds, algoPulse, when)
}

export function triangle(amplitude, frequency, seconds, when = 0) {
  return create(amplitude, frequency, null, seconds, algoTriangle, when)
}

export function sawtooth(parameters, when = 0) {
  const seconds = parameters[LENGTH] / 1000

  const buffer = context.createBuffer(1, Math.ceil(SYNTH_RATE * seconds), SYNTH_RATE)
  const data = buffer.getChannelData(0)
  algoSawtooth(data, parameters)
  const source = context.createBufferSource()
  source.buffer = buffer
  source.connect(context.destination)
  source.start(when)
  return source
}

export const WAVEFORMS = ['Sine', 'Square', 'Pulse', 'Triangle', 'Sawtooth', 'Noise', 'Static']

export function waveFromName(name) {
  switch (name) {
    case 'sine':
      return sine
    case 'square':
      return square
    case 'pulse':
      return pulse
    case 'triangle':
      return triangle
    case 'sawtooth':
      return sawtooth
    case 'noise':
      return noise
    case 'static':
      return pure
  }
  console.error('Bad waveform: ' + name)
  return sine
}

const notes = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B']

export function semitoneName(semitone) {
  semitone += 9
  let note = semitone % 12
  while (note < 0) note += 12
  const octave = 4 + Math.floor(semitone / 12)
  return notes[note] + octave
}

export function diatonic(semitone) {
  return 440 * Math.pow(2, semitone / 12)
}
