import {lineIntersect, Float} from '/src/math/vector.js'
import {toCell, toFloatCell, WORLD_CELL_SHIFT} from '/src/world/world.js'

function cameraFixView(self) {
  let target = self.target
  let minC = Math.floor(self.x) >> WORLD_CELL_SHIFT
  let maxC = Math.floor(target.x) >> WORLD_CELL_SHIFT
  let minR = Math.floor(self.z) >> WORLD_CELL_SHIFT
  let maxR = Math.floor(target.z) >> WORLD_CELL_SHIFT

  if (minC < maxC) {
    let c = minC
    minC = maxC
    maxC = c
  }

  if (minR < maxR) {
    let r = minR
    minR = maxR
    maxR = r
  }

  let world = self.world
  let columns = world.columns

  if (minC < 0) minC = 0
  if (minR < 0) minR = 0
  if (maxC >= columns) maxC = columns - 1
  if (maxR >= world.rows) maxR = world.rows - 1

  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      let cell = world.cells[c + r * world.columns]
      let i = cell.lines.length
      while (i--) {
        let line = cell.lines[i]
        if (line.physical && lineIntersect(self.x, self.z, target.x, target.z, line.a.x, line.a.y, line.b.x, line.b.y)) {
          console.log('kazookie!')
        }
      }
    }
  }
}

export function cameraFollowOrbit() {
  let target = this.target
  let sinX = Math.sin(this.rx)
  let cosX = Math.cos(this.rx)
  let sinY = Math.sin(this.ry)
  let cosY = Math.cos(this.ry)
  this.x = target.x - this.radius * cosX * sinY
  this.y = target.y + this.radius * sinX + target.height
  this.z = target.z + this.radius * cosX * cosY
}

export function cameraFollowCinema() {
  let target = this.target
  const offset = Math.PI / 16.0
  let sinX = Math.sin(this.rx)
  let cosX = Math.cos(this.rx)
  let sinY = Math.sin(this.ry - offset)
  let cosY = Math.cos(this.ry - offset)
  let x = target.x
  let y = target.y + target.height
  let z = target.z
  this.x = x - this.radius * cosX * sinY
  this.y = y + this.radius * sinX
  this.z = z + this.radius * cosX * cosY
  cameraFixView(this)
}

export function cameraTowardsTarget() {
  let target = this.target
  if (!target) return
  if (Float.eq(this.x, target.x) && Float.eq(this.z, target.z)) return
  let x = target.x - this.x
  let z = target.z - this.z
  let angle = Math.atan2(z, x)
  let distance = Math.sqrt(x * x + z * z)
  let speed = Math.min(0.2, distance)
  let dx = speed * Math.cos(angle)
  let dz = speed * Math.sin(angle)
  this.x += dx
  this.z += dz
}

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
