import {Camera} from '/src/game/camera.js'
import {Vector2} from '/src/math/vector.js'
import {Line} from '/src/map/line.js'
import {ThingReference} from '/src/editor/thing-reference.js'
import {entityDictionary} from '/src/assets/assets.js'
import * as In from '/src/editor/editor-input.js'

export const TOP_MODE = 0
export const VIEW_MODE = 1

// TODO: Combine VECTOR and LINE tool into DRAW tool
export const DRAW_TOOL = 0
export const THING_TOOL = 1
export const SECTOR_TOOL = 2
export const TOOL_COUNT = 3

export const OPTION_DRAW_MODE_DEFAULT = 0
export const OPTION_VECTOR_UNDER_CURSOR = 1
export const OPTION_MOVE_VECTOR = 2
export const OPTION_END_LINE = 3
export const OPTION_END_LINE_NEW_VECTOR = 4
export const OPTION_LINE_UNDER_CURSOR = 5
export const OPTION_THING_MODE_DEFAULT = 6
export const OPTION_THING_UNDER_CURSOR = 7
export const OPTION_MOVE_THING = 8
export const OPTION_SECTOR_MODE_DEFAULT = 9
export const OPTION_VECTOR_OVERLAP = 10
export const OPTION_COUNT = 11

export const DO_MOVE_VECTOR = 0
export const DO_END_MOVING_VECTOR = 1
export const DO_PLACE_LINE = 2
export const DO_FLIP_LINE = 3
export const DO_DELETE_LINE = 4
export const DO_START_LINE = 5
export const DO_END_LINE = 6
export const DO_END_LINE_NEW_VECTOR = 7
export const DO_PLACE_THING = 8
export const DO_MOVE_THING = 9
export const DO_EDIT_THING = 10
export const DO_DELETE_THING = 11
export const DO_END_MOVING_THING = 12
export const DO_EDIT_SECTOR = 13
export const DO_MERGE_VECTOR = 14
export const ACTION_COUNT = 15

export const DESCRIBE_TOOL = new Array(TOOL_COUNT)
DESCRIBE_TOOL[DRAW_TOOL] = 'Draw mode'
DESCRIBE_TOOL[THING_TOOL] = 'Thing mode'
DESCRIBE_TOOL[SECTOR_TOOL] = 'Sector mode'

const DEFAULT_TOOL_OPTIONS = new Array(TOOL_COUNT)
DEFAULT_TOOL_OPTIONS[DRAW_TOOL] = OPTION_DRAW_MODE_DEFAULT
DEFAULT_TOOL_OPTIONS[THING_TOOL] = OPTION_THING_MODE_DEFAULT
DEFAULT_TOOL_OPTIONS[SECTOR_TOOL] = OPTION_SECTOR_MODE_DEFAULT

export const DESCRIBE_ACTION = new Array(ACTION_COUNT)
DESCRIBE_ACTION[DO_MOVE_VECTOR] = 'Move vector'
DESCRIBE_ACTION[DO_END_MOVING_VECTOR] = 'Stop moving vector'
DESCRIBE_ACTION[DO_MERGE_VECTOR] = 'Merge vector'

DESCRIBE_ACTION[DO_PLACE_LINE] = 'Start line with new vector'
DESCRIBE_ACTION[DO_FLIP_LINE] = 'Flip line'
DESCRIBE_ACTION[DO_DELETE_LINE] = 'Delete line'
DESCRIBE_ACTION[DO_START_LINE] = 'Start line at vector'
DESCRIBE_ACTION[DO_END_LINE] = 'End line at vector'
DESCRIBE_ACTION[DO_END_LINE_NEW_VECTOR] = 'End line with new vector'

DESCRIBE_ACTION[DO_PLACE_THING] = 'Place thing'
DESCRIBE_ACTION[DO_MOVE_THING] = 'Move thing'
DESCRIBE_ACTION[DO_EDIT_THING] = 'Edit thing'
DESCRIBE_ACTION[DO_DELETE_THING] = 'Delete thing'
DESCRIBE_ACTION[DO_END_MOVING_THING] = 'Stop moving thing'

DESCRIBE_ACTION[DO_EDIT_SECTOR] = 'Edit sector'

export const DESCRIBE_OPTIONS = new Array(OPTION_COUNT)

const DRAW_MODE_OPTIONS = new Map()
DRAW_MODE_OPTIONS.set(In.BUTTON_A, DO_PLACE_LINE)
DESCRIBE_OPTIONS[OPTION_DRAW_MODE_DEFAULT] = DRAW_MODE_OPTIONS

const VECTOR_UNDER_CURSOR_OPTIONS = new Map()
VECTOR_UNDER_CURSOR_OPTIONS.set(In.BUTTON_A, DO_START_LINE)
VECTOR_UNDER_CURSOR_OPTIONS.set(In.BUTTON_B, DO_MOVE_VECTOR)
DESCRIBE_OPTIONS[OPTION_VECTOR_UNDER_CURSOR] = VECTOR_UNDER_CURSOR_OPTIONS

const MOVE_VECTOR_OPTIONS = new Map()
MOVE_VECTOR_OPTIONS.set(In.BUTTON_A, DO_END_MOVING_VECTOR)
DESCRIBE_OPTIONS[OPTION_MOVE_VECTOR] = MOVE_VECTOR_OPTIONS

const VECTOR_OVERLAP_OPTIONS = new Map()
VECTOR_OVERLAP_OPTIONS.set(In.BUTTON_A, DO_MERGE_VECTOR)
DESCRIBE_OPTIONS[OPTION_VECTOR_OVERLAP] = VECTOR_OVERLAP_OPTIONS

const LINE_UNDER_CURSOR_OPTIONS = new Map()
LINE_UNDER_CURSOR_OPTIONS.set(In.BUTTON_A, DO_FLIP_LINE)
LINE_UNDER_CURSOR_OPTIONS.set(In.BUTTON_B, DO_DELETE_LINE)
DESCRIBE_OPTIONS[OPTION_LINE_UNDER_CURSOR] = LINE_UNDER_CURSOR_OPTIONS

const END_LINE_OPTIONS = new Map()
END_LINE_OPTIONS.set(In.BUTTON_A, DO_END_LINE)
DESCRIBE_OPTIONS[OPTION_END_LINE] = END_LINE_OPTIONS

const DO_END_LINE_NEW_VECTOR_OPTIONS = new Map()
DO_END_LINE_NEW_VECTOR_OPTIONS.set(In.BUTTON_A, DO_END_LINE_NEW_VECTOR)
DESCRIBE_OPTIONS[OPTION_END_LINE_NEW_VECTOR] = DO_END_LINE_NEW_VECTOR_OPTIONS

const THING_MODE_OPTIONS = new Map()
THING_MODE_OPTIONS.set(In.BUTTON_A, DO_PLACE_THING)
DESCRIBE_OPTIONS[OPTION_THING_MODE_DEFAULT] = THING_MODE_OPTIONS

const THING_UNDER_CURSOR_OPTIONS = new Map()
THING_UNDER_CURSOR_OPTIONS.set(In.BUTTON_A, DO_MOVE_THING)
THING_UNDER_CURSOR_OPTIONS.set(In.BUTTON_B, DO_DELETE_THING)
THING_UNDER_CURSOR_OPTIONS.set(In.BUTTON_X, DO_EDIT_THING)
DESCRIBE_OPTIONS[OPTION_THING_UNDER_CURSOR] = THING_UNDER_CURSOR_OPTIONS

const MOVING_THING_OPTIONS = new Map()
MOVING_THING_OPTIONS.set(In.BUTTON_A, DO_END_MOVING_THING)
DESCRIBE_OPTIONS[OPTION_MOVE_THING] = MOVING_THING_OPTIONS

const SECTOR_MODE_OPTIONS = new Map()
SECTOR_MODE_OPTIONS.set(In.BUTTON_A, DO_EDIT_SECTOR)
DESCRIBE_OPTIONS[OPTION_SECTOR_MODE_DEFAULT] = SECTOR_MODE_OPTIONS

export const DESCRIBE_MENU = ['Open', 'Save', 'Quit']

export function vectorSize(zoom) {
  return Math.ceil(1.0 + 0.05 * zoom)
}

export function thingSize(thing, zoom) {
  return Math.ceil(thing.box * zoom)
}

export class Editor {
  constructor(width, height) {
    this.width = width
    this.height = height
    this.input = new In.EditorInput()
    this.camera = new Camera(0.0, 0.0, 0.0, 0.0, 0.0, null)
    this.mode = TOP_MODE
    this.tool = DRAW_TOOL
    this.action = OPTION_DRAW_MODE_DEFAULT
    this.zoom = 10.0
    this.cursor = new Vector2(0.5 * width, 0.5 * height)
    this.vecs = []
    this.lines = []
    this.sectors = []
    this.things = []
    this.selectedVec = null
    this.selectedLine = null
    this.selectedSector = null
    this.selectedThing = null
    this.selectedSecondVec = null
    this.usingEntity = null
    this.entityTable = new Map()
    this.menuActive = false
    this.toolSelectionActive = false
    this.snapToGrid = false
    this.viewVecs = true
    this.viewLines = true
    this.viewSectors = false
    this.viewThings = true
    this.shadowInput = true
  }

  resize(width, height) {
    this.width = width
    this.height = height
  }

  addEntity(name, entity) {
    this.entityTable.set(name, entity)
  }

  load(world) {
    for (let [name, entity] of entityDictionary()) {
      this.addEntity(name, entity)
      this.usingEntity = name
    }

    for (const sector of world.sectors) {
      for (const vec of sector.vecs) {
        this.vecs.push(vec)
      }
      for (const line of sector.lines) {
        this.lines.push(line)
      }
    }

    for (const thing of world.things) {
      if (thing == null) break
      this.things.push(thing)
    }
  }

  vectorUnderCursor(ignore = null) {
    let x = this.camera.x + this.cursor.x / this.zoom
    let y = this.camera.z + this.cursor.y / this.zoom
    const size = vectorSize(this.zoom)
    let best = Number.MAX_VALUE
    let closest = null
    for (const vec of this.vecs) {
      if (vec === ignore) continue
      let distance = Math.sqrt((vec.x - x) * (vec.x - x) + (vec.y - y) * (vec.y - y))
      if (distance > size || distance > best) continue
      best = distance
      closest = vec
    }
    return closest
  }

  lineUnderCursor() {
    let x = this.camera.x + this.cursor.x / this.zoom
    let y = this.camera.z + this.cursor.y / this.zoom
    const size = vectorSize(this.zoom)
    let best = Number.MAX_VALUE
    let closest = null
    for (const line of this.lines) {
      let vx = line.b.x - line.a.x
      let vz = line.b.y - line.a.y
      let wx = x - line.a.x
      let wz = y - line.a.y
      let t = (wx * vx + wz * vz) / (vx * vx + vz * vz)
      if (t < 0.0) t = 0.0
      else if (t > 1.0) t = 1.0
      let px = line.a.x + vx * t - x
      let pz = line.a.y + vz * t - y
      let distance = px * px + pz * pz
      if (distance > size * size || distance > best) continue
      best = distance
      closest = line
    }
    return closest
  }

  placeVectorAtCursor() {
    let x = this.camera.x + this.cursor.x / this.zoom
    let y = this.camera.z + this.cursor.y / this.zoom
    let vec = new Vector2(x, y)
    this.vecs.push(vec)
    return vec
  }

  thingUnderCursor() {
    let x = this.camera.x + this.cursor.x / this.zoom
    let y = this.camera.z + this.cursor.y / this.zoom
    for (const thing of this.things) {
      let size = 0.25 * thingSize(thing, this.zoom)
      if (x >= thing.x - size && x <= thing.x + size && y >= thing.z - size && y <= thing.z + size) {
        return thing
      }
    }
    return null
  }

  placeThingAtCursor() {
    let x = this.camera.x + this.cursor.x / this.zoom
    let y = this.camera.z + this.cursor.y / this.zoom
    let thing = new ThingReference(this.entityTable.get(this.usingEntity), x, y)
    this.things.push(thing)
    return thing
  }

  deleteVec(vec) {
    let index = this.vecs.indexOf(vec)
    this.vecs.splice(index, 1)
  }

  deleteSelectedVector() {
    this.deleteVec(this.selectedVec)
    this.selectedVec = null
  }

  flipSelectedLine() {
    let line = this.selectedLine
    let temp = line.a
    line.a = line.b
    line.b = temp
  }

  deleteSelectedLine() {
    let selected = this.selectedLine
    let index = this.lines.indexOf(selected)
    this.lines.splice(index, 1)
    let a = false
    let b = false
    for (const line of this.lines) {
      if (line.a === selected.a || line.b === selected.a) a = true
      if (line.a === selected.b || line.b === selected.b) b = true
      if (a && b) break
    }
    if (!a) this.deleteVec(selected.a)
    if (!b) this.deleteVec(selected.b)
    this.selectedLine = null
  }

  deleteSelectedThing() {
    let index = this.things.indexOf(this.selectedThing)
    this.things.splice(index, 1)
    this.selectedThing = null
  }

  referenceLinesFromVec(vec) {
    let list = []
    for (const line of this.lines) {
      if (line.a === vec || line.b === vec) {
        list.push(line)
      }
    }
    return list
  }

  switchTool() {
    this.action = DEFAULT_TOOL_OPTIONS[this.tool]
    this.selectedVec = null
    this.selectedLine = null
    this.selectedSector = null
    this.selectedThing = null
    this.selectedSecondVec = null
  }

  top() {
    const input = this.input
    const cursor = this.cursor
    const camera = this.camera

    if (input.openToolMenu()) {
      input.in[In.OPEN_TOOL_MENU] = false
      this.toolSelectionActive = !this.toolSelectionActive
    }

    if (this.toolSelectionActive) {
      if (input.buttonA()) {
        input.in[In.BUTTON_A] = false
        this.toolSelectionActive = false
      } else if (input.moveForward() || input.lookUp()) {
        input.in[In.MOVE_FORWARD] = false
        input.in[In.LOOK_UP] = false
        if (this.tool > 0) {
          this.tool--
          this.switchTool()
        }
      } else if (input.moveBackward() || input.lookDown()) {
        input.in[In.MOVE_BACKWARD] = false
        input.in[In.LOOK_DOWN] = false
        if (this.tool + 1 < TOOL_COUNT) {
          this.tool++
          this.switchTool()
        }
      }
      return
    }

    if (input.switchMode()) {
      input.in[In.SWITCH_MODE] = false
      this.mode = VIEW_MODE
      this.camera.x += cursor.x / this.zoom
      this.camera.z += cursor.y / this.zoom
      return
    }

    if (input.openMenu()) {
      input.in[In.OPEN_MENU] = false
      this.menuActive = !this.menuActive
      return
    }

    if (input.snapToGrid()) {
      input.in[In.SNAP_TO_GRID] = false
      this.snapToGrid = !this.snapToGrid
      return
    }

    if (input.zoomIn()) {
      this.zoom += 0.25
      this.camera.x -= 1.0 / this.zoom
      this.camera.z -= 1.0 / this.zoom
    }

    if (input.zoomOut()) {
      this.zoom -= 0.25
      this.camera.x += 1.0 / this.zoom
      this.camera.z += 1.0 / this.zoom
    }

    if (this.snapToGrid) {
      const grid = 10
      if (input.lookLeft()) {
        input.in[In.LOOK_LEFT] = false
        let x = Math.floor(cursor.x)
        let modulo = x % grid
        if (modulo == 0) cursor.x -= grid
        else cursor.x -= modulo
        if (cursor.x < 0.0) cursor.x = 0.0
      }
      if (input.lookRight()) {
        input.in[In.LOOK_RIGHT] = false
        let x = Math.floor(cursor.x)
        let modulo = x % grid
        if (modulo == 0) cursor.x += grid
        else cursor.x += grid - modulo
        if (cursor.x > this.width) cursor.x = this.width
      }
      if (input.lookUp()) {
        input.in[In.LOOK_UP] = false
        let y = Math.floor(cursor.y)
        let modulo = y % grid
        if (modulo == 0) cursor.y += grid
        else cursor.y += grid - modulo
        if (cursor.y > this.height) cursor.y = this.height
      }
      if (input.lookDown()) {
        input.in[In.LOOK_DOWN] = false
        let y = Math.floor(cursor.y)
        let modulo = y % grid
        if (modulo == 0) cursor.y -= grid
        else cursor.y -= modulo
        if (cursor.y < 0.0) cursor.y = 0.0
      }

      if (input.moveLeft()) {
        input.in[In.MOVE_LEFT] = false
        let x = Math.floor(camera.x)
        let modulo = x % grid
        if (modulo == 0) camera.x -= grid
        else camera.x -= modulo
      }
      if (input.moveRight()) {
        input.in[In.MOVE_RIGHT] = false
        let x = Math.floor(camera.x)
        let modulo = x % grid
        if (modulo == 0) camera.x += grid
        else camera.x += grid - modulo
      }
      if (input.moveForward()) {
        input.in[In.MOVE_FORWARD] = false
        let z = Math.floor(camera.z)
        let modulo = z % grid
        if (modulo == 0) camera.z += grid
        else camera.z += grid - modulo
      }
      if (input.moveBackward()) {
        input.in[In.MOVE_BACKWARD] = false
        let z = Math.floor(camera.z)
        let modulo = z % grid
        if (modulo == 0) camera.z -= grid
        else camera.z -= modulo
      }
    } else {
      const look = input.leftTrigger() ? 5.0 : 1.0
      if (input.lookLeft()) {
        cursor.x -= look
        if (cursor.x < 0.0) cursor.x = 0.0
      }
      if (input.lookRight()) {
        cursor.x += look
        if (cursor.x > this.width) cursor.x = this.width
      }
      if (input.lookUp()) {
        cursor.y += look
        if (cursor.y > this.height) cursor.y = this.height
      }
      if (input.lookDown()) {
        cursor.y -= look
        if (cursor.y < 0.0) cursor.y = 0.0
      }

      const speed = input.leftTrigger() ? 2.0 : 0.5
      if (input.moveLeft()) {
        camera.x -= speed
      }
      if (input.moveRight()) {
        camera.x += speed
      }
      if (input.moveForward()) {
        camera.z += speed
      }
      if (input.moveBackward()) {
        camera.z -= speed
      }
    }

    if (this.tool == DRAW_TOOL) {
      if (this.action == OPTION_DRAW_MODE_DEFAULT || this.action == OPTION_VECTOR_UNDER_CURSOR || this.action == OPTION_LINE_UNDER_CURSOR) {
        this.action = OPTION_DRAW_MODE_DEFAULT
        this.selectedVec = this.vectorUnderCursor()
        if (this.selectedVec !== null) {
          this.action = OPTION_VECTOR_UNDER_CURSOR
        } else {
          this.selectedLine = this.lineUnderCursor()
          if (this.selectedLine !== null) {
            this.action = OPTION_LINE_UNDER_CURSOR
          }
        }
      } else if (this.action == OPTION_END_LINE || this.action == OPTION_END_LINE_NEW_VECTOR) {
        this.action = OPTION_END_LINE_NEW_VECTOR
        this.selectedSecondVec = this.vectorUnderCursor()
        if (this.selectedSecondVec !== null) {
          this.action = OPTION_END_LINE
        }
      } else if (this.action == OPTION_MOVE_VECTOR || this.action == OPTION_VECTOR_OVERLAP) {
        this.action = OPTION_MOVE_VECTOR
        let x = camera.x + cursor.x / this.zoom
        let y = camera.z + cursor.y / this.zoom
        this.selectedVec.x = x
        this.selectedVec.y = y
        this.selectedSecondVec = this.vectorUnderCursor(this.selectedVec)
        if (this.selectedSecondVec !== null) {
          this.action = OPTION_VECTOR_OVERLAP
        }
      }

      let options = DESCRIBE_OPTIONS[this.action]

      if (this.action == OPTION_DRAW_MODE_DEFAULT) {
        for (const [button, option] of options) {
          if (input.in[button]) {
            input.in[button] = false
            if (option === DO_PLACE_LINE) {
              this.selectedVec = this.placeVectorAtCursor()
              this.action = OPTION_END_LINE
            }
          }
        }
      } else if (this.action == OPTION_LINE_UNDER_CURSOR) {
        for (const [button, option] of options) {
          if (input.in[button]) {
            input.in[button] = false
            if (option === DO_FLIP_LINE) {
              this.flipSelectedLine()
            } else if (option === DO_DELETE_LINE) {
              this.deleteSelectedLine()
            }
          }
        }
      } else if (this.action == OPTION_VECTOR_UNDER_CURSOR) {
        for (const [button, option] of options) {
          if (input.in[button]) {
            input.in[button] = false
            if (option === DO_START_LINE) {
              this.action = OPTION_END_LINE
            } else if (option === DO_MOVE_VECTOR) {
              this.action = OPTION_MOVE_VECTOR
            }
          }
        }
      } else if (this.action == OPTION_MOVE_VECTOR) {
        for (const [button, option] of options) {
          if (input.in[button]) {
            input.in[button] = false
            if (option === DO_END_MOVING_VECTOR) {
              this.action = OPTION_VECTOR_UNDER_CURSOR
            }
          }
        }
      } else if (this.action == OPTION_VECTOR_OVERLAP) {
        for (const [button, option] of options) {
          if (input.in[button]) {
            input.in[button] = false
            if (option === DO_MERGE_VECTOR) {
              let lines = this.referenceLinesFromVec(this.selectedVec)
              for (let line of lines) {
                if (line.a === this.selectedVec) line.a = this.selectedSecondVec
                else line.b = this.selectedSecondVec
              }
              this.deleteSelectedVector()
              this.action = OPTION_VECTOR_UNDER_CURSOR
            }
          }
        }
      } else if (this.action == OPTION_END_LINE) {
        for (const [button, option] of options) {
          if (input.in[button]) {
            input.in[button] = false
            if (option === DO_END_LINE) {
              if (this.selectedVec !== this.selectedSecondVec) {
                this.lines.push(new Line(-1, -1, -1, this.selectedVec, this.selectedSecondVec))
              }
              this.selectedVec = null
              this.selectedSecondVec = null
              this.action = OPTION_VECTOR_UNDER_CURSOR
            }
          }
        }
      } else if (this.action == OPTION_END_LINE_NEW_VECTOR) {
        for (const [button, option] of options) {
          if (input.in[button]) {
            input.in[button] = false
            if (option === DO_END_LINE_NEW_VECTOR) {
              this.lines.push(new Line(-1, -1, -1, this.selectedVec, this.placeVectorAtCursor()))
              this.selectedVec = null
              this.action = OPTION_VECTOR_UNDER_CURSOR
            }
          }
        }
      }
    } else if (this.tool == THING_TOOL) {
      if (this.action == OPTION_THING_MODE_DEFAULT || this.action == OPTION_THING_UNDER_CURSOR) {
        this.action = OPTION_THING_MODE_DEFAULT
        this.selectedThing = this.thingUnderCursor()
        if (this.selectedThing !== null) {
          this.action = OPTION_THING_UNDER_CURSOR
        }
      } else if (this.action == OPTION_MOVE_THING) {
        let x = camera.x + cursor.x / this.zoom
        let y = camera.z + cursor.y / this.zoom
        this.selectedThing.x = x
        this.selectedThing.z = y
      }

      let options = DESCRIBE_OPTIONS[this.action]

      if (this.action == OPTION_THING_MODE_DEFAULT) {
        for (const [button, option] of options) {
          if (input.in[button]) {
            input.in[button] = false
            if (option === DO_PLACE_THING) {
              this.selectedThing = this.placeThingAtCursor()
            }
          }
        }
      } else if (this.action == OPTION_THING_UNDER_CURSOR) {
        for (const [button, option] of options) {
          if (input.in[button]) {
            input.in[button] = false
            if (option === DO_MOVE_THING) {
              this.action = OPTION_MOVE_THING
            } else if (option === DO_DELETE_THING) {
              this.deleteSelectedThing()
            }
          }
        }
      } else if (this.action == OPTION_MOVE_THING) {
        for (const [button, option] of options) {
          if (input.in[button]) {
            input.in[button] = false
            if (option === DO_END_MOVING_THING) {
              this.action = OPTION_THING_UNDER_CURSOR
            }
          }
        }
      }
    }
  }

  view() {
    let input = this.input
    let camera = this.camera

    if (input.switchMode()) {
      input.in[In.SWITCH_MODE] = false
      this.mode = TOP_MODE
      let cursor = this.cursor
      this.camera.x -= cursor.x / this.zoom
      this.camera.z -= cursor.y / this.zoom
      return
    }

    if (input.lookLeft()) {
      camera.ry -= 0.05
      if (camera.ry < 0.0) camera.ry += 2.0 * Math.PI
    }

    if (input.lookRight()) {
      camera.ry += 0.05
      if (camera.ry >= 2.0 * Math.PI) camera.ry -= 2.0 * Math.PI
    }

    if (input.lookUp()) {
      camera.rx -= 0.05
      if (camera.rx < 0.0) camera.rx += 2.0 * Math.PI
    }

    if (input.lookDown()) {
      camera.rx += 0.05
      if (camera.rx >= 2.0 * Math.PI) camera.rx -= 2.0 * Math.PI
    }

    const speed = 0.3

    if (input.moveUp()) {
      camera.y += speed
    }

    if (input.moveDown()) {
      camera.y -= speed
    }

    let direction = null
    let rotation = null

    if (input.moveForward()) {
      direction = 'w'
      rotation = camera.ry
    }

    if (input.moveBackward()) {
      if (direction === null) {
        direction = 's'
        rotation = camera.ry + Math.PI
      } else {
        direction = null
        rotation = null
      }
    }

    if (input.moveLeft()) {
      if (direction === null) {
        direction = 'a'
        rotation = camera.ry - 0.5 * Math.PI
      } else if (direction === 'w') {
        direction = 'wa'
        rotation -= 0.25 * Math.PI
      } else if (direction === 's') {
        direction = 'sa'
        rotation += 0.25 * Math.PI
      }
    }

    if (input.moveRight()) {
      if (direction === null) {
        rotation = camera.ry + 0.5 * Math.PI
      } else if (direction === 'a') {
        rotation = null
      } else if (direction === 'wa') {
        rotation = camera.ry
      } else if (direction === 'sa') {
        rotation = camera.ry + Math.PI
      } else if (direction === 'w') {
        rotation += 0.25 * Math.PI
      } else if (direction === 's') {
        rotation -= 0.25 * Math.PI
      }
    }

    if (rotation !== null) {
      camera.x += Math.sin(rotation) * speed
      camera.z -= Math.cos(rotation) * speed
    }
  }

  update() {
    if (this.input.nothingOn()) {
      if (this.shadowInput) {
        this.shadowInput = false
      } else {
        return
      }
    } else {
      this.shadowInput = true
    }
    switch (this.mode) {
      case TOP_MODE:
        this.top()
        break
      case VIEW_MODE:
        this.view()
        break
    }
  }

  export() {
    return ''
  }
}
