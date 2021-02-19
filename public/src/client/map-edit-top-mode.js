import {drawRectangle, drawLine, drawTriangle, drawTextFontSpecial} from '../render/render.js'
import {spr} from '../render/pico.js'
import {identity, multiply} from '../math/matrix.js'
import {textureByName} from '../assets/assets.js'
import {vectorSize, thingSize, SECTOR_TOOL, OPTION_END_LINE, OPTION_END_LINE_NEW_VECTOR} from '../editor/maps.js'
import {colorf, blackf, darkgreyf, yellowf, whitef, greenf, redf, white0f, white1f, white2f} from '../editor/palette.js'
import {renderTouch} from '../client/render-touch.js'
import {defaultFont, calcFontScale, calcTopBarHeight, calcBottomBarHeight} from '../editor/editor-util.js'
import {renderDialogBox, renderTextBox, renderStatus} from '../client/client-util.js'

function mapX(x, zoom, camera) {
  return zoom * (x - camera.x)
}

function mapZ(z, zoom, camera) {
  return zoom * (z - camera.z)
}

function drawLineWithNormal(b, x1, y1, x2, y2, thickness, red, green, blue, alpha, zoom, normal) {
  drawLine(b, x1, y1, x2, y2, thickness, red, green, blue, alpha)
  if (!normal) return
  let midX = 0.5 * (x1 + x2)
  let midY = 0.5 * (y1 + y2)
  let normX = -(y1 - y2)
  let normY = x1 - x2
  let magnitude = Math.sqrt(normX * normX + normY * normY)
  normX /= magnitude
  normY /= magnitude
  zoom *= 0.25
  drawLine(b, midX, midY, midX + normX * zoom, midY + normY * zoom, thickness, red, green, blue, alpha)
}

function mapRender(b, maps) {
  let zoom = maps.zoom
  let camera = maps.camera
  const alpha = 1.0
  const thickness = 1.0
  if (maps.viewSectors && maps.tool === SECTOR_TOOL) {
    let seed = 0
    for (const sector of maps.sectors) {
      for (const triangle of sector.view) {
        let x1 = mapX(triangle.a.x, zoom, camera)
        let y1 = mapZ(triangle.a.y, zoom, camera)
        let x2 = mapX(triangle.b.x, zoom, camera)
        let y2 = mapZ(triangle.b.y, zoom, camera)
        let x3 = mapX(triangle.c.x, zoom, camera)
        let y3 = mapZ(triangle.c.y, zoom, camera)
        seed++
        if (seed == 5) seed++
        else if (seed === 15) seed = 0
        if (sector == maps.selectedSector) drawTriangle(b, x1, y1, x2, y2, x3, y3, blackf(0), blackf(1), blackf(2), alpha)
        else drawTriangle(b, x1, y1, x2, y2, x3, y3, colorf(seed, 0), colorf(seed, 1), colorf(seed, 2), alpha)
      }
    }
  }
  if (maps.viewLines) {
    let normal = maps.viewLineNormals
    for (const line of maps.lines) {
      let x1 = mapX(line.a.x, zoom, camera)
      let y1 = mapZ(line.a.y, zoom, camera)
      let x2 = mapX(line.b.x, zoom, camera)
      let y2 = mapZ(line.b.y, zoom, camera)
      if (line == maps.selectedLine) drawLineWithNormal(b, x1, y1, x2, y2, thickness, greenf(0), greenf(1), greenf(2), alpha, zoom, normal)
      else drawLineWithNormal(b, x1, y1, x2, y2, thickness, whitef(0), whitef(1), whitef(2), alpha, zoom, normal)
    }
  }
  if (maps.viewVecs) {
    const size = vectorSize(zoom)
    for (const vec of maps.vecs) {
      let x = Math.floor(mapX(vec.x, zoom, camera))
      let y = Math.floor(mapZ(vec.y, zoom, camera))
      if (vec === maps.selectedVec || vec === maps.selectedSecondVec) drawRectangle(b, x - size, y - size, 2.0 * size, 2.0 * size, greenf(0), greenf(1), greenf(2), alpha)
      else drawRectangle(b, x - size, y - size, 2.0 * size, 2.0 * size, redf(0), redf(1), redf(2), alpha)
    }
  }
  if (maps.viewThings) {
    for (const thing of maps.things) {
      let x = Math.floor(mapX(thing.x, zoom, camera))
      let y = Math.floor(mapZ(thing.z, zoom, camera))
      let size = thingSize(thing, zoom)
      if (thing == maps.selectedThing) drawRectangle(b, x - size, y - size, 2.0 * size, 2.0 * size, yellowf(0), yellowf(1), yellowf(2), alpha)
      else drawRectangle(b, x - size, y - size, 2.0 * size, 2.0 * size, greenf(0), greenf(1), greenf(2), alpha)
    }
  }
}

export function renderMapEditTopMode(state) {
  const maps = state.maps
  if (!maps.doPaint) return

  const client = state.client
  const gl = client.gl
  const rendering = client.rendering
  const view = state.view
  const projection = state.projection
  const scale = maps.scale
  const width = client.width
  const height = client.height - client.top

  if (client.touch) renderTouch(client.touchRender)

  rendering.setProgram(0)
  rendering.setView(0, client.top, width, height)

  gl.clearColor(darkgreyf(0), darkgreyf(1), darkgreyf(2), 1.0)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  gl.disable(gl.CULL_FACE)
  gl.disable(gl.DEPTH_TEST)

  identity(view)
  multiply(projection, client.orthographic, view)
  rendering.updateUniformMatrix('u_mvp', projection)

  client.bufferColor.zero()

  mapRender(client.bufferColor, maps)

  if (maps.action == OPTION_END_LINE || maps.action == OPTION_END_LINE_NEW_VECTOR) {
    const thickness = 1.0
    const zoom = maps.zoom
    const camera = maps.camera
    const vec = maps.selectedVec
    let x = zoom * (vec.x - camera.x)
    let y = zoom * (vec.y - camera.z)
    drawLineWithNormal(client.bufferColor, x, y, maps.cursor.x, maps.cursor.y, thickness, yellowf(0), yellowf(1), yellowf(2), 1.0, zoom, maps.viewLineNormals)
  }

  // top and bottom bar

  const topBarHeight = calcTopBarHeight(scale)
  drawRectangle(client.bufferColor, 0, height - topBarHeight, width, topBarHeight, redf(0), redf(1), redf(2), 1.0)

  const bottomBarHeight = calcBottomBarHeight(scale)
  drawRectangle(client.bufferColor, 0, 0, width, bottomBarHeight, redf(0), redf(1), redf(2), 1.0)

  rendering.updateAndDraw(client.bufferColor)

  rendering.setProgram(4)
  rendering.setView(0, client.top, width, height)
  rendering.updateUniformMatrix('u_mvp', projection)

  client.bufferGUI.zero()

  const font = defaultFont()
  const fontScale = calcFontScale(scale)
  const fontWidth = fontScale * font.width

  //  status text

  renderStatus(client, width, height, font, fontWidth, fontScale, topBarHeight, maps)

  rendering.bindTexture(gl.TEXTURE0, textureByName(font.name).texture)
  rendering.updateAndDraw(client.bufferGUI)

  // dialog box, text box, or cursor

  if (maps.dialog != null) {
    renderDialogBox(state, scale, font, maps.dialog)
  } else if (maps.askName) {
    const box = maps.textBox
    renderTextBox(state, scale, font, box, 200, 200)

    client.bufferGUI.zero()
    drawTextFontSpecial(client.bufferGUI, 200, 500, maps.name, fontScale, white0f, white1f, white2f, font)
    rendering.updateAndDraw(client.bufferGUI)
  } else {
    rendering.setProgram(3)
    rendering.setView(0, client.top, width, height)
    rendering.updateUniformMatrix('u_mvp', projection)

    client.bufferGUI.zero()
    const cursor = textureByName('editor-sprites')
    const cursorSize = 8 * scale
    spr(client.bufferGUI, 9, 1.0, 1.0, maps.cursor.x, maps.cursor.y - cursorSize, cursorSize, cursorSize)
    rendering.bindTexture(gl.TEXTURE0, cursor.texture)
    rendering.updateAndDraw(client.bufferGUI)
  }
}
