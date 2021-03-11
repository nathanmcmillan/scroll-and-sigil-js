const MAX_SECTOR_HEIGHT = 9999

export class Sector {
  constructor(bottom, floor, ceiling, top, floorTexture, ceilingTexture, type, trigger, vecs, lines) {
    this.bottom = Math.min(bottom, floor)
    this.floor = Math.max(bottom, floor)
    if (ceiling === 0) ceiling = MAX_SECTOR_HEIGHT
    if (top === 0) top = MAX_SECTOR_HEIGHT
    this.ceiling = Math.min(ceiling, top)
    this.top = Math.max(ceiling, top)
    this.floorTexture = floorTexture
    this.ceilingTexture = ceilingTexture
    this.type = type
    this.trigger = trigger
    this.vecs = vecs
    this.lines = lines
    this.triangles = []
    this.inside = []
    this.outside = null
    this.neighbors = []
  }

  hasFloor() {
    return this.floorTexture >= 0
  }

  hasCeiling() {
    return this.ceilingTexture >= 0
  }

  getFloorTexture() {
    return this.floorTexture
  }

  getCeilingTexture() {
    return this.ceilingTexture
  }

  contains(x, z) {
    let odd = false
    let len = this.vecs.length
    let k = len - 1
    for (let i = 0; i < len; i++) {
      let a = this.vecs[i]
      let b = this.vecs[k]
      if (a.y > z != b.y > z) {
        let val = ((b.x - a.x) * (z - a.y)) / (b.y - a.y) + a.x
        if (x < val) {
          odd = !odd
        }
      }
      k = i
    }
    return odd
  }

  find(x, z) {
    let i = this.inside.length
    while (i--) {
      let inside = this.inside[i]
      if (inside.contains(x, z)) {
        return inside.find(x, z)
      }
    }
    return this
  }

  searchFor(x, z) {
    if (this.contains(x, z)) return this.find(x, z)
    const queue = this.neighbors.slice()
    const done = []
    while (queue.length > 0) {
      const current = queue.shift()
      if (current.contains(x, z)) return current.find(x, z)
      const neighbors = current.neighbors
      for (let i = 0; i < neighbors.length; i++) {
        let neighbor = neighbors[i]
        if (neighbor === current || queue.includes(neighbor) || done.includes(neighbor)) continue
        queue.push(neighbor)
      }
      done.push(current)
    }
    return null
  }

  otherIsInside(other) {
    for (const inside of this.inside) {
      if (inside === other) return true
      if (inside.otherIsInside(other)) return true
    }
  }
}

function deleteNestedInside(set, inner) {
  for (const nested of inner.inside) {
    set.add(nested)
    deleteNestedInside(set, nested)
  }
}

export function sectorInsideOutside(sectors) {
  for (const sector of sectors) {
    for (const other of sectors) {
      if (sector === other) continue
      let inside = 0
      let outside = 0
      for (const o of other.vecs) {
        let shared = false
        for (const s of sector.vecs) {
          if (s === o) {
            shared = true
            break
          }
        }
        if (shared) continue
        if (sector.contains(o.x, o.y)) inside++
        else outside++
      }
      if (outside === 0 && inside > 0) sector.inside.push(other)
    }
  }
  for (const sector of sectors) {
    const inside = sector.inside
    const dead = new Set()
    for (const inner of inside) deleteNestedInside(dead, inner)
    for (const other of dead) {
      let index = inside.indexOf(other)
      if (index >= 0) inside.splice(index, 1)
    }
    for (const inner of inside) inner.outside = sector
  }
}

export function sectorLineNeighbors(sectors, scale) {
  const size = sectors.length
  for (let i = 0; i < size; i++) {
    const sector = sectors[i]
    for (let k = i + 1; k < size; k++) {
      const other = sectors[k]
      let neighbors = false
      for (const a of sector.lines) {
        for (const b of other.lines) {
          if (a === b) {
            neighbors = true
            // FIXME: How to know which should be plus or minus side?
            // Answer: Need to check the winding to see which sector the line is pointing towards
            if (a.plus !== null || a.minus !== null) console.error('Line sectors were already set')
            a.updateSectorsForLine(sector, other, scale)
          }
        }
      }
      if (neighbors) {
        sector.neighbors.push(other)
        other.neighbors.push(sector)
      }
    }
    let plus, minus
    if (sector.outside) {
      if (!sector.neighbors.includes(sector.outside)) sector.neighbors.push(sector.outside)
      if (!sector.outside.neighbors.includes(sector)) sector.outside.neighbors.push(sector)

      plus = sector
      minus = sector.outside
    } else {
      plus = null
      minus = sector
    }
    for (const line of sector.lines) {
      if (line.plus !== null || line.minus !== null) continue
      line.updateSectorsForLine(plus, minus, scale)
    }
  }
}
