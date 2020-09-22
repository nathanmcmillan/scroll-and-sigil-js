import {Line} from '/src/map/line.js'
import {Vector2} from '/src/math/vector.js'
import {Sector} from '/src/map/sector.js'
import {World} from '/src/world/world.js'
import {Camera} from '/src/game/camera.js'
import {Input} from '/src/game/input.js'
import {Hero} from '/src/thing/hero.js'
import {Baron} from '/src/thing/baron.js'
import {Blood} from '/src/thing/blood.js'
import {Tree} from '/src/thing/tree.js'

const NO_TEXTURE = -1
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
    lines.push(new Line(NO_TEXTURE, TEXTURE_STONE, NO_TEXTURE, vecs[k], vecs[i]))
    k = i
  }

  let outside = new Sector(0.0, 0.0, 6.0, 0.0, NO_TEXTURE, NO_TEXTURE, vecs, lines)
  world.pushSector(outside)

  let inner = [vecs[2], vecs[9], vecs[8], vecs[7], vecs[6], vecs[5], vecs[4], vecs[3]]

  lines = [new Line(NO_TEXTURE, NO_TEXTURE, TEXTURE_GRASS, vecs[2], vecs[9])]

  let inside = new Sector(0.0, 0.0, 5.0, 6.0, TEXTURE_PLANK, TEXTURE_STONE, inner, lines)
  world.pushSector(inside)
}

export class Game {
  constructor() {
    this.world = new World()
    this.camera = new Camera(0.0, 0.0, 0.0, 0.0, 0.0, 6.0)
    this.input = new Input()
    let world = this.world
    grass(world)
    house(world, 10, 10)
    house(world, 40, 60)
    world.buildSectors()
    new Hero(world, this.input, 10.0, 40.0)
    new Baron(world, 8.0, 45.0)
    new Blood(world, 5.0, 1.0, 30.0)
    new Tree(world, 14.0, 42.0)
  }

  update() {
    this.world.update()
  }
}
