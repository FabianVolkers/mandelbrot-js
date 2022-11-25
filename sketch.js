//var frDiv;


var minval = -0.5;
var maxval = 0.5;
var minSlider;
var maxSlider;
var viewX = -2.5;
var viewY = 1.4;
var maxiterations = 100;
var interiorColor = [0, 0, 0, 255];
var aspectRatio;
/* var min;
var max; */



/*
 * Main renderer equation.
 *
 * Returns number of iterations and values of Z_{n}^2 = Tr + Ti at the time
 * we either converged (n == iterations) or diverged.  We use these to
 * determined the color at the current pixel.
 *
 * The Mandelbrot set is rendered taking
 *
 *     Z_{n+1} = Z_{n} + C
 *
 * with C = x + iy, based on the "look at" coordinates.
 *
 * The Julia set can be rendered by taking
 *
 *     Z_{0} = C = x + iy
 *     Z_{n+1} = Z_{n} + K
 *
 * for some arbitrary constant K.  The point C for Z_{0} must be the
 * current pixel we're rendering, but K could be based on the "look at"
 * coordinate, or by letting the user select a point on the screen.
 */

function iterateEquation(Cr, Ci, escapeRadius, iterations) {

    var Zr = 0; // Z real component
    var Zi = 0; // Z imaginary component
    var Tr = 0; // T real component
    var Ti = 0; // T imaginary component
    var n = 0; // iterator

    for (; n < iterations && (Tr + Ti) <= escapeRadius; ++n) {
        Zi = 2 * Zr * Zi + Ci;
        Zr = Tr - Ti + Cr;
        Tr = Zr * Zr;
        Ti = Zi * Zi;
    }

    /*
     * Four more iterations to decrease error term;
     * see http://linas.org/art-gallery/escape/escape.html
     */
    for (var e = 0; e < 4; ++e) {
        Zi = 2 * Zr * Zi + Ci;
        Zr = Tr - Ti + Cr;
        Tr = Zr * Zr;
        Ti = Zi * Zi;
    }

    return [n, Tr, Ti];

}

// Some constants used with smoothColor
var logBase = 1.0 / Math.log(2.0);
var logHalfBase = Math.log(0.5) * logBase;

function smoothColor(steps, n, Tr, Ti) {

    return 5 + n - logHalfBase - Math.log(Math.log(Tr + Ti)) * logBase;
}

function pickColor(steps, n, Tr, Ti) {
    if (n == steps) { // converged?
        return interiorColor;
    }

    var v = smoothColor(steps, n, Tr, Ti);
    v = Math.floor(512.0 * v / steps);
    if (v > 255) v = 255;
    return [v, v, v, 255];
}

function drawMandelbrot(rangeX, rangeY, deltaX, deltaY, maxiterations, width, height, pixels, offset) {
    var Ci = rangeY[0];

    for (var y = 0; y < height; y++) {
        var Cr = rangeX[0];
        var currentRowStart = offset
        for (var x = 0; x < width; x++) {

            var escapeRadius = 16;



            var escapeRadiusSquared = Math.pow(escapeRadius, 2.0);
            p = iterateEquation(Cr, Ci, escapeRadiusSquared, maxiterations)
            var color = pickColor(maxiterations, p[0], p[1], p[2]);


            pixels[offset++] = color[0];
            pixels[offset++] = color[1];
            pixels[offset++] = color[2];
            pixels[offset++] = 255;

            Cr += deltaX;

        }
        
        Ci += deltaY;

        // post rendered row to backend and update canvas
        var currentRow = pixels.slice(currentRowStart,currentRowStart + width);
        //console.log(currentRow)
        updatePixels();
    }
}

function getRenderedFrames(resolution, destination, color) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "http://127.0.0.1:5000/frames", true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({
        data: {
            resolution: resolution,
            destination: destination,
            color: color
        }
    }));
    console.log(xhr.response)
    frames = response.data
    return frames
}

var range = [-1.5, 1];
var rangeX;
var rangeY;

function setup() {
    //createCanvas(300, 300);
    createCanvas(windowWidth, windowHeight);
    //console.log(width)
    //range = [-(windowWidth / 1000), windowHeight / 1000];
    var aspectRatio = width / height;
    rangeX = [-1.5 * aspectRatio, 1 * aspectRatio];
    rangeY = [-1.5, 1];


    pixelDensity(1)
    frameRate(3)
    //minSlider = createSlider(-2.5, 2.5, -2.5, 0.01);
    //maxSlider = createSlider(-2.5, 2.5, 2.5, 0.01);

}
var zoomFactor = 0.05;
var mandelbrotCoords = [
    [

        -1.2490581404699488,
        -0.026105585996245635

    ],
    /*     [
            0.013438870532012129028364919004019686867528573314565492885548699,
            0.655614218769465062251320027664617466691295975864786403994151735 
        ],
        [
            0.2891996027788072739144331834536302581065177640194119127942487,
            0.0133306403386070904940708676330593085680577608325373712243689

        ], */

];
var mandel = 0;
var zoomOffsetX = mandelbrotCoords[mandel][0];
var zoomOffsetY = mandelbrotCoords[mandel][1];



function draw() {

    loadPixels();
    //startTimer();
    var offset = 0; // loop through pixel array sequentially instead of calculating var offset = (x + y * width) * 4; for every pixel
    var deltaX = (rangeX[1] - rangeX[0]) / (0.5 + (width - 1));
    var deltaY = (rangeY[1] - rangeY[0]) / (0.5 + (height - 1));

    drawMandelbrot(rangeX, rangeY, deltaX, deltaY, maxiterations, width, height, pixels, offset);

    //updatePixels();
    //saveCanvas('frame_' + frameCount, 'png');

    // change range according to zoomSpeed to zoom into Mandelbrot set
    //console.log(range)
    function zoomIn(coordVal, zoomFactor, zoomOffset) {
        coordVal -= zoomOffset;
        coordVal *= 1 - zoomFactor;
        coordVal += zoomOffset;
        return coordVal;

    }

    rangeX[0] = zoomIn(rangeX[0], zoomFactor, zoomOffsetX);
    rangeX[1] = zoomIn(rangeX[1], zoomFactor, zoomOffsetX);
    rangeY[0] = zoomIn(rangeY[0], zoomFactor, zoomOffsetY);
    rangeY[1] = zoomIn(rangeY[1], zoomFactor, zoomOffsetY);

    /* 
        range[0] *= 1-zoomFactor;
        range[1] = range[1] - zoomOffset;
        range[1] *= 1-zoomFactor;
        range[1] = range[1] + zoomOffset;

        range[0] < range[1] */

    var f = Math.sqrt(
        0.001 + 2.0 * Math.min(
            Math.abs(rangeX[0] - rangeX[1]),
            Math.abs(rangeY[0] - rangeY[1])));

    maxiterations = Math.floor(223.0 / f);
}