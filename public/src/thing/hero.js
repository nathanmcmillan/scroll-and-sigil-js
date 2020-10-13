import {Thing} from '/src/thing/thing.js'
import {Blood} from '/src/particle/blood.js'
import {playSound} from '/src/assets/sounds.js'
import {textureIndexForName, entityByName} from '/src/assets/assets.js'
import {animationMap} from '/src/entity/entity.js'
import {ANIMATION_ALMOST_DONE, ANIMATION_DONE} from '/src/world/world.js'
import {Plasma} from '/src/missile/plasma.js'
import {randomInt} from '/src/math/random.js'

const STATUS_IDLE = 0
const STATUS_MOVE = 1
const STATUS_MISSILE = 2
const STATUS_DEAD = 3

export class Hero extends Thing {
  constructor(world, entity, x, z, input) {
    super(world, entity, x, z, 0.0, 0.75, 2.0)
    this.input = input
    this.texture = textureIndexForName(entity.get('sprite'))
    this.animations = animationMap(entity)
    this.animation = this.animations.get('move')
    this.sprite = this.animation[0]
    this.speed = 0.025
    this.health = 10
    this.status = STATUS_IDLE
    this.reaction = 0
    this.inventory = []
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

  pickup() {
    let world = this.world
    for (let r = this.minR; r <= this.maxR; r++) {
      for (let c = this.minC; c <= this.maxC; c++) {
        let cell = world.cells[c + r * world.columns]
        let i = cell.thingCount
        while (i--) {
          let thing = cell.things[i]
          if (thing.isItem && !thing.pickedUp && this.collision(thing)) {
            this.inventory.push(thing)
            thing.pickedUp = true
          }
        }
      }
    }
  }

  dead() {
    if (this.animationFrame == this.animation.length - 1) {
      return
    }
    this.updateAnimation()
    this.updateSprite()
  }

  missile() {
    let frame = this.updateAnimation()
    if (frame == ANIMATION_ALMOST_DONE) {
      this.reaction = 60
      let speed = 0.3
      let angle = this.rotation
      let dx = Math.sin(angle)
      let dz = -Math.cos(angle)
      let x = this.x + dx * this.box * 3.0
      let z = this.z + dz * this.box * 3.0
      let y = this.y + this.height * 0.75
      new Plasma(this.world, entityByName('plasma'), x, y, z, dx * speed, 0.0, dz * speed, 1 + randomInt(3))
    } else if (frame == ANIMATION_DONE) {
      this.status = STATUS_IDLE
      this.animationFrame = 0
      this.animation = this.animations.get('move')
      this.updateSprite()
    }
  }

  move() {
    if (this.reaction > 0) {
      this.reaction--
    } else if (this.input.attackLight) {
      this.status = STATUS_MISSILE
      this.animationFrame = 0
      this.animation = this.animations.get('missile')
      this.updateSprite()
      playSound('baron-missile')
      return
    } else if (this.input.pickupItem) {
      this.input.pickupItem = false
      this.pickup()
    }
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

      if (this.updateAnimation() == ANIMATION_DONE) {
        this.animationFrame = 0
      }
      this.updateSprite()
    }
  }

  update() {
    switch (this.status) {
      case STATUS_IDLE:
      case STATUS_MOVE:
        this.move()
        break
      case STATUS_MISSILE:
        this.missile()
        break
      case STATUS_DEAD:
        this.dead()
        break
    }
    this.integrate()
    return false
  }
}
