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

export const VIBRATO_WAVE = 12
export const VIBRATO_FREQ = 13
export const VIBRATO_PERC = 14

export const TREMOLO_WAVE = 15
export const TREMOLO_FREQ = 16
export const TREMOLO_PERC = 17

export const BIT_CRUSH = 18
export const NOISE = 19
export const DISTORTION = 20
export const LOW_PASS = 21
export const HIGH_PASS = 22
export const REPEATING = 23

export const PARAMETER_COUNT = 24

const rate = 1.0 / SYNTH_RATE
const pi = Math.PI
const tau = 2.0 * pi
const context = newAudioContext()

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
// function algoSine(data, amplitude, frequency) {
//   const len = data.length
//   const increment = tau * frequency * rate
//   let phase = 0
//   for (let i = 0; i < len; i++) {
//     data[i] = amplitude * Math.sin(phase)
//     phase += increment
//     if (phase > tau) phase -= tau
//   }
// }

function algoSine(data, parameters) {
  let attack = parameters[ATTACK]
  let decay = parameters[DECAY]
  let length = parameters[LENGTH]
  let release = parameters[RELEASE]

  if (attack === 0) attack = 4
  if (decay === 0) decay = 4
  if (release === 0) release = 4

  attack = Math.floor((attack / 1000) * SYNTH_RATE)
  decay = Math.floor((decay / 1000) * SYNTH_RATE)
  length = Math.floor((length / 1000) * SYNTH_RATE)
  release = Math.floor((release / 1000) * SYNTH_RATE)

  const volume = parameters[VOLUME]
  const sustain = parameters[SUSTAIN]
  const hold = volume * sustain

  const attackRate = volume / attack
  const decayRate = (volume - hold) / decay
  const releaseRate = hold / release

  const decayEnd = attack + decay
  const lengthEnd = decayEnd + length

  let amplitude = 0

  let frequency = diatonic(parameters[FREQ] - SEMITONES)
  let speed = parameters[SPEED]
  let acceleration = parameters[ACCEL] / SYNTH_RATE
  const jerk = parameters[JERK] / SYNTH_RATE / SYNTH_RATE

  const size = data.length
  let phase = 0

  for (let i = 0; i < size; i++) {
    if (i < attack) amplitude += attackRate
    else if (i < decayEnd) amplitude -= decayRate
    else if (i > lengthEnd) amplitude -= releaseRate
    else amplitude = hold

    data[i] = amplitude * Math.sin(phase)

    const increment = tau * frequency * rate
    phase += increment
    if (phase > tau) phase -= tau

    frequency += speed
    speed += acceleration
    acceleration += jerk
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
  let attack = parameters[ATTACK]
  let decay = parameters[DECAY]
  let length = parameters[LENGTH]
  let release = parameters[RELEASE]

  if (attack === 0) attack = 4
  if (decay === 0) decay = 4
  if (release === 0) release = 4

  attack = Math.floor((attack / 1000) * SYNTH_RATE)
  decay = Math.floor((decay / 1000) * SYNTH_RATE)
  length = Math.floor((length / 1000) * SYNTH_RATE)
  release = Math.floor((release / 1000) * SYNTH_RATE)

  const volume = parameters[VOLUME]
  const sustain = parameters[SUSTAIN]
  const hold = volume * sustain

  const attackRate = volume / attack
  const decayRate = (volume - hold) / decay
  const releaseRate = hold / release

  const decayEnd = attack + decay
  const lengthEnd = decayEnd + length

  let amplitude = 0

  let frequency = diatonic(parameters[FREQ] - SEMITONES)
  let speed = parameters[SPEED]
  let acceleration = parameters[ACCEL] / SYNTH_RATE
  const jerk = parameters[JERK] / SYNTH_RATE / SYNTH_RATE

  const size = data.length
  let phase = 0

  for (let i = 0; i < size; i++) {
    if (i < attack) amplitude += attackRate
    else if (i < decayEnd) amplitude -= decayRate
    else if (i > lengthEnd) amplitude -= releaseRate
    else amplitude = hold

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

export function sine(parameters, when = 0) {
  // return create(amplitude, frequency, null, seconds, algoSine, when)
  const seconds = (parameters[ATTACK] + parameters[DECAY] + parameters[LENGTH] + parameters[RELEASE]) / 1000

  const buffer = context.createBuffer(1, Math.ceil(SYNTH_RATE * seconds), SYNTH_RATE)
  const data = buffer.getChannelData(0)
  algoSine(data, parameters)
  const source = context.createBufferSource()
  source.buffer = buffer
  source.connect(context.destination)
  source.start(when)
  return source
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
  const seconds = (parameters[ATTACK] + parameters[DECAY] + parameters[LENGTH] + parameters[RELEASE]) / 1000

  const buffer = context.createBuffer(1, Math.ceil(SYNTH_RATE * seconds), SYNTH_RATE)
  const data = buffer.getChannelData(0)
  algoSawtooth(data, parameters)
  const source = context.createBufferSource()
  source.buffer = buffer
  source.connect(context.destination)
  source.start(when)
  return source
}

export const WAVEFORMS = ['None', 'Sine', 'Square', 'Pulse', 'Triangle', 'Sawtooth', 'Noise', 'Static']

export function waveFromName(name) {
  switch (name) {
    case 'none':
      return null
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
  return null
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
