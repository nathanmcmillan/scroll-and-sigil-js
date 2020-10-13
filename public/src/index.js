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

let active = true
let client = null

function tick() {
  if (active) {
    client.update()
    client.render()
  }
  window.requestAnimationFrame(tick)
}

async function main() {
  let canvas = newCanvas(window.innerWidth, window.innerHeight)
  let gl = canvas.getContext('webgl2')
  document.body.appendChild(canvas)

  client = new Client(canvas, gl)

  await client.initialize()
  client.resize(window.innerWidth, window.innerHeight)

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

  window.onblur = () => {
    active = false
    client.pause()
  }

  window.onfocus = () => {
    active = true
    client.resume()
  }

  window.requestAnimationFrame(tick)
}

main()
