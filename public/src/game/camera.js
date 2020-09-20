export class Camera {
  constructor(x, y, z, rx, ry, radius) {
    this.x = x
    this.y = y
    this.rx = rx
    this.ry = ry
    this.radius = radius
  }

  updateOrbit(target) {
    let sinX = Math.sin(this.rx)
    let cosX = Math.cos(this.rx)
    let sinY = Math.sin(this.ry)
    let cosY = Math.cos(this.ry)
    this.x = target.position.x - this.radius * cosX * sinY
    this.y = target.position.y + this.radius * sinX + target.height
    this.z = target.position.z + this.radius * cosX * cosY
  }
}
