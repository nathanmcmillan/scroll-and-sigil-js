import {Particle} from '/src/particle/particle.js'
import {ANIMATION_DONE} from '/src/world/world.js'
import {textureIndexForName} from '/src/assets/assets.js'

export class PlasmaExplosion extends Particle {
  constructor(world, entity, x, y, z) {
    super(world, x, y, z)
    this.texture = textureIndexForName(entity.get('sprite'))
    this.animation = entity.animations()
    this.sprite = this.animation[0]
    this.animationMod = 0
    this.animationFrame = 0
    this.setup()
  }

  update() {
    if (this.updateAnimation() === ANIMATION_DONE) {
      return true
    }
    this.sprite = this.animation[this.animationFrame]
    return false
  }
}
