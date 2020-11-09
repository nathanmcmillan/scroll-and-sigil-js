import {Missile} from '/src/missile/missile.js'
import {PlasmaExplosion} from '/src/particle/plasma-explosion.js'
import {playSound} from '/src/assets/sounds.js'
import {textureIndexForName, spritesByName, entityByName} from '/src/assets/assets.js'

export class Plasma extends Missile {
  constructor(world, entity, x, y, z, dx, dy, dz, damage) {
    super(world, x, y, z)
    this.box = entity.box()
    this.height = entity.height()
    this.texture = textureIndexForName(entity.get('sprite'))
    this.sprite = spritesByName(entity.get('sprite')).get(entity.get('animation'))
    this.deltaX = dx
    this.deltaY = dy
    this.deltaZ = dz
    this.damage = damage
    this.setup()
  }

  hit(thing) {
    super.hit(thing)
    playSound('plasma-impact')
    new PlasmaExplosion(this.world, entityByName('plasma-explosion'), this.x, this.y, this.z)
  }

  update() {
    return this.integrate()
  }
}
