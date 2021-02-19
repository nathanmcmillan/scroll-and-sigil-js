import {VGA_FONT, EGA_FONT, DINA_FONT, TIC_FONT, SUPER_TITLE_FONT, SUPER_FONT, SUPER_OUTLINE_FONT} from '../render/render.js'

export function defaultFont() {
  return SUPER_OUTLINE_FONT
}

export function calcFontScale(scale) {
  return Math.floor(scale * 1.5)
}

export function calcFontPad(fontHeight) {
  return Math.floor(0.4 * fontHeight)
}

export function calcThickness(scale) {
  return 2 * scale
}

export function calcTopBarHeight(scale) {
  return (defaultFont().base + 2) * calcFontScale(scale)
}

export function calcBottomBarHeight(scale) {
  return (defaultFont().base + 2) * calcFontScale(scale)
}

export function calcLongest(list) {
  let high = list[0].length
  for (let i = 1; i < list.length; i++) {
    let len = list[i].length
    if (len > high) high = len
  }
  return high
}
