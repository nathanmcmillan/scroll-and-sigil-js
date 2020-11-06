import {Thing} from '/src/thing/thing.js'
import {playSound} from '/src/assets/sounds.js'
import {textureIndexForName} from '/src/assets/assets.js'
import {animationMap} from '/src/entity/entity.js'
import {redBloodTowards, redBloodExplode} from '/src/thing/thing-util.js'

const STATUS_STAND = 0
const STATUS_DEAD = 1
const STATUS_FINAL = 2

export class Merchant extends Thing {
  constructor(world, entity, x, z) {
    super(world, x, z, 0.0, 0.4, 1.0)
    this.texture = textureIndexForName(entity.get('sprite'))
    this.animations = animationMap(entity)
    this.animation = this.animations.get('idle')
    this.health = parseInt(entity.get('health'))
    this.speed = parseFloat(entity.get('speed'))
    this.sprite = this.animation[0]
    this.target = null
    this.moveCount = 0
    this.status = STATUS_STAND
    this.reaction = 0
    this.name = entity.get('name')
    this.group = 'human|merchant'
    this.interactions = entity.get('interact')
  }

  damage(source, health) {
    if (this.status === STATUS_DEAD || this.status === STATUS_FINAL) return
    this.health -= health
    if (this.health <= 0) {
      this.health = 0
      this.status = STATUS_DEAD
      this.animationFrame = 0
      this.animation = this.animations.get('death')
      this.updateSprite()
      playSound('baron-death')
      redBloodExplode(this)
    } else {
      playSound('baron-pain')
      redBloodTowards(this, source)
    }
  }

  dead() {
    if (this.animationFrame == this.animation.length - 1) {
      this.isPhysical = false
      this.status = STATUS_FINAL
      return
    }
    this.updateAnimation()
    this.updateSprite()
  }

  update() {
    switch (this.status) {
      case STATUS_DEAD:
        this.dead()
        break
      case STATUS_FINAL:
        return false
    }
    this.integrate()
    return false
  }
}
