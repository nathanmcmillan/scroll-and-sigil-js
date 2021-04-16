/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

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
export const REPEAT = 23

export const PARAMETER_COUNT = 24

const _INTERVAL = 0

const _COUNT = 1

const rate = 1.0 / SYNTH_RATE
const pi = Math.PI
const tau = 2.0 * pi
const context = newAudioContext()

export function synthTime() {
  return context.currentTime
}

// function noise(data, amplitude, frequency) {
//   const len = data.length
//   const increment = tau * frequency * rate
//   let phase = 0
//   for (let i = 0; i < len; i++) {
//     phase += increment
//     if (phase > tau) {
//       data[i] = amplitude * (2.0 * Math.random() - 1.0)
//       phase -= tau
//     }
//   }
// }

// function process(data, algo, parameters) {
//   let attack = parameters[ATTACK]
//   let decay = parameters[DECAY]
//   let length = parameters[LENGTH]
//   let release = parameters[RELEASE]

//   if (attack === 0) attack = 4
//   if (decay === 0) decay = 4
//   if (release === 0) release = 4

//   attack = Math.floor((attack / 1000) * SYNTH_RATE)
//   decay = Math.floor((decay / 1000) * SYNTH_RATE)
//   length = Math.floor((length / 1000) * SYNTH_RATE)
//   release = Math.floor((release / 1000) * SYNTH_RATE)

//   const volume = parameters[VOLUME]
//   const sustain = parameters[SUSTAIN]
//   const hold = volume * sustain

//   const attackRate = volume / attack
//   const decayRate = (volume - hold) / decay
//   const releaseRate = hold / release

//   const decayEnd = attack + decay
//   const lengthEnd = decayEnd + length

//   let amplitude = 0

//   let frequency = diatonic(parameters[FREQ] - SEMITONES)
//   let speed = parameters[SPEED]
//   let acceleration = parameters[ACCEL] / SYNTH_RATE
//   const jerk = parameters[JERK] / SYNTH_RATE / SYNTH_RATE

//   const extra = new Array(_COUNT)
//   extra[_INTERVAL] = tau * parameters[CYCLE]

//   const size = data.length
//   let phase = 0

//   for (let i = 0; i < size; i++) {
//     if (i < attack) amplitude += attackRate
//     else if (i < decayEnd) amplitude -= decayRate
//     else if (i > lengthEnd) amplitude -= releaseRate
//     else amplitude = hold

//     data[i] = algo(amplitude, phase, extra)

//     const increment = tau * frequency * rate
//     phase += increment
//     if (phase > tau) phase -= tau

//     frequency += speed
//     speed += acceleration
//     acceleration += jerk
//   }
// }

function processSine(amplitude, phase) {
  return amplitude * Math.sin(phase)
}

function processSquare(amplitude, phase) {
  return phase < pi ? amplitude : -amplitude
}

function processPulse(amplitude, phase, extra) {
  return phase < extra[_INTERVAL] ? amplitude : -amplitude
}

function processTriangle(amplitude, phase) {
  const cycle = (2.0 * amplitude) / pi
  if (phase < pi) return -amplitude + cycle * phase
  return 3 * amplitude - cycle * phase
}

function processSawtooth(amplitude, phase) {
  return amplitude - (amplitude / pi) * phase
}

function processNoise(amplitude, phase) {
  return phase > tau ? amplitude * (2.0 * Math.random() - 1.0) : 0.0
}

function processStatic(amplitude) {
  return amplitude * (2.0 * Math.random() - 1.0)
}

function process(data, algo, parameters) {
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

  const startFrequency = diatonic(parameters[FREQ] - SEMITONES)
  const startSpeed = parameters[SPEED]
  const startAcceleration = parameters[ACCEL] / SYNTH_RATE
  const jerk = parameters[JERK] / SYNTH_RATE / SYNTH_RATE

  let frequency = startFrequency
  let speed = startSpeed
  let acceleration = startAcceleration

  const vibratoWave = parameters[VIBRATO_WAVE]
  const vibratoFreq = parameters[VIBRATO_FREQ]
  const vibratoPerc = parameters[VIBRATO_PERC]

  let vibratoPhase = 0

  const tremoloWave = parameters[TREMOLO_WAVE]
  const tremoloFreq = parameters[TREMOLO_FREQ]
  const tremoloPerc = parameters[TREMOLO_PERC]

  const crush = parameters[BIT_CRUSH]
  const noise = parameters[NOISE]
  const distortion = parameters[DISTORTION]
  const low = parameters[LOW_PASS]
  const high = parameters[HIGH_PASS]
  const repeat = Math.floor(parameters[REPEAT] * SYNTH_RATE)

  const extra = new Array(_COUNT)
  extra[_INTERVAL] = tau * parameters[CYCLE]

  const size = data.length
  let phase = 0

  let out = 0.0

  for (let i = 0; i < size; i++) {
    if (i < attack) amplitude += attackRate
    else if (i < decayEnd) amplitude -= decayRate
    else if (i > lengthEnd) amplitude -= releaseRate
    else amplitude = hold

    let calculate = true

    if (crush !== 0.0) {
      if (i % Math.floor(crush * 100) !== 0) calculate = false
    }

    if (calculate) {
      let current = amplitude

      if (vibratoWave !== 0) {
        const vibrato = processSine(vibratoPerc, vibratoPhase, extra)
        current *= vibrato

        const increment = tau * vibratoFreq * rate
        vibratoPhase += increment
        if (vibratoPhase > tau) vibratoPhase -= tau
      }

      out = algo(current, phase, extra)

      if (noise !== 0.0) {
        out = out - out * noise * (1.0 - (((Math.sin(i) + 1.0) * 1e9) % 2))
      }

      if (distortion !== 0.0) {
        if (out >= 0.0) {
          if (out > distortion) out = distortion
        } else {
          if (-out > distortion) out = -distortion
        }
      }

      if (low !== 0.0) {
        out = 0.0
      }

      if (high !== 0.0) {
        out = 0.0
      }
    }

    data[i] = out

    const increment = tau * frequency * rate
    phase += increment
    if (phase > tau) phase -= tau

    frequency += speed
    speed += acceleration
    acceleration += jerk

    if (repeat !== 0) {
      if (i % repeat === 0) {
        frequency = startFrequency
        speed = startSpeed
        acceleration = startAcceleration
      }
    }
  }
}

function create(parameters, algo, when) {
  const seconds = (parameters[ATTACK] + parameters[DECAY] + parameters[LENGTH] + parameters[RELEASE]) / 1000
  const buffer = context.createBuffer(1, Math.ceil(SYNTH_RATE * seconds), SYNTH_RATE)
  const data = buffer.getChannelData(0)
  process(data, algo, parameters)
  const source = context.createBufferSource()
  source.buffer = buffer
  source.connect(context.destination)
  source.start(when)
  return source
}

export function sine(parameters, when = 0) {
  return create(parameters, processSine, when)
}

export function square(parameters, when = 0) {
  return create(parameters, processSquare, when)
}

export function pulse(parameters, when = 0) {
  return create(parameters, processPulse, when)
}

export function triangle(parameters, when = 0) {
  return create(parameters, processTriangle, when)
}

export function sawtooth(parameters, when = 0) {
  return create(parameters, processSawtooth, when)
}

export function noise(parameters, when = 0) {
  return create(parameters, processNoise, when)
}

export function pure(parameters, when = 0) {
  return create(parameters, processStatic, when)
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
