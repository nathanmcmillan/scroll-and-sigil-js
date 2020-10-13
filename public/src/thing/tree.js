import {Thing} from '/src/thing/thing.js'
import {textureIndexForName, spritesByName} from '/src/assets/assets.js'

export class Tree extends Thing {
  constructor(world, entity, x, z) {
    super(world, entity, x, z, 0.0, 0.25, 1.76)
    this.texture = textureIndexForName(entity.get('sprite'))
    this.sprite = spritesByName(entity.get('sprite')).get(entity.get('animation'))
  }

  update() {
    return false
  }
}
