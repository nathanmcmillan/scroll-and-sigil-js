import {Camera} from '/src/game/camera.js'
import {Vector2} from '/src/math/vector.js'
import * as In from '/src/editor/editor-input.js'

export const TOP_MODE = 0
export const VIEW_MODE = 1

export const VECTOR_TOOL = 0
export const LINE_TOOL = 1
export const THING_TOOL = 2
export const SECTOR_TOOL = 3

export const NO_ACTION = -1
export const SELECT_VECTOR = 0
export const MOVE_VECTOR = 1

export const DESCRIBE_TOOL = ['Place vector', 'Place line', 'Place thing', 'Edit sector']
export const DESCRIBE_ACTION = ['Select vector', 'Move vector']

export const DESCRIBE_MENU = ['Open', 'Save', 'Quit']

export class Editor {
  constructor(width, height) {
    this.width = width
    this.height = height
    this.input = new In.EditorInput()
    this.camera = new Camera(0.0, 0.0, 0.0, 0.0, 0.0, null)
    this.mode = TOP_MODE
    this.tool = VECTOR_TOOL
    this.action = NO_ACTION
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
    this.menuActive = false
    this.toolSelectionActive = false
    this.snapToGrid = false
    this.viewVecs = true
    this.viewLines = true
    this.viewSectors = false
  }

  resize(width, height) {
    this.width = width
    this.height = height
  }

  top() {
    let input = this.input
    let cursor = this.cursor
    let camera = this.camera

    if (input.switchMode()) {
      input.in[In.SWITCH_MODE] = false
      this.mode = VIEW_MODE
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

    if (input.openToolMenu()) {
      input.in[In.OPEN_TOOL_MENU] = false
      this.toolSelectionActive = !this.toolSelectionActive
      return
    }

    if (input.zoomIn()) {
      this.zoom += 0.25
      this.camera.x -= 1
      this.camera.z -= 1
    }

    if (input.zoomOut()) {
      this.zoom -= 0.25
      this.camera.x += 1
      this.camera.z += 1
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
      if (this.action == NO_ACTION || this.action == SELECT_VECTOR) {
        this.action = NO_ACTION
        let x = camera.x + cursor.x / this.zoom
        let y = camera.z + cursor.y / this.zoom
        const size = 1.0 + 0.05 * this.zoom
        for (const vec of this.vecs) {
          if (Math.sqrt((vec.x - x) * (vec.x - x) + (vec.y - y) * (vec.y - y)) < size) {
            this.selectedVec = vec
            this.action = SELECT_VECTOR
            break
          }
        }
      } else {
        let x = camera.x + cursor.x / this.zoom
        let y = camera.z + cursor.y / this.zoom
        this.selectedVec.x = x
        this.selectedVec.y = y
      }
      if (input.clickLeft()) {
        input.in[In.CLICK_LEFT] = false
        if (this.action == MOVE_VECTOR) {
          this.action = SELECT_VECTOR
        } else if (this.action == SELECT_VECTOR) {
          this.action = MOVE_VECTOR
        } else {
          let cursor = this.cursor
          let x = camera.x + cursor.x / this.zoom
          let y = camera.z + cursor.y / this.zoom
          this.vecs.push(new Vector2(x, y))
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
