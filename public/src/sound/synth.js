export const SYNTH_RATE = 44100

const rate = 1.0 / SYNTH_RATE
const pi = Math.PI
const tau = 2.0 * pi
const context = new AudioContext()

export function synthTime() {
  return context.currentTime
}

function algoNoise(data, amplitude, frequency) {
  const len = data.length
  for (let i = 0; i < len; i++) {
    data[i] = amplitude * (2.0 * Math.random() - 1.0)
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

function algoSawtooth(data, amplitude, frequency) {
  const len = data.length
  const increment = tau * frequency * rate
  let phase = 0
  for (let i = 0; i < len; i++) {
    data[i] = amplitude - (amplitude / pi) * phase
    phase += increment
    if (phase > tau) phase -= tau
  }
}

function play(amplitude, frequency, seconds, algo, when = 0) {
  let buffer = context.createBuffer(1, Math.ceil(SYNTH_RATE * seconds), SYNTH_RATE)
  let data = buffer.getChannelData(0)
  algo(data, amplitude, frequency)
  let source = context.createBufferSource()
  source.buffer = buffer
  source.connect(context.destination)
  source.start(when)
}

export function noise(amplitude, frequency, seconds, when = 0) {
  play(amplitude, frequency, seconds, algoNoise, when)
}

export function sine(amplitude, frequency, seconds, when = 0) {
  play(amplitude, frequency, seconds, algoSine, when)
}

export function square(amplitude, frequency, seconds, when = 0) {
  play(amplitude, frequency, seconds, algoSquare, when)
}

export function triangle(amplitude, frequency, seconds, when = 0) {
  play(amplitude, frequency, seconds, algoTriangle, when)
}

export function sawtooth(amplitude, frequency, seconds, when = 0) {
  play(amplitude, frequency, seconds, algoSawtooth, when)
}
