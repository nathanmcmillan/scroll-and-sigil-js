import {TwoWayMap} from '/src/util/collections.js'
import {textureByName} from '/src/assets/assets.js'
import {drawTextSpecial, FONT_WIDTH, FONT_HEIGHT} from '/src/render/render.js'
import {identity, multiply} from '/src/math/matrix.js'
import {darkbluef, whitef} from '/src/editor/palette.js'
import {flexBox, flexSolve} from '/src/flex/flex.js'
import {Home} from '/src/menu/home.js'
import * as In from '/src/input/input.js'

export class HomeState {
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

    this.view = new Float32Array(16)
    this.projection = new Float32Array(16)

    this.home = new Home(client.width, client.height, client.scale)
  }

  resize(width, height, scale) {
    this.home.resize(width, height, scale)
  }

  keyEvent(code, down) {
    if (this.keys.has(code)) this.home.input.set(this.keys.get(code), down)
  }

  mouseEvent() {}

  mouseMove() {}

  async initialize() {}

  update(timestamp) {
    let home = this.home
    home.update(timestamp)
    if (home.yes) {
      let client = this.client
      if (home.row === 0) {
        client.openState('game')
      } else if (home.row === 1) {
        client.openState('game')
      } else if (home.row === 2) {
        client.openState('dashboard')
      }
    }
  }

  render() {
    const home = this.home
    if (!home.doPaint) return

    const client = this.client
    const gl = client.gl
    const rendering = client.rendering
    const view = this.view
    const projection = this.projection
    const scale = home.scale
    const width = client.width
    const height = client.height
    const fontWidth = scale * FONT_WIDTH
    const fontHeight = scale * FONT_HEIGHT

    let darkblue0 = darkbluef(0)
    let darkblue1 = darkbluef(1)
    let darkblue2 = darkbluef(2)

    gl.clearColor(darkblue0, darkblue1, darkblue2, 1.0)

    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.clear(gl.DEPTH_BUFFER_BIT)

    gl.disable(gl.CULL_FACE)
    gl.disable(gl.DEPTH_TEST)

    identity(view)
    multiply(projection, client.orthographic, view)

    client.bufferGUI.zero()

    let white0 = whitef(0)
    let white1 = whitef(1)
    let white2 = whitef(2)

    rendering.setProgram(1)
    rendering.setView(0, 0, width, height)
    rendering.updateUniformMatrix('u_mvp', projection)

    let text = 'Scroll and Sigil'
    let mainMenu = flexBox(fontWidth * text.length, fontHeight)
    mainMenu.bottomSpace = fontHeight
    mainMenu.funX = 'center'
    mainMenu.funY = '%'
    mainMenu.argY = 75
    flexSolve(width, height, mainMenu)
    drawTextSpecial(client.bufferGUI, mainMenu.x, mainMenu.y, text, scale, white0, white1, white2)

    text = 'continue game'
    let continueGame = flexBox(fontWidth * text.length, fontHeight)
    continueGame.leftSpace = fontWidth
    continueGame.funX = 'center'
    continueGame.fromX = mainMenu
    continueGame.funY = 'below'
    continueGame.fromY = mainMenu
    flexSolve(width, height, continueGame)
    drawTextSpecial(client.bufferGUI, continueGame.x, continueGame.y, text, scale, white0, white1, white2)

    text = 'start new game'
    let startNewGame = flexBox(fontWidth * text.length, fontHeight)
    startNewGame.leftSpace = fontWidth
    startNewGame.funX = 'center'
    startNewGame.fromX = continueGame
    startNewGame.funY = 'below'
    startNewGame.fromY = continueGame
    flexSolve(width, height, startNewGame)
    drawTextSpecial(client.bufferGUI, startNewGame.x, startNewGame.y, text, scale, white0, white1, white2)

    text = 'open editor'
    let openEditor = flexBox(fontWidth * text.length, fontHeight)
    openEditor.leftSpace = fontWidth
    openEditor.funX = 'center'
    openEditor.fromX = startNewGame
    openEditor.funY = 'below'
    openEditor.fromY = startNewGame
    flexSolve(width, height, openEditor)
    drawTextSpecial(client.bufferGUI, openEditor.x, openEditor.y, text, scale, white0, white1, white2)

    text = ')'
    let indicator = flexBox(fontWidth * text.length, fontHeight)
    indicator.funX = 'left-of'
    indicator.funY = 'center'
    if (home.row === 0) {
      indicator.fromX = continueGame
      indicator.fromY = continueGame
    } else if (home.row === 1) {
      indicator.fromX = startNewGame
      indicator.fromY = startNewGame
    } else if (home.row === 2) {
      indicator.fromX = openEditor
      indicator.fromY = openEditor
    }
    flexSolve(width, height, indicator)
    drawTextSpecial(client.bufferGUI, indicator.x, indicator.y, text, scale, white0, white1, white2)

    rendering.bindTexture(gl.TEXTURE0, textureByName('font').texture)
    rendering.updateAndDraw(client.bufferGUI)
  }
}
