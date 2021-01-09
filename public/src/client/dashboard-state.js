import {textureByName} from '/src/assets/assets.js'
import {drawTextSpecial, FONT_WIDTH, FONT_HEIGHT} from '/src/render/render.js'
import {identity, multiply} from '/src/math/matrix.js'
import {darkgreyf, whitef} from '/src/editor/palette.js'
import {flexBox, flexSolve} from '/src/flex/flex.js'
import {Dashboard} from '/src/menu/dashboard.js'

export class DashboardState {
  constructor(client) {
    this.client = client
    this.keys = client.keys

    this.view = new Float32Array(16)
    this.projection = new Float32Array(16)

    this.dashboard = new Dashboard(client.width, client.height, client.scale, client.input)
  }

  resize(width, height, scale) {
    this.dashboard.resize(width, height, scale)
  }

  keyEvent(code, down) {
    if (this.keys.has(code)) this.dashboard.input.set(this.keys.get(code), down)
  }

  mouseEvent() {}

  mouseMove() {}

  async initialize() {}

  update(timestamp) {
    let dashboard = this.dashboard
    dashboard.update(timestamp)
    if (dashboard.yes) {
      let client = this.client
      if (dashboard.column === 0) {
        client.openState('paint')
      } else if (dashboard.column === 1) {
        client.openState('maps')
      } else if (dashboard.column === 2) {
        client.openState('music')
      } else if (dashboard.column === 3) {
        client.openState('sfx')
      }
    } else if (dashboard.back) {
      this.client.openState('home')
    }
  }

  render() {
    const dashboard = this.dashboard
    if (!dashboard.doPaint) return

    const client = this.client
    const gl = client.gl
    const rendering = client.rendering
    const view = this.view
    const projection = this.projection
    const scale = dashboard.scale
    const width = client.width
    const height = client.height

    const fontScale = Math.floor(1.5 * scale)
    const fontWidth = fontScale * FONT_WIDTH
    const fontHeight = fontScale * FONT_HEIGHT

    gl.clearColor(darkgreyf(0), darkgreyf(1), darkgreyf(2), 1.0)

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

    // text
    rendering.setProgram(4)
    rendering.setView(0, 0, width, height)
    rendering.updateUniformMatrix('u_mvp', projection)

    let text = 'Scroll and Sigil Editor'
    let mainMenu = flexBox(fontWidth * text.length, fontHeight)
    mainMenu.bottomSpace = 4 * fontHeight
    mainMenu.funX = 'center'
    mainMenu.funY = '%'
    mainMenu.argY = 75
    flexSolve(width, height, mainMenu)
    drawTextSpecial(client.bufferGUI, mainMenu.x, mainMenu.y, text, fontScale, white0, white1, white2)

    if (dashboard.menu === 0) {
      text = 'Open'
      let optionOpen = flexBox(fontWidth * text.length, fontHeight)
      optionOpen.rightSpace = fontWidth
      optionOpen.funX = 'center'
      optionOpen.fromX = mainMenu
      optionOpen.funY = 'below'
      optionOpen.fromY = mainMenu
      flexSolve(width, height, optionOpen)
      drawTextSpecial(client.bufferGUI, optionOpen.x, optionOpen.y, text, fontScale, white0, white1, white2)

      text = 'Export'
      let optionExport = flexBox(fontWidth * text.length, fontHeight)
      optionExport.rightSpace = fontWidth
      optionExport.funX = 'align-left'
      optionExport.fromX = optionOpen
      optionExport.funY = 'below'
      optionExport.fromY = optionOpen
      flexSolve(width, height, optionExport)
      drawTextSpecial(client.bufferGUI, optionExport.x, optionExport.y, text, fontScale, white0, white1, white2)

      text = 'New'
      let optionNew = flexBox(fontWidth * text.length, fontHeight)
      optionNew.rightSpace = fontWidth
      optionNew.funX = 'align-left'
      optionNew.fromX = optionExport
      optionNew.funY = 'below'
      optionNew.fromY = optionExport
      flexSolve(width, height, optionNew)
      drawTextSpecial(client.bufferGUI, optionNew.x, optionNew.y, text, fontScale, white0, white1, white2)

      text = 'Copy'
      let optionCopy = flexBox(fontWidth * text.length, fontHeight)
      optionCopy.funX = 'align-left'
      optionCopy.fromX = optionNew
      optionCopy.funY = 'below'
      optionCopy.fromY = optionNew
      flexSolve(width, height, optionCopy)
      drawTextSpecial(client.bufferGUI, optionCopy.x, optionCopy.y, text, fontScale, white0, white1, white2)

      text = 'Back'
      let optionBack = flexBox(fontWidth * text.length, fontHeight)
      optionBack.funX = 'align-left'
      optionBack.fromX = optionCopy
      optionBack.funY = 'below'
      optionBack.fromY = optionCopy
      flexSolve(width, height, optionBack)
      drawTextSpecial(client.bufferGUI, optionBack.x, optionBack.y, text, fontScale, white0, white1, white2)

      text = '>'
      let indicator = flexBox(fontWidth * text.length, fontHeight)
      indicator.funX = 'left-of'
      indicator.funY = 'center'
      if (dashboard.column === 0) {
        indicator.fromX = optionOpen
        indicator.fromY = optionOpen
      } else if (dashboard.column === 1) {
        indicator.fromX = optionExport
        indicator.fromY = optionExport
      } else if (dashboard.column === 2) {
        indicator.fromX = optionNew
        indicator.fromY = optionNew
      } else if (dashboard.column === 3) {
        indicator.fromX = optionCopy
        indicator.fromY = optionCopy
      } else if (dashboard.column === 4) {
        indicator.fromX = optionBack
        indicator.fromY = optionBack
      }
      flexSolve(width, height, indicator)
      drawTextSpecial(client.bufferGUI, indicator.x, indicator.y, text, fontScale, white0, white1, white2)

      rendering.bindTexture(gl.TEXTURE0, textureByName('tic-80-wide-font').texture)
      rendering.updateAndDraw(client.bufferGUI)
    } else {
      text = 'Paint'
      let optionOpen = flexBox(fontWidth * text.length, fontHeight)
      optionOpen.rightSpace = fontWidth
      optionOpen.funX = 'center'
      optionOpen.fromX = mainMenu
      optionOpen.funY = 'below'
      optionOpen.fromY = mainMenu
      flexSolve(width, height, optionOpen)
      drawTextSpecial(client.bufferGUI, optionOpen.x, optionOpen.y, text, fontScale, white0, white1, white2)

      text = 'Maps'
      let optionExport = flexBox(fontWidth * text.length, fontHeight)
      optionExport.rightSpace = fontWidth
      optionExport.funX = 'align-left'
      optionExport.fromX = optionOpen
      optionExport.funY = 'below'
      optionExport.fromY = optionOpen
      flexSolve(width, height, optionExport)
      drawTextSpecial(client.bufferGUI, optionExport.x, optionExport.y, text, fontScale, white0, white1, white2)

      text = 'Music'
      let optionNew = flexBox(fontWidth * text.length, fontHeight)
      optionNew.rightSpace = fontWidth
      optionNew.funX = 'align-left'
      optionNew.fromX = optionExport
      optionNew.funY = 'below'
      optionNew.fromY = optionExport
      flexSolve(width, height, optionNew)
      drawTextSpecial(client.bufferGUI, optionNew.x, optionNew.y, text, fontScale, white0, white1, white2)

      text = 'Sound'
      let optionCopy = flexBox(fontWidth * text.length, fontHeight)
      optionCopy.funX = 'align-left'
      optionCopy.fromX = optionNew
      optionCopy.funY = 'below'
      optionCopy.fromY = optionNew
      flexSolve(width, height, optionCopy)
      drawTextSpecial(client.bufferGUI, optionCopy.x, optionCopy.y, text, fontScale, white0, white1, white2)

      text = 'Back'
      let optionBack = flexBox(fontWidth * text.length, fontHeight)
      optionBack.funX = 'align-left'
      optionBack.fromX = optionCopy
      optionBack.funY = 'below'
      optionBack.fromY = optionCopy
      flexSolve(width, height, optionBack)
      drawTextSpecial(client.bufferGUI, optionBack.x, optionBack.y, text, fontScale, white0, white1, white2)

      text = '>'
      let indicator = flexBox(fontWidth * text.length, fontHeight)
      indicator.funX = 'left-of'
      indicator.funY = 'center'
      if (dashboard.column === 0) {
        indicator.fromX = optionOpen
        indicator.fromY = optionOpen
      } else if (dashboard.column === 1) {
        indicator.fromX = optionExport
        indicator.fromY = optionExport
      } else if (dashboard.column === 2) {
        indicator.fromX = optionNew
        indicator.fromY = optionNew
      } else if (dashboard.column === 3) {
        indicator.fromX = optionCopy
        indicator.fromY = optionCopy
      } else if (dashboard.column === 4) {
        indicator.fromX = optionBack
        indicator.fromY = optionBack
      }
      flexSolve(width, height, indicator)
      drawTextSpecial(client.bufferGUI, indicator.x, indicator.y, text, fontScale, white0, white1, white2)

      rendering.bindTexture(gl.TEXTURE0, textureByName('tic-80-wide-font').texture)
      rendering.updateAndDraw(client.bufferGUI)
    }
  }
}
