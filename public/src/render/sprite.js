export class Sprite {
  constructor(left, top, width, height, offsetX, offsetY, atlasInverseWidth, atlasInverseHeight, scale) {
    this.left = left * atlasInverseWidth
    this.top = left * atlasInverseHeight
    this.right = (left + width) * atlasInverseWidth
    this.bottom = (top + height) * atlasInverseHeight
    this.width = width * scale
    this.height = height * scale
    this.halfWidth = width * scale * 0.5
    this.offsetX = offsetX * scale
    this.offsetY = offsetY * scale
  }
}
