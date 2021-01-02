export const SYNTH_FREQ = 44100

const pi = Math.PI
const tau = 2.0 * pi
const context = new AudioContext()

export function synthTime() {
  return context.currentTime
}

function generateSawtooth(data, pitch) {
  const len = data.length
  for (let i = 0; i < len; i++) {
    let x = i / SYNTH_FREQ
    data[i] = 0.5 - (x - Math.floor(x / tau) * tau) / tau
  }
}

function generateNoise(data, pitch) {
  const len = data.length
  for (let i = 0; i < len; i++) {
    data[i] = 2.0 * Math.random() - 1.0
  }
}

function play(pitch, seconds, algo, when = 0) {
  let buffer = context.createBuffer(1, Math.ceil(SYNTH_FREQ * seconds), SYNTH_FREQ)
  let data = buffer.getChannelData(0)
  algo(data, pitch)
  let source = context.createBufferSource()
  source.buffer = buffer
  source.connect(context.destination)
  source.start(when)
}

export function sawtooth(pitch, seconds, when = 0) {
  play(pitch, seconds, generateSawtooth, when)
}

export function noise(pitch, seconds, when = 0) {
  play(pitch, seconds, generateNoise, when)
}
