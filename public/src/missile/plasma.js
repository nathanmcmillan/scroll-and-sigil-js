import { entityByName } from '../assets/assets.js'
import { playSound } from '../assets/sounds.js'
import { missileHit, missileIntegrate, missileSetup } from '../missile/missile.js'
import { newPlasmaExplosion } from '../particle/plasma-explosion.js'

function plasmaHit(thing) {
  missileHit(this, thing)
  playSound('plasma-impact')
  newPlasmaExplosion(this.world, entityByName('plasma-explosion'), this.x, this.y, this.z)
}

function plasmaUpdate() {
  return missileIntegrate(this)
}

function plasmaInit(self, entity, dx, dy, dz, damage) {
  self.hit = plasmaHit
  self.update = plasmaUpdate
  self.box = entity.box()
  self.height = entity.height()
  self.stamp = entity.stamp()
  self.deltaX = dx
  self.deltaY = dy
  self.deltaZ = dz
  self.damage = damage
  missileSetup(self)
}

export function newPlasma(world, entity, x, y, z, dx, dy, dz, damage) {
  const missile = world.newMissile(x, y, z)
  plasmaInit(missile, entity, dx, dy, dz, damage)
  return missile
}
