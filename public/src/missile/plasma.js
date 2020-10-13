import {Missile} from '/src/missile/missile.js'
import {PlasmaExplosion} from '/src/particle/plasma-explosion.js'
import {playSound} from '/src/assets/sounds.js'
import {textureIndexForName, spritesByName, entityByName} from '/src/assets/assets.js'

export class Plasma extends Missile {
  constructor(world, entity, x, y, z, dx, dy, dz, damage) {
    super(world, entity, x, y, z, dx, dy, dz, 0.2, 0.2, damage)
    this.texture = textureIndexForName(entity.get('sprite'))
    this.sprite = spritesByName(entity.get('sprite')).get(entity.get('animation'))
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
