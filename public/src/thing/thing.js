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
    this.box = box
    this.height = height
    this.rotation = rotation
    this.ground = false
    this.speed = 0.0
    this.health = 0.0
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
    for (let c = minC; c <= maxC; c++) {
      for (let r = minR; r <= maxR; r++) {
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
    for (let c = this.minC; c <= this.maxC; c++) {
      for (let r = this.minR; r <= this.maxR; r++) {
        world.cells[c + r * world.columns].removeThing(this)
      }
    }
  }

  integrate() {}

  render() {}
}
