import {Thing} from '/src/thing/thing.js'
import {Blood} from '/src/particle/blood.js'
import {playSound} from '/src/assets/sounds.js'
import {textureIndexForName, entityByName} from '/src/assets/assets.js'
import {animationMap} from '/src/entity/entity.js'
import {WORLD_CELL_SHIFT, ANIMATION_ALMOST_DONE, ANIMATION_DONE} from '/src/world/world.js'
import {Plasma} from '/src/missile/plasma.js'
import {randomInt} from '/src/math/random.js'
import {lineIntersect} from '/src/math/vector.js'
import * as In from '/src/game/input.js'

const STATUS_IDLE = 0
const STATUS_MOVE = 1
const STATUS_MELEE = 2
const STATUS_MISSILE = 3
const STATUS_DEAD = 4
const STATUS_BUSY = 5

export class Hero extends Thing {
  constructor(world, entity, x, z, input) {
    super(world, x, z, 0.0, 0.75, 2.0)
    this.input = input
    this.texture = textureIndexForName(entity.get('sprite'))
    this.animations = animationMap(entity)
    this.animation = this.animations.get('move')
    this.sprite = this.animation[0]
    this.speed = 0.025
    this.maxHealth = 10
    this.health = this.maxHealth
    this.maxStamina = 10
    this.stamina = this.maxStamina
    this.status = STATUS_IDLE
    this.reaction = 0
    this.group = 'human'
    this.rank = 1
    this.experience = 0
    this.experienceNeeded = 20
    this.techniquePoints = 0
    this.inventory = []
    this.menu = null
    this.interaction = null
  }

  damage(health) {
    if (this.status === STATUS_BUSY) {
      this.status = STATUS_IDLE
      this.menu = null
      this.interaction = null
    }
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

  closeToThing(x, z, thing) {
    let box = thing.box
    let vx = x - this.x
    let vz = z - this.z
    let wx = thing.x - this.x
    let wz = thing.z - this.z
    let t = (wx * vx + wz * vz) / (vx * vx + vz * vz)
    if (t < 0.0) t = 0.0
    else if (t > 1.0) t = 1.0
    let px = this.x + vx * t - thing.x
    let pz = this.z + vz * t - thing.z
    if (px * px + pz * pz > box * box) return false
    return true
  }

  closeToLine(x, z, line) {
    return lineIntersect(this.x, this.z, x, z, line.a.x, line.a.y, line.b.x, line.b.y)
  }

  interact() {
    let distance = this.box + 3.0
    let x = this.x + distance * Math.sin(this.rotation)
    let z = this.z - distance * Math.cos(this.rotation)

    let minC = Math.floor(this.x) >> WORLD_CELL_SHIFT
    let maxC = Math.floor(x) >> WORLD_CELL_SHIFT
    let minR = Math.floor(this.z) >> WORLD_CELL_SHIFT
    let maxR = Math.floor(z) >> WORLD_CELL_SHIFT

    if (maxC < minC) {
      let temp = minC
      minC = maxC
      maxC = temp
    }

    if (maxR < minR) {
      let temp = minR
      minR = maxR
      maxR = temp
    }

    let world = this.world
    let columns = world.columns

    if (minC < 0) minC = 0
    if (minR < 0) minR = 0
    if (maxC > columns) maxC = columns
    if (maxR > world.rows) maxR = world.rows

    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        let cell = world.cells[c + r * columns]
        let i = cell.thingCount
        while (i--) {
          let thing = cell.things[i]
          if (this === thing) continue
          if (thing.interactions && this.closeToThing(x, z, thing)) {
            this.status = STATUS_BUSY
            this.animationFrame = 0
            this.animation = this.animations.get('move')
            this.updateSprite()
            this.interaction = {thing: thing, options: thing.interactions}
            this.world.notify('interact', [this, thing])
            return true
          }
        }
        i = cell.lines.length
        while (i--) {
          let line = cell.lines[i]
          if (this.closeToLine(x, z, line)) {
            console.log('interacting with line', line)
            this.world.notify('interact-line', [this, line])
            this.world.notify('hero-goto-map', 'base_copy')
            return true
          }
        }
      }
    }

    return false
  }

  dead() {
    if (this.animationFrame === this.animation.length - 1) {
      if (this.input.a()) {
        this.input.off(In.BUTTON_A)
        this.world.notify('hero-dead-menu')
      }
      return
    }
    this.updateAnimation()
    this.updateSprite()
  }

  openMenu() {
    this.status = STATUS_BUSY
    this.animationFrame = 0
    this.animation = this.animations.get('move')
    this.updateSprite()
    this.menu = {page: 'inventory'}
  }

  busy() {
    if (this.input.rightTrigger()) {
      this.input.off(In.RIGHT_TRIGGER)
      this.status = STATUS_IDLE
      if (this.menu) this.menu = null
      if (this.interaction) this.interaction = null
    }
  }

  takeExperience(value) {
    this.experience += value
    if (this.experience > this.experienceNeeded) {
      this.experience -= this.experienceNeeded
      this.experienceNeeded = Math.floor(1 + 1.8 * this.experienceNeeded)
      this.techniquePoints++
    }
  }

  melee() {
    let frame = this.updateAnimation()
    if (frame === ANIMATION_ALMOST_DONE) {
      this.reaction = 40

      let distance = this.box + 3.0
      let x = this.x + distance * Math.sin(this.rotation)
      let z = this.z - distance * Math.cos(this.rotation)

      let minC = Math.floor(this.x) >> WORLD_CELL_SHIFT
      let maxC = Math.floor(x) >> WORLD_CELL_SHIFT
      let minR = Math.floor(this.z) >> WORLD_CELL_SHIFT
      let maxR = Math.floor(z) >> WORLD_CELL_SHIFT

      if (maxC < minC) {
        let temp = minC
        minC = maxC
        maxC = temp
      }

      if (maxR < minR) {
        let temp = minR
        minR = maxR
        maxR = temp
      }

      let world = this.world
      let columns = world.columns

      if (minC < 0) minC = 0
      if (minR < 0) minR = 0
      if (maxC > columns) maxC = columns
      if (maxR > world.rows) maxR = world.rows

      iter: for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
          let cell = world.cells[c + r * columns]
          let i = cell.thingCount
          while (i--) {
            let thing = cell.things[i]
            if (this === thing) continue
            if (this.closeToThing(x, z, thing)) {
              thing.damage(1 + randomInt(3))
              if (thing.health <= 0) this.takeExperience(thing.experience)
              break iter
            }
          }
        }
      }
    } else if (frame === ANIMATION_DONE) {
      this.status = STATUS_IDLE
      this.animationFrame = 0
      this.animation = this.animations.get('move')
      this.updateSprite()
    }
  }

  missile() {
    let frame = this.updateAnimation()
    if (frame === ANIMATION_ALMOST_DONE) {
      this.reaction = 60
      let speed = 0.3
      let angle = this.rotation
      let dx = Math.sin(angle)
      let dz = -Math.cos(angle)
      let x = this.x + dx * this.box * 3.0
      let z = this.z + dz * this.box * 3.0
      let y = this.y + this.height * 0.75
      new Plasma(this.world, entityByName('plasma'), x, y, z, dx * speed, 0.0, dz * speed, 1 + randomInt(3))
    } else if (frame === ANIMATION_DONE) {
      this.status = STATUS_IDLE
      this.animationFrame = 0
      this.animation = this.animations.get('move')
      this.updateSprite()
    }
  }

  move() {
    if (this.reaction > 0) {
      this.reaction--
    } else if (this.input.a()) {
      this.status = STATUS_MISSILE
      this.animationFrame = 0
      this.animation = this.animations.get('missile')
      this.updateSprite()
      playSound('baron-missile')
      return
    } else if (this.input.b()) {
      this.status = STATUS_MELEE
      this.animationFrame = 0
      this.animation = this.animations.get('melee')
      this.updateSprite()
      playSound('baron-melee')
      return
    } else if (this.input.rightTrigger()) {
      this.input.off(In.RIGHT_TRIGGER)
      if (this.interact()) return
    }
    if (this.input.leftTrigger()) {
      this.input.off(In.LEFT_TRIGGER)
      this.pickup()
    } else if (this.input.rightBumper()) {
      this.input.off(In.RIGHT_BUMPER)
      this.openMenu()
    }
    if (this.ground) {
      if (this.input.rightClick()) {
        this.input.off(In.RIGHT_STICK_CLICK)
        this.ground = false
        this.deltaY += 0.4
      } else {
        let direction = null
        let rotation = null
        if (this.input.leftUp()) {
          direction = 'w'
          rotation = this.rotation
        }
        if (this.input.leftDown()) {
          if (direction === null) {
            direction = 's'
            rotation = this.rotation + Math.PI
          } else {
            direction = null
            rotation = null
          }
        }
        if (this.input.leftLeft()) {
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
        if (this.input.leftRight()) {
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
        if (rotation) {
          this.deltaX += Math.sin(rotation) * this.speed
          this.deltaZ -= Math.cos(rotation) * this.speed
          if (this.updateAnimation() === ANIMATION_DONE) this.animationFrame = 0
          this.updateSprite()
        }
      }
    }
  }

  update() {
    switch (this.status) {
      case STATUS_IDLE:
      case STATUS_MOVE:
        this.move()
        break
      case STATUS_MELEE:
        this.melee()
        break
      case STATUS_MISSILE:
        this.missile()
        break
      case STATUS_DEAD:
        this.dead()
        break
      case STATUS_BUSY:
        this.busy()
        break
    }
    this.integrate()
    return false
  }

  set(x, z) {
    this.sector = this.world.findSector(x, z)
    this.x = this.previousX = x
    this.y = this.previousY = this.sector.floor
    this.z = this.previousZ = z
    this.pushToCells()
    this.world.pushThing(this)
  }
}
