import {Particle} from '/src/particle/particle.js'
import {Decal} from '/src/world/decal.js'
import {WORLD_CELL_SHIFT} from '/src/world/world.js'
import {textureIndexForName, spritesByName} from '/src/assets/assets.js'
import {randomInt} from '/src/math/random.js'

export class Blood extends Particle {
  constructor(world, entity, x, y, z, dx, dy, dz) {
    super(world, x, y, z, dx, dy, dz, 0.2, 0.2)
    this.texture = textureIndexForName(entity.get('sprite'))
    let types = entity.get('animation')
    this.sprite = spritesByName(entity.get('sprite')).get(types[randomInt(types.length)])
  }

  hitFloor() {
    let sector = this.sector
    let decal = new Decal(this.world, this.texture)

    let sprite = this.sprite
    let width = sprite.halfWidth
    let height = 0.5 * sprite.height

    let x = Math.round(this.x * 16.0) / 16.0
    let z = Math.round(this.z * 16.0) / 16.0

    decal.x1 = x - width
    decal.y1 = sector.floor
    decal.z1 = z - height

    decal.u1 = sprite.left
    decal.v1 = sprite.top

    decal.x2 = x - width
    decal.y2 = sector.floor
    decal.z2 = z + height

    decal.u2 = sprite.left
    decal.v2 = sprite.bottom

    decal.x3 = x + width
    decal.y3 = sector.floor
    decal.z3 = z + height

    decal.u3 = sprite.right
    decal.v3 = sprite.bottom

    decal.x4 = x + width
    decal.y4 = sector.floor
    decal.z4 = z - height

    decal.u4 = sprite.right
    decal.v4 = sprite.top

    decal.nx = 0.0
    decal.ny = 1.0
    decal.nz = 0.0
  }

  hitCeiling() {
    let sector = this.sector
    let decal = new Decal(this.world, this.texture)

    let sprite = this.sprite
    let width = sprite.halfWidth
    let height = 0.5 * sprite.height

    let x = Math.round(this.x * 16.0) / 16.0
    let z = Math.round(this.z * 16.0) / 16.0

    decal.x1 = x + width
    decal.y1 = sector.ceiling
    decal.z1 = z - height

    decal.u1 = sprite.left
    decal.v1 = sprite.top

    decal.x2 = x + width
    decal.y2 = sector.ceiling
    decal.z2 = z + height

    decal.u2 = sprite.left
    decal.v2 = sprite.bottom

    decal.x3 = x - width
    decal.y3 = sector.ceiling
    decal.z3 = z + height

    decal.u3 = sprite.right
    decal.v3 = sprite.bottom

    decal.x4 = x - width
    decal.y4 = sector.ceiling
    decal.z4 = z - height

    decal.u4 = sprite.right
    decal.v4 = sprite.top

    decal.nx = 0.0
    decal.ny = -1.0
    decal.nz = 0.0
  }

  hitLine(line) {
    let box = this.box
    let vx = line.b.x - line.a.x
    let vz = line.b.y - line.a.y
    let wx = this.x - line.a.x
    let wz = this.z - line.a.y
    let t = (wx * vx + wz * vz) / (vx * vx + vz * vz)
    if (t < 0.0) t = 0.0
    else if (t > 1.0) t = 1.0
    let px = line.a.x + vx * t - this.x
    let pz = line.a.y + vz * t - this.z
    if (px * px + pz * pz > box * box) return false
    if (line.middle != null || this.y < line.plus.floor || this.y + this.height > line.plus.ceiling) {
      let decal = new Decal(this.world, this.texture)

      let x = px + this.x
      let z = pz + this.z

      let sprite = this.sprite
      let width = sprite.halfWidth
      let height = sprite.height

      decal.x1 = x - line.normal.y * width
      decal.y1 = this.y + height
      decal.z1 = z + line.normal.x * width

      wx = decal.x1 - line.a.x
      wz = decal.z1 - line.a.y

      t = (wx * vx + wz * vz) / (vx * vx + vz * vz)

      if (t < 0.0) {
        decal.x1 = line.a.x
        decal.z1 = line.a.y
      }

      decal.u1 = sprite.left
      decal.v1 = sprite.top

      decal.x2 = decal.x1
      decal.y2 = this.y
      decal.z2 = decal.z1

      decal.u2 = sprite.left
      decal.v2 = sprite.bottom

      decal.x3 = x + line.normal.y * width
      decal.y3 = this.y
      decal.z3 = z - line.normal.x * width

      wx = decal.x3 - line.a.x
      wz = decal.z3 - line.a.y

      t = (wx * vx + wz * vz) / (vx * vx + vz * vz)

      if (t > 1.0) {
        decal.x3 = line.b.x
        decal.z3 = line.b.y
      }

      decal.u3 = sprite.right
      decal.v3 = sprite.bottom

      decal.x4 = decal.x3
      decal.y4 = decal.y1
      decal.z4 = decal.z3

      decal.u4 = sprite.right
      decal.v4 = sprite.top

      decal.nx = line.normal.x
      decal.ny = 0.0
      decal.nz = line.normal.y

      return true
    }
    return false
  }

  check() {
    // need to update sector
    if (this.y < this.sector.floor) {
      this.hitFloor()
      return true
    } else if (this.y + this.height > this.sector.ceiling) {
      this.hitCeiling()
      return true
    }
    let box = this.box
    let minC = Math.floor(this.x - box) >> WORLD_CELL_SHIFT
    let maxC = Math.floor(this.x + box) >> WORLD_CELL_SHIFT
    let minR = Math.floor(this.z - box) >> WORLD_CELL_SHIFT
    let maxR = Math.floor(this.z + box) >> WORLD_CELL_SHIFT
    let world = this.world
    let columns = world.columns
    if (minC < 0 || minR < 0 || maxC >= columns || maxR >= world.rows) return true
    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        let cell = world.cells[c + r * world.columns]
        let i = cell.lines.length
        while (i--) {
          if (this.hitLine(cell.lines[i])) {
            return true
          }
        }
      }
    }
    return false
  }

  update() {
    this.deltaX *= 0.95
    this.deltaY -= 0.01
    this.deltaZ *= 0.95
    this.x += this.deltaX
    this.y += this.deltaY
    this.z += this.deltaZ
    return this.check()
  }
}