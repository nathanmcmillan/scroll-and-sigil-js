import {Blood} from '/src/particle/blood.js'
import {entityByName} from '/src/assets/assets.js'

export function redBloodTowards(thing, other) {
  const tau = 2.0 * Math.PI
  const angle = Math.atan2(other.z - thing.z, other.x - thing.x)
  for (let i = 0; i < 20; i++) {
    let theta = tau * Math.random()
    let x = thing.x + thing.box * Math.sin(theta)
    let z = thing.z + thing.box * Math.cos(theta)
    let y = thing.y + thing.height * Math.random()
    let towards = angle - 0.2 + 0.4 * Math.random()
    let spread = 0.1 + 0.12 * Math.random()
    let dx = spread * Math.cos(towards)
    let dz = spread * Math.sin(towards)
    let dy = spread * Math.random()
    new Blood(thing.world, entityByName('blood'), x, y, z, dx, dy, dz)
  }
}

export function redBloodExplode(thing) {
  const tau = 2.0 * Math.PI
  for (let i = 0; i < 20; i++) {
    let theta = tau * Math.random()
    let x = thing.x + thing.box * Math.sin(theta)
    let z = thing.z + thing.box * Math.cos(theta)
    let y = thing.y + thing.height * Math.random()
    let spread = 0.1 + 0.12 * Math.random()
    let dx = spread * Math.sin(theta)
    let dz = spread * Math.cos(theta)
    let dy = spread * Math.random()
    new Blood(thing.world, entityByName('blood'), x, y, z, dx, dy, dz)
  }
}
