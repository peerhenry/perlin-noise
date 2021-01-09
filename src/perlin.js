const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')

ctx.beginPath();
ctx.fillStyle = "#FFFFFF";

const cellSize = 40;
const xSteps = canvas.width/cellSize+1
const ySteps = canvas.height/cellSize+1

// setup gradient vectors
const gradientVecs = {}
for(let i = 0; i<xSteps; i++) {
  for(let j = 0; j<ySteps; j++) {
    const rmin = 10
    const rmax = cellSize
    const r = (rmax-rmin)*Math.random() + rmin
    const angle = 2*Math.PI*Math.random()
    gradientVecs[`${i}-${j}`] = [r*Math.cos(angle), r*Math.sin(angle)]
  }
}

var imageData = ctx.createImageData(canvas.width, canvas.height);
const data = imageData.data;
const xFloats = canvas.width*4
const yFloats = canvas.height*4
for (var n = 0; n < data.length; n += 4) {
// for (var n = 0; n < 3040; n += 4) { // breaks at n = 3040
  const x = Math.floor((n % xFloats)/4)
  const y = Math.floor((n / xFloats)/4)
  const col = (perlin(x, y) + 1)/2
  const amp = 128
  data[n]     = col*amp; // red
  data[n + 1] = col*amp; // green
  data[n + 2] = col*amp; // blue
  data[n + 3] = 255; // alpha
}
ctx.putImageData(imageData, 0, 0);

drawGrid()
for(let i = 0; i<xSteps; i++) {
  for(let j = 0; j<ySteps; j++) {
    drawPoint(i*cellSize,j*cellSize)
    gradientVector = gradientVecs[`${i}-${j}`]
    drawArrow(i*cellSize,j*cellSize, gradientVector[0], gradientVector[1])
  }
}

// test
(function () {
  const corners = getCorners(10, 10)
  console.log('getCorners(10, 10)', corners)
  const offsetVectors = getOffsetVectors(corners, 10, 10)
  console.log('getOffsetVectors(10, 10)', offsetVectors)
  const gradientVectors = getGradientVectors(corners)
  console.log('getGradientVectors(10, 10)', gradientVectors)
  const dotProducts = calculateDotProducts(offsetVectors, gradientVectors)
  console.log('getGradientVectors(10, 10)', dotProducts)
  console.log('perlin(10, 10)', perlin(10, 10))
})()

// A - B
// |   |
// C - D

function perlin(x, y) {
  const corners = getCorners(x, y)
  const offsetVectors = getOffsetVectors(corners, x, y)
  const gradientVectors = getGradientVectors(corners)
  const dotProducts = calculateDotProducts(offsetVectors, gradientVectors)
  // get fractional part of coordinate within cell to use for interpolation
  const fracX = (x%cellSize)/cellSize
  const fracY = (y%cellSize)/cellSize
  const fractionals = [fracX, fracY]
  const u = fractionals.map(f => f*f*(3.0-2.0*f)) // Cubic Hermine Curve.  Same as SmoothStep()
  const [dotA, dotB, dotC, dotD] = dotProducts
  const alpha = mix(dotA, dotB, u[0])
  const beta = mix(dotC, dotD, u[0])
  const value = mix(alpha, beta, u[1])
  const normalized = (value+160)/(2*160)

  return normalized
}

function mix(a, b, f) {
  return b*f + a*(1-f)
}

function getCorners(x, y) {
  const prevGridi = Math.floor(x/cellSize)
  const nextGridi = prevGridi + 1
  const prevGridj = Math.floor(y/cellSize)
  const nextGridj = prevGridj + 1
  return [
    [prevGridi, prevGridj],
    [nextGridi, prevGridj],
    [prevGridi, nextGridj],
    [nextGridi, nextGridj],
  ]
}

function getOffsetVectors(corners, x, y) {
  return corners
    .map(c => c.map(h => cellSize*h))
    .map(c => [c[0] - x,c[1] -y])
}

function getGradientVectors(corners) {
  return corners
  .map(c => gradientVecs[`${c[0]}-${c[1]}`])
}

function calculateDotProducts(offsetVectors, gradientVectors) {
  const dotProducts = []
  for(let n = 0; n<4; n++) {
    const offset = offsetVectors[n]
    const gradientVec = gradientVectors[n]
    dotProducts.push(offset[0]*gradientVec[0] + offset[1]*gradientVec[1])
  }
  return dotProducts
}

// helper functions

function drawPoint(x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 3, 0, 2 * Math.PI); // x, y, r, sAngle, eAngle, counterclockwise
  ctx.fill();
}

function drawArrow(x, y, dx, dy) {
  ctx.beginPath();
  ctx.strokeStyle = "#FF0000";
  ctx.lineWidth = 2;
  ctx.moveTo(x,y);
  ctx.lineTo(x+dx,y+dy);
  ctx.stroke();
}

// draw grid

function drawGrid() {
  for(let i = 0; i<xSteps; i++) {
    drawVerticalLine(i*cellSize)
  }
  for(let j = 0; j<ySteps; j++) {
    drawHorizontalLine(j*cellSize)
  }
}

function drawHorizontalLine(y) {
  ctx.beginPath();
  ctx.strokeStyle = "#FFFFFF";
  ctx.moveTo(0,y);
  ctx.lineTo(canvas.width,y);
  ctx.stroke();
}

function drawVerticalLine(x) {
  ctx.beginPath();
  ctx.strokeStyle = "#FFFFFF";
  ctx.moveTo(x,0);
  ctx.lineTo(x,canvas.height);
  ctx.stroke();
}