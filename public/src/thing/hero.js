import {Thing} from '/src/thing/thing.js'
import {Blood} from '/src/particle/blood.js'
import {playSound} from '/src/assets/sounds.js'
import {textureIndexForName, entityByName} from '/src/assets/assets.js'
import {animationMap} from '/src/entity/entity.js'

export class Hero extends Thing {
  constructor(world, entity, x, z, input) {
    super(world, x, z, 0.0, 0.75, 2.0)
    this.input = input
    this.texture = textureIndexForName(entity.get('sprite'))
    this.animations = animationMap(entity)
    this.animation = this.animations.get('idle')
    this.sprite = this.animation[0]
    this.speed = 0.025
    this.health = 10
  }

  damage(health) {
    this.health -= health
    if (this.health <= 0) {
      this.health = 0
      playSound('baron-death')
    } else {
      playSound('baron-pain')
    }
    for (let i = 0; i < 20; i++) {
      let x = this.x + this.box * (1.0 - 2.0 * Math.random())
      let y = this.y + this.height * Math.random()
      let z = this.z + this.box * (1.0 - 2.0 * Math.random())
      const spread = 0.2
      let dx = spread * (1.0 - Math.random() * 2.0)
      let dy = spread * Math.random()
      let dz = spread * (1.0 - Math.random() * 2.0)
      new Blood(this.world, entityByName('blood'), x, y, z, dx, dy, dz)
    }
  }

  update() {
    let direction = null
    let rotation = null
    if (this.input.moveForward) {
      direction = 'w'
      rotation = this.rotation
    }
    if (this.input.moveBackward) {
      if (direction === null) {
        direction = 's'
        rotation = this.rotation + Math.PI
      } else {
        direction = null
        rotation = null
      }
    }
    if (this.input.moveLeft) {
      if (direction === null) {
        direction = 'a'
        rotation = this.rotation - 0.5 * Math.PI
      } else if (direction === 'w') {
        direction = 'wa'
        rotation -= 0.25 * Math.PI
      } else if (direction === 's') {
        direction = 'sa'
        rotation += 0.25 * Math.PI
      }
    }
    if (this.input.moveRight) {
      if (direction === null) {
        rotation = this.rotation + 0.5 * Math.PI
      } else if (direction === 'a') {
        rotation = null
      } else if (direction === 'wa') {
        rotation = this.rotation
      } else if (direction === 'sa') {
        rotation = this.rotation + Math.PI
      } else if (direction === 'w') {
        rotation += 0.25 * Math.PI
      } else if (direction === 's') {
        rotation -= 0.25 * Math.PI
      }
    }
    if (rotation !== null) {
      this.deltaX += Math.sin(rotation) * this.speed
      this.deltaZ -= Math.cos(rotation) * this.speed
    }
    this.integrate()
    return false
  }
}
