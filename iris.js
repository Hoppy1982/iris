//Define individual irises in this array.
//WrapperId is mandatory but the following options are optional,
//defaults applied in the class constructor if omitted here:
// - primaryColor (implemented)
// - toggleCmd
// - startsOpen
// - speed
// - loop ?
// - nSegments ?
// - clockwise ?


const irisOptions = [
  {
    wrapperId: 'iris-wrapper-1',
    maxRot: 0.3
  },
  {
    wrapperId: 'iris-wrapper-2',
    primaryColor: '#00ff00',
    nSegments: 16,
    maxRot: 0.35,
    initialSpeed: 0.001
  },
  {
    wrapperId: 'iris-wrapper-3',
    primaryColor: '#008888',
    nSegments: 32,
    initialSpeed: 0.0006
  }
]


//Array to hold the Iris objects - populated automatically, leave empty.
const irises = []


//Initialization
document.addEventListener('DOMContentLoaded', function(event) {
    console.log('DOM loaded..')
    createIrises()
})


window.addEventListener('resize', function() {
  irises.forEach( iris => {
    iris.resizeCanvas()
    iris.clearFrame()
    iris.initBoundingCircle()
    iris.initSegments()
    iris.renderBoundingCircle()
    iris.renderSegments()
  })
})


function createIrises() {
  irisOptions.forEach(irisOption => {
    irises.push(new Iris(irisOption))
  })

  irises.forEach(iris => {
    iris.resizeCanvas()
    iris.clearFrame()
    iris.initBoundingCircle()
    iris.initSegments()
    iris.renderBoundingCircle()
    iris.renderSegments()
  })
}


//Class Defination
class Iris {
  constructor({
      wrapperId,
      primaryColor = '#0000ff',
      nSegments = 8,
      maxRot = 0.3,
      initialSpeed = 0.002
    }) {
    this.wrapperId = wrapperId
    this.primaryColor = primaryColor
    this.nSegments = nSegments
    this.maxRot = maxRot
    this.initialSpeed = initialSpeed
    this.speed = initialSpeed
    this.rot = 0
    this.wrapper = document.getElementById(this.wrapperId)
    this.canvas = document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d')
    this.wrapper.appendChild(this.canvas)
    this.wrapperWidth = this.wrapper.clientWidth
    this.canvas.width = this.wrapperWidth
    this.canvas.height = this.wrapperWidth
    this.boundingCircle = []
    this.segments = []
    this.frameNum
    this.isPaused = false
    this.currentAni
    this.shouldLoop = false
    
    this.initBoundingCircle = this.initBoundingCircle.bind(this)
    this.initSegments = this.initSegments.bind(this)
    this.resizeCanvas = this.resizeCanvas.bind(this)
    this.renderAll = this.renderAll.bind(this)
    this.clearFrame = this.clearFrame.bind(this)
    this.renderBoundingCircle = this.renderBoundingCircle.bind(this)
    this.renderSegments = this.renderSegments.bind(this)
    this.open = this.open.bind(this)
    this.close = this.close.bind(this)
    this.loop = this.loop.bind(this)
    this.stopLoop = this.stopLoop.bind(this)
    this.pause = this.pause.bind(this)
    this.unPause = this.unPause.bind(this)
    this.togglePause = this.togglePause.bind(this)
  }

  initBoundingCircle() {
    this.boundingCircle = []
    let radius = this.wrapperWidth / 2
    let xCenter = this.wrapperWidth / 2
    let yCenter = this.wrapperWidth / 2
    let segmentAngle = (Math.PI * 2) / this.nSegments

    for (let i=0; i<this.nSegments; i++) {
      let x = (Math.cos(i*segmentAngle) * radius) + xCenter
      let y = (Math.sin(i*segmentAngle) * radius) + yCenter
      this.boundingCircle.push({x: x, y: y})
    }
  }

  initSegments() {//maybe a segments should have their own class?
    this.segments = []
    for (let i=0; i<this.nSegments; i++) {
      let j = i+1
      if (j == this.nSegments) {j = 0}
      let p1 = {x: this.wrapperWidth / 2, y: this.wrapperWidth / 2}
      let p2 = {x: this.boundingCircle[i].x, y: this.boundingCircle[i].y}
      let p3 = {x: this.boundingCircle[j].x, y: this.boundingCircle[j].y}
      let origin = {x: this.boundingCircle[i].x, y: this.boundingCircle[i].y}
      this.segments.push({p1: p1, p2: p2, p3: p3, origin: origin})
    }
  }

  resizeCanvas() {
    this.wrapperWidth = this.wrapper.clientWidth
    this.canvas.width = this.wrapperWidth
    this.canvas.height = this.wrapperWidth
  }

  renderAll() {
    this.clearFrame()
    this.renderBoundingCircle()
    this.renderSegments()
  }

  clearFrame() {
    this.ctx.fillStyle = this.primaryColor
    this.ctx.clearRect(0, 0, this.wrapperWidth, this.wrapperWidth)
  }

  renderBoundingCircle() {
    this.ctx.beginPath()
    this.ctx.moveTo(this.boundingCircle[0].x,this.boundingCircle[0].y)
    for (let i=0; i<this.boundingCircle.length; i++) {
      this.ctx.lineTo(this.boundingCircle[i].x,this.boundingCircle[i].y)
    }
    this.ctx.lineTo(this.boundingCircle[0].x,this.boundingCircle[0].y)
    this.ctx.stroke()
  }

  renderSegments() {
    for (let i=0; i<this.segments.length; i++) {
      this.ctx.save()
      this.ctx.translate(this.segments[i].origin.x, this.segments[i].origin.y)
      this.ctx.rotate(Math.PI * this.rot)
      this.ctx.translate(- this.segments[i].origin.x, - this.segments[i].origin.y)
      this.ctx.beginPath()
      this.ctx.moveTo(this.segments[i].p1.x, this.segments[i].p1.y)
      this.ctx.lineTo(this.segments[i].p2.x, this.segments[i].p2.y)
      this.ctx.lineTo(this.segments[i].p3.x, this.segments[i].p3.y)
      this.ctx.lineTo(this.segments[i].p1.x, this.segments[i].p1.y)
      this.ctx.closePath()
      this.ctx.fill()
      this.ctx.stroke()
      this.ctx.restore()
    }
  }

  open(cb) {
    this.currentAni = 'open'
    this.speed = this.initialSpeed
    if (this.rot < this.maxRot && this.isPaused === false) {
      this.renderAll()
      //this.isPaused = false
      this.rot += this.speed
      this.frameNum = window.requestAnimationFrame( this.open.bind(this, cb) )
    }
    if (this.rot >= this.maxRot) {
      this.renderAll()
      this.rot = this.maxRot
      //this.isPaused = true
      window.cancelAnimationFrame(this.frameNum)
      if (typeof(cb) === 'function') { cb() }
    }
  }

  close(cb) {
    this.currentAni = 'close'
    this.speed = this.initialSpeed
    if (this.rot > 0) {
      this.renderAll()
      //this.isPaused = false
      this.rot -= this.speed
      this.frameNum = window.requestAnimationFrame( this.close.bind(this, cb) )
    }
    if (this.rot <= 0) {
      this.renderAll()
      this.rot = 0
      //this.isPaused = true
      window.cancelAnimationFrame(this.frameNum)
      if (typeof(cb) === 'function') { cb() }
    }
  }

  loop() {
    this.shouldLoop = true
    this.open( this.close.bind(this, this.loop) )
  }

  stopLoop() {
    this.shouldLoop = false
    this.pause()
  }

  pause() {
    this.isPaused = true
    window.cancelAnimationFrame(this.frameNum)
  }

  unPause() {
    this.isPaused = false
    if (this.currentAni === 'open' && this.shouldLoop === false) {this.open()}
    if (this.currentAni === 'close' && this.shouldLoop === false) {this.close()}
    if (this.shouldLoop === true) {this.loop()}
  }

  togglePause() {
    if (this.isPaused) { this.unPause() }
    else { this.pause() }
  }
}

