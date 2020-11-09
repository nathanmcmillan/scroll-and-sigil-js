import {Thing} from '/src/thing/thing.js'
import {textureIndexForName, spritesByName} from '/src/assets/assets.js'

export class Tree extends Thing {
  constructor(world, entity, x, z) {
    super(world, x, z)
    this.box = entity.box()
    this.height = entity.height()
    this.texture = textureIndexForName(entity.get('sprite'))
    this.sprite = spritesByName(entity.get('sprite')).get(entity.get('animation'))
    this.setup()
  }

  update() {
    return false
  }
}
