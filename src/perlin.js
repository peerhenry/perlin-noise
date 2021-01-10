// globals
const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')
const cellSizePixels = 32;
const xSteps = canvas.width/cellSizePixels+1
const ySteps = canvas.height/cellSizePixels+1
// setup random gradient vectors
const r = Math.sqrt(2)
const rightVecs = [[r, 0], [-r, 0], [0, r], [0, r]] // right vectors
const diagonalVecs = [[1, 1], [1, -1], [-1, 1], [-1, -1]] // diagonal vectors
const rightAndDiags = rightVecs.concat(diagonalVecs)

// note; each choice of gradientVecs makes noise look slightly different
// const gradientVecs = rightVecs
// const gradientVecs = diagonalVecs
// const gradientVecs = rightAndDiags
// const gradientVecs = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(n => n*Math.PI/8).map(a => [r*Math.cos(a), r*Math.sin(a)])
const gradientVecs = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31].map(n => n*Math.PI/16).map(a => [r*Math.cos(a), r*Math.sin(a)])

testLog()
renderPerlinCanvas()

function createHashMaker(seed = 1, range = 8) {
  return (i, j) => {
    const changer = Math.cos(seed) + 1.5
    const nr = 12345*changer*(Math.cos(45.33*changer*i) + Math.cos(33.45*changer*j) + 13)
    return Math.floor(nr) % range
  }
}

// test
function testLog () {
  const makeHash = createHashMaker(1, gradientVecs.length)
  const x = 50
  const y = 90
  const corners = getCorners(cellSizePixels, x, y)
  console.log(`getCorners(cellSizePixels, ${x}, ${y})`, corners)
  const offsetVectors = getOffsetVectors(cellSizePixels, corners, x, y)
  console.log(`getOffsetVectors(cellSizePixels, corners, ${x}, ${y})`, offsetVectors)
  const gradientVectors = getGradientVectors(makeHash, corners)
  console.log(`getGradientVectors([${x}, ${y}])`, gradientVectors)
  const dotProducts = calculateDotProducts(offsetVectors, gradientVectors)
  console.log(`calculateDotProducts(${x}, ${y})`, dotProducts)
  console.log(`perlin(cellSizePixels, makeHash, ${x}, ${y})`, perlin(cellSizePixels, makeHash, x, y, 1))
}

// main function
function renderPerlinCanvas() {
  const seed = 1
  const makeHash = createHashMaker(seed, gradientVecs.length)
  const t0 = performance.now();
  const octaves = 1
  drawPerlinNoise(cellSizePixels, makeHash, octaves)
  const t1 = performance.now();
  const dt = Math.round(t1 - t0)
  console.log(`It took ${dt} milliseconds to draw perling noise.`);
  // drawGrid(cellSizePixels)
  // drawGradientVectors(cellSizePixels, makeHash)
}

function drawPerlinNoise(baseCellSize, makeHash, octaves) {
  const imageData = ctx.createImageData(canvas.width, canvas.height);
  const data = imageData.data;
  let min = 1
  let max = 0
  for (var n = 0; n < data.length; n += 4) {
    const pixelNumber = n/4
    const x = Math.floor(pixelNumber % canvas.width)
    const y = Math.floor(Math.floor(pixelNumber / canvas.width))
    const col = (perlin(baseCellSize, makeHash, x, y, octaves) + 1)/2
    if(col<min) min = col
    if(col>max) max = col
    const amp = 255
    data[n]     = col*amp; // red
    data[n + 1] = col*amp; // green
    data[n + 2] = col*amp; // blue
    data[n + 3] = 255; // alpha
  }
  console.log('min', min)
  console.log('max', max)
  ctx.putImageData(imageData, 0, 0);
}

// A - B
// | . |
// C - D

function perlin(baseCellSize, makeHash, x, y, octaves = 1) {
  if(!Number.isInteger(octaves) || octaves < 1) throw 'octaves must be an integer > 0'

  const getPerlinValue = (cellSize) => {
    const corners = getCorners(cellSize, x, y)
    const offsetVectors = getOffsetVectors(cellSize, corners, x, y)
    const gradientVectors = getGradientVectors(makeHash, corners)
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
    return value
  }

  let acc = 0
  for(let oct = 1; oct <= octaves; oct++) {
    const divider = Math.pow(2, oct-1)
    const cellSize = baseCellSize/divider
    acc += getPerlinValue(cellSize)/divider
  }
  const normalizer = 2 - 1/Math.pow(2, octaves-1)
  return acc/normalizer
}

function mix(a, b, f) {
  return b*f + a*(1-f)
}

function getCorners(cellSize, x, y) {
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

function getOffsetVectors(cellSize, corners, x, y) {
  return corners
    .map(c => c.map(h => cellSize*h))
    .map(c => [c[0] - x,c[1] -y])
    .map(v => v.map(x => x/cellSize))
}

function getGradientVectors(makeHash, corners) {
  return corners.map(([i,j]) => gradientVecs[makeHash(i,j)])
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

function drawGradientVectors(cellSize, makeHash) {
  ctx.fillStyle = "#FFFFFF88"
  for(let i = 0; i<xSteps; i++) {
    for(let j = 0; j<ySteps; j++) {
      drawPoint(i*cellSize,j*cellSize)
      gradientVector = gradientVecs[makeHash(i, j)]
      const amp = cellSize/2.8
      drawArrow(i*cellSize,j*cellSize, amp*gradientVector[0], amp*gradientVector[1])
    }
  }
}

function drawPoint(x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 1, 0, 2 * Math.PI); // x, y, r, sAngle, eAngle, counterclockwise
  ctx.fill();
}

function drawArrow(x, y, dx, dy) {
  ctx.beginPath();
  ctx.strokeStyle = "#FF000088";
  ctx.lineWidth = 2;
  ctx.moveTo(x,y);
  ctx.lineTo(x+dx,y+dy);
  ctx.stroke();
}

// draw grid

function drawGrid(cellSize) {
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