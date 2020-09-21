import {triangulate} from '/src/map/triangulate.js'

const WORLD_SCALE = 0.25
export const WORLD_CELL_SHIFT = 5

export class Cell {
  constructor() {
    this.lines = []
    this.things = []
    this.thingCount = 0
  }

  pushThing(thing) {
    let things = this.things
    if (things.length === this.thingCount) {
      things.push(thing)
    } else {
      things[this.thingCount] = thing
    }
    this.thingCount++
  }

  removeThing(thing) {
    let things = this.things
    let index = things.indexOf(thing)
    things[index] = things[things.length - 1]
    this.thingCount--
  }
}

export class World {
  constructor() {
    this.things = []
    this.thingCount = 0
    this.sectors = []
    this.cells = null
    this.columns = 0
    this.rows = 0
  }

  buildCellLines(line) {
    let dx = Math.abs(line.b.x - line.a.x)
    let dy = Math.abs(line.b.y - line.a.y)

    let x = Math.floor(line.a.x)
    let y = Math.floor(line.a.y)

    let n = 1
    let error = 0.0
    let incrementX = 0
    let incrementY = 0

    if (dx == 0.0) {
      incrementX = 0
      error = Number.MAX_VALUE
    } else if (line.b.x > line.a.x) {
      incrementX = 1
      n += Math.floor(line.b.x) - x
      error = (Math.floor(line.a.x) + 1.0 - line.a.x) * dy
    } else {
      incrementX = -1
      n += x - Math.floor(line.b.x)
      error = (line.a.x - Math.floor(line.a.x)) * dy
    }

    if (dy == 0.0) {
      incrementY = 0
      error = Number.MIN_VALUE
    } else if (line.b.y > line.a.y) {
      incrementY = 1
      n += Math.floor(line.b.y) - y
      error -= (Math.floor(line.a.y) + 1.0 - line.a.y) * dx
    } else {
      incrementY = -1
      n += y - Math.floor(line.b.y)
      error -= (line.a.y - Math.floor(line.a.y)) * dx
    }

    while (n > 0) {
      let cell = this.cells[(x >> WORLD_CELL_SHIFT) + (y >> WORLD_CELL_SHIFT) * this.columns]
      cell.lines.push(line)

      if (error > 0.0) {
        y += incrementY
        error -= dx
      } else {
        x += incrementX
        error += dy
      }

      n -= 1
    }
  }

  buildLines(sector) {
    if (sector.lines.length == 0) {
      return
    }
    let plus = null
    let minus = null
    if (sector.outside == null) {
      minus = sector
    } else {
      plus = sector
      minus = sector.outside
    }
    let bottom = sector.bottom
    let floor = sector.floor
    let ceil = sector.ceiling
    let top = sector.top
    let uv = 0.0
    for (const line of sector.lines) {
      this.buildCellLines(line)
      line.updateSectors(plus, minus)
      let x = line.a.x - line.b.x
      let y = line.a.y - line.b.y
      let st = uv + Math.sqrt(x * x + y * y) * WORLD_SCALE
      if (line.top != null) {
        line.top.update(ceil, top, uv, ceil * WORLD_SCALE, st, top * WORLD_SCALE)
      }
      if (line.middle != null) {
        line.middle.update(floor, ceil, uv, floor * WORLD_SCALE, st, ceil * WORLD_SCALE)
      }
      if (line.bottom != null) {
        line.bottom.update(bottom, floor, uv, bottom * WORLD_SCALE, st, floor * WORLD_SCALE)
      }
      uv = st
    }
  }

  buildSectors() {
    let top = 0.0
    let right = 0.0
    for (const sector of this.sectors) {
      for (const vec of sector.vecs) {
        if (vec.y > top) top = vec.y
        if (vec.x > right) right = vec.x
      }
    }
    for (const sector of this.sectors) {
      for (const other of this.sectors) {
        if (sector === other) {
          continue
        }
        let contains = true
        for (const o of other.vecs) {
          for (const s of sector.vecs) {
            if (s.eq(o)) {
              contains = false
              break
            }
          }
          if (!contains) {
            break
          }
          if (!sector.contains(o.x, o.y)) {
            contains = false
            break
          }
        }
        if (contains) {
          sector.inside.push(other)
        }
      }
    }
    for (const sector of this.sectors) {
      let dead = new Set()
      for (const inside of sector.inside) {
        for (const nested of inside.inside) {
          dead.add(nested)
        }
      }
      for (const other of dead) {
        sector.inside.splice(sector.inside.indexOf(other), 1)
      }
      for (const inside of sector.inside) {
        inside.outside = sector
      }
    }
    const size = 1 << WORLD_CELL_SHIFT
    this.rows = Math.ceil(top / size)
    this.columns = Math.ceil(right / size)
    this.cells = new Array(this.rows * this.columns)
    for (let i = 0; i < this.cells.length; i++) {
      this.cells[i] = new Cell()
    }
    for (const sector of this.sectors) {
      triangulate(sector, WORLD_SCALE)
    }
    for (const sector of this.sectors) {
      this.buildLines(sector)
    }
  }

  pushThing(thing) {
    let things = this.things
    if (things.length === this.thingCount) {
      things.push(thing)
    } else {
      things[this.thingCount] = thing
    }
    this.thingCount++
  }

  removeThing(thing) {
    let things = this.things
    let index = things.indexOf(thing)
    things[index] = things[things.length - 1]
    this.thingCount--
  }

  pushSector(sector) {
    this.sectors.push(sector)
  }

  findSector(x, z) {
    let i = this.sectors.length
    while (i--) {
      let sector = this.sectors[i]
      if (sector.outside != null) {
        continue
      } else if (sector.contains(x, z)) {
        return sector.find(x, z)
      }
    }
    return null
  }

  update() {
    const things = this.things
    let len = things.length
    let t = len
    while (t--) {
      if (things[t].update()) {
        things[t] = things[len - 1]
        things[len - 1] = null
        len--
        t++
      }
    }
  }
}
