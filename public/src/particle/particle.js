import {Float} from '/src/math/vector.js'
import {WORLD_CELL_SHIFT, GRAVITY} from '/src/world/world.js'

export class Particle {
  constructor(world, x, y, z, dx, dy, dz, box, height) {
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

    this.pushToCells()
    world.pushParticle(this)
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
        world.cells[c + r * world.columns].pushParticle(this)
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
        world.cells[c + r * world.columns].removeParticle(this)
      }
    }
  }

  lineCollision() {}

  integrate() {
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
}
