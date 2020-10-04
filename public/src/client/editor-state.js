import {renderEditorTopMode} from '/src/client/editor-top-mode.js'
import {renderEditorViewMode} from '/src/client/editor-view-mode.js'
import {Editor, TOP_MODE, VIEW_MODE} from '/src/editor/editor.js'
import * as In from '/src/editor/editor-input.js'

export class EditorState {
  constructor(client) {
    this.client = client
    this.editor = new Editor(client.width, client.height)

    let keyEventMap = new Map()
    keyEventMap.set('KeyW', In.MOVE_FORWARD)
    keyEventMap.set('KeyA', In.MOVE_LEFT)
    keyEventMap.set('KeyS', In.MOVE_BACKWARD)
    keyEventMap.set('KeyD', In.MOVE_RIGHT)
    keyEventMap.set('KeyQ', In.MOVE_UP)
    keyEventMap.set('KeyE', In.MOVE_DOWN)
    keyEventMap.set('KeyJ', In.LOOK_LEFT)
    keyEventMap.set('ArrowLeft', In.LOOK_LEFT)
    keyEventMap.set('KeyL', In.LOOK_RIGHT)
    keyEventMap.set('ArrowRight', In.LOOK_RIGHT)
    keyEventMap.set('KeyI', In.LOOK_UP)
    keyEventMap.set('ArrowUp', In.LOOK_UP)
    keyEventMap.set('KeyK', In.LOOK_DOWN)
    keyEventMap.set('ArrowDown', In.LOOK_DOWN)
    keyEventMap.set('KeyH', In.CLICK_LEFT)
    keyEventMap.set('Space', In.CLICK_LEFT)
    keyEventMap.set('KeyU', In.CLICK_RIGHT)
    keyEventMap.set('Enter', In.OPEN_MENU)
    keyEventMap.set('KeyM', In.OPEN_TOOL_MENU)
    keyEventMap.set('KeyV', In.SWITCH_MODE)
    keyEventMap.set('KeyZ', In.ZOOM_IN)
    keyEventMap.set('KeyX', In.ZOOM_OUT)
    keyEventMap.set('KeyU', In.UNDO)
    keyEventMap.set('KeyR', In.REDO)
    keyEventMap.set('KeyG', In.SNAP_TO_GRID)

    this.keyEventMap = keyEventMap
  }

  resize(width, height) {
    this.editor.resize(width, height)
  }

  keyEvent(code, down) {
    if (this.keyEventMap.has(code)) {
      this.editor.input.set(this.keyEventMap.get(code), down)
    }
  }

  initialize() {}

  update() {
    this.editor.update()
  }

  render() {
    switch (this.editor.mode) {
      case TOP_MODE:
        renderEditorTopMode(this)
        break
      case VIEW_MODE:
        renderEditorViewMode(this)
        break
    }
  }
}
