import {Thing} from '/src/thing/thing.js'
import {Blood} from '/src/particle/blood.js'
import {playSound} from '/src/assets/sounds.js'
import {textureIndexForName, entityByName} from '/src/assets/assets.js'
import {animationMap} from '/src/entity/entity.js'

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

  damage(health) {
    if (this.status === STATUS_DEAD || this.status === STATUS_FINAL) return
    this.health -= health
    if (this.health <= 0) {
      this.health = 0
      this.status = STATUS_DEAD
      this.animationFrame = 0
      this.animation = this.animations.get('death')
      this.updateSprite()
      playSound('baron-death')
    } else {
      playSound('baron-pain')
    }
    const spread = 0.2
    const tau = 2.0 * Math.PI
    for (let i = 0; i < 20; i++) {
      let theta = tau * Math.random()
      let x = this.x + this.box * Math.sin(theta)
      let z = this.z + this.box * Math.cos(theta)
      let y = this.y + this.height * Math.random()
      let dx = spread * Math.sin(theta)
      let dz = spread * Math.cos(theta)
      let dy = spread * Math.random()
      new Blood(this.world, entityByName('blood'), x, y, z, dx, dy, dz)
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
