import {TwoWayMap} from '/src/util/collections.js'
import {textureByName} from '/src/assets/assets.js'
import {drawTextSpecial, FONT_WIDTH, FONT_HEIGHT} from '/src/render/render.js'
import {identity, multiply} from '/src/math/matrix.js'
import {darkbluef, whitef} from '/src/editor/palette.js'
import {MainMenu} from '/src/menu/menu.js'
import * as In from '/src/input/input.js'

export class MainMenuState {
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

    this.menu = new MainMenu(client.width, client.height)
  }

  resize(width, height, scale) {
    this.menu.resize(width, height, scale)
  }

  keyEvent(code, down) {
    if (this.keys.has(code)) this.menu.input.set(this.keys.get(code), down)
  }

  mouseEvent() {}

  mouseMove() {}

  async initialize() {}

  update() {
    this.menu.update()
  }

  render() {
    const menu = this.menu
    if (!menu.doPaint) return

    const client = this.client
    const gl = client.gl
    const rendering = client.rendering
    const view = this.view
    const projection = this.projection
    const scale = menu.scale
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

    let text = 'main menu'
    let mainMenu = {
      x: 0,
      y: 0,
      left: 'center',
      top: '75p',
      padtop: 0,
      padbottom: 0,
      padleft: 0,
      padright: 0,
      width: fontWidth * text.length,
      height: fontHeight,
    }
    flexSolve(width, height, mainMenu)
    drawTextSpecial(client.bufferGUI, mainMenu.x, mainMenu.y, text, scale, white0, white1, white2)

    text = 'continue game'
    let continueGame = {
      x: 0,
      y: 0,
      align: mainMenu,
      below: mainMenu,
      padtop: 0,
      padbottom: 0,
      padleft: 0,
      padright: 0,
      width: fontWidth * text.length,
      height: fontHeight,
    }
    flexSolve(width, height, continueGame)
    drawTextSpecial(client.bufferGUI, continueGame.x, continueGame.y, text, scale, white0, white1, white2)

    text = 'open editor'
    let openEditor = {
      x: 0,
      y: 0,
      align: continueGame,
      below: continueGame,
      padtop: 0,
      padbottom: 0,
      padleft: 0,
      padright: 0,
      width: fontWidth * text.length,
      height: fontHeight,
    }
    flexSolve(width, height, openEditor)
    drawTextSpecial(client.bufferGUI, openEditor.x, openEditor.y, text, scale, white0, white1, white2)

    text = '()'
    let indicator = {
      x: 0,
      y: 0,
      align: continueGame,
      below: continueGame,
      padtop: 0,
      padbottom: 0,
      padleft: 0,
      padright: 0,
      width: fontWidth * text.length,
      height: fontHeight,
    }
    flexSolve(width, height, indicator)
    drawTextSpecial(client.bufferGUI, indicator.x, indicator.y, text, scale, white0, white1, white2)

    rendering.bindTexture(gl.TEXTURE0, textureByName('font').texture)
    rendering.updateAndDraw(client.bufferGUI)
  }
}

function flexSolve(width, height, flex) {
  if (flex.left) {
    if (flex.left === 'center') {
      flex.x = Math.floor(0.5 * width - 0.5 * flex.width)
    } else if (flex.left.endsWith('p')) {
      let percent = parseFloat(flex.left.substring(0, flex.left.length - 1)) / 100.0
      flex.x = Math.floor(percent * width)
    } else {
      flex.x = parseFloat(flex.left)
    }
  } else if (flex.align) {
    console.log('align...', flex.align)
    flex.x = flex.align.x
  }
  if (flex.top) {
    if (flex.top === 'center') {
      flex.y = Math.floor(0.5 * height - 0.5 * flex.height)
    } else if (flex.top.endsWith('p')) {
      let percent = parseFloat(flex.top.substring(0, flex.top.length - 1)) / 100.0
      flex.y = Math.floor(percent * height)
    } else {
      flex.y = parseFloat(flex.top)
    }
  } else if (flex.below) {
    console.log('below...', flex.below)
    flex.y = flex.below.y - flex.below.padbottom - flex.height
  }
  console.log(flex)
  return flex
}
