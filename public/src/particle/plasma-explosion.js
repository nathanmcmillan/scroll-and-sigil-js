import {ANIMATION_DONE} from '/src/world/world.js'
import {textureIndexForName} from '/src/assets/assets.js'

function update() {
  if (this.updateAnimation() === ANIMATION_DONE) return true
  this.sprite = this.animation[this.animationFrame]
  return false
}

function init(entity) {
  this.update = update
  this.texture = textureIndexForName(entity.get('sprite'))
  this.animation = entity.animations()
  this.sprite = this.animation[0]
  this.animationMod = 0
  this.animationFrame = 0
  this.setup()
}

export function newPlasmaExplosion(world, entity, x, y, z) {
  let particle = world.newParticle(x, y, z)
  particle.init = init
  particle.init(entity)
  return particle
}
