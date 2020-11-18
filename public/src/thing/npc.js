import {thingSetup, thingUpdateSprite, thingUpdateAnimation, Thing} from '/src/thing/thing.js'
import {playSound} from '/src/assets/sounds.js'
import {textureIndexForName} from '/src/assets/assets.js'
import {redBloodTowards, redBloodExplode} from '/src/thing/thing-util.js'

const STATUS_STAND = 0
const STATUS_DEAD = 1
const STATUS_FINAL = 2

export class NonPlayerCharacter extends Thing {
  constructor(world, entity, x, z) {
    super(world, x, z)
    this.box = entity.box()
    this.height = entity.height()
    this.name = entity.name()
    this.group = entity.group()
    this.texture = textureIndexForName(entity.get('sprite'))
    this.animations = entity.animations()
    this.animation = this.animations.get('idle')
    this.health = entity.health()
    this.speed = entity.speed()
    this.sprite = this.animation[0]
    this.target = null
    this.moveCount = 0
    this.status = STATUS_STAND
    this.reaction = 0
    this.interaction = entity.get('interaction')
    thingSetup(this)
  }

  damage(source, health) {
    if (this.status === STATUS_DEAD || this.status === STATUS_FINAL) return
    this.health -= health
    if (this.health <= 0) {
      this.health = 0
      this.status = STATUS_DEAD
      this.animationFrame = 0
      this.animation = this.animations.get('death')
      thingUpdateSprite(this)
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
    thingUpdateAnimation(this)
    thingUpdateSprite(this)
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
