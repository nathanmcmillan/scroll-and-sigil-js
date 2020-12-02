class FlexBox {
  constructor() {
    this.width = 0
    this.height = 0
    this.topSpace = 0
    this.bottomSpace = 0
    this.leftSpace = 0
    this.rightSpace = 0
    this.funX = null
    this.funY = null
    this.argX = null
    this.argY = null
    this.fromX = null
    this.fromY = null
    this.x = 0
    this.y = 0
  }
}

export function flexBox(width = 0, height = 0) {
  let flex = new FlexBox()
  flex.width = width
  flex.height = height
  return flex
}

export function flexSolve(width, height, flex) {
  let funX = flex.funX
  if (funX) {
    if (funX === 'center') {
      if (flex.fromX) {
        flex.x = Math.floor(flex.fromX.x + 0.5 * flex.fromX.width - 0.5 * flex.width)
      } else {
        flex.x = Math.floor(0.5 * width - 0.5 * flex.width)
      }
    } else if (funX === 'left-of') {
      flex.x = flex.fromX.x - flex.fromX.leftSpace - flex.width
    } else if (funX === 'right-of') {
      flex.x = flex.fromX.x + flex.fromX.width + flex.fromX.rightSpace
    } else if (funX === '%') {
      flex.x = Math.floor((parseFloat(flex.argX) / 100.0) * width)
    }
  } else {
    flex.x = parseFloat(flex.argX)
  }

  let funY = flex.funY
  if (funY) {
    if (funY === 'center') {
      if (flex.fromY) {
        flex.y = Math.floor(flex.fromY.y + 0.5 * flex.fromY.height - 0.5 * flex.height)
      } else {
        flex.y = Math.floor(0.5 * height - 0.5 * flex.height)
      }
    } else if (funY === 'above') {
      flex.y = flex.fromY.y + flex.fromY.topSpace + flex.height
    } else if (funY === 'below') {
      flex.y = flex.fromY.y - flex.fromY.height - flex.fromY.bottomSpace
    } else if (funY === '%') {
      flex.y = Math.floor((parseFloat(flex.argY) / 100.0) * height)
    }
  } else {
    flex.y = parseFloat(flex.argY)
  }

  return flex
}
