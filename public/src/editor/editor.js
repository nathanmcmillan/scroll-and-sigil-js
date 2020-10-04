import {Camera} from '/src/game/camera.js'
import {EditorInput, CHANGE_MODE} from '/src/editor/editor-input.js'
import {Vector2} from '/src/math/vector.js'

export const TOP_MODE = 1
export const VIEW_MODE = 2

export const EDIT_VECTORS = 1
export const EDIT_LINES = 2
export const EDIT_SECTORS = 3
export const EDIT_THINGS = 4

export const EDIT_PLACE_VECTOR = 1
export const EDIT_MOVE_VECTOR = 2

export const DESCRIBE_EDIT_VECTORS = {
  EDIT_PLACE_VECTOR: 'Place vector',
  EDIT_MOVE_VECTOR: 'Move vector',
}

export class Editor {
  constructor(width, height) {
    this.width = width
    this.height = height
    this.input = new EditorInput()
    this.camera = new Camera(0.0, 0.0, 0.0, 0.0, 0.0, null)
    this.mode = TOP_MODE
    this.submode = EDIT_VECTORS
    this.zoom = 10.0
    this.cursor = new Vector2(0.5 * width, 0.5 * height)
    this.vectors = []
    this.lines = []
    this.sectors = []
    this.things = []
  }

  resize(width, height) {
    this.width = width
    this.height = height
  }

  top() {
    let input = this.input
    let cursor = this.cursor
    let camera = this.camera

    if (input.changeMode()) {
      input.in[CHANGE_MODE] = false
      this.mode = VIEW_MODE
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
      camera.x += speed
    }

    if (input.moveRight()) {
      camera.x -= speed
    }

    if (input.moveForward()) {
      camera.z -= speed
    }

    if (input.moveBackward()) {
      camera.z += speed
    }
  }

  view() {
    let input = this.input
    let camera = this.camera

    if (input.changeMode()) {
      input.in[CHANGE_MODE] = false
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
