import {
  thingSetup,
  thingPushToCells,
  thingRemoveFromCells,
  thingFindSector,
  thingY,
  thingApproximateDistance,
  thingCheckSight,
  thingUpdateSprite,
  thingUpdateAnimation,
  Thing,
} from '/src/thing/thing.js'
import {randomInt} from '/src/math/random.js'
import {WORLD_CELL_SHIFT, ANIMATION_ALMOST_DONE, ANIMATION_DONE} from '/src/world/world.js'
import {newPlasma} from '/src/missile/plasma.js'
import {playSound} from '/src/assets/sounds.js'
import {textureIndexForName, entityByName} from '/src/assets/assets.js'
import {redBloodTowards, redBloodExplode} from '/src/thing/thing-util.js'
import {sin, cos, atan2} from '/src/math/approximate.js'

const STATUS_LOOK = 0
const STATUS_CHASE = 1
const STATUS_MELEE = 2
const STATUS_MISSILE = 3
const STATUS_DEAD = 4
const STATUS_FINAL = 5

let tempSector = null
let tempFloor = 0.0
let tempCeiling = 0.0

function thingTryOverlap(x, z, box, thing) {
  box += thing.box
  return Math.abs(x - thing.x) <= box && Math.abs(z - thing.z) <= box
}

function thingTryLineOverlap(self, x, z, line) {
  if (!line.physical) {
    if (line.plus) {
      if (line.plus.floor > tempFloor) {
        tempSector = line.plus
        tempFloor = line.plus.floor
      }
      if (line.plus.ceiling < tempCeiling) tempCeiling = line.plus.ceiling
    }
    if (line.minus) {
      if (line.minus.floor > tempFloor) {
        tempSector = line.minus
        tempFloor = line.minus.floor
      }
      if (line.minus.ceiling < tempCeiling) tempCeiling = line.minus.ceiling
    }
    const step = 1.0
    let min = self.y + step
    let max = self.y + self.height
    if (line.plus && min > line.plus.floor && max < line.plus.ceiling) return false
    if (line.minus && min > line.minus.floor && max < line.minus.ceiling) return false
  }
  let box = self.box
  let vx = line.b.x - line.a.x
  let vz = line.b.y - line.a.y
  let wx = x - line.a.x
  let wz = z - line.a.y
  let t = (wx * vx + wz * vz) / (vx * vx + vz * vz)
  if (t < 0.0) t = 0.0
  else if (t > 1.0) t = 1.0
  let px = line.a.x + vx * t - x
  let pz = line.a.y + vz * t - z
  return px * px + pz * pz <= box * box
}

function thingTryMove(self, x, z) {
  tempSector = null
  tempFloor = -Number.MAX_VALUE
  tempCeiling = Number.MAX_VALUE
  let box = self.box
  let minC = Math.floor(x - box) >> WORLD_CELL_SHIFT
  let maxC = Math.floor(x + box) >> WORLD_CELL_SHIFT
  let minR = Math.floor(z - box) >> WORLD_CELL_SHIFT
  let maxR = Math.floor(z + box) >> WORLD_CELL_SHIFT
  let world = self.world
  let columns = world.columns
  if (minC < 0 || minR < 0 || maxC >= columns || maxR >= world.rows) return false
  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      let cell = world.cells[c + r * columns]
      let i = cell.thingCount
      while (i--) {
        let thing = cell.things[i]
        if (self === thing) continue
        if (thingTryOverlap(x, z, box, thing)) return false
      }
      i = cell.lines.length
      while (i--) {
        if (thingTryLineOverlap(self, x, z, cell.lines[i])) return false
      }
    }
  }
  return true
}

function thingMove(self) {
  let x = self.x + cos(self.rotation) * self.speed
  let z = self.z + sin(self.rotation) * self.speed
  if (thingTryMove(self, x, z)) {
    thingRemoveFromCells(self)
    self.previousX = self.x
    self.previousZ = self.z
    self.x = x
    self.z = z
    thingPushToCells(self)
    if (tempSector === null) {
      if (self.wasOnLine) thingFindSector(self)
    } else {
      self.sector = tempSector
      self.floor = tempFloor
      self.ceiling = tempCeiling
    }
    self.wasOnLine = tempSector !== null
    return true
  }
  return false
}

function baronTestMove(self) {
  if (!thingMove(self)) return false
  self.moveCount = 16 + randomInt(32)
  return true
}

function chaseDirection(self) {
  let angle = atan2(self.target.z - self.z, self.target.x - self.x)
  for (let i = 0; i < 4; i++) {
    self.rotation = angle - 0.785375 + 1.57075 * Math.random()
    if (baronTestMove(self)) return
    angle += Math.PI
  }
  if (self.rotation < 0.0) self.rotation += 2.0 * Math.PI
  else if (self.rotation >= 2.0 * Math.PI) self.rotation -= 2.0 * Math.PI
}

function baronDamage(source, health) {
  if (this.status === STATUS_DEAD || this.status === STATUS_FINAL) return
  this.health -= health
  if (this.health <= 0) {
    playSound('baron-death')
    this.health = 0
    this.status = STATUS_DEAD
    this.animationFrame = 0
    this.animation = this.animations.get('death')
    thingUpdateSprite(this)
    redBloodExplode(this)
  } else {
    playSound('baron-pain')
    redBloodTowards(this, source)
  }
}

function baronUpdate() {
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
    case STATUS_FINAL:
      return false
  }
  thingY(this)
  return false
}

export class Baron extends Thing {
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
    this.meleeRange = 1.0
    this.missileRange = 50.0
    this.status = STATUS_LOOK
    this.reaction = 0
    this.damage = baronDamage
    this.update = baronUpdate
    thingSetup(this)
  }

  dead() {
    if (this.animationFrame === this.animation.length - 1) {
      this.isPhysical = false
      this.status = STATUS_FINAL
      return
    }
    thingUpdateAnimation(this)
    thingUpdateSprite(this)
  }

  look() {
    if (this.reaction > 0) {
      this.reaction--
    } else {
      let things = this.world.things
      let i = this.world.thingCount
      while (i--) {
        let thing = things[i]
        if (this === thing) continue
        if (thing.group === 'human' && thing.health > 0 && thingCheckSight(this, thing)) {
          if (Math.random() < 0.4) playSound('baron-scream')
          this.target = thing
          this.status = STATUS_CHASE
          this.animationFrame = 0
          this.animation = this.animations.get('move')
          thingUpdateSprite(this)
          return
        }
      }
      this.reaction = 10 + randomInt(60)
    }
    if (thingUpdateAnimation(this) === ANIMATION_DONE) this.animationFrame = 0
    thingUpdateSprite(this)
  }

  melee() {
    let frame = thingUpdateAnimation(this)
    if (frame === ANIMATION_ALMOST_DONE) {
      this.reaction = 40 + randomInt(220)
      if (thingApproximateDistance(this, this.target) < this.box + this.target.box + this.meleeRange) {
        this.target.damage(this, 1 + randomInt(3))
      }
    } else if (frame === ANIMATION_DONE) {
      this.status = STATUS_CHASE
      this.animationFrame = 0
      this.animation = this.animations.get('move')
      thingUpdateSprite(this)
    }
  }

  missile() {
    let frame = thingUpdateAnimation(this)
    if (frame === ANIMATION_ALMOST_DONE) {
      this.reaction = 40 + randomInt(220)
      const speed = 0.3
      let target = this.target
      let angle = atan2(target.z - this.z, target.x - this.x)
      let distance = thingApproximateDistance(this, target)
      let dx = cos(angle)
      let dz = sin(angle)
      let dy = (target.y + target.height * 0.5 - this.y - this.height * 0.5) / (distance / speed)
      let x = this.x + dx * (this.box + 2.0)
      let z = this.z + dz * (this.box + 2.0)
      let y = this.y + 0.5 * this.height
      newPlasma(this.world, entityByName('plasma'), x, y, z, dx * speed, dy, dz * speed, 1 + randomInt(3))
    } else if (frame === ANIMATION_DONE) {
      this.status = STATUS_CHASE
      this.animationFrame = 0
      this.animation = this.animations.get('move')
      thingUpdateSprite(this)
    }
  }

  chase() {
    if (this.reaction > 0) this.reaction--
    if (this.target.health <= 0 || this.target === null) {
      this.target = null
      this.status = STATUS_LOOK
      this.animationFrame = 0
      this.animation = this.animations.get('idle')
      thingUpdateSprite(this)
    } else {
      let distance = thingApproximateDistance(this, this.target)
      if (this.reaction <= 0 && distance < this.box + this.target.box + this.meleeRange) {
        playSound('baron-melee')
        this.status = STATUS_MELEE
        this.animationFrame = 0
        this.animation = this.animations.get('melee')
        thingUpdateSprite(this)
      } else if (this.reaction <= 0 && distance < this.missileRange) {
        if (thingCheckSight(this, this.target)) {
          playSound('baron-missile')
          this.status = STATUS_MISSILE
          this.animationFrame = 0
          this.animation = this.animations.get('missile')
          thingUpdateSprite(this)
        } else {
          this.reaction = 20 + randomInt(110)
        }
      } else {
        this.moveCount--
        if (this.moveCount < 0 || !thingMove(this)) chaseDirection(this)
        if (thingUpdateAnimation(this) === ANIMATION_DONE) this.animationFrame = 0
        thingUpdateSprite(this)
      }
    }
  }
}
