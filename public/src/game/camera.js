export class Camera {
  constructor(x, y, z, rx, ry, radius) {
    this.x = x
    this.y = y
    this.z = z
    this.rx = rx
    this.ry = ry
    this.radius = radius
  }

  updateOrbit(target) {
    let sinX = Math.sin(this.rx)
    let cosX = Math.cos(this.rx)
    let sinY = Math.sin(this.ry)
    let cosY = Math.cos(this.ry)
    this.x = target.x - this.radius * cosX * sinY
    this.y = target.y + this.radius * sinX + target.height
    this.z = target.z + this.radius * cosX * cosY
  }
}
