import {Particle} from '/src/particle/particle.js'
import {Sprite} from '/src/render/sprite.js'
import {ANIMATION_DONE} from '/src/world/world.js'

const ANIMATION = [0, 0, 0, 0]

export class PlasmaExplosion extends Particle {
  constructor(world, x, y, z) {
    super(world, x, y, z, 0.0, 0.0, 0.0, 0.0, 0.0)
    let scale = 1.0 / 64.0
    let atlasWidth = 1.0 / 1024.0
    let atlasHeight = 1.0 / 512.0
    let left = 696
    let top = 0
    let width = 110
    let height = 128
    this.texture = 3
    this.sprite = new Sprite(left, top, width, height, 0.0, 0.0, atlasWidth, atlasHeight, scale)
    this.animationMod = 0
    this.animationFrame = 0
    this.animation = ANIMATION
  }

  update() {
    if (this.updateAnimation() === ANIMATION_DONE) {
      return true
    }
    this.sprite = this.animation[this.animationFrame]
    return false
  }
}
