import {textureIndexForName} from '/src/assets/assets.js'
import {animationMap} from '/src/entity/entity.js'

export class ThingReference {
  constructor(entity, x, z) {
    this.x = x
    this.y = 0.0
    this.z = z
    this.box = 1.0
    this.height = 1.0
    this.rotation = 1.0
    this.texture = textureIndexForName(entity.get('sprite'))
    this.animations = animationMap(entity)
    if (Array.isArray(this.animations)) {
      this.sprite = this.animations[0]
    } else if (this.animations instanceof Map) {
      this.animation = this.animations.values().next().value
      this.sprite = this.animation[0]
    } else {
      this.sprite = this.animations
    }
    this.entity = entity
  }
}
