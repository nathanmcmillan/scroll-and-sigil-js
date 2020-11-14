import {lineIntersect, Float} from '/src/math/vector.js'
import {toCell, toFloatCell, WORLD_CELL_SHIFT, GRAVITY, RESISTANCE, ANIMATION_RATE, ANIMATION_NOT_DONE, ANIMATION_ALMOST_DONE, ANIMATION_DONE} from '/src/world/world.js'

let collided = new Set()
let collisions = new Set()

// function sideOfLine(x, z, line) {
//   let vx = line.b.x - line.a.x
//   let vz = line.b.y - line.a.y
//   let wx = x - line.a.x
//   let wz = z - line.a.y
//   if (vx * wz - vz * wx < 0.0) return -1
//   return 1
// }

function thingUpdateY(self) {
  if (self.y < self.floor) {
    self.ground = true
    self.deltaY = 0.0
    self.y = self.floor
  } else if (self.y > self.floor) {
    self.ground = false
    if (self.y + self.height > self.ceiling) {
      self.deltaY = 0.0
      self.y = self.ceiling - self.height
    }
  }
}

function thingFindSector(self) {
  let previous = self.sector
  if (previous !== null && previous.contains(self.x, self.z)) return
  let sector = self.world.findSector(self.x, self.z)
  self.sector = sector
  self.floor = sector.floor
  self.ceiling = sector.ceiling
}

function thingLineCollision(self, line) {
  let box = self.box
  let vx = line.b.x - line.a.x
  let vz = line.b.y - line.a.y
  let wx = self.x - line.a.x
  let wz = self.z - line.a.y
  let t = (wx * vx + wz * vz) / (vx * vx + vz * vz)
  let endpoint = false
  if (t < 0.0) {
    t = 0.0
    endpoint = true
  } else if (t > 1.0) {
    t = 1.0
    endpoint = true
  }
  let px = line.a.x + vx * t - self.x
  let pz = line.a.y + vz * t - self.z
  if (px * px + pz * pz > box * box) return false
  const step = 1.0
  if (!line.middle) {
    let min = self.y + step
    let max = self.y + self.height
    if (line.plus && min > line.plus.floor && max < line.plus.ceiling) return true
    if (line.minus && min > line.minus.floor && max < line.minus.ceiling) return true
  }
  if (endpoint) {
    let ex = -px
    let ez = -pz
    let em = Math.sqrt(ex * ex + ez * ez)
    ex /= em
    ez /= em
    let overlap = Math.sqrt((px + box * ex) * (px + box * ex) + (pz + box * ez) * (pz + box * ez))
    self.x += ex * overlap
    self.z += ez * overlap
  } else {
    let overlap = Math.sqrt((px + box * line.normal.x) * (px + box * line.normal.x) + (pz + box * line.normal.y) * (pz + box * line.normal.y))
    self.x += line.normal.x * overlap
    self.z += line.normal.y * overlap
  }
  return false
}

function thingLineFloorAndCeiling(self, line) {
  let box = self.box
  let vx = line.b.x - line.a.x
  let vz = line.b.y - line.a.y
  let wx = self.x - line.a.x
  let wz = self.z - line.a.y
  let t = (wx * vx + wz * vz) / (vx * vx + vz * vz)
  if (t < 0.0) t = 0.0
  else if (t > 1.0) t = 1.0
  let px = line.a.x + vx * t - self.x
  let pz = line.a.y + vz * t - self.z
  if (px * px + pz * pz > box * box) return false
  if (line.plus) {
    if (line.plus.floor > self.floor) {
      self.sector = line.plus
      self.floor = line.plus.floor
    }
    if (line.plus.ceiling < self.ceiling) self.ceiling = line.plus.ceiling
  }
  if (line.minus) {
    if (line.minus.floor > self.floor) {
      self.sector = line.minus
      self.floor = line.minus.floor
    }
    if (line.minus.ceiling < self.ceiling) self.ceiling = line.minus.ceiling
  }
  return true
}

function thingFindSectorFromLine(self) {
  self.floor = -Number.MAX_VALUE
  self.ceiling = Number.MAX_VALUE
  const cells = self.world.cells
  const columns = self.world.columns
  let on = false
  for (let r = self.minR; r <= self.maxR; r++) {
    for (let c = self.minC; c <= self.maxC; c++) {
      let cell = cells[c + r * columns]
      let i = cell.lines.length
      while (i--) {
        on = thingLineFloorAndCeiling(self, cell.lines[i]) || on
      }
    }
  }
  return on
}

export class Thing {
  constructor(world, x, z) {
    this.world = world
    this.sector = null
    this.floor = 0.0
    this.ceiling = 0.0
    this.x = this.previousX = x
    this.z = this.previousZ = z
    this.y = 0.0
    this.deltaX = 0.0
    this.deltaY = 0.0
    this.deltaZ = 0.0
    this.box = 0.0
    this.height = 0.0
    this.rotation = 0.0
    this.ground = false
    this.speed = 0.0
    this.health = 0.0
    this.texture = 0
    this.sprite = null
    this.minC = 0
    this.maxC = 0
    this.minR = 0
    this.maxR = 0
    this.animationMod = 0
    this.animationFrame = 0
    this.animation = null
    this.isPhysical = true
    this.isItem = false
    this.name = null
    this.group = null
    this.interaction = null
    this.experience = 1
  }

  setup() {
    this.pushToCells()
    if (!thingFindSectorFromLine(this)) thingFindSector(this)
    thingUpdateY(this)
    this.world.pushThing(this)
  }

  set(x, z) {
    this.x = this.previousX = x
    this.z = this.previousZ = z
    this.pushToCells()
    this.sector = null
    if (!thingFindSectorFromLine(this)) thingFindSector(this)
    thingUpdateY(this)
    this.world.pushThing(this)
  }

  teleport(x, z) {
    this.removeFromCells()
    this.x = this.previousX = x
    this.z = this.previousZ = z
    this.pushToCells()
    this.sector = null
    if (!thingFindSectorFromLine(this)) thingFindSector(this)
    thingUpdateY(this)
  }

  pushToCells() {
    let box = this.box
    let minC = Math.floor(this.x - box) >> WORLD_CELL_SHIFT
    let maxC = Math.floor(this.x + box) >> WORLD_CELL_SHIFT
    let minR = Math.floor(this.z - box) >> WORLD_CELL_SHIFT
    let maxR = Math.floor(this.z + box) >> WORLD_CELL_SHIFT

    let world = this.world
    let columns = world.columns

    if (minC < 0) minC = 0
    if (minR < 0) minR = 0
    if (maxC >= columns) maxC = columns - 1
    if (maxR >= world.rows) maxR = world.rows - 1

    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        world.cells[c + r * columns].pushThing(this)
      }
    }

    this.minC = minC
    this.maxC = maxC
    this.minR = minR
    this.maxR = maxR
  }

  removeFromCells() {
    const cells = this.world.cells
    const columns = this.world.columns
    for (let r = this.minR; r <= this.maxR; r++) {
      for (let c = this.minC; c <= this.maxC; c++) {
        cells[c + r * columns].removeThing(this)
      }
    }
  }

  updateAnimation() {
    this.animationMod++
    if (this.animationMod === ANIMATION_RATE) {
      this.animationMod = 0
      this.animationFrame++
      let frames = this.animation.length
      if (this.animationFrame === frames - 1) return ANIMATION_ALMOST_DONE
      else if (this.animationFrame === frames) return ANIMATION_DONE
    }
    return ANIMATION_NOT_DONE
  }

  updateSprite() {
    this.sprite = this.animation[this.animationFrame]
  }

  damage() {}

  checkSight(thing) {
    let xf = toFloatCell(this.x)
    let yf = toFloatCell(this.z)
    let dx = Math.abs(toFloatCell(thing.x) - xf)
    let dy = Math.abs(toFloatCell(thing.z) - yf)
    let x = toCell(this.x)
    let y = toCell(this.z)
    let xb = toCell(thing.x)
    let yb = toCell(thing.z)
    let n = 1
    let error = 0.0
    let incrementX = 0
    let incrementY = 0
    if (Float.zero(dx)) {
      incrementX = 0
      error = Number.MAX_VALUE
    } else if (thing.x > this.x) {
      incrementX = 1
      n += xb - x
      error = (x + 1.0 - xf) * dy
    } else {
      incrementX = -1
      n += x - xb
      error = (xf - x) * dy
    }
    if (Float.zero(dy)) {
      incrementY = 0
      error = -Number.MAX_VALUE
    } else if (thing.z > this.z) {
      incrementY = 1
      n += yb - y
      error -= (y + 1.0 - yf) * dx
    } else {
      incrementY = -1
      n += y - yb
      error -= (yf - y) * dx
    }
    let cells = this.world.cells
    let columns = this.world.columns
    for (; n > 0; n--) {
      let cell = cells[x + y * columns]
      let i = cell.lines.length
      while (i--) {
        let line = cell.lines[i]
        if (line.middle && lineIntersect(this.x, this.z, thing.x, thing.z, line.a.x, line.a.y, line.b.x, line.b.y)) return false
      }
      if (error > 0.0) {
        y += incrementY
        error -= dx
      } else {
        x += incrementX
        error += dy
      }
    }
    return true
  }

  approximateDistance(thing) {
    let dx = Math.abs(this.x - thing.x)
    let dz = Math.abs(this.z - thing.z)
    if (dx > dz) {
      return dx + dz - dz * 0.5
    }
    return dx + dz - dx * 0.5
  }

  collision(thing) {
    let box = this.box + thing.box
    return Math.abs(this.x - thing.x) <= box && Math.abs(this.z - thing.z) <= box
  }

  resolveCollision(thing) {
    let box = this.box + thing.box
    if (Math.abs(this.x - thing.x) > box || Math.abs(this.z - thing.z) > box) return
    if (Math.abs(this.previousX - thing.x) > Math.abs(this.previousZ - thing.z)) {
      if (this.previousX - thing.x < 0.0) {
        this.x = thing.x - box
      } else {
        this.x = thing.x + box
      }
      this.deltaX = 0.0
    } else {
      if (this.previousZ - thing.z < 0.0) {
        this.z = thing.z - box
      } else {
        this.z = thing.z + box
      }
      this.deltaZ = 0.0
    }
  }

  integrate() {
    if (this.ground) {
      this.deltaX *= RESISTANCE
      this.deltaZ *= RESISTANCE
    }

    if (!Float.zero(this.deltaX) || !Float.zero(this.deltaZ)) {
      this.previousX = this.x
      this.previousZ = this.z

      this.x += this.deltaX
      this.z += this.deltaZ

      this.removeFromCells()

      let box = this.box
      let minC = Math.floor(this.x - box) >> WORLD_CELL_SHIFT
      let maxC = Math.floor(this.x + box) >> WORLD_CELL_SHIFT
      let minR = Math.floor(this.z - box) >> WORLD_CELL_SHIFT
      let maxR = Math.floor(this.z + box) >> WORLD_CELL_SHIFT
      let world = this.world
      let columns = world.columns
      if (minC < 0) minC = 0
      if (minR < 0) minR = 0
      if (maxC >= columns) maxC = columns - 1
      if (maxR >= world.rows) maxR = world.rows - 1

      collided.clear()
      collisions.clear()

      for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
          let cell = world.cells[c + r * columns]
          let i = cell.thingCount
          while (i--) {
            let thing = cell.things[i]
            if (!thing.isPhysical || collisions.has(thing)) continue
            if (this.collision(thing)) collided.add(thing)
            collisions.add(thing)
          }
        }
      }

      while (collided.size > 0) {
        let closest = null
        let manhattan = Number.MAX_VALUE
        for (const thing of collided) {
          let distance = Math.abs(this.previousX - thing.x) + Math.abs(this.previousZ - thing.z)
          if (distance < manhattan) {
            manhattan = distance
            closest = thing
          }
        }
        this.resolveCollision(closest)
        collided.delete(closest)
      }

      let on = false
      for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
          let cell = world.cells[c + r * world.columns]
          let i = cell.lines.length
          while (i--) {
            on = thingLineCollision(this, cell.lines[i]) || on
          }
        }
      }
      if (on) on = thingFindSectorFromLine(this)
      if (!on) thingFindSector(this)

      this.pushToCells()
    }

    if (this.ground === false || !Float.zero(this.deltaY)) {
      this.deltaY -= GRAVITY
      this.y += this.deltaY
    }

    thingUpdateY(this)
  }
}
