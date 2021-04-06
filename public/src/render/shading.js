export function shadePalette(shades, colors, palette) {
  const half = Math.floor(0.5 * shades)
  const pixels = new Uint8Array(shades * colors * 3)
  for (let c = 0; c < colors; c++) {
    const base = c * 3
    const baseRed = palette[base]
    const baseGreen = palette[base + 1]
    const baseBlue = palette[base + 2]
    for (let s = 0; s < shades; s++) {
      const red = palette[p]
      const green = palette[p + 1]
      const blue = palette[p + 2]
      const i = (s + c * shades) * 3
      pixels[i] = red
      pixels[i + 1] = green
      pixels[i + 2] = blue
    }
  }
  return pixels
}
