import {Camera} from '/src/game/camera.js'
import {Vector2} from '/src/math/vector.js'
import {Line} from '/src/map/line.js'
import {ThingReference} from '/src/editor/thing-reference.js'
import * as In from '/src/editor/editor-input.js'

export const TOP_MODE = 0
export const VIEW_MODE = 1

export const VECTOR_TOOL = 0
export const LINE_TOOL = 1
export const THING_TOOL = 2
export const SECTOR_TOOL = 3
export const TOOL_COUNT = 4

export const VECTOR_MODE_DEFAULT = 0
export const VECTOR_UNDER_CURSOR = 1
export const MOVING_VECTOR = 2
export const LINE_MODE_DEFAULT = 3
export const START_LINE = 4
export const END_LINE = 5
export const END_LINE_NEW_VECTOR = 6
export const LINE_UNDER_CURSOR = 7
export const THING_MODE_DEFAULT = 8
export const THING_UNDER_CURSOR = 9
export const MOVING_THING = 10
export const SECTOR_MODE_DEFAULT = 11
export const OPTION_COUNT = 12

export const PLACE_VECTOR = 0
export const PLACE_LINE = 1
export const PLACE_THING = 2
export const EDIT_SECTOR = 3
export const MOVE_VECTOR = 4
export const DELETE_VECTOR = 5
export const END_MOVING_VECTOR = 6
export const FLIP_LINE = 6
export const DELETE_LINE = 7
export const MOVE_THING = 9
export const END_MOVING_THING = 10
export const EDIT_THING = 11
export const DELETE_THING = 12
export const ACTION_COUNT = 14

export const DESCRIBE_TOOL = new Array(TOOL_COUNT)
DESCRIBE_TOOL[VECTOR_TOOL] = 'Vector mode'
DESCRIBE_TOOL[LINE_TOOL] = 'Line mode'
DESCRIBE_TOOL[THING_TOOL] = 'Thing mode'
DESCRIBE_TOOL[SECTOR_TOOL] = 'Sector mode'

const DEFAULT_TOOL_ACTION = new Array(TOOL_COUNT)
DEFAULT_TOOL_ACTION[VECTOR_TOOL] = VECTOR_MODE_DEFAULT
DEFAULT_TOOL_ACTION[LINE_TOOL] = LINE_MODE_DEFAULT
DEFAULT_TOOL_ACTION[THING_TOOL] = THING_MODE_DEFAULT
DEFAULT_TOOL_ACTION[SECTOR_TOOL] = SECTOR_MODE_DEFAULT

export const DESCRIBE_ACTION = new Array(ACTION_COUNT)
DESCRIBE_ACTION[PLACE_VECTOR] = 'Place vector'
DESCRIBE_ACTION[MOVE_VECTOR] = 'Move vector'
DESCRIBE_ACTION[DELETE_VECTOR] = 'Delete vector'
DESCRIBE_ACTION[END_MOVING_VECTOR] = 'Stop moving vector'

DESCRIBE_ACTION[PLACE_LINE] = 'Place line'
DESCRIBE_ACTION[FLIP_LINE] = 'Flip line'
DESCRIBE_ACTION[DELETE_LINE] = 'Delete line'
DESCRIBE_ACTION[START_LINE] = 'Start line at vector'
DESCRIBE_ACTION[END_LINE] = 'End line at vector'
DESCRIBE_ACTION[END_LINE_NEW_VECTOR] = 'End line with new vector'

DESCRIBE_ACTION[PLACE_THING] = 'Place thing'
DESCRIBE_ACTION[MOVE_THING] = 'Move thing'
DESCRIBE_ACTION[EDIT_THING] = 'Edit thing'
DESCRIBE_ACTION[DELETE_THING] = 'Delete thing'
DESCRIBE_ACTION[END_MOVING_THING] = 'Stop moving thing'

DESCRIBE_ACTION[EDIT_SECTOR] = 'Edit sector'

export const DESCRIBE_OPTIONS = new Array(OPTION_COUNT)

const VECTOR_MODE_OPTIONS = new Map()
VECTOR_MODE_OPTIONS.set(In.BUTTON_A, PLACE_VECTOR)
DESCRIBE_OPTIONS[VECTOR_MODE_DEFAULT] = VECTOR_MODE_OPTIONS

const VECTOR_UNDER_CURSOR_OPTIONS = new Map()
VECTOR_UNDER_CURSOR_OPTIONS.set(In.BUTTON_A, MOVE_VECTOR)
VECTOR_UNDER_CURSOR_OPTIONS.set(In.BUTTON_B, DELETE_VECTOR)
DESCRIBE_OPTIONS[VECTOR_UNDER_CURSOR] = VECTOR_UNDER_CURSOR_OPTIONS

const MOVING_VECTOR_OPTIONS = new Map()
MOVING_VECTOR_OPTIONS.set(In.BUTTON_A, END_MOVING_VECTOR)
DESCRIBE_OPTIONS[MOVING_VECTOR] = MOVING_VECTOR_OPTIONS

const LINE_MODE_OPTIONS = new Map()
LINE_MODE_OPTIONS.set(In.BUTTON_A, PLACE_LINE)
DESCRIBE_OPTIONS[LINE_MODE_DEFAULT] = LINE_MODE_OPTIONS

const LINE_UNDER_CURSOR_OPTIONS = new Map()
LINE_UNDER_CURSOR_OPTIONS.set(In.BUTTON_A, FLIP_LINE)
LINE_UNDER_CURSOR_OPTIONS.set(In.BUTTON_B, DELETE_LINE)
DESCRIBE_OPTIONS[LINE_UNDER_CURSOR] = LINE_UNDER_CURSOR_OPTIONS

const THING_MODE_OPTIONS = new Map()
THING_MODE_OPTIONS.set(In.BUTTON_A, PLACE_THING)
DESCRIBE_OPTIONS[THING_MODE_DEFAULT] = THING_MODE_OPTIONS

const THING_UNDER_CURSOR_OPTIONS = new Map()
THING_UNDER_CURSOR_OPTIONS.set(In.BUTTON_A, MOVE_THING)
THING_UNDER_CURSOR_OPTIONS.set(In.BUTTON_B, DELETE_THING)
THING_UNDER_CURSOR_OPTIONS.set(In.BUTTON_X, EDIT_THING)
DESCRIBE_OPTIONS[THING_UNDER_CURSOR] = THING_UNDER_CURSOR_OPTIONS

const MOVING_THING_OPTIONS = new Map()
MOVING_THING_OPTIONS.set(In.BUTTON_A, END_MOVING_THING)
DESCRIBE_OPTIONS[MOVING_THING] = MOVING_THING_OPTIONS

const SECTOR_MODE_OPTIONS = new Map()
SECTOR_MODE_OPTIONS.set(In.BUTTON_A, EDIT_SECTOR)
DESCRIBE_OPTIONS[SECTOR_MODE_DEFAULT] = SECTOR_MODE_OPTIONS

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
    this.tool = VECTOR_TOOL
    this.action = VECTOR_MODE_DEFAULT
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
    this.menuActive = false
    this.toolSelectionActive = false
    this.snapToGrid = false
    this.viewVecs = true
    this.viewLines = true
    this.viewSectors = false
    this.viewThings = true
  }

  resize(width, height) {
    this.width = width
    this.height = height
  }

  load(world) {
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

  vectorUnderCursor() {
    let x = this.camera.x + this.cursor.x / this.zoom
    let y = this.camera.z + this.cursor.y / this.zoom
    const size = vectorSize(this.zoom)
    for (const vec of this.vecs) {
      if (Math.sqrt((vec.x - x) * (vec.x - x) + (vec.y - y) * (vec.y - y)) < size) {
        return vec
      }
    }
    return null
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
    let thing = new ThingReference(x, y)
    this.things.push(thing)
    return thing
  }

  switchTool() {
    this.action = DEFAULT_TOOL_ACTION[this.tool]
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
      const look = 1.0
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

      const speed = 0.5
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

    if (this.tool == VECTOR_TOOL) {
      if (this.action == VECTOR_MODE_DEFAULT || this.action == VECTOR_UNDER_CURSOR) {
        this.action = VECTOR_MODE_DEFAULT
        this.selectedVec = this.vectorUnderCursor()
        if (this.selectedVec !== null) {
          this.action = VECTOR_UNDER_CURSOR
        }
      } else if (this.action == MOVING_VECTOR) {
        let x = camera.x + cursor.x / this.zoom
        let y = camera.z + cursor.y / this.zoom
        this.selectedVec.x = x
        this.selectedVec.y = y
      }
      if (input.buttonA()) {
        input.in[In.BUTTON_A] = false
        if (this.action == VECTOR_UNDER_CURSOR) {
          this.action = MOVING_VECTOR
        } else if (this.action == MOVING_VECTOR) {
          this.action = VECTOR_UNDER_CURSOR
        } else {
          this.placeVectorAtCursor()
        }
      }
    } else if (this.tool == LINE_TOOL) {
      if (this.action == LINE_MODE_DEFAULT || this.action == START_LINE) {
        this.action = LINE_MODE_DEFAULT
        this.selectedVec = this.vectorUnderCursor()
        if (this.selectedVec !== null) {
          this.action = START_LINE
        }
      } else if (this.action == END_LINE || this.action == END_LINE_NEW_VECTOR) {
        this.action = END_LINE_NEW_VECTOR
        this.selectedSecondVec = this.vectorUnderCursor()
        if (this.selectedSecondVec !== null) {
          this.action = END_LINE
        }
      }
      if (input.buttonA()) {
        input.in[In.BUTTON_A] = false
        if (this.action == LINE_MODE_DEFAULT) {
          this.selectedVec = this.placeVectorAtCursor()
          this.action = END_LINE
        } else if (this.action == START_LINE) {
          this.action = END_LINE
        } else if (this.action == END_LINE) {
          this.lines.push(new Line(-1, -1, -1, this.selectedVec, this.selectedSecondVec))
          this.selectedVec = null
          this.selectedSecondVec = null
          this.action = LINE_MODE_DEFAULT
        } else if (this.action == END_LINE_NEW_VECTOR) {
          this.lines.push(new Line(-1, -1, -1, this.selectedVec, this.placeVectorAtCursor()))
          this.selectedVec = null
          this.action = LINE_MODE_DEFAULT
        }
      }
    } else if (this.tool == THING_TOOL) {
      if (this.action == THING_MODE_DEFAULT || this.action == THING_UNDER_CURSOR) {
        this.action = THING_MODE_DEFAULT
        this.selectedThing = this.thingUnderCursor()
        if (this.selectedThing !== null) {
          this.action = THING_UNDER_CURSOR
        }
      } else if (this.action == MOVE_THING) {
        let x = camera.x + cursor.x / this.zoom
        let y = camera.z + cursor.y / this.zoom
        this.selectedThing.x = x
        this.selectedThing.z = y
      }
      if (input.buttonA()) {
        input.in[In.BUTTON_A] = false
        if (this.action == THING_MODE_DEFAULT) {
          this.selectedThing = this.placeThingAtCursor()
        } else if (this.action == THING_UNDER_CURSOR) {
          this.action = MOVE_THING
        } else if (this.action == MOVE_THING) {
          this.action = THING_UNDER_CURSOR
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
