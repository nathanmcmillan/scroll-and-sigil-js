import {drawText, drawImage, drawRectangle, drawLine, drawTriangle, FONT_HEIGHT} from '/src/render/render.js'
import {identity, multiply} from '/src/math/matrix.js'
import {textureByName} from '/src/assets/assets.js'
import {vectorSize, DESCRIBE_MENU, DESCRIBE_TOOL, NO_ACTION, DESCRIBE_ACTION, END_LINE, END_LINE_NEW_VECTOR} from '/src/editor/editor.js'

function mapRender(b, editor) {
  let zoom = editor.zoom
  let camera = editor.camera
  const size = vectorSize(zoom)
  const alpha = 1.0
  const thickness = 1.0
  if (editor.viewLines) {
    for (const line of editor.lines) {
      let x1 = zoom * (line.a.x - camera.x)
      let y1 = zoom * (line.a.y - camera.z)
      let x2 = zoom * (line.b.x - camera.x)
      let y2 = zoom * (line.b.y - camera.z)
      drawLine(b, x1, y1, x2, y2, thickness, 1.0, 1.0, 1.0, alpha)
    }
  }
  if (editor.viewVecs) {
    for (const vec of editor.vecs) {
      let x = Math.floor(zoom * (vec.x - camera.x))
      let y = Math.floor(zoom * (vec.y - camera.z))
      if (vec == editor.selectedVec) drawRectangle(b, x - size, y - size, 2.0 * size, 2.0 * size, 1.0, 0.0, 1.0, alpha)
      else drawRectangle(b, x - size, y - size, 2.0 * size, 2.0 * size, 1.0, 0.0, 0.0, alpha)
    }
  }
}

function sectorRender(b, sector, editor) {
  let zoom = editor.zoom
  let camera = editor.camera
  let red = 0.5
  let green = 0.5
  let blue = 0.5
  const alpha = 1.0
  if (editor.viewSectors) {
    for (const triangle of sector.triangles) {
      let x1 = zoom * (triangle.a.x - camera.x)
      let y1 = zoom * (triangle.a.y - camera.z)
      let x2 = zoom * (triangle.b.x - camera.x)
      let y2 = zoom * (triangle.b.y - camera.z)
      let x3 = zoom * (triangle.c.x - camera.x)
      let y3 = zoom * (triangle.c.y - camera.z)
      drawTriangle(b, x1, y1, x2, y2, x3, y3, red, green, blue, alpha)
    }
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
  mapRender(client.bufferColor, editor)
  if (editor.action == END_LINE || editor.action == END_LINE_NEW_VECTOR) {
    const thickness = 1.0
    const alpha = 1.0
    const zoom = editor.zoom
    const camera = editor.camera
    const a = editor.selectedVec
    let x1 = zoom * (a.x - camera.x)
    let y1 = zoom * (a.y - camera.z)
    let x2 = zoom * -camera.x + editor.cursor.x
    let y2 = zoom * -camera.z + editor.cursor.y
    drawLine(client.bufferColor, x1, y1, x2, y2, thickness, 1.0, 1.0, 0.0, alpha)
  }

  rendering.updateAndDraw(client.bufferColor)

  rendering.setProgram(1)
  rendering.setView(0, 0, client.width, client.height)

  identity(view)
  multiply(projection, client.orthographic, view)
  rendering.updateUniformMatrix('u_mvp', projection)

  client.bufferGUI.zero()
  let cursor = textureByName('cursor')
  drawImage(client.bufferGUI, editor.cursor.x - 0.5 * cursor.width, editor.cursor.y - cursor.height, cursor.width, cursor.height, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0)
  rendering.bindTexture(gl.TEXTURE0, cursor.texture)
  rendering.updateAndDraw(client.bufferGUI)

  client.bufferGUI.zero()

  if (editor.toolSelectionActive) {
    let x = Math.floor(0.5 * client.width)
    let y = Math.floor(0.5 * client.height)
    for (let i = 0; i < DESCRIBE_TOOL.length; i++) {
      const option = DESCRIBE_TOOL[i]
      if (i == editor.tool) drawTextSpecial(client.bufferGUI, x, y, option, 2.0, 1.0, 1.0, 0.0)
      else drawTextSpecial(client.bufferGUI, x, y, option, 2.0, 1.0, 0.0, 0.0)
      y -= 2.0 * FONT_HEIGHT
    }
  }

  if (editor.menuActive) {
    let x = Math.floor(0.5 * client.width)
    let y = Math.floor(0.5 * client.height)
    for (const option of DESCRIBE_MENU) {
      drawTextSpecial(client.bufferGUI, x, y, option, 2.0, 1.0, 1.0, 1.0)
      y -= 2.0 * FONT_HEIGHT
    }
  }

  if (editor.action === NO_ACTION) {
    drawTextSpecial(client.bufferGUI, 10.0, client.height - 10.0 - 2.0 * FONT_HEIGHT, DESCRIBE_TOOL[editor.tool], 2.0, 1.0, 0.0, 0.0)
  } else {
    drawTextSpecial(client.bufferGUI, 10.0, client.height - 10.0 - 2.0 * FONT_HEIGHT, DESCRIBE_ACTION[editor.action], 2.0, 1.0, 0.0, 0.0)
  }

  rendering.bindTexture(gl.TEXTURE0, textureByName('font').texture)
  rendering.updateAndDraw(client.bufferGUI)
}
