import { Float, lineIntersectAt } from '../math/vector.js'
import { WORLD_CELL_SHIFT } from '../world/world.js'

const out = [0.0, 0.0]

export class Camera {
  constructor(x, y, z, rx, ry, radius, ox = 0.0, oy = 0.0) {
    this.x = x
    this.y = y
    this.z = z
    this.rx = rx
    this.ry = ry
    this.radius = radius
    this.ox = ox
    this.oy = oy
    this.target = null
  }
}

function cameraFixView(self, world) {
  const target = self.target
  let minC = Math.floor(self.x) >> WORLD_CELL_SHIFT
  let maxC = Math.floor(target.x) >> WORLD_CELL_SHIFT
  let minR = Math.floor(self.z) >> WORLD_CELL_SHIFT
  let maxR = Math.floor(target.z) >> WORLD_CELL_SHIFT

  if (maxC < minC) {
    const c = minC
    minC = maxC
    maxC = c
  }

  if (maxR < minR) {
    const r = minR
    minR = maxR
    maxR = r
  }

  const columns = world.columns

  if (minC < 0) minC = 0
  if (minR < 0) minR = 0
  if (maxC >= columns) maxC = columns - 1
  if (maxR >= world.rows) maxR = world.rows - 1

  const fudge = 0.05

  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      const cell = world.cells[c + r * world.columns]
      let i = cell.lines.length
      while (i--) {
        const line = cell.lines[i]
        if (line.physical && lineIntersectAt(out, self.x, self.z, target.x, target.z, line.a.x, line.a.y, line.b.x, line.b.y)) {
          const angle = Math.atan2(target.z - self.z, target.x - self.x)
          const dx = Math.cos(angle)
          const dz = Math.sin(angle)
          self.x = out[0] + fudge * dx
          self.z = out[1] + fudge * dz
        }
      }
    }
  }

  const sector = world.findSector(self.x, self.z)
  if (sector === null) return
  if (sector.hasFloor() && self.y < sector.floor + fudge) self.y = sector.floor + fudge
  if (sector.hasCeiling() && self.y > sector.ceiling - fudge) self.y = sector.ceiling - fudge
}

export function cameraFollowOrbit(self) {
  const target = self.target
  const sinX = Math.sin(self.rx)
  const cosX = Math.cos(self.rx)
  const sinY = Math.sin(self.ry)
  const cosY = Math.cos(self.ry)
  self.x = target.x - self.radius * cosX * sinY
  self.y = target.y + self.radius * sinX + target.height
  self.z = target.z + self.radius * cosX * cosY
}

export function cameraFollowCinema(self, world) {
  const target = self.target
  const offset = Math.PI / 16.0
  const sinX = Math.sin(self.rx)
  const cosX = Math.cos(self.rx)
  const sinY = Math.sin(self.ry - offset)
  const cosY = Math.cos(self.ry - offset)
  const x = target.x
  const y = target.y + target.height
  const z = target.z
  self.x = x - self.radius * cosX * sinY
  self.y = y + self.radius * sinX
  self.z = z + self.radius * cosX * cosY
  cameraFixView(self, world)
}

export function cameraTowardsTarget(self) {
  const target = self.target
  if (!target) return
  if (Float.eq(self.x, target.x) && Float.eq(self.z, target.z)) return
  const x = target.x - self.x
  const z = target.z - self.z
  const angle = Math.atan2(z, x)
  const distance = Math.sqrt(x * x + z * z)
  const speed = Math.min(0.2, distance)
  const dx = speed * Math.cos(angle)
  const dz = speed * Math.sin(angle)
  self.x += dx
  self.z += dz
}
