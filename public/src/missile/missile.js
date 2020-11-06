import {WORLD_CELL_SHIFT} from '/src/world/world.js'

export class Missile {
  constructor(world, x, y, z, dx, dy, dz, box, height, damage) {
    let sector = world.findSector(x, z)
    this.world = world
    this.sector = sector
    this.x = x
    this.y = y
    this.z = z
    this.deltaX = dx
    this.deltaY = dy
    this.deltaZ = dz
    this.box = box
    this.height = height
    this.ground = false
    this.texture = 0
    this.sprite = null
    this.minC = 0
    this.maxC = 0
    this.minR = 0
    this.maxR = 0
    this.damage = damage

    this.pushToCells()
    world.pushMissile(this)
  }

  pushToCells() {
    let box = this.box
    let minC = Math.floor(this.x - box) >> WORLD_CELL_SHIFT
    let maxC = Math.floor(this.x + box) >> WORLD_CELL_SHIFT
    let minR = Math.floor(this.z - box) >> WORLD_CELL_SHIFT
    let maxR = Math.floor(this.z + box) >> WORLD_CELL_SHIFT

    let world = this.world
    let columns = world.columns

    if (minC < 0 || minR < 0 || maxC >= columns || maxR >= world.rows) return true

    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        world.cells[c + r * columns].pushMissile(this)
      }
    }

    this.minC = minC
    this.maxC = maxC
    this.minR = minR
    this.maxR = maxR

    return false
  }

  removeFromCells() {
    let world = this.world
    for (let r = this.minR; r <= this.maxR; r++) {
      for (let c = this.minC; c <= this.maxC; c++) {
        world.cells[c + r * world.columns].removeMissile(this)
      }
    }
  }

  overlap(thing) {
    let box = this.box + thing.box
    return Math.abs(this.x - thing.x) <= box && Math.abs(this.z - thing.z) <= box
  }

  lineOverlap(line) {
    let box = this.box
    let vx = line.b.x - line.a.x
    let vz = line.b.y - line.a.y
    let wx = this.x - line.a.x
    let wz = this.z - line.a.y
    let t = (wx * vx + wz * vz) / (vx * vx + vz * vz)
    if (t < 0.0) t = 0.0
    else if (t > 1.0) t = 1.0
    let px = line.a.x + vx * t - this.x
    let pz = line.a.y + vz * t - this.z
    if (px * px + pz * pz > box * box) return false
    if (!line.plus) return false
    return line.middle || this.y < line.plus.floor || this.y + this.height > line.plus.ceiling
  }

  hit(thing) {
    if (thing) thing.damage(this, this.damage)
  }

  check() {
    let box = this.box
    let minC = Math.floor(this.x - box) >> WORLD_CELL_SHIFT
    let maxC = Math.floor(this.x + box) >> WORLD_CELL_SHIFT
    let minR = Math.floor(this.z - box) >> WORLD_CELL_SHIFT
    let maxR = Math.floor(this.z + box) >> WORLD_CELL_SHIFT
    let world = this.world
    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        let cell = world.cells[c + r * world.columns]
        let i = cell.thingCount
        while (i--) {
          let thing = cell.things[i]
          if (this == thing) continue
          if (thing.isPhysical && this.overlap(thing)) {
            this.hit(thing)
            return true
          }
        }
        i = cell.lines.length
        while (i--) {
          if (this.lineOverlap(cell.lines[i])) {
            this.hit(null)
            return true
          }
        }
      }
    }
  }

  integrate() {
    if (this.check()) return true
    this.x += this.deltaX
    this.y += this.deltaY
    this.z += this.deltaZ
    this.removeFromCells()
    if (this.pushToCells()) return true
    return this.check()
  }
}
