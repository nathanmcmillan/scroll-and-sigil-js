import { textureByName } from '../assets/assets.js'
import { renderTouch } from '../client/render-touch.js'
import { calcFontScale } from '../editor/editor-util.js'
import { blackf, whitef } from '../editor/palette.js'
import { flexSolve, flexText } from '../gui/flex.js'
import { identity, multiply } from '../math/matrix.js'
import { drawTextSpecial, TIC_FONT_HEIGHT, TIC_FONT_WIDTH } from '../render/render.js'
import { bufferZero } from '../webgl/buffer.js'
import { rendererBindTexture, rendererSetProgram, rendererSetView, rendererUpdateAndDraw, rendererUpdateUniformMatrix } from '../webgl/renderer.js'

export function renderLoadingInProgress(client, view, projection) {
  const gl = client.gl
  const rendering = client.rendering
  const width = client.width
  const height = client.height - client.top
  const scale = client.scale

  if (client.touch) renderTouch(client.touchRender)

  const fontScale = calcFontScale(scale)
  const fontWidth = fontScale * TIC_FONT_WIDTH
  const fontHeight = fontScale * TIC_FONT_HEIGHT

  rendererSetProgram(rendering, 'texture2d-font')
  rendererSetView(rendering, 0, client.top, width, height)
  rendererUpdateUniformMatrix(rendering, 'u_mvp', projection)

  gl.clearColor(blackf(0), blackf(1), blackf(2), 1.0)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  identity(view)
  multiply(projection, client.orthographic, view)
  rendererUpdateUniformMatrix(rendering, 'u_mvp', projection)

  bufferZero(client.bufferGUI)

  const text = 'Loading. Please wait...'
  const box = flexText(text, fontWidth * text.length, fontHeight)
  box.funX = 'center'
  box.funY = 'center'
  flexSolve(width, height, box)

  drawTextSpecial(client.bufferGUI, box.x, box.y, box.text, fontScale, whitef(0), whitef(1), whitef(2))

  rendererBindTexture(rendering, gl.TEXTURE0, textureByName('tic-80-wide-font').texture)
  rendererUpdateAndDraw(rendering, client.bufferGUI)
}
