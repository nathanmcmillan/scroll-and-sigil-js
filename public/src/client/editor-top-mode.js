import {drawText, drawImage, drawLine, drawTriangle, FONT_WIDTH, FONT_HEIGHT} from '/src/render/render.js'
import {identity, multiply} from '/src/math/matrix.js'
import {textureByName} from '/src/assets/assets.js'

function sectorRender(b, sector, editor) {
  let zoom = editor.zoom
  let camera = editor.camera
  let red = 0.5
  let green = 0.5
  let blue = 0.5
  const alpha = 1.0
  for (const triangle of sector.triangles) {
    let x1 = zoom * (triangle.a.x + camera.x)
    let y1 = zoom * (triangle.a.y + camera.z)
    let x2 = zoom * (triangle.b.x + camera.x)
    let y2 = zoom * (triangle.b.y + camera.z)
    let x3 = zoom * (triangle.c.x + camera.x)
    let y3 = zoom * (triangle.c.y + camera.z)
    drawTriangle(b, x1, y1, x2, y2, x3, y3, red, green, blue, alpha)
  }
  const thickness = 1.0
  red = 1.0
  green = 1.0
  blue = 1.0
  for (const line of sector.lines) {
    let x1 = zoom * (line.a.x + camera.x)
    let y1 = zoom * (line.a.y + camera.z)
    let x2 = zoom * (line.b.x + camera.x)
    let y2 = zoom * (line.b.y + camera.z)
    drawLine(b, x1, y1, x2, y2, thickness, red, green, blue, alpha)
  }
}

function drawTextSpecial(b, x, y, text, scale, red, green, blue) {
  drawText(b, x + scale, y - scale, text, scale, 0.0, 0.0, 0.0, 1.0)
  drawText(b, x, y, text, scale, red, green, blue, 1.0)
}

export function renderEditorTopMode(state) {
  const editor = state.editor
  const client = state.client
  const gl = client.gl
  const rendering = client.rendering

  gl.clear(gl.COLOR_BUFFER_BIT)
  gl.clear(gl.DEPTH_BUFFER_BIT)

  gl.disable(gl.CULL_FACE)
  gl.disable(gl.DEPTH_TEST)

  let view = new Array(16)
  let projection = new Array(16)

  rendering.setProgram(0)
  rendering.setView(0, 0, client.width, client.height)

  identity(view)
  multiply(projection, client.orthographic, view)
  rendering.updateUniformMatrix('u_mvp', projection)

  let world = client.game.world

  client.bufferColor.zero()
  for (const sector of world.sectors) {
    sectorRender(client.bufferColor, sector, editor)
  }
  rendering.updateAndDraw(client.bufferColor)

  rendering.setProgram(1)
  rendering.setView(0, 0, client.width, client.height)

  identity(view)
  multiply(projection, client.orthographic, view)
  rendering.updateUniformMatrix('u_mvp', projection)

  client.bufferGUI.zero()
  let cursor = textureByName('cursor')
  drawImage(client.bufferGUI, editor.cursor.x, editor.cursor.y, cursor.width, cursor.height, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0)
  rendering.bindTexture(gl.TEXTURE0, cursor.texture)
  rendering.updateAndDraw(client.bufferGUI)

  client.bufferGUI.zero()
  drawTextSpecial(client.bufferGUI, 10.0, 10.0, 'Place vector', 2.0, 1.0, 0.0, 0.0)

  drawTextSpecial(client.bufferGUI, 10.0, client.height - FONT_HEIGHT * 2.0 - 10.0, 'Open', 2.0, 1.0, 1.0, 1.0)
  drawTextSpecial(client.bufferGUI, 10.0 + 'Open '.length * FONT_WIDTH * 2.0, client.height - FONT_HEIGHT * 2.0 - 10.0, 'Save', 2.0, 1.0, 1.0, 1.0)

  rendering.bindTexture(gl.TEXTURE0, textureByName('font').texture)
  rendering.updateAndDraw(client.bufferGUI)
}
