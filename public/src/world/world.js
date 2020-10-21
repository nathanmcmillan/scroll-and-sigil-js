import {Cell} from '/src/world/cell.js'
import {sectorInsideOutside} from '/src/map/sector.js'
import {sectorTriangulate} from '/src/map/triangulate.js'

export const WORLD_SCALE = 0.25
export const WORLD_CELL_SHIFT = 5

export const GRAVITY = 0.028
export const RESISTANCE = 0.88

export const ANIMATION_RATE = 16
export const ANIMATION_NOT_DONE = 0
export const ANIMATION_ALMOST_DONE = 1
export const ANIMATION_DONE = 2

export class World {
  constructor() {
    this.sectors = []
    this.cells = null
    this.columns = 0
    this.rows = 0
    this.things = []
    this.thingCount = 0
    this.missiles = []
    this.missileCount = 0
    this.particles = []
    this.particleCount = 0
    this.decals = []
    this.decalCount = 0
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

  pushMissile(missile) {
    let missiles = this.missiles
    if (missiles.length === this.missileCount) {
      missiles.push(missile)
    } else {
      missiles[this.missileCount] = missile
    }
    this.missileCount++
  }

  pushParticle(particle) {
    let particles = this.particles
    if (particles.length === this.particleCount) {
      particles.push(particle)
    } else {
      particles[this.particleCount] = particle
    }
    this.particleCount++
  }

  pushDecal(decal) {
    let decals = this.decals
    if (decals.length === this.decalCount) {
      decals.push(decal)
    } else {
      decals[this.decalCount] = decal
    }
    this.decalCount++
  }

  removeDecal(decal) {
    let decals = this.decals
    let index = decals.indexOf(decal)
    this.decalCount--
    decals[index] = decals[this.decalCount]
    decals[this.decalCount] = null
  }

  update() {
    const things = this.things
    let i = this.thingCount
    while (i--) {
      if (things[i].update()) {
        this.thingCount--
        things[i] = things[this.thingCount]
        things[this.thingCount] = null
      }
    }

    const missiles = this.missiles
    i = this.missileCount
    while (i--) {
      if (missiles[i].update()) {
        this.missileCount--
        missiles[i] = missiles[this.missileCount]
        missiles[this.missileCount] = null
      }
    }

    const particles = this.particles
    i = this.particleCount
    while (i--) {
      if (particles[i].update()) {
        this.particleCount--
        particles[i] = particles[this.particleCount]
        particles[this.particleCount] = null
      }
    }
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
    const size = 1 << WORLD_CELL_SHIFT
    this.rows = Math.ceil(top / size)
    this.columns = Math.ceil(right / size)
    this.cells = new Array(this.rows * this.columns)
    for (let i = 0; i < this.cells.length; i++) {
      this.cells[i] = new Cell()
    }
    sectorInsideOutside(this.sectors)
    for (const sector of this.sectors) {
      sectorTriangulate(sector, WORLD_SCALE)
    }
    for (const sector of this.sectors) {
      this.buildLines(sector)
    }
  }
}
