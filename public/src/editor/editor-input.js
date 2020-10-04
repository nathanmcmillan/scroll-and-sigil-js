export const LOOK_LEFT = 0
export const LOOK_RIGHT = 1
export const LOOK_UP = 2
export const LOOK_DOWN = 3
export const MOVE_FORWARD = 4
export const MOVE_BACKWARD = 5
export const MOVE_LEFT = 6
export const MOVE_RIGHT = 7
export const MOVE_UP = 8
export const MOVE_DOWN = 9
export const CLICK_LEFT = 10
export const CLICK_RIGHT = 11
export const OPEN_MENU = 12
export const OPEN_TOOL_MENU = 13
export const UNDO = 14
export const REDO = 15
export const SWITCH_MODE = 16
export const ZOOM_IN = 17
export const ZOOM_OUT = 18
export const SNAP_TO_GRID = 19

export class EditorInput {
  constructor() {
    this.in = new Array(20).fill(false)
  }

  set(index, down) {
    this.in[index] = down
  }

  lookLeft() {
    return this.in[LOOK_LEFT]
  }

  lookRight() {
    return this.in[LOOK_RIGHT]
  }

  lookUp() {
    return this.in[LOOK_UP]
  }

  lookDown() {
    return this.in[LOOK_DOWN]
  }

  moveForward() {
    return this.in[MOVE_FORWARD]
  }

  moveBackward() {
    return this.in[MOVE_BACKWARD]
  }

  moveLeft() {
    return this.in[MOVE_LEFT]
  }

  moveRight() {
    return this.in[MOVE_RIGHT]
  }

  moveUp() {
    return this.in[MOVE_UP]
  }

  moveDown() {
    return this.in[MOVE_DOWN]
  }

  clickLeft() {
    return this.in[CLICK_LEFT]
  }

  clickRight() {
    return this.in[CLICK_RIGHT]
  }

  openMenu() {
    return this.in[OPEN_MENU]
  }

  openToolMenu() {
    return this.in[OPEN_TOOL_MENU]
  }

  undo() {
    return this.in[UNDO]
  }

  redo() {
    return this.in[REDO]
  }

  switchMode() {
    return this.in[SWITCH_MODE]
  }

  zoomIn() {
    return this.in[ZOOM_IN]
  }

  zoomOut() {
    return this.in[ZOOM_OUT]
  }

  snapToGrid() {
    return this.in[SNAP_TO_GRID]
  }
}
