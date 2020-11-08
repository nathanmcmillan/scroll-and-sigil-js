import {Thing} from '/src/thing/thing.js'
import {textureIndexForName, spritesByName} from '/src/assets/assets.js'

export class Medkit extends Thing {
  constructor(world, entity, x, z) {
    super(world, x, z)
    this.box = entity.get('box')
    this.height = entity.get('height')
    this.texture = textureIndexForName(entity.get('sprite'))
    this.sprite = spritesByName(entity.get('sprite')).get(entity.get('animation'))
    this.isPhysical = false
    this.isItem = true
    this.pickedUp = false
    this.setup()
  }

  update() {
    return this.pickedUp
  }
}
