import {Float} from '/src/math/vector.js'

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

  followOrbit() {
    let target = this.target
    let sinX = Math.sin(this.rx)
    let cosX = Math.cos(this.rx)
    let sinY = Math.sin(this.ry)
    let cosY = Math.cos(this.ry)
    this.x = target.x - this.radius * cosX * sinY
    this.y = target.y + this.radius * sinX + target.height
    this.z = target.z + this.radius * cosX * cosY
  }

  followCinema() {
    let target = this.target
    const offset = Math.PI / 16.0
    let sinX = Math.sin(this.rx)
    let cosX = Math.cos(this.rx)
    let sinY = Math.sin(this.ry - offset)
    let cosY = Math.cos(this.ry - offset)
    let x = target.x
    let y = target.y + target.height * 2.0
    let z = target.z
    this.x = x - this.radius * cosX * sinY
    this.y = y + this.radius * sinX
    this.z = z + this.radius * cosX * cosY
  }

  towardsTarget() {
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
}
