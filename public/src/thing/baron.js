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
}

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

function baronDead(self) {
  if (self.animationFrame === self.animation.length - 1) {
    self.isPhysical = false
    self.status = STATUS_FINAL
    return
  }
  thingUpdateAnimation(self)
  thingUpdateSprite(self)
}

function baronLook(self) {
  if (self.reaction > 0) {
    self.reaction--
  } else {
    let things = self.world.things
    let i = self.world.thingCount
    while (i--) {
      let thing = things[i]
      if (self === thing) continue
      if (thing.group === 'human' && thing.health > 0 && thingCheckSight(self, thing)) {
        if (Math.random() < 0.9) playSound('baron-scream')
        self.target = thing
        self.status = STATUS_CHASE
        self.animationFrame = 0
        self.animation = self.animations.get('move')
        thingUpdateSprite(self)
        return
      }
    }
    self.reaction = 10 + randomInt(20)
  }
  if (thingUpdateAnimation(self) === ANIMATION_DONE) self.animationFrame = 0
  thingUpdateSprite(self)
}

function baronMelee(self) {
  let frame = thingUpdateAnimation(self)
  if (frame === ANIMATION_ALMOST_DONE) {
    self.reaction = 40 + randomInt(220)
    if (thingApproximateDistance(self, self.target) < self.box + self.target.box + self.meleeRange) {
      self.target.damage(self, 1 + randomInt(3))
    }
  } else if (frame === ANIMATION_DONE) {
    self.status = STATUS_CHASE
    self.animationFrame = 0
    self.animation = self.animations.get('move')
    thingUpdateSprite(self)
  }
}

function baronMissile(self) {
  let frame = thingUpdateAnimation(self)
  if (frame === ANIMATION_ALMOST_DONE) {
    self.reaction = 40 + randomInt(220)
    const speed = 0.3
    let target = self.target
    let angle = atan2(target.z - self.z, target.x - self.x)
    let distance = thingApproximateDistance(self, target)
    let dx = cos(angle)
    let dz = sin(angle)
    let dy = (target.y + target.height * 0.5 - self.y - self.height * 0.5) / (distance / speed)
    let x = self.x + dx * (self.box + 2.0)
    let z = self.z + dz * (self.box + 2.0)
    let y = self.y + 0.5 * self.height
    newPlasma(self.world, entityByName('plasma'), x, y, z, dx * speed, dy, dz * speed, 1 + randomInt(3))
  } else if (frame === ANIMATION_DONE) {
    self.status = STATUS_CHASE
    self.animationFrame = 0
    self.animation = self.animations.get('move')
    thingUpdateSprite(self)
  }
}

function baronChase(self) {
  if (self.reaction > 0) self.reaction--
  if (self.target.health <= 0 || self.target === null) {
    self.target = null
    self.status = STATUS_LOOK
    self.animationFrame = 0
    self.animation = self.animations.get('idle')
    thingUpdateSprite(self)
  } else {
    let distance = thingApproximateDistance(self, self.target)
    if (self.reaction <= 0 && distance < self.box + self.target.box + self.meleeRange) {
      playSound('baron-melee')
      self.status = STATUS_MELEE
      self.animationFrame = 0
      self.animation = self.animations.get('melee')
      thingUpdateSprite(self)
    } else if (self.reaction <= 0 && distance < self.missileRange) {
      if (thingCheckSight(self, self.target)) {
        playSound('baron-missile')
        self.status = STATUS_MISSILE
        self.animationFrame = 0
        self.animation = self.animations.get('missile')
        thingUpdateSprite(self)
      } else {
        self.reaction = 20 + randomInt(110)
      }
    } else {
      self.moveCount--
      if (self.moveCount < 0 || !thingMove(self)) chaseDirection(self)
      if (thingUpdateAnimation(self) === ANIMATION_DONE) self.animationFrame = 0
      thingUpdateSprite(self)
    }
  }
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
      baronLook(this)
      break
    case STATUS_CHASE:
      baronChase(this)
      break
    case STATUS_MELEE:
      baronMelee(this)
      break
    case STATUS_MISSILE:
      baronMissile(this)
      break
    case STATUS_DEAD:
      baronDead(this)
      break
    case STATUS_FINAL:
      return false
  }
  thingY(this)
  return false
}
