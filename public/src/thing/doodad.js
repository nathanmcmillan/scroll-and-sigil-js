import {thingSetup, Thing} from '../thing/thing.js'

export class Doodad extends Thing {
  constructor(world, entity, x, z) {
    super(world, x, z)
    this.box = entity.box()
    this.height = entity.height()
    this.stamp = entity.stamp()
    this.update = doodadUpdate
    thingSetup(this)
  }
}

function doodadUpdate() {
  return false
}
