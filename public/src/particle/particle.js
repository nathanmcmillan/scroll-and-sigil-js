import {WORLD_CELL_SHIFT, ANIMATION_RATE, ANIMATION_NOT_DONE, ANIMATION_ALMOST_DONE, ANIMATION_DONE} from '/src/world/world.js'

export class Particle {
  constructor() {
    this.world = null
    this.sector = null
    this.x = 0.0
    this.y = 0.0
    this.z = 0.0
    this.deltaX = 0.0
    this.deltaY = 0.0
    this.deltaZ = 0.0
    this.box = 0.0
    this.height = 0.0
    this.ground = false
    this.texture = 0
    this.sprite = null
    this.minC = 0
    this.maxC = 0
    this.minR = 0
    this.maxR = 0
  }

  initialize(world, x, y, z) {
    this.world = world
    this.x = x
    this.y = y
    this.z = z
  }

  setup() {
    this.pushToCells()
    this.updateSector()
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
        world.cells[c + r * columns].pushParticle(this)
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

  updateSector() {
    this.sector = this.world.findSector(this.x, this.z)
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

  update() {}
}
