import * as Wad from '/src/wad/wad.js'
import {fetchText} from '/src/client/net.js'
import {Line} from '/src/map/line.js'
import {Vector2} from '/src/math/vector.js'
import {Sector} from '/src/map/sector.js'
import {World} from '/src/world/world.js'
import {Camera} from '/src/game/camera.js'
import {Input} from '/src/game/input.js'
import {Hero} from '/src/thing/hero.js'
import {Baron} from '/src/thing/baron.js'
import {Tree} from '/src/thing/tree.js'

const NO_TEXTURE = -1
const TEXTURE_GRASS = 0
const TEXTURE_STONE = 1
const TEXTURE_PLANK = 2

async function grass(world) {
  let txt = await fetchText('/maps/grass.wad')
  let wad = Wad.parse(txt)
  console.log('wad', wad)

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
    this.input = new Input()
    this.camera = new Camera(0.0, 0.0, 0.0, 0.0, 0.0, 6.0, null)
  }

  async mapper() {
    let world = this.world
    await grass(world)
    house(world, 10, 10)
    house(world, 40, 60)
    world.buildSectors()
    let hero = new Hero(world, this.input, 10.0, 40.0)
    new Baron(world, 8.0, 45.0)
    new Tree(world, 14.0, 42.0)
    this.camera.target = hero
  }

  update() {
    let input = this.input
    let camera = this.camera

    if (input.lookLeft) {
      camera.ry -= 0.05
      if (camera.ry < 0.0) camera.ry += 2.0 * Math.PI
    }

    if (input.lookRight) {
      camera.ry += 0.05
      if (camera.ry >= 2.0 * Math.PI) camera.ry -= 2.0 * Math.PI
    }

    if (input.lookUp) {
      camera.rx -= 0.05
      if (camera.rx < 0.0) camera.rx += 2.0 * Math.PI
    }

    if (input.lookDown) {
      camera.rx += 0.05
      if (camera.rx >= 2.0 * Math.PI) camera.rx -= 2.0 * Math.PI
    }

    camera.updateOrbit()
    camera.target.rotation = camera.ry

    this.world.update()
  }
}
