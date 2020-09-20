import {Client} from '/src/client/client.js'

function newCanvas(width, height) {
  let canvas = document.createElement('canvas')
  canvas.style.display = 'block'
  canvas.style.position = 'absolute'
  canvas.style.left = '0'
  canvas.style.right = '0'
  canvas.style.top = '0'
  canvas.style.bottom = '0'
  canvas.style.margin = 'auto'
  canvas.width = width
  canvas.height = height
  return canvas
}

async function main() {
  let canvas = newCanvas(window.innerWidth, window.innerHeight)
  let gl = canvas.getContext('webgl2')
  document.body.appendChild(canvas)

  let client = new Client(canvas, gl)

  document.onkeyup = (event) => {
    client.keyUp(event)
  }

  document.onkeydown = (event) => {
    client.keyDown(event)
  }

  document.onmouseup = (event) => {
    client.mouseUp(event)
  }

  document.onmousedown = (event) => {
    client.mouseDown(event)
  }

  document.onmousemove = (event) => {
    client.mouseMove(event)
  }

  window.onresize = () => {
    client.resize(window.innerWidth, window.innerHeight)
  }

  let active = true

  window.onblur = () => {
    console.log('pause')
    active = false
  }

  window.onfocus = () => {
    console.log('continue')
    active = true
  }

  await client.initialize()
  client.resize(window.innerWidth, window.innerHeight)

  let tick = () => {
    if (active) {
      client.update()
      client.render()
    }
    window.requestAnimationFrame(tick)
  }

  window.requestAnimationFrame(tick)
}

main()
