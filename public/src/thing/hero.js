import {Thing} from '/src/thing/thing.js'
import {Sprite} from '/src/render/sprite.js'
import {Blood} from '/src/particle/blood.js'

export class Hero extends Thing {
  constructor(world, input, x, z) {
    super(world, x, z, 0.0, 0.25, 1.76)
    this.input = input
    let scale = 1.0 / 64.0
    let atlasWidth = 1.0 / 1024.0
    let atlasHeight = 1.0 / 512.0
    let left = 696
    let top = 0
    let width = 110
    let height = 128
    this.texture = 0
    this.sprite = new Sprite(left, top, width, height, 0.0, 0.0, atlasWidth, atlasHeight, scale)
    this.speed = 0.025
    this.health = 10
  }

  damage(health) {
    this.health -= health
    if (this.health <= 0) {
      this.health = 0
    }
    new Blood(this.world, this.x, this.y + this.height * 0.5, this.z, 0.0, 0.2, 0.0)
  }

  update() {
    let direction = null
    let rotation = null
    if (this.input.moveForward) {
      direction = 'w'
      rotation = this.rotation
    }
    if (this.input.moveBackward) {
      if (direction === null) {
        direction = 's'
        rotation = this.rotation + Math.PI
      } else {
        direction = null
        rotation = null
      }
    }
    if (this.input.moveLeft) {
      if (direction === null) {
        direction = 'a'
        rotation = this.rotation - 0.5 * Math.PI
      } else if (direction === 'w') {
        direction = 'wa'
        rotation -= 0.25 * Math.PI
      } else if (direction === 's') {
        direction = 'sa'
        rotation += 0.25 * Math.PI
      }
    }
    if (this.input.moveRight) {
      if (direction === null) {
        rotation = this.rotation + 0.5 * Math.PI
      } else if (direction === 'a') {
        rotation = null
      } else if (direction === 'wa') {
        rotation = this.rotation
      } else if (direction === 'sa') {
        rotation = this.rotation + Math.PI
      } else if (direction === 'w') {
        rotation += 0.25 * Math.PI
      } else if (direction === 's') {
        rotation -= 0.25 * Math.PI
      }
    }
    if (rotation !== null) {
      this.deltaX += Math.sin(rotation) * this.speed
      this.deltaZ -= Math.cos(rotation) * this.speed
    }
    this.integrate()
    return false
  }
}
