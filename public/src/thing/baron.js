import {randomInt} from '/src/math/random.js'
import {ANIMATION_ALMOST_DONE, ANIMATION_DONE} from '/src/world/world.js'
import {Thing} from '/src/thing/thing.js'
import {Sprite} from '/src/render/sprite.js'
import {WORLD_CELL_SHIFT} from '/src/world/world.js'
import {Plasma} from '/src/missile/plasma.js'
import {Blood} from '/src/particle/blood.js'
import {playSound} from '/src/client/sound.js'

const BARON_ANIMATION_MOVE = [0, 0, 0, 0]
const BARON_ANIMATION_MELEE = [0, 0, 0, 0]
const BARON_ANIMATION_MISSILE = [0, 0, 0, 0]
const BARON_ANIMATION_DEATH = [0, 0, 0, 0]

const BARON_LOOK = 0
const BARON_CHASE = 1
const BARON_MELEE = 2
const BARON_MISSILE = 3
const BARON_DEAD = 4

export class Baron extends Thing {
  constructor(world, x, z) {
    super(world, x, z, 0.0, 0.4, 1.0)
    let scale = 1.0 / 64.0
    let atlasWidth = 1.0 / 1024.0
    let atlasHeight = 1.0 / 512.0
    let left = 696
    let top = 0
    let width = 110
    let height = 128
    this.texture = 1
    this.sprite = new Sprite(left, top, width, height, 0.0, 0.0, atlasWidth, atlasHeight, scale)
    this.health = 1
    this.speed = 0.1
    this.animation = BARON_ANIMATION_MOVE
    this.target = null
    this.moveCount = 0
    this.meleeRange = 2.0
    this.missileRange = 10.0
    this.status = BARON_LOOK
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
    if (this.status == BARON_DEAD) return
    this.health -= health
    if (this.health <= 0) {
      this.health = 0
      this.status = BARON_DEAD
      this.animationFrame = 0
      this.animation = BARON_ANIMATION_DEATH
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
      new Blood(this.world, x, y, z, dx, dy, dz)
    }
  }

  dead() {
    if (this.animationFrame == this.animation.length - 1) {
      return
    }
    this.updateAnimation()
  }

  look() {
    let things = this.world.things
    let i = this.world.thingCount
    while (i--) {
      let thing = things[i]
      if (this === thing) continue
      if (thing.health > 0) {
        this.target = thing
        this.status = BARON_CHASE
        if (Math.random() < 0.2) playSound('baron-scream')
        return
      }
    }
    if (this.updateAnimation() == ANIMATION_DONE) {
      this.animationFrame = 0
    }
  }

  melee() {
    let frame = this.updateAnimation()
    if (frame == ANIMATION_ALMOST_DONE) {
      this.reaction = 40 + randomInt(220)
      if (this.approximateDistance(this.target)) {
        this.target.damage(1 + randomInt(3))
      }
    } else if (frame == ANIMATION_DONE) {
      this.status = BARON_CHASE
      this.animationFrame = 0
      this.animation = BARON_ANIMATION_MOVE
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
      let x = this.x + dx * this.box * 2.0
      let z = this.z + dz * this.box * 2.0
      let y = this.y + dy * this.height * 0.75
      new Plasma(this.world, x, y, z, dx * speed, dy, dz * speed, 1 + randomInt(3))
    } else if (frame == ANIMATION_DONE) {
      this.status = BARON_CHASE
      this.animationFrame = 0
      this.animation = BARON_ANIMATION_MOVE
    }
  }

  chase() {
    if (this.reaction > 0) this.reaction--
    if (this.target.health <= 0 || this.target == null) {
      this.target = null
      this.status = BARON_LOOK
    } else {
      let distance = this.approximateDistance(this.target)
      if (this.reaction == 0 && distance < this.meleeRange) {
        this.status = BARON_MELEE
        this.animationFrame = 0
        this.animation = BARON_ANIMATION_MELEE
        playSound('baron-melee')
      } else if (this.reaction == 0 && distance < this.missileRange) {
        this.status = BARON_MISSILE
        this.animationFrame = 0
        this.animation = BARON_ANIMATION_MISSILE
        playSound('baron-missile')
      } else {
        this.moveCount--
        if (this.moveCount < 0 || !this.move()) {
          this.chaseDirection()
        }
        if (this.updateAnimation() == ANIMATION_DONE) {
          this.animationFrame = 0
        }
      }
    }
  }

  update() {
    switch (this.status) {
      case BARON_LOOK:
        this.look()
        break
      case BARON_CHASE:
        this.chase()
        break
      case BARON_MELEE:
        this.melee()
        break
      case BARON_MISSILE:
        this.missile()
        break
      case BARON_DEAD:
        this.dead()
        break
    }
    this.integrate()
    return false
  }
}
