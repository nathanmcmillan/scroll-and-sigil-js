import { closestInPalette } from '../editor/palette.js'

export function shadePalette(shades, colors, palette) {
  const pixels = new Uint8Array(shades * colors * 3)
  for (let c = 0; c < colors; c++) {
    const base = c * 3
    const red = palette[base]
    const green = palette[base + 1]
    const blue = palette[base + 2]
    for (let s = 0; s < shades; s++) {
      // const light = (2 * s - shades) / shades
      const light = s / shades
      // const close = closestInPalette(palette, Math.floor(red * light), Math.floor(green * light), Math.floor(blue * light))
      // const close = closestInPalette(palette, (red / 255.0) * light, (green / 255.0) * light, (blue / 255.0) * light)
      const close = closestInPalette(palette, red * light, green * light, blue * light)
      const p = (s + c * shades) * 3
      if (true) {
        pixels[p] = palette[close]
        pixels[p + 1] = palette[close + 1]
        pixels[p + 2] = palette[close + 2]
      } else {
        pixels[p] = Math.floor(red * light)
        pixels[p + 1] = Math.floor(green * light)
        pixels[p + 2] = Math.floor(blue * light)
      }
    }
  }
  return pixels
}
