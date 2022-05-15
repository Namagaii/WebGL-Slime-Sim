let gl = null;
let glCanvas = null;

let aspectRatio;
let squareResolution = [];
let currentRotation = [0, 1];
let currentScale = [1.0, 1.0];
let incrementx = 0;
let incrementy = 0;

let vertexArray;
let vertexBuffer;
let vertexNumComponents;
let vertexCount;

let uScalingFactor;
let uGradientColor1;
let uGradientColor2;
let uGradientColor3;
let uTime;
let color1 = {
    r: 1.0,
    g: 0.5,
    b: 0
};
let color2 = {
    r: 0.2,
    g: 0,
    b: 0.5
};
let color3 = {
    r: 0.5,
    g: 0.2,
    b: 0.6
}
let uRotationVector;
let aVertexPosition;
let uSquareResolution;

let previousTime = 0.0;
let degreesPerSecond = 25.0;

window.addEventListener("load", startup, false);

function normalize(maxValue, minValue, currentValue){
    let output = (currentValue - minValue) / (maxValue - minValue);
    output *= 2;
    output -= 1;
    return output;
}

function normalizeStandard(maxValue, minValue, currentValue){
    return (currentValue - minValue) / (maxValue - minValue);
}

function getRandomFloat(max){
    return Math.random() * max;
} 

function startup(){
    glCanvas = document.getElementById("glcanvas");
    gl = glCanvas.getContext("webgl");

    const shaderSet = [
        {
            type: gl.VERTEX_SHADER,
            id: "vertex-shader"
        },
        {
            type: gl.FRAGMENT_SHADER,
            id: "fragment-shader"
        }
    ];

    shaderProgram = buildShaderProgram(shaderSet);

    aspectRatio = glCanvas.width/glCanvas.height;
    currentRotation = [0, 1];
    currentScale = [1.0, aspectRatio];
    // The size of the coordinate space is simply the size of the largest dimension i.e. length or hieght
    let coordinateSpaceHalfLength = Math.max(glCanvas.width, glCanvas.height)/2//The length from 0 to 1 in the coordinate space
    let viewPortHalfWidth = glCanvas.width/2; //The length from 0 to 1 in the viewPort Space on the x axis
    let viewPortHalfHeight = glCanvas.height/2; // The length from 0 to 1 in the viewPort Space on the y axis
    let percentageOfWidth = 0.5;
    let percentageOfHeight = 0.60;
    squareResolution[0] = percentageOfWidth * viewPortHalfWidth; 
    squareResolution[1] =  percentageOfHeight * viewPortHalfHeight;
    //Gets square width and height by normalizing the position in the viewport between the size of the entire coordinate space
    let squareWidth = normalize(coordinateSpaceHalfLength, -coordinateSpaceHalfLength, squareResolution[0])
    let squareHeight = normalize(coordinateSpaceHalfLength, -coordinateSpaceHalfLength, squareResolution[1])
    // Translate coordPosition in viewport space to be acurate to the actual coord space
    vertexArray = new Float32Array([
        -squareWidth, squareHeight, squareWidth, squareHeight, squareWidth, -squareHeight,
        -squareWidth, -squareHeight, -squareWidth, squareHeight, squareWidth, -squareHeight 
    ]);

    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.STATIC_DRAW);

    vertexNumComponents = 2;
    vertexCount = vertexArray.length/vertexNumComponents;
    currentAngle = 0.0;

    setInterval(() => {
        color1.r = normalizeStandard(255, 0, getRandomFloat(255));
        color1.g = normalizeStandard(255, 0, getRandomFloat(255));
        color1.b = normalizeStandard(255, 0, getRandomFloat(255));
        color2.r = normalizeStandard(255, 0, getRandomFloat(255));
        color2.g = normalizeStandard(255, 0, getRandomFloat(255));
        color2.b = normalizeStandard(255, 0, getRandomFloat(255));
        color3.r = normalizeStandard(255, 0, getRandomFloat(255));
        color3.g = normalizeStandard(255, 0, getRandomFloat(255));
        color3.b = normalizeStandard(255, 0, getRandomFloat(255));
    }, 5000)
    animateScene();
}

function buildShaderProgram(shaderInfo) {
    let program = gl.createProgram();

    shaderInfo.forEach(function(desc) {
        let shader = compileShader(desc.id, desc.type);

        if (shader) {
        gl.attachShader(program, shader);
        }
    });

    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.log("Error linking shader program:");
        console.log(gl.getProgramInfoLog(program));
    }

    return program;
}

function compileShader(id, type) {
    let code = document.getElementById(id).firstChild.nodeValue;
    let shader = gl.createShader(type);

    gl.shaderSource(shader, code);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.log(`Error compiling ${type === gl.VERTEX_SHADER ? "vertex" : "fragment"} shader:`);
        console.log(gl.getShaderInfoLog(shader));
    }
    return shader;
}
      
function animateScene() {
    gl.viewport(0, 0, glCanvas.width, glCanvas.height);
    gl.clearColor(0.8, 0.9, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    let radians = currentAngle * Math.PI / 180.0;
    currentRotation[0] = Math.sin(radians);
    currentRotation[1] = Math.cos(radians);

    gl.useProgram(shaderProgram);

    uScalingFactor =
        gl.getUniformLocation(shaderProgram, "uScalingFactor");
    uGradientColor1 =
        gl.getUniformLocation(shaderProgram, "uGradientColor1");
    uGradientColor2 =
        gl.getUniformLocation(shaderProgram, "uGradientColor2");
    uGradientColor3 = 
        gl.getUniformLocation(shaderProgram, "uGradientColor3");
    uRotationVector =
        gl.getUniformLocation(shaderProgram, "uRotationVector");
    uSquareResolution =
        gl.getUniformLocation(shaderProgram, "uResolution");
    uTime =
        gl.getUniformLocation(shaderProgram, "uTime");
    gl.uniform2fv(uScalingFactor, currentScale);
    gl.uniform2fv(uRotationVector, currentRotation);
    gl.uniform4fv(uGradientColor1, [color1.r, color1.g, color1.b, 1]);
    gl.uniform4fv(uGradientColor2, [color2.r, color2.g, color2.b, 1]);
    gl.uniform4fv(uGradientColor3, [color3.r, color3.g, color3.b, 1]);
    gl.uniform2fv(uSquareResolution, squareResolution);
    gl.uniform1f(uTime, previousTime/1000.0);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    aVertexPosition =
        gl.getAttribLocation(shaderProgram, "aVertexPosition");

    gl.enableVertexAttribArray(aVertexPosition);
    gl.vertexAttribPointer(aVertexPosition, vertexNumComponents,
            gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, vertexCount);

    window.requestAnimationFrame(function(currentTime) {
        let deltaAngle = ((currentTime - previousTime) / 1000.0)
            * degreesPerSecond;

        currentAngle = (currentAngle + deltaAngle) % 360;

        previousTime = currentTime;
        animateScene();
    });
}