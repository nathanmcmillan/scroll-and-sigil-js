import {Line} from '/src/map/line.js'
import {Vector2} from '/src/math/vector.js'
import {Sector} from '/src/map/sector.js'
import {World} from '/src/world/world.js'
import {Camera} from '/src/game/camera.js'
import {Input} from '/src/game/input.js'
import {Hero} from '/src/thing/hero.js'

const TEXTURE_GRASS = 0
const TEXTURE_STONE = 1
const TEXTURE_PLANK = 2

function grass(world) {
  let vecs = [new Vector2(0, 0), new Vector2(0, 127), new Vector2(127, 127), new Vector2(127, 0)]
  let sector = new Sector(0.0, 0.0, 10.0, 0.0, TEXTURE_GRASS, -1, vecs, [])
  world.pushSector(sector)
}

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
    lines.push(new Line(-1, TEXTURE_STONE, -1, vecs[k], vecs[i]))
    k = i
  }
  let bottom = 0.0
  let floor = 0.0
  let ceiling = 10.0
  let top = 0.0
  let sector = new Sector(bottom, floor, ceiling, top, TEXTURE_STONE, TEXTURE_PLANK, vecs, lines)
  world.pushSector(sector)
}

export class Game {
  constructor() {
    this.world = new World()
    this.camera = new Camera()
    this.input = new Input()
    let world = this.world
    grass(world)
    house(world, 10, 10)
    house(world, 40, 60)
    world.buildSectors()
    new Hero(world, this.input, 10, 40)
  }

  update() {
    this.world.update()
  }
}
