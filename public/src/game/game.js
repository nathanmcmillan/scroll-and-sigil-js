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
import {Medkit} from '/src/thing/medkit.js'
import {textureIndexForName, entityByName} from '/src/assets/assets.js'

function texture(name) {
  if (name === 'none') return -1
  return textureIndexForName(name)
}

// function vectorWad(wad) {
//   let vecs = wad.get('vectors')
//   let list = []
//   for (const vec of vecs) {
//     let x = parseFloat(vec[0])
//     let y = parseFloat(vec[1])
//     list.push(new Vector2(x, y))
//   }
//   return list
// }

// function lineWad(wad, vecs) {
//   let lines = wad.get('lines')
//   let list = []
//   if (lines === undefined) return list
//   for (const line of lines) {
//     let a = vecs[parseInt(line[0])]
//     let b = vecs[parseInt(line[1])]
//     list.push(new Line(texture(line[2]), texture(line[3]), texture(line[4]), a, b))
//   }
//   return list
// }

// function sectorWad(wad, vecs, lines) {
//   let bottom = parseFloat(wad.get('bottom'))
//   let floor = parseFloat(wad.get('floor'))
//   let ceiling = parseFloat(wad.get('ceiling'))
//   let top = parseFloat(wad.get('top'))
//   let floorTexture = texture(wad.get('floor-texture'))
//   let ceilingTexture = texture(wad.get('ceiling-texture'))
//   return new Sector(bottom, floor, ceiling, top, floorTexture, ceilingTexture, vecs, lines)
// }

// async function grass(world) {
//   let wad = Wad.parse(await fetchText('/maps/grass.wad'))
//   let vecs = vectorWad(wad)
//   let lines = lineWad(wad, vecs)
//   let sector = sectorWad(wad, vecs, lines)
//   world.pushSector(sector)
// }

// function house(world, x, y) {
//   let vecs = [
//     new Vector2(x, y),
//     new Vector2(x, y + 20.0),
//     new Vector2(x + 6.0, y + 20.0),
//     new Vector2(x + 6.0, y + 19.0),
//     new Vector2(x + 1.0, y + 19.0),
//     new Vector2(x + 1.0, y + 1.0),
//     new Vector2(x + 19.0, y + 1.0),
//     new Vector2(x + 19.0, y + 19.0),
//     new Vector2(x + 14.0, y + 19.0),
//     new Vector2(x + 14.0, y + 20.0),
//     new Vector2(x + 20.0, y + 20.0),
//     new Vector2(x + 20.0, y),
//   ]

//   let lines = []
//   let k = vecs.length - 1
//   for (let i = 0; i < vecs.length; i++) {
//     lines.push(new Line(-1, texture('stone'), -1, vecs[k], vecs[i]))
//     k = i
//   }

//   let outside = new Sector(0.0, 0.0, 6.0, 0.0, -1, -1, vecs, lines)
//   world.pushSector(outside)

//   // let inner = [vecs[2], vecs[9], vecs[8], vecs[7], vecs[6], vecs[5], vecs[4], vecs[3]]

//   // lines = [new Line(texture('plank'), -1, -1, vecs[2], vecs[9])]

//   // let inside = new Sector(0.0, 0.0, 5.0, 6.0, texture('plank-floor'), texture('stone-floor'), inner, lines)
//   // world.pushSector(inside)
// }

export class Game {
  constructor() {
    this.world = new World()
    this.input = new Input()
    this.camera = new Camera(0.0, 0.0, 0.0, 0.0, 0.0, 8.0, null)
  }

  async mapper(file) {
    let world = this.world

    let vecs = []
    let lines = []

    let map = (await fetchText(file)).split('\n')
    let index = 0

    let vectors = parseInt(map[index].split(' ')[1])
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
        case 'hero':
          this.camera.target = new Hero(world, entity, x, z, this.input)
      }
    }

    // await grass(world)
    // house(world, 10, 10)
    // house(world, 40, 60)
    // world.buildSectors()
    // new Baron(world, entityByName('baron'), 8.0, 45.0)
    // new Tree(world, entityByName('tree'), 14.0, 42.0)
    // new Medkit(world, entityByName('medkit'), 18.0, 42.0)
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
