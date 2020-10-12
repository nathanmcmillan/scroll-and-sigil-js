import {renderEditorTopMode} from '/src/client/editor-top-mode.js'
import {renderEditorViewMode, updateEditorViewSectorBuffer} from '/src/client/editor-view-mode.js'
import {Editor, TOP_MODE, VIEW_MODE, SWITCH_MODE_CALLBACK} from '/src/editor/editor.js'
import * as In from '/src/editor/editor-input.js'

class TwoWayMap {
  constructor() {
    this.map = new Map()
    this.reverse = new Map()
  }

  set(a, b) {
    this.map.set(a, b)
    this.reverse.set(b, a)
  }

  get(k) {
    return this.map.get(k)
  }

  has(k) {
    return this.map.has(k)
  }

  reversed(k) {
    return this.reverse.get(k)
  }
}

export class EditorState {
  constructor(client) {
    this.client = client

    let keys = new TwoWayMap()
    keys.set('KeyW', In.MOVE_FORWARD)
    keys.set('KeyA', In.MOVE_LEFT)
    keys.set('KeyS', In.MOVE_BACKWARD)
    keys.set('KeyD', In.MOVE_RIGHT)
    keys.set('KeyQ', In.MOVE_UP)
    keys.set('KeyE', In.MOVE_DOWN)
    keys.set('ArrowLeft', In.LOOK_LEFT)
    keys.set('ArrowRight', In.LOOK_RIGHT)
    keys.set('ArrowUp', In.LOOK_UP)
    keys.set('ArrowDown', In.LOOK_DOWN)
    keys.set('Enter', In.BUTTON_A)
    keys.set('KeyC', In.BUTTON_B)
    keys.set('KeyN', In.BUTTON_X)
    keys.set('KeyM', In.BUTTON_Y)
    keys.set('KeyI', In.OPEN_MENU)
    keys.set('KeyM', In.OPEN_TOOL_MENU)
    keys.set('KeyV', In.SWITCH_MODE)
    keys.set('KeyZ', In.ZOOM_IN)
    keys.set('KeyX', In.ZOOM_OUT)
    keys.set('KeyU', In.UNDO)
    keys.set('KeyR', In.REDO)
    keys.set('KeyG', In.SNAP_TO_GRID)
    keys.set('ShiftLeft', In.LEFT_TRIGGER)
    keys.set('ShiftRight', In.RIGHT_TRIGGER)

    this.keys = keys

    let self = this
    let callbacks = []
    callbacks[SWITCH_MODE_CALLBACK] = () => {
      self.switchMode()
    }

    this.editor = new Editor(client.width, client.height, callbacks)
  }

  resize(width, height) {
    this.editor.resize(width, height)
  }

  keyEvent(code, down) {
    if (this.keys.has(code)) {
      this.editor.input.set(this.keys.get(code), down)
    }
  }

  initialize() {
    this.editor.load(this.client.game.world)
  }

  switchMode() {
    if (this.editor.mode === VIEW_MODE) {
      updateEditorViewSectorBuffer(this)
    }
  }

  update() {
    this.editor.update()
  }

  render() {
    if (this.editor.mode === TOP_MODE) {
      renderEditorTopMode(this)
    } else {
      renderEditorViewMode(this)
    }
  }
}
