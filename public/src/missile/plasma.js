import {newPlasmaExplosion} from '/src/particle/plasma-explosion.js'
import {playSound} from '/src/assets/sounds.js'
import {textureIndexForName, spritesByName, entityByName} from '/src/assets/assets.js'
import {missileHit} from '/src/missile/missile.js'

function hit(thing) {
  missileHit(this, thing)
  playSound('plasma-impact')
  newPlasmaExplosion(this.world, entityByName('plasma-explosion'), this.x, this.y, this.z)
}

function update() {
  return this.integrate()
}

function init(entity, dx, dy, dz, damage) {
  this.hit = hit
  this.update = update
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

export function newPlasma(world, entity, x, y, z, dx, dy, dz, damage) {
  let missile = world.newMissile(x, y, z)
  missile.init = init
  missile.init(entity, dx, dy, dz, damage)
  return missile
}
