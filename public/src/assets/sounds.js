const MUSIC = new Map()
const SOUNDS = new Map()

let CURRENT = null

export function downloadSound(name, path) {
  if (SOUNDS.has(name)) return
  SOUNDS.set(name, new Audio(path))
}

export function playSound(name) {
  let sound = SOUNDS.get(name)
  sound.pause()
  sound.volume = 0.25
  sound.currentTime = 0
  let promise = sound.play()
  if (promise) {
    promise.then(() => {}).catch(() => {})
  }
}

export function downloadMusic(name, path) {
  if (MUSIC.has(name)) return
  MUSIC.set(name, new Audio(path))
}

export function playMusic(name) {
  let music = MUSIC.get(name)
  music.pause()
  music.loop = true
  music.volume = 0.25
  music.currentTime = 0
  let promise = music.play()
  if (promise) {
    promise.then(() => {}).catch(() => {})
  }
  CURRENT = music
}

export function resumeMusic() {
  if (CURRENT === null) return
  CURRENT.play()
}

export function pauseMusic() {
  if (CURRENT === null) return
  CURRENT.pause()
}
