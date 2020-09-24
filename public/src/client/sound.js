export class AudioManager {
  constructor() {
    this.sounds = new Map()
  }

  playSound(id) {
    let sound = this.sounds[id]
    sound.pause()
    sound.volume = 0.25
    sound.currentTime = 0
    let promise = sound.play()
    if (promise) {
      promise.then(() => {}).catch(() => {})
    }
  }
}
