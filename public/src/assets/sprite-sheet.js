import {Sprite} from '../render/sprite.js'

const SCALE = 1.0 / 20.0

export function createSpriteSheet(width, height, list) {
  width = 1.0 / width
  height = 1.0 / height
  let sprites = new Map()
  for (const sprite of list) {
    const name = sprite[0]
    const left = parseInt(sprite[1])
    const top = parseInt(sprite[2])
    const right = parseInt(sprite[3])
    const bottom = parseInt(sprite[4])
    sprites.set(name, new Sprite(left, top, right - left, bottom - top, 0.0, 0.0, width, height, SCALE))
  }
  return sprites
}
