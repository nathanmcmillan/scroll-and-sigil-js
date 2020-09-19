import {Line} from '/src/map/line.js'
import {Vector2} from '/src/math/vector.js'
import {Sector} from '/src/map/sector.js'
import {World} from '/src/world/world.js'

function house(world, x, y) {
  let vecs = [
    new Vector2(x, y),
    new Vector2(x, y + 20.0),
    new Vector2(x + 6.0, y + 20.0),
    new Vector2(x + 6.0, y + 19.0),
    new Vector2(x + 1.0, y + 19.0),
    new Vector2(x + 1.0, y + 1.0),
    new Vector2(x + 19.0, y + 1.0),
    new Vector2(x + 19.0, y + 19.0),
    new Vector2(x + 14.0, y + 19.0),
    new Vector2(x + 14.0, y + 20.0),
    new Vector2(x + 20.0, y + 20.0),
    new Vector2(x + 20.0, y),
  ]
  let lines = []
  let k = vecs.length - 1
  for (let i = 0; i < vecs.length; i++) {
    lines.push(new Line(-1, 99, -1, vecs[k], vecs[i]))
    k = i
  }
  let bottom = 0.0
  let floor = 0.0
  let ceiling = 10.0
  let top = 0.0
  let sector = Sector(bottom, floor, ceiling, top, 99, -1, vecs, lines)
  world.pushSector(sector)
}

let world = new World()
house(world, 10, 40)
world.build()
