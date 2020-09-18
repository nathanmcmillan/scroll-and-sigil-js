const SpriteScale = 1.0 / 64.0

class Sprite {
  constructor(atlas, width, height, left, top, right, bottom, ox, oy) {
    this.atlas = atlas
    this.width = width
    this.half_width = width * 0.5
    this.height = height
    this.left = left
    this.top = top
    this.right = right
    this.bottom = bottom
    this.ox = ox
    this.oy = oy
  }
  static Simple(left, top, width, height, atlas_width, atlas_height) {
    return [left * atlas_width, top * atlas_height, (left + width) * atlas_width, (top + height) * atlas_height]
  }
  static Build(atlas, atlas_width, atlas_height) {
    let left = atlas[0] * atlas_width
    let top = atlas[1] * atlas_height
    let right = (atlas[0] + atlas[2]) * atlas_width
    let bottom = (atlas[1] + atlas[3]) * atlas_height

    let width = atlas[2]
    let height = atlas[3]

    let ox = 0
    let oy = 0
    if (atlas.length > 4) {
      ox = atlas[4]
      oy = atlas[5]
    }

    return new Sprite(atlas, width, height, left, top, right, bottom, ox, oy)
  }
  static Build3(atlas, atlas_width, atlas_height) {
    let left = atlas[0] * atlas_width
    let top = atlas[1] * atlas_height
    let right = (atlas[0] + atlas[2]) * atlas_width
    let bottom = (atlas[1] + atlas[3]) * atlas_height

    let width = atlas[2] * SpriteScale
    let height = atlas[3] * SpriteScale

    let ox = 0
    let oy = 0
    if (atlas.length > 4) {
      ox = atlas[4] * SpriteScale
      oy = atlas[5] * SpriteScale
    }

    return new Sprite(atlas, width, height, left, top, right, bottom, ox, oy)
  }
  static Copy(sprite, ox, oy) {
    return new Sprite(sprite.atlas, sprite.width, sprite.height, sprite.left, sprite.top, sprite.right, sprite.bottom, ox, oy)
  }
}
