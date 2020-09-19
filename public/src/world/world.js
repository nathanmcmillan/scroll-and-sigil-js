import {triangulate} from '/src/map/triangulate.js'

const WORLD_SCALE = 0.25
const WORLD_CELL_SHIFT = 5

class Cell {
  constructor() {
    this.lines = []
    this.things = []
  }
}

class World {
  constructor() {
    this.things = []
    this.sectors = []
    this.cells = []
    this.columns = 0
    this.rows = 0
  }

  build() {
    const size = 1 << WORLD_CELL_SHIFT
    let top = 0.0
    let right = 0.0
    for (const sector of this.sectors) {
      for (const vec of sector.vecs) {
        if (vec.y > top) top = vec.y
        if (vec.x > right) right = vec.x
      }
    }
  }

  pushThing(thing) {
    this.thing.push(thing)
  }

  pushSector(sector) {
    this.sectors.push(sector)
  }

  update() {
    let t = this.things.length
    while (t--) {
      this.things[t].update()
    }
  }
}

export {Cell, World}
