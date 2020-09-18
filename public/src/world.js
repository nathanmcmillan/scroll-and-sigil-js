const NetUpdateRate = 50
const InverseNetRate = 16.67 / NetUpdateRate

const WorldPositiveX = 0
const WorldPositiveY = 1
const WorldPositiveZ = 2
const WorldNegativeX = 3
const WorldNegativeY = 4
const WorldNegativeZ = 5

const BroadcastNew = 0
const BroadcastDelete = 1
const BroadcastChat = 2

class World {
  constructor(g, gl) {
    this.g = g
    this.gl = gl
    this.width
    this.height
    this.length
    this.tileWidth
    this.tileHeight
    this.tileLength
    this.slice
    this.all
    this.blocks
    this.viewable
    this.spriteSet
    this.spriteBuffer = new Map()
    this.spriteCount
    this.thingCount
    this.itemCount
    this.missileCount
    this.particleCount
    this.things
    this.items
    this.missiles
    this.particles
    this.netLookup
    this.occluder = new Occluder()
    this.PID
  }
}
