export class Camera {
  constructor(x, y, z, rx, ry, radius, ox, oy) {
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

  updateOrbit() {
    let target = this.target
    let sinX = Math.sin(this.rx)
    let cosX = Math.cos(this.rx)
    let sinY = Math.sin(this.ry)
    let cosY = Math.cos(this.ry)
    this.x = target.x - this.radius * cosX * sinY
    this.y = target.y + this.radius * sinX + target.height
    this.z = target.z + this.radius * cosX * cosY
  }
}

export class CameraCinema {
  constructor(x, y, z, rx, ry, radius, ox, oy) {
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

  updateOrbit() {
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
}
