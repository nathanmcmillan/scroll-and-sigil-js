let SocketConnection = null
let SocketQueue = []
let SocketSend = new DataView(new ArrayBuffer(128))
let SocketSendIndex = 1
let SocketSendSet = new Map()

class App {
  constructor(manager) {
    this.manager = manager

    let canvas = document.createElement('canvas')
    canvas.style.display = 'block'
    canvas.style.position = 'absolute'
    canvas.style.left = '0'
    canvas.style.right = '0'
    canvas.style.top = '0'
    canvas.style.bottom = '0'
    canvas.style.margin = 'auto'
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    let gl = canvas.getContext('webgl2')
    let g = new RenderSystem()

    gl.clearColor(0, 0, 0, 1)
    gl.depthFunc(gl.LEQUAL)
    gl.cullFace(gl.BACK)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.disable(gl.CULL_FACE)
    gl.disable(gl.BLEND)
    gl.disable(gl.DEPTH_TEST)

    this.on = true
    this.canvas = canvas
    this.gl = gl
    this.g = g
    this.screen = RenderBuffer.Init(gl, 2, 0, 0, 4, 6)
    this.frameScreen = RenderBuffer.Init(gl, 2, 0, 0, 4, 6)
    this.drawImages = RenderBuffer.Init(gl, 2, 0, 2, 400, 600)
    this.world = new World(g, gl)
    this.frame = null
    this.frame2 = null
    this.frameGeo = null
    this.camera = null
    this.state = new WorldState(this)

    document.onkeyup = Input.SetKeyUp
    document.onkeydown = Input.SetKeyDown
    document.onmouseup = Input.SetMouseUp
    document.onmousedown = Input.SetMouseDown
    document.onmousemove = Input.SetMouseMove

    // let self = this

    window.onblur = function () {
      // self.on = false
    }

    window.onfocus = function () {
      // self.on = true
    }
  }
  resize() {
    let gl = this.gl
    let canvas = this.canvas

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    let canvasOrtho = new Array(16)
    let drawOrtho = new Array(16)
    let drawPerspective = new Array(16)
    let drawInversePerspective = new Array(16)
    let drawInverseMv = new Array(16)
    let drawPreviousMvp = new Array(16)
    let drawCurrentToPreviousMvp = new Array(16)

    let drawFraction = 1.0
    let drawWidth = Math.floor(canvas.width / drawFraction)
    let drawHeight = Math.floor(canvas.height / drawFraction)
    let ratio = drawWidth / drawHeight
    let fov = 2 * Math.atan(Math.tan((60 * (Math.PI / 180)) / 2) / ratio) * (180 / Math.PI)

    Matrix.Orthographic(canvasOrtho, 0.0, canvas.width, 0.0, canvas.height, 0.0, 1.0)
    Matrix.Orthographic(drawOrtho, 0.0, drawWidth, 0.0, drawHeight, 0.0, 1.0)
    Matrix.Perspective(drawPerspective, fov, 0.01, 100.0, ratio)
    Matrix.Inverse(drawInversePerspective, drawPerspective)

    if (this.frame === null) {
      this.frame = FrameBuffer.Make(gl, drawWidth, drawHeight, [gl.RGB], [gl.RGB], [gl.UNSIGNED_BYTE], 'nearest', 'depth')
      this.frameGeo = FrameBuffer.Make(gl, drawWidth, drawHeight, [gl.RGB], [gl.RGB], [gl.UNSIGNED_BYTE], 'nearest', 'depth')
      this.frame2 = FrameBuffer.Make(gl, drawWidth, drawHeight, [gl.RGB], [gl.RGB], [gl.UNSIGNED_BYTE], 'nearest', 'depth')
    } else {
      this.frame.Resize(gl, drawWidth, drawHeight)
      this.frameGeo.Resize(gl, drawWidth, drawHeight)
      this.frame2.Resize(gl, drawWidth, drawHeight)
    }

    this.screen.Zero()
    Render.Screen(this.screen, 0, 0, canvas.width, canvas.height)
    RenderSystem.UpdateVao(gl, this.screen)

    this.frameScreen.Zero()
    Render.Screen(this.frameScreen, 0, 0, drawWidth, drawHeight)
    RenderSystem.UpdateVao(gl, this.frameScreen)

    this.canvasOrtho = canvasOrtho
    this.drawOrtho = drawOrtho
    this.drawPerspective = drawPerspective
    this.drawInversePerspective = drawInversePerspective
    this.drawInverseMv = drawInverseMv
    this.drawPreviousMvp = drawPreviousMvp
    this.drawCurrentToPreviousMvp = drawCurrentToPreviousMvp
  }
  async init() {
    let self = this
    let g = this.g
    let gl = this.gl

    let data = await Net.Request('wad')
    await Wad.Load(g, gl, data)

    SocketConnection = await Net.Socket('websocket')
    SocketConnection.binaryType = 'arraybuffer'

    SocketConnection.onclose = function () {
      SocketConnection = null
      self.on = false
      throw new Error('Lost connection to server')
    }

    let raw = await new Promise(function (resolve) {
      SocketConnection.onmessage = function (event) {
        resolve(event.data)
      }
    })

    SocketConnection.onmessage = function (event) {
      SocketQueue.push(event.data)
    }

    this.world.Load(raw)

    this.manager.init(this)
  }
  async run() {
    await this.init()
    let self = this
    window.onresize = function () {
      self.resize()
    }
    document.body.appendChild(this.canvas)
    this.resize()
    this.loop()
  }
  switch(state) {
    this.state = state
  }
  loop() {
    if (this.on) {
      this.state.update()
      this.state.render()
    }
    requestAnimationFrame(loop)
  }
}

function PlaySound(name) {
  let sound = Sounds[name]
  sound.pause()
  sound.volume = 0.25
  sound.currentTime = 0
  let promise = sound.play()
  if (promise) promise.then((_) => {}).catch((_) => {})
}
