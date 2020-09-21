import {Thing} from '/src/thing/thing.js'
import {Sprite} from '/src/render/sprite.js'

export class Hero extends Thing {
  constructor(world, input, x, z) {
    super(world, x, z, 0.0, 0.25, 1.76)
    let scale = 1.0 / 64.0
    let atlasWidth = 1.0 / 1024.0
    let atlasHeight = 1.0 / 512.0
    let left = 696
    let top = 0
    let width = 110
    let height = 128
    this.sprite = new Sprite(left, top, width, height, 0.0, 0.0, atlasWidth, atlasHeight, scale)
    this.speed = 0.1
    this.input = input
  }

  update() {
    this.integrate()
    return false
  }
}
