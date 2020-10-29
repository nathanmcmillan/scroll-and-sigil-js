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
import {Merchant} from '/src/thing/merchant.js'
import {Medkit} from '/src/thing/medkit.js'
import {textureIndexForName, entityByName} from '/src/assets/assets.js'
import {playMusic} from '/src/assets/sounds.js'

function texture(name) {
  if (name === 'none') return -1
  return textureIndexForName(name)
}

export class Game {
  constructor() {
    this.world = new World()
    this.input = new Input()
    this.camera = new Camera(0.0, 0.0, 0.0, 0.0, 0.0, 8.0, null)
  }

  async load(file) {
    let world = this.world

    let vecs = []
    let lines = []

    let map = (await fetchText(file)).split('\n')
    let index = 0

    let info = parseInt(map[index].split(' ')[1])
    index++
    for (; index <= info; index++) {
      let content = map[index].split(' ')
      if (content[0] === 'music') {
        playMusic(content[1])
      }
    }

    let vectors = index + parseInt(map[index].split(' ')[1])
    index++
    for (; index <= vectors; index++) {
      let vec = map[index].split(' ')
      vecs.push(new Vector2(parseFloat(vec[0]), parseFloat(vec[1])))
    }

    let count = index + parseInt(map[index].split(' ')[1])
    index++
    for (; index <= count; index++) {
      let line = map[index].split(' ')
      let a = vecs[parseInt(line[0])]
      let b = vecs[parseInt(line[1])]
      let top = texture(line[2])
      let middle = texture(line[3])
      let bottom = texture(line[4])
      lines.push(new Line(top, middle, bottom, a, b))
    }

    let sectors = index + parseInt(map[index].split(' ')[1])
    index++
    for (; index <= sectors; index++) {
      let sector = map[index].split(' ')
      let bottom = parseFloat(sector[0])
      let floor = parseFloat(sector[1])
      let ceiling = parseFloat(sector[2])
      let top = parseFloat(sector[3])
      let floorTexture = texture(sector[4])
      let ceilingTexture = texture(sector[5])
      let count = parseInt(sector[6])
      let i = 7
      let end = i + count
      let sectorVecs = []
      for (; i < end; i++) {
        sectorVecs.push(vecs[parseInt(sector[i])])
      }
      count = parseInt(sector[i])
      i++
      end = i + count
      let sectorLines = []
      for (; i < end; i++) {
        sectorLines.push(lines[parseInt(sector[i])])
      }
      world.pushSector(new Sector(bottom, floor, ceiling, top, floorTexture, ceilingTexture, sectorVecs, sectorLines))
    }

    world.buildSectors()

    let things = index + parseInt(map[index].split(' ')[1])
    index++
    for (; index <= things; index++) {
      let thing = map[index].split(' ')
      let x = parseFloat(thing[0])
      let z = parseFloat(thing[1])
      let name = thing[2]
      let entity = entityByName(name)
      switch (name) {
        case 'baron':
          new Baron(world, entity, x, z)
          continue
        case 'tree':
          new Tree(world, entity, x, z)
          continue
        case 'medkit':
          new Medkit(world, entity, x, z)
          continue
        case 'merchant':
          new Merchant(world, entity, x, z)
          continue
        case 'hero':
          this.camera.target = new Hero(world, entity, x, z, this.input)
          continue
      }
    }

    if (this.camera.target === null) throw 'map is missing a hero entity'
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
