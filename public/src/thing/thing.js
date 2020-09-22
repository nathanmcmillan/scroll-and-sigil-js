import {Float} from '/src/math/vector.js'
import {WORLD_CELL_SHIFT} from '/src/world/world.js'

export const GRAVITY = 0.028
export const RESISTANCE = 0.88

export class Thing {
  constructor(world, x, z, rotation, box, height) {
    let sector = world.findSector(x, z)
    this.world = world
    this.sector = sector
    this.x = x
    this.y = sector.floor
    this.z = z
    this.previousX = x
    this.previousY = sector.floor
    this.previousZ = z
    this.deltaX = 0.0
    this.deltaY = 0.0
    this.deltaZ = 0.0
    this.box = box
    this.height = height
    this.rotation = rotation
    this.ground = false
    this.speed = 0.0
    this.health = 0.0
    this.texture = 0
    this.sprite = null
    this.minC = 0
    this.maxC = 0
    this.minR = 0
    this.maxR = 0
    this.pushToCells()

    world.pushThing(this)
  }

  pushToCells() {
    let box = this.box
    let minC = Math.floor(this.x - box) >> WORLD_CELL_SHIFT
    let maxC = Math.floor(this.x + box) >> WORLD_CELL_SHIFT
    let minR = Math.floor(this.z - box) >> WORLD_CELL_SHIFT
    let maxR = Math.floor(this.z + box) >> WORLD_CELL_SHIFT

    let world = this.world
    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        world.cells[c + r * world.columns].pushThing(this)
      }
    }

    this.minC = minC
    this.maxC = maxC
    this.minR = minR
    this.maxR = maxR
  }

  removeFromCells() {
    let world = this.world
    for (let r = this.minR; r <= this.maxR; r++) {
      for (let c = this.minC; c <= this.maxC; c++) {
        world.cells[c + r * world.columns].removeThing(this)
      }
    }
  }

  collision(b) {
    let box = this.box + b.box
    return Math.abs(this.x - b.x) <= box && Math.abs(this.z - b.z) <= box
  }

  resolveCollision(b) {
    let box = this.box + b.box
    if (Math.abs(this.x - b.x) > box || Math.abs(this.z - b.z) > box) return

    if (Math.abs(this.previousX - b.x) > Math.abs(this.previousZ - b.z)) {
      if (this.previousX - b.x < 0) {
        this.x = b.x - box
      } else {
        this.x = b.x + box
      }
      this.deltaX = 0.0
    } else {
      if (this.previousZ - b.z < 0) {
        this.z = b.z - box
      } else {
        this.z = b.z + box
      }
      this.deltaZ = 0.0
    }
  }

  lineCollision(line) {
    let box = this.box

    let vx = line.b.x - line.a.x
    let vz = line.b.y - line.a.y

    let wx = this.x - line.a.x
    let wz = this.z - line.a.y

    let t = (wx * vx + wz * vz) / (vx * vx + vz * vz)

    let endpoint = false

    if (t < 0.0) {
      t = 0.0
      endpoint = true
    } else if (t > 1.0) {
      t = 1.0
      endpoint = true
    }

    let px = line.a.x + vx * t
    let pz = line.a.y + vz * t

    px -= this.x
    pz -= this.z

    if (px * px + pz * pz > box * box) return

    let collision = false

    if (line.middle != null) {
      collision = true
    } else {
      if (this.y + this.height > line.plus.ceiling || this.y + 1.0 < line.plus.floor) {
        collision = true
      }
    }

    if (collision) {
      if (this.sec == line.plus) return

      if (endpoint) {
        let ex = -px
        let ez = -pz

        let em = Math.sqrt(ex * ex + ez * ez)

        ex /= em
        ez /= em

        let overlap = Math.sqrt((px + box * ex) * (px + box * ex) + (pz + box * ez) * (pz + box * ez))

        this.x += ex * overlap
        this.z += ez * overlap
      } else {
        let overlap = Math.sqrt((px + box * line.normal.x) * (px + box * line.normal.x) + (pz + box * line.normal.y) * (pz + box * line.normal.y))

        this.x += line.normal.x * overlap
        this.z += line.normal.y * overlap
      }
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

      this.removeFromCells(self)

      let box = this.box
      let minC = Math.floor(this.x - box) >> WORLD_CELL_SHIFT
      let maxC = Math.floor(this.x + box) >> WORLD_CELL_SHIFT
      let minR = Math.floor(this.z - box) >> WORLD_CELL_SHIFT
      let maxR = Math.floor(this.z + box) >> WORLD_CELL_SHIFT

      let collided = new Set()
      let collisions = new Set()

      let world = this.world

      for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
          let cell = world.cells[c + r * world.columns]
          let i = cell.thingCount
          while (i--) {
            let t = cell.things[i]
            if (collisions.has(t)) continue
            if (this.collision(t)) collided.add(t)
            collisions.add(t)
          }
        }
      }

      while (collided.size > 0) {
        let closest = null
        let manhattan = Number.MAX_VALUE

        for (const t of collided) {
          let distance = Math.abs(this.previousX - t.x) + Math.abs(this.previousZ - t.z)
          if (distance < manhattan) {
            manhattan = distance
            closest = t
          }
        }

        this.resolveCollision(closest)

        collided.delete(closest)
      }

      for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
          let cell = world.cells[c + r * world.columns]
          for (const line of cell.lines) {
            this.lineCollision(line)
          }
        }
      }

      this.pushToCells()
    }

    if (this.ground == false || !Float.zero(this.deltaY)) {
      this.deltaY -= GRAVITY
      this.y += this.deltaY
      if (this.y < this.sector.floor) {
        this.ground = true
        this.deltaY = 0.0
        this.y = this.sector.floor
      } else {
        this.ground = false
      }
    }
  }

  render() {}
}
