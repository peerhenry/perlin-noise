// globals
const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')
const cellSize = 40;
const gradientVecs = {};
const xSteps = canvas.width/cellSize+1
const ySteps = canvas.height/cellSize+1
// setup gradient vectors
for(let i = 0; i<xSteps; i++) {
  for(let j = 0; j<ySteps; j++) {
    const r = Math.sqrt(2)
    const angle = 2*Math.PI*Math.random()
    gradientVecs[`${i}-${j}`] = [r*Math.cos(angle), r*Math.sin(angle)]
  }
}
testLog()
renderPerlinCanvas()

// test
function testLog () {
  const x = 50
  const y = 90
  const corners = getCorners(x, y)
  console.log(`getCorners(${x}, ${y})`, corners)
  const offsetVectors = getOffsetVectors(corners, x, y)
  console.log(`getOffsetVectors(${x}, ${y})`, offsetVectors)
  const gradientVectors = getGradientVectors(corners)
  console.log(`getGradientVectors(${x}, ${y})`, gradientVectors)
  const dotProducts = calculateDotProducts(offsetVectors, gradientVectors)
  console.log(`calculateDotProducts(${x}, ${y})`, dotProducts)
  console.log(`perlin(${x}, ${y})`, perlin(x, y))
}

// main function
function renderPerlinCanvas() {
  const t0 = performance.now();
  drawPerlinNoise()
  const t1 = performance.now();
  const dt = Math.round(t1 - t0)
  console.log(`It took ${dt} milliseconds to draw perling noise.`);
  drawGrid()
  drawGradientVectors()
}

function drawPerlinNoise() {
  var imageData = ctx.createImageData(canvas.width, canvas.height);
  const data = imageData.data;
  for (var n = 0; n < data.length; n += 4) {
    const pixelNumber = n/4
    const x = Math.floor(pixelNumber % canvas.width)
    const y = Math.floor(Math.floor(pixelNumber / canvas.width))
    const col = (perlin(x, y) + 1)/2
    const amp = 255
    data[n]     = col*amp; // red
    data[n + 1] = col*amp; // green
    data[n + 2] = col*amp; // blue
    data[n + 3] = 255; // alpha
  }
  ctx.putImageData(imageData, 0, 0);
}

// A - B
// | . |
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
  const alpha = mix(dotA, dotC, u[1]) // not sure about the mixing, or the smoothstep thingy
  const beta = mix(dotB, dotD, u[1])
  const value = mix(alpha, beta, u[0])
  // const alpha = mix(dotA, dotB, u[0]) // not sure about the mixing, or the smoothstep thingy
  // const beta = mix(dotC, dotD, u[0])
  // const value = mix(alpha, beta, u[1])

  return value
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
    .map(v => v.map(x => x/cellSize))
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

// draw gradient vectors

function drawGradientVectors() {
  ctx.fillStyle = "#FFFFFF"
  for(let i = 0; i<xSteps; i++) {
    for(let j = 0; j<ySteps; j++) {
      drawPoint(i*cellSize,j*cellSize)
      gradientVector = gradientVecs[`${i}-${j}`]
      const amp = 20
      drawArrow(i*cellSize,j*cellSize, amp*gradientVector[0], amp*gradientVector[1])
    }
  }
}

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