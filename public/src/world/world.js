import {Float} from '/src/math/vector.js'
import {Cell} from '/src/world/cell.js'
import {sectorUpdateLines, sectorInsideOutside} from '/src/map/sector.js'
import {sectorTriangulate} from '/src/map/triangulate.js'

export const WORLD_SCALE = 0.25
export const WORLD_CELL_SHIFT = 5

export const GRAVITY = 0.028
export const RESISTANCE = 0.88

export const ANIMATION_RATE = 16
export const ANIMATION_NOT_DONE = 0
export const ANIMATION_ALMOST_DONE = 1
export const ANIMATION_DONE = 2

function toCell(f) {
  return Math.floor(f) >> WORLD_CELL_SHIFT
}

function toFloatCell(f) {
  return f / (1 << WORLD_CELL_SHIFT)
}

export class World {
  constructor(game) {
    this.game = game
    this.lines = null
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
    this.triggers = new Map()
  }

  clear() {
    for (let i = 0; i < this.thingCount; i++) this.things[i] = null
    for (let i = 0; i < this.missileCount; i++) this.missiles[i] = null
    for (let i = 0; i < this.particleCount; i++) this.particles[i] = null
    if (this.cells) for (let i = 0; i < this.cells.length; i++) this.cells[i].clear()
    this.lines = null
    this.sectors.length = 0
    this.cells = null
    this.columns = 0
    this.rows = 0
    this.things.length = 0
    this.thingCount = 0
    this.missiles.length = 0
    this.missileCount = 0
    this.particles.length = 0
    this.particleCount = 0
    this.decals.length = 0
    this.decalCount = 0
    this.triggers.clear()
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
      if (sector.outside) {
        continue
      } else if (sector.contains(x, z)) {
        return sector.find(x, z)
      }
    }
    return null
  }

  buildCellLines(line) {
    let xf = toFloatCell(line.a.x)
    let yf = toFloatCell(line.a.y)

    let dx = Math.abs(toFloatCell(line.b.x) - xf)
    let dy = Math.abs(toFloatCell(line.b.y) - yf)

    let x = toCell(line.a.x)
    let y = toCell(line.a.y)

    let xb = toCell(line.b.x)
    let yb = toCell(line.b.y)

    let n = 1
    let error = 0.0
    let incrementX = 0
    let incrementY = 0

    if (Float.zero(dx)) {
      incrementX = 0
      error = Number.MAX_VALUE
    } else if (line.b.x > line.a.x) {
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
    } else if (line.b.y > line.a.y) {
      incrementY = 1
      n += yb - y
      error -= (y + 1.0 - yf) * dx
    } else {
      incrementY = -1
      n += y - yb
      error -= (yf - y) * dx
    }

    for (; n > 0; n--) {
      let cell = this.cells[x + y * this.columns]
      cell.lines.push(line)
      if (error > 0.0) {
        y += incrementY
        error -= dx
      } else {
        x += incrementX
        error += dy
      }
    }
  }

  setLines(lines) {
    this.lines = lines
  }

  build() {
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
    for (let i = 0; i < this.cells.length; i++) this.cells[i] = new Cell()
    sectorInsideOutside(this.sectors)
    for (const sector of this.sectors) sectorTriangulate(sector, WORLD_SCALE)
    for (const sector of this.sectors) sectorUpdateLines(sector, WORLD_SCALE)
    for (const line of this.lines) this.buildCellLines(line)
  }

  trigger(type, trigger, conditions, events) {
    let list = this.triggets.get(type)
    if (!list) {
      list = []
      this.triggers.set(type, list)
    }
    list.push(events)
  }

  notify(trigger, params) {
    let list = this.triggers.get(trigger)
    if (!list) {
      this.game.notify(trigger, params)
      return
    }
    for (const entry of list) entry.process()
  }
}
