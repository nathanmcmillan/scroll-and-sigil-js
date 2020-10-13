import {randomInt} from '/src/math/random.js'
import {ANIMATION_ALMOST_DONE, ANIMATION_DONE} from '/src/world/world.js'
import {Thing} from '/src/thing/thing.js'
import {WORLD_CELL_SHIFT} from '/src/world/world.js'
import {Plasma} from '/src/missile/plasma.js'
import {Blood} from '/src/particle/blood.js'
import {playSound} from '/src/assets/sounds.js'
import {textureIndexForName, entityByName} from '/src/assets/assets.js'
import {animationMap} from '/src/entity/entity.js'

const STATUS_LOOK = 0
const STATUS_CHASE = 1
const STATUS_MELEE = 2
const STATUS_MISSILE = 3
const STATUS_DEAD = 4

export class Baron extends Thing {
  constructor(world, entity, x, z) {
    super(world, entity, x, z, 0.0, 0.4, 1.0)
    this.texture = textureIndexForName(entity.get('sprite'))
    this.animations = animationMap(entity)
    this.animation = this.animations.get('idle')
    this.health = parseInt(entity.get('health'))
    this.speed = parseFloat(entity.get('speed'))
    this.sprite = this.animation[0]
    this.target = null
    this.moveCount = 0
    this.meleeRange = 2.0
    this.missileRange = 10.0
    this.status = STATUS_LOOK
    this.reaction = 0
  }

  tryOverlap(x, z, thing) {
    let box = this.box + thing.box
    return Math.abs(x - thing.x) <= box && Math.abs(z - thing.z) <= box
  }

  tryLineOverlap(x, z, line) {
    let box = this.box
    let vx = line.b.x - line.a.x
    let vz = line.b.y - line.a.y
    let wx = x - line.a.x
    let wz = z - line.a.y
    let t = (wx * vx + wz * vz) / (vx * vx + vz * vz)
    if (t < 0.0) t = 0.0
    else if (t > 1.0) t = 1.0
    let px = line.a.x + vx * t - x
    let pz = line.a.y + vz * t - z
    if (px * px + pz * pz > box * box) return false
    return line.middle != null || this.y + 1.0 < line.plus.floor || this.y + this.height > line.plus.ceiling
  }

  tryMove(x, z) {
    let box = this.box
    let minC = Math.floor(x - box) >> WORLD_CELL_SHIFT
    let maxC = Math.floor(x + box) >> WORLD_CELL_SHIFT
    let minR = Math.floor(z - box) >> WORLD_CELL_SHIFT
    let maxR = Math.floor(z + box) >> WORLD_CELL_SHIFT
    let world = this.world
    let columns = world.columns
    if (minC < 0 || minR < 0 || maxC >= columns || maxR >= world.rows) return false
    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        let cell = world.cells[c + r * world.columns]
        let i = cell.thingCount
        while (i--) {
          let thing = cell.things[i]
          if (this == thing) continue
          if (this.tryOverlap(x, z, thing)) return false
        }
        i = cell.lines.length
        while (i--) {
          if (this.tryLineOverlap(x, z, cell.lines[i])) return false
        }
      }
    }
    return true
  }

  move() {
    let x = this.x + Math.sin(this.rotation) * this.speed
    let z = this.z - Math.cos(this.rotation) * this.speed
    if (this.tryMove(x, z)) {
      this.removeFromCells()
      this.previousX = this.x
      this.previousZ = this.z
      this.x = x
      this.z = z
      this.pushToCells()
      return true
    }
    return false
  }

  testMove() {
    if (!this.move()) {
      return false
    }
    this.moveCount = 16 + randomInt(32)
    return true
  }

  chaseDirection() {
    for (let i = 0; i < 4; i++) {
      this.rotation = Math.random() * 360
      if (this.testMove()) return
    }
  }

  damage(health) {
    if (this.status == STATUS_DEAD) return
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

  dead() {
    if (this.animationFrame == this.animation.length - 1) {
      return
    }
    this.updateAnimation()
    this.updateSprite()
  }

  look() {
    let things = this.world.things
    let i = this.world.thingCount
    while (i--) {
      let thing = things[i]
      if (this === thing) continue
      if (thing.health > 0) {
        this.target = thing
        this.status = STATUS_CHASE
        if (Math.random() < 0.2) playSound('baron-scream')
        return
      }
    }
    if (this.updateAnimation() == ANIMATION_DONE) {
      this.animationFrame = 0
    }
    this.updateSprite()
  }

  melee() {
    let frame = this.updateAnimation()
    if (frame == ANIMATION_ALMOST_DONE) {
      this.reaction = 40 + randomInt(220)
      if (this.approximateDistance(this.target)) {
        this.target.damage(1 + randomInt(3))
      }
    } else if (frame == ANIMATION_DONE) {
      this.status = STATUS_CHASE
      this.animationFrame = 0
      this.animation = this.animations.get('move')
      this.updateSprite()
    }
  }

  missile() {
    let frame = this.updateAnimation()
    if (frame == ANIMATION_ALMOST_DONE) {
      this.reaction = 40 + randomInt(220)
      let target = this.target
      let speed = 0.3
      let angle = Math.atan2(target.z - this.z, target.x - this.x)
      let distance = this.approximateDistance(target)
      let dx = Math.cos(angle)
      let dz = Math.sin(angle)
      let dy = (target.y + target.height * 0.5 - this.y - this.height * 0.5) / (distance / speed)
      let x = this.x + dx * this.box * 3.0
      let z = this.z + dz * this.box * 3.0
      let y = this.y + dy * this.height * 0.75
      new Plasma(this.world, entityByName('plasma'), x, y, z, dx * speed, dy, dz * speed, 1 + randomInt(3))
    } else if (frame == ANIMATION_DONE) {
      this.status = STATUS_CHASE
      this.animationFrame = 0
      this.animation = this.animations.get('move')
      this.updateSprite()
    }
  }

  chase() {
    if (this.reaction > 0) this.reaction--
    if (this.target.health <= 0 || this.target == null) {
      this.target = null
      this.status = STATUS_LOOK
    } else {
      let distance = this.approximateDistance(this.target)
      if (this.reaction == 0 && distance < this.meleeRange) {
        this.status = STATUS_MELEE
        this.animationFrame = 0
        this.animation = this.animations.get('melee')
        this.updateSprite()
        playSound('baron-melee')
      } else if (this.reaction == 0 && distance < this.missileRange) {
        this.status = STATUS_MISSILE
        this.animationFrame = 0
        this.animation = this.animations.get('missile')
        this.updateSprite()
        playSound('baron-missile')
      } else {
        this.moveCount--
        if (this.moveCount < 0 || !this.move()) {
          this.chaseDirection()
        }
        if (this.updateAnimation() == ANIMATION_DONE) {
          this.animationFrame = 0
        }
        this.updateSprite()
      }
    }
  }

  update() {
    switch (this.status) {
      case STATUS_LOOK:
        this.look()
        break
      case STATUS_CHASE:
        this.chase()
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
    }
    this.integrate()
    return false
  }
}
