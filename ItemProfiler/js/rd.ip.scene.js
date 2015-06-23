//use http://closure-compiler.appspot.com for deployment
if (!window['rd']) { window['rd'] = {}; }
if (!window['rd']['ip']) { window['rd']['ip'] = {}; }

rd.ip.scene = {};

var gl;
var glCanvas;
var vertices;
var shaderProgram;
var mvMatrix = mat4.create();
var mvMatrixStack = [];
var pMatrix = mat4.create();
var cardVertexPositionBuffer;
var cardVertexTextureCoordBuffer;

var requestAnimFrameId = 0;

var mouseIsDown = false;
var mouseMoveTime = new Date();
var mouseMoveStartX = 0;
var mouseMoveStartY = 0;
var mouseMovePrevX = 0;

var zoom = -15;
var minZoom = -25;
var maxZoom = -2.4;

var inactivityTimerId = 0;

var lastTime = 0;

var isStopped = false;
var currentlyPressedKeys = {};

function initGL(canvas) {
    try {
        gl = createWebGLContext(canvas);
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) { }
    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }
}

function createWebGLContext(canvas, opt_attribs) {
    var names = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
    var context = null;
    for (var ii = 0; ii < names.length; ++ii) {
        try {
            context = canvas.getContext(names[ii], opt_attribs);
        } catch (e) { }
        if (context) {
            break;
        }
    }
    return context;
}


function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }

    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

function initShaders() {
    var fragmentShader = getShader(gl, "shader-fs");
    var vertexShader = getShader(gl, "shader-vs");

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
    gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
    shaderProgram.colorUniform = gl.getUniformLocation(shaderProgram, "uColor");
}

function mvPushMatrix() {
    var copy = mat4.create();
    mat4.set(mvMatrix, copy);
    mvMatrixStack.push(copy);
}

function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
        throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}


function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

function handleWindowClick(event) {
    restartInactivityTimer();
}

function handleKeyDown(event) {
    currentlyPressedKeys[event.keyCode] = true;
}


function handleKeyUp(event) {
    currentlyPressedKeys[event.keyCode] = false;
}

function handleKeys() {
    if (currentlyPressedKeys[33]) {
        // Page Up
        //zoom -= 0.1;
        isStopped = true;
    }
    if (currentlyPressedKeys[34]) {
        // Page Down
        //zoom += 0.1;
        isStopped = false;
    }
}

function handleMouseDown() {
    processTouchStart(event.clientX, event.clientY);
    mouseIsDown = true;
}

function handleMouseUp() {
    if (mouseIsDown) {
        mouseIsDown = false;
        processTouchEnd(event.clientX, event.clientY);
    }
}

function handleMouseMove() {
    if (mouseIsDown) {
        processTouchMove(event.clientX);
    }
}

function handleTouchStart(event) {
    processTouchStart(event.targetTouches[0].clientX, event.targetTouches[0].clientY);
}

function handleTouchEnd(event) {
    //wait for last finger to be release i.e. event.targetTouches.length=0
    if (event.targetTouches.length == 0) {
        processTouchEnd(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
    }
}

function handleTouchMove(event) {
    event.preventDefault();
    processTouchMove(event.targetTouches[0].clientX);
}

function processTouchStart(eventClientX, eventClientY) {
    mouseMoveStartY = eventClientY;
    mouseMovePrevX = eventClientX;
    mouseMoveTime = new Date();
    //mouseIsDown = true;
}

function processTouchEnd(eventClientX, eventClientY) {
    //mouseIsDown = false;
    moveCards((mouseMovePrevX - eventClientX) / 100);
    if (Math.abs(mouseMoveStartY - eventClientY) > 10) {
        zoomDirection = (mouseMoveStartY - eventClientY < 0) ? 1 : -1;
    }
}

function processTouchMove(eventClientX) {
    moveCards((mouseMovePrevX - eventClientX) / 100);

    speedX = (mouseMovePrevX - eventClientX) / ((new Date() - mouseMoveTime) * 10);
    if (!isFinite(speedX)) {
        speedX = 0.0;
    }
    mouseMoveTime = new Date();
    mouseMovePrevX = eventClientX;
    if (Math.abs(speedX) > 1) {
        speedX = speedX > 0 ? 1 : -1;
    }
}

function moveCards(deltaX) {
    for (var i in rd.ip.core.activeCards) {
        rd.ip.core.activeCards[i].x -= deltaX;
        if (rd.ip.core.activeCards[i].x < 0 || rd.ip.core.activeCards[i].x >= rd.ip.globals.SCENE_WIDTH) {
            rd.ip.core.activeCards[i].x = rd.ip.core.activeCards[i].x % rd.ip.globals.SCENE_WIDTH;
            if (rd.ip.core.activeCards[i].x < 0) {
                rd.ip.core.activeCards[i].x += rd.ip.globals.SCENE_WIDTH;
            }
            rd.ip.core.activeCards[i].profile = rd.ip.floatingProfileCard.getNextProfile(rd.ip.core.activeCards[i], zoomDirection);
        }
    }
}

function initBuffers() {
    cardVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cardVertexPositionBuffer);
    vertices = [
            -1.0, -0.5, 0.0,
             1.0, -0.5, 0.0,
            -1.0, 0.5, 0.0,
             1.0, 0.5, 0.0
        ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    cardVertexPositionBuffer.itemSize = 3;
    cardVertexPositionBuffer.numItems = 4;

    cardVertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cardVertexTextureCoordBuffer);
    var textureCoords = [
            0.0, 0.0,
            1.0, 0.0,
            0.0, 1.0,
            1.0, 1.0
        ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
    cardVertexTextureCoordBuffer.itemSize = 2;
    cardVertexTextureCoordBuffer.numItems = 4;
}


function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);

    mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 1, 1000, pMatrix);
    mat4.identity(mvMatrix);
    //mat4.translate(mvMatrix, [0.0, 0.0, zoom]);
    mat4.translate(mvMatrix, [-rd.ip.globals.SCENE_WIDTH / 2, -rd.ip.globals.SCENE_HEIGHT / 2, 0]); //move entire scene 5px to the left and down so scene X and Y range changes from (-5 < X > 5) to (0 < X > 10)

    for (var i in rd.ip.core.activeCards) {
        rd.ip.core.activeCards[i].draw();
    }

}

function animate() {
    var timeNow = new Date().getTime();
    if (lastTime != 0) {
        var elapsed = timeNow - lastTime;

        if (!mouseIsDown) {
            moveCards(speedX);
            if (Math.abs(speedX) > minSpeedX) {
                speedX -= speedX * 0.05;
            }
        }

        if (!mouseIsDown) {
            for (var j in rd.ip.core.activeCards) {
                rd.ip.core.activeCards[j].animate(j, elapsed);
            }
        }
    }
    lastTime = timeNow;

}

function tick() {
    requestAnimFrameId = requestAnimFrame(tick);
    handleKeys();
    if (!isStopped && rd.ip.core.lic.isAuth) {
        animate();
        drawScene();
    }
}

function webGLStart() {
    if (!glCanvas) {
        glCanvas = document.getElementById("my-canvas");
        initGL(glCanvas);
        initShaders();
        initBuffers();

        gl.clearColor(0.0, 0.0, 0.0, 0.0);

        rd.ip.floatingProfileCard.initTexturePool();

        document.onkeydown = handleKeyDown;
        document.onkeyup = handleKeyUp;

        glCanvas.addEventListener('touchstart', handleTouchStart);
        glCanvas.addEventListener('touchend', handleTouchEnd);
        glCanvas.addEventListener('touchmove', handleTouchMove);
    }
}

function restartInactivityTimer() {
    clearTimeout(inactivityTimerId);
    inactivityTimerId = setTimeout('inactivityTimerTick()', rd.ip.globals.INACTIVITY_INTERVAL * 1000);
}

function inactivityTimerTick() {
    rd.ip.core.reset();
}

function handleClick() {
    //calc the zoom (z) value for the projection when it occupies entire screen
    var zoom1x = 1 / Math.tan(45 * Math.PI / 360.0);
    var pScale = 2 / glCanvas.height;

    //loop backwards so items with higher Z value are processed first
    var i = rd.ip.core.activeCards.length; //or 10
    while (i--) {
        var c = rd.ip.core.activeCards[i];
        var zScale = -c.z / zoom1x;
        var x = (event.offsetX - glCanvas.width / 2) * pScale * zScale + rd.ip.globals.SCENE_WIDTH / 2;
        var y = rd.ip.globals.SCENE_HEIGHT / 2 - (event.offsetY - glCanvas.height / 2) * pScale * zScale; //!!! Y axis in WebGL goes from bottom up!
        //calc card's width, height, left, and top
        var cw = 2; //card width is 2 (from -1 to 1)
        var ch = 1; //card height is 1 (from -0.5 to 0.5)
        var cLeft = c.x - cw / 2;
        var cTop = c.y - ch / 2;

        if (x > cLeft && x < cLeft + cw && y > cTop && y < cTop + ch && c.z > minZoom + 1 && c.z < maxZoom - 1) {
            rd.ip.core.profileDetails.show(c.profile);
            return;
        }
    }
}

function startAnimation() {
    tick();
}

function stopAnimation() {
    //cancelRequestAnimFrame does not seem to work. Don't use for now.
    //window.cancelRequestAnimFrame(requestAnimFrameId);
    //requestAnimFrameId = 0;
    isStopped = true;
}

var isfirsttime = true;
function handleExternalMessages(event) {
    if (event.data == "play") {
        if (isfirsttime) {
            isfirsttime = false;
        	webGLStart();
        	rd.ip.core.initWorldObjects();
        	rd.ip.core.featuredProfileCard.restart();
            startAnimation();
        }
        isStopped = false;
    } 
    else if (event.data == "stop" || event.data == "pause") {
        stopAnimation();
    }
}

/**
* Provides requestAnimationFrame in a cross browser way.
*/
window.requestAnimFrame = (function() {
    return window.requestAnimationFrame ||
         window.webkitRequestAnimationFrame ||
         window.mozRequestAnimationFrame ||
         window.oRequestAnimationFrame ||
         window.msRequestAnimationFrame ||
         function(/* function FrameRequestCallback */callback, /* DOMElement Element */element) {
             window.setTimeout(callback, 1000 / 60);
         };
})();

window.cancelRequestAnimFrame = (function() {
    return window.cancelAnimationFrame ||
        window.webkitCancelRequestAnimationFrame ||
        window.mozCancelRequestAnimationFrame ||
        window.oCancelRequestAnimationFrame ||
        window.msCancelRequestAnimationFrame ||
        clearTimeout
})();