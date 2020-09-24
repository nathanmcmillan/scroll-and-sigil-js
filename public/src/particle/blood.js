import {Particle} from '/src/particle/particle.js'
import {Sprite} from '/src/render/sprite.js'

export class Blood extends Particle {
  constructor(world, x, y, z, dx, dy, dz) {
    super(world, x, y, z, dx, dy, dz, 0.2, 0.2)
    let scale = 1.0 / 64.0
    let atlasWidth = 1.0 / 1024.0
    let atlasHeight = 1.0 / 512.0
    let left = 696
    let top = 0
    let width = 110
    let height = 128
    this.texture = 3
    this.sprite = new Sprite(left, top, width, height, 0.0, 0.0, atlasWidth, atlasHeight, scale)
  }

  update() {
    this.integrate()
    return false
  }
}
