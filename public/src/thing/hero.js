import {Thing} from '/src/thing/thing.js'
import {playSound} from '/src/assets/sounds.js'
import {textureIndexForName, entityByName} from '/src/assets/assets.js'
import {WORLD_CELL_SHIFT, ANIMATION_ALMOST_DONE, ANIMATION_DONE} from '/src/world/world.js'
import {newPlasma} from '/src/missile/plasma.js'
import {randomInt} from '/src/math/random.js'
import {redBloodTowards, redBloodExplode} from '/src/thing/thing-util.js'
import * as In from '/src/game/input.js'

// TODO
// If thing interacting with dies / is busy then nullify hero interaction

const STATUS_IDLE = 0
const STATUS_MOVE = 1
const STATUS_MELEE = 2
const STATUS_MISSILE = 3
const STATUS_DEAD = 4
const STATUS_BUSY = 5

const COMBAT_TIMER = 300

const MELEE_COST = 2
const MISSILE_COST = 4

export class Hero extends Thing {
  constructor(world, entity, x, z, input) {
    super(world, x, z)
    this.box = entity.box()
    this.height = entity.height()
    this.input = input
    this.texture = textureIndexForName(entity.get('sprite'))
    this.animations = entity.animations()
    this.animation = this.animations.get('move')
    this.sprite = this.animation[0]
    this.speed = entity.speed()
    this.maxHealth = entity.health()
    this.health = this.maxHealth
    this.maxStamina = entity.stamina()
    this.stamina = this.maxStamina
    this.staminaRate = 0
    this.staminaBound = 32
    this.status = STATUS_IDLE
    this.reaction = 0
    this.group = 'human'
    this.level = 1
    this.experience = 0
    this.experienceNeeded = 20
    this.skills = 0
    this.tree = {}
    this.outfit = null
    this.headpiece = null
    this.weapon = null
    this.nearby = null
    this.quests = []
    this.inventory = []
    this.combat = 0
    this.menu = null
    this.menuSub = 0
    this.menuColumn = 0
    this.menuRow = 0
    this.interactionWith = null
    this.setup()
  }

  damage(source, health) {
    if (this.status === STATUS_BUSY) {
      this.status = STATUS_IDLE
      this.menu = null
      this.interaction = null
      this.interactionWith = null
    }
    this.health -= health
    if (this.health <= 0) {
      playSound('baron-death')
      this.health = 0
      this.status = STATUS_DEAD
      this.animationFrame = 0
      this.animation = this.animations.get('death')
      this.updateSprite()
      this.combat = 0
      redBloodExplode(this)
    } else {
      playSound('baron-pain')
      this.combat = COMBAT_TIMER
      redBloodTowards(this, source)
    }
  }

  distanceToLine(box, line) {
    let vx = line.b.x - line.a.x
    let vz = line.b.y - line.a.y
    let wx = this.x - line.a.x
    let wz = this.z - line.a.y
    if (vx * wz - vz * wx < 0.0) return null
    let t = (wx * vx + wz * vz) / (vx * vx + vz * vz)
    if (t < 0.0) t = 0.0
    else if (t > 1.0) t = 1.0
    let px = line.a.x + vx * t - this.x
    let pz = line.a.y + vz * t - this.z
    let distance = px * px + pz * pz
    if (distance > box * box) return null
    return Math.sqrt(distance)
  }

  findClosestThing() {
    this.nearby = null

    let box = this.box + 2.0
    let minC = Math.floor(this.x - box) >> WORLD_CELL_SHIFT
    let maxC = Math.floor(this.x + box) >> WORLD_CELL_SHIFT
    let minR = Math.floor(this.z - box) >> WORLD_CELL_SHIFT
    let maxR = Math.floor(this.z + box) >> WORLD_CELL_SHIFT

    let world = this.world
    let columns = world.columns

    if (minC < 0) minC = 0
    if (minR < 0) minR = 0
    if (maxC >= columns) maxC = columns - 1
    if (maxR >= world.rows) maxR = world.rows - 1

    let closest = Number.MAX_VALUE

    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        let cell = world.cells[c + r * columns]
        let i = cell.thingCount
        while (i--) {
          let thing = cell.things[i]
          if (this === thing) continue
          if ((thing.isItem && !thing.pickedUp) || (thing.interaction && thing.health > 0)) {
            let distance = this.approximateDistance(thing)
            if (distance < 2.0 && distance < closest) {
              closest = distance
              this.nearby = thing
            }
          }
        }
      }
    }
  }

  interact() {
    if (this.nearby) {
      let thing = this.nearby
      if (thing.isItem && !thing.pickedUp) {
        playSound('pickup-item')
        this.inventory.push(thing)
        thing.pickedUp = true
        return false
      } else if (thing.interaction && thing.health > 0) {
        this.combat = 0
        this.status = STATUS_BUSY
        this.animationFrame = 0
        this.animation = this.animations.get('move')
        this.updateSprite()
        this.interactionWith = thing
        this.interaction = thing.interaction
        if (this.interaction.get('type') === 'quest') {
          this.world.notify('begin-cinema')
        }
        // this.world.notify('interact-thing', [this, thing])
        return true
      }
    }

    let box = this.box + 2.0
    let minC = Math.floor(this.x - box) >> WORLD_CELL_SHIFT
    let maxC = Math.floor(this.x + box) >> WORLD_CELL_SHIFT
    let minR = Math.floor(this.z - box) >> WORLD_CELL_SHIFT
    let maxR = Math.floor(this.z + box) >> WORLD_CELL_SHIFT

    let world = this.world
    let columns = world.columns

    if (minC < 0) minC = 0
    if (minR < 0) minR = 0
    if (maxC >= columns) maxC = columns - 1
    if (maxR >= world.rows) maxR = world.rows - 1

    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        let cell = world.cells[c + r * columns]
        let i = cell.lines.length
        while (i--) {
          let line = cell.lines[i]
          let distance = this.distanceToLine(box, line)
          if (distance !== null && distance < 2.0) {
            this.world.notify('interact-line', [this, line])
          }
        }
      }
    }

    return false
  }

  dead() {
    if (this.animationFrame === this.animation.length - 1) {
      if (this.input.a()) {
        this.input.off(In.BUTTON_A)
        this.world.notify('death-menu')
      }
      return
    }
    this.updateAnimation()
    this.updateSprite()
  }

  openMenu() {
    this.status = STATUS_BUSY
    this.animationFrame = 0
    this.animation = this.animations.get('move')
    this.updateSprite()
    this.menu = {page: 'inventory'}
  }

  busy() {
    if (this.input.rightTrigger()) {
      this.input.off(In.RIGHT_TRIGGER)
      this.status = STATUS_IDLE
      if (this.menu) this.menu = null
      if (this.interaction) {
        this.interaction = null
        this.interactionWith = null
      }
    }
  }

  takeExperience(value) {
    this.experience += value
    if (this.experience > this.experienceNeeded) {
      this.experience -= this.experienceNeeded
      this.experienceNeeded = Math.floor(1 + 1.8 * this.experienceNeeded)
      this.techniquePoints++
    }
  }

  melee() {
    let frame = this.updateAnimation()
    if (frame === ANIMATION_ALMOST_DONE) {
      this.reaction = 40

      const meleeRange = 1.0

      let box = this.box + meleeRange
      let minC = Math.floor(this.x - box) >> WORLD_CELL_SHIFT
      let maxC = Math.floor(this.x + box) >> WORLD_CELL_SHIFT
      let minR = Math.floor(this.z - box) >> WORLD_CELL_SHIFT
      let maxR = Math.floor(this.z + box) >> WORLD_CELL_SHIFT

      let world = this.world
      let columns = world.columns

      if (minC < 0) minC = 0
      if (minR < 0) minR = 0
      if (maxC >= columns) maxC = columns - 1
      if (maxR >= world.rows) maxR = world.rows - 1

      let closest = Number.MAX_VALUE
      let target = null

      for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
          let cell = world.cells[c + r * columns]
          let i = cell.thingCount
          while (i--) {
            let thing = cell.things[i]
            if (this === thing) continue
            let distance = this.approximateDistance(thing)
            if (distance < this.box + thing.box + meleeRange && distance < closest) {
              closest = distance
              target = thing
            }
          }
        }
      }

      if (target) {
        target.damage(this, 1 + randomInt(3))
        if (target.health <= 0) this.takeExperience(target.experience)
      }
    } else if (frame === ANIMATION_DONE) {
      this.status = STATUS_IDLE
      this.animationFrame = 0
      this.animation = this.animations.get('move')
      this.updateSprite()
    }
  }

  missile() {
    let frame = this.updateAnimation()
    if (frame === ANIMATION_ALMOST_DONE) {
      this.reaction = 60
      let speed = 0.3
      let dx = Math.cos(this.rotation)
      let dz = Math.sin(this.rotation)
      let x = this.x + dx * (this.box + 2.0)
      let z = this.z + dz * (this.box + 2.0)
      let y = this.y + 0.5 * this.height
      newPlasma(this.world, entityByName('plasma'), x, y, z, dx * speed, 0.0, dz * speed, 1 + randomInt(3))
    } else if (frame === ANIMATION_DONE) {
      this.status = STATUS_IDLE
      this.animationFrame = 0
      this.animation = this.animations.get('move')
      this.updateSprite()
    }
  }

  move() {
    if (this.combat > 0) this.combat--
    if (this.stamina < this.maxStamina) {
      this.staminaRate++
      if (this.staminaRate >= this.staminaBound) {
        this.stamina++
        this.staminaRate = 0
      }
    }
    this.findClosestThing()
    if (this.reaction > 0) {
      this.reaction--
    } else if (this.input.a() && this.stamina >= MISSILE_COST) {
      playSound('baron-missile')
      this.status = STATUS_MISSILE
      this.animationFrame = 0
      this.animation = this.animations.get('missile')
      this.updateSprite()
      this.combat = COMBAT_TIMER
      this.stamina -= MISSILE_COST
      return
    } else if (this.input.b() && this.stamina >= MELEE_COST) {
      playSound('baron-melee')
      this.status = STATUS_MELEE
      this.animationFrame = 0
      this.animation = this.animations.get('melee')
      this.updateSprite()
      this.combat = COMBAT_TIMER
      this.stamina -= MELEE_COST
      return
    } else if (this.input.rightTrigger()) {
      this.input.off(In.RIGHT_TRIGGER)
      if (this.interact()) return
    }
    if (this.input.rightBumper()) {
      this.input.off(In.RIGHT_BUMPER)
      this.openMenu()
    }
    if (this.ground) {
      if (this.input.rightClick()) {
        this.input.off(In.RIGHT_STICK_CLICK)
        this.ground = false
        this.deltaY += 0.4
      } else {
        let direction = null
        let rotation = null
        if (this.input.leftUp()) {
          direction = 'w'
          rotation = this.rotation
        }
        if (this.input.leftDown()) {
          if (direction === null) {
            direction = 's'
            rotation = this.rotation + Math.PI
          } else {
            direction = null
            rotation = null
          }
        }
        if (this.input.leftLeft()) {
          if (direction === null) {
            direction = 'a'
            rotation = this.rotation - 0.5 * Math.PI
          } else if (direction === 'w') {
            direction = 'wa'
            rotation -= 0.25 * Math.PI
          } else if (direction === 's') {
            direction = 'sa'
            rotation += 0.25 * Math.PI
          }
        }
        if (this.input.leftRight()) {
          if (direction === null) {
            rotation = this.rotation + 0.5 * Math.PI
          } else if (direction === 'a') {
            rotation = null
          } else if (direction === 'wa') {
            rotation = this.rotation
          } else if (direction === 'sa') {
            rotation = this.rotation + Math.PI
          } else if (direction === 'w') {
            rotation += 0.25 * Math.PI
          } else if (direction === 's') {
            rotation -= 0.25 * Math.PI
          }
        }
        if (rotation) {
          this.deltaX += Math.cos(rotation) * this.speed
          this.deltaZ += Math.sin(rotation) * this.speed
          if (this.updateAnimation() === ANIMATION_DONE) this.animationFrame = 0
          this.updateSprite()
        }
      }
    }
  }

  update() {
    switch (this.status) {
      case STATUS_IDLE:
      case STATUS_MOVE:
        this.move()
        break
      case STATUS_MELEE:
        this.melee()
        break
      case STATUS_MISSILE:
        this.missile()
        break
      case STATUS_DEAD:
        this.dead()
        break
      case STATUS_BUSY:
        this.busy()
        break
    }
    this.integrate()
    return false
  }
}
