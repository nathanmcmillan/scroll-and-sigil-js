import {drawText, drawImage, drawRectangle, drawLine, drawTriangle, FONT_WIDTH, FONT_HEIGHT} from '/src/render/render.js'
import {identity, multiply} from '/src/math/matrix.js'
import {textureByName} from '/src/assets/assets.js'
import {vectorSize, thingSize, DESCRIBE_MENU, DESCRIBE_TOOL, DESCRIBE_ACTION, DESCRIBE_OPTIONS, END_LINE, END_LINE_NEW_VECTOR} from '/src/editor/editor.js'

function mapX(x, zoom, camera) {
  return zoom * (x - camera.x)
}

function mapZ(z, zoom, camera) {
  return zoom * (z - camera.z)
}

function drawLineWithNormal(b, x1, y1, x2, y2, thickness, red, green, blue, alpha, zoom) {
  drawLine(b, x1, y1, x2, y2, thickness, red, green, blue, alpha)
  let midX = 0.5 * (x1 + x2)
  let midY = 0.5 * (y1 + y2)
  let normX = y1 - y2
  let normY = -(x1 - x2)
  let magnitude = Math.sqrt(normX * normX + normY * normY)
  normX /= magnitude
  normY /= magnitude
  drawLine(b, midX, midY, midX + normX * zoom, midY + normY * zoom, thickness, red, green, blue, alpha)
}

function mapRender(b, editor) {
  let zoom = editor.zoom
  let camera = editor.camera
  const alpha = 1.0
  const thickness = 1.0
  if (editor.viewLines) {
    for (const line of editor.lines) {
      let x1 = mapX(line.a.x, zoom, camera)
      let y1 = mapZ(line.a.y, zoom, camera)
      let x2 = mapX(line.b.x, zoom, camera)
      let y2 = mapZ(line.b.y, zoom, camera)
      drawLineWithNormal(b, x1, y1, x2, y2, thickness, 1.0, 1.0, 1.0, alpha, zoom)
    }
  }
  if (editor.viewVecs) {
    const size = vectorSize(zoom)
    for (const vec of editor.vecs) {
      let x = Math.floor(mapX(vec.x, zoom, camera))
      let y = Math.floor(mapZ(vec.y, zoom, camera))
      if (vec == editor.selectedVec) drawRectangle(b, x - size, y - size, 2.0 * size, 2.0 * size, 1.0, 0.0, 1.0, alpha)
      else drawRectangle(b, x - size, y - size, 2.0 * size, 2.0 * size, 1.0, 0.0, 0.0, alpha)
    }
  }
  if (editor.viewThings) {
    for (const thing of editor.things) {
      let x = Math.floor(mapX(thing.x, zoom, camera))
      let y = Math.floor(mapZ(thing.z, zoom, camera))
      let size = thingSize(thing, zoom)
      drawRectangle(b, x - size, y - size, 2.0 * size, 2.0 * size, 0.0, 1.0, 0.0, alpha)
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
    const vec = editor.selectedVec
    let x = zoom * (vec.x - camera.x)
    let y = zoom * (vec.y - camera.z)
    drawLineWithNormal(client.bufferColor, x, y, editor.cursor.x, editor.cursor.y, thickness, 1.0, 1.0, 0.0, alpha, zoom)
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
    let x = 10.0
    let y = client.height - 10.0 - 2.0 * FONT_HEIGHT
    for (let i = 0; i < DESCRIBE_TOOL.length; i++) {
      const option = DESCRIBE_TOOL[i]
      if (i == editor.tool) drawTextSpecial(client.bufferGUI, x, y, option, 2.0, 1.0, 1.0, 0.0)
      else drawTextSpecial(client.bufferGUI, x, y, option, 2.0, 1.0, 0.0, 0.0)
      y -= 2.5 * FONT_HEIGHT
    }
  }

  if (editor.menuActive) {
    let x = 10.0
    let y = client.height - 10.0 - 2.0 * FONT_HEIGHT
    for (const option of DESCRIBE_MENU) {
      drawTextSpecial(client.bufferGUI, x, y, option, 2.0, 1.0, 1.0, 1.0)
      y -= 2.5 * FONT_HEIGHT
    }
  }

  const options = DESCRIBE_OPTIONS[editor.action]
  let x = 10.0
  for (const [button, option] of options) {
    let text = '(' + state.keys.reversed(button) + ') ' + DESCRIBE_ACTION[option]
    drawTextSpecial(client.bufferGUI, x, 10.0, text, 2.0, 1.0, 0.0, 0.0)
    x += 2.0 * FONT_WIDTH * (text.length + 1)
  }

  rendering.bindTexture(gl.TEXTURE0, textureByName('font').texture)
  rendering.updateAndDraw(client.bufferGUI)
}
