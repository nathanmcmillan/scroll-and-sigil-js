import {Particle} from '/src/particle/particle.js'
import {ANIMATION_DONE} from '/src/world/world.js'
import {textureIndexForName} from '/src/assets/assets.js'
import {animationMap} from '/src/entity/entity.js'

export class PlasmaExplosion extends Particle {
  constructor(world, entity, x, y, z) {
    super(world, entity, x, y, z, 0.0, 0.0, 0.0, 0.0, 0.0)
    this.texture = textureIndexForName(entity.get('sprite'))
    this.animation = animationMap(entity)
    this.sprite = this.animation[0]
    this.animationMod = 0
    this.animationFrame = 0
  }

  update() {
    if (this.updateAnimation() === ANIMATION_DONE) {
      return true
    }
    this.sprite = this.animation[this.animationFrame]
    return false
  }
}
