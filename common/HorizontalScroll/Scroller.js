/* Parent class for all scrollers. */
function Scroller(xPos, width, height) {
    this.canvas = document.createElement("canvas");
    this.canvas.width = width;
    this.canvas.height = height;
    this.context = this.canvas.getContext("2d");
    
    this.x = xPos;
    this.startCanvasItem = null;
    this.endCanvasItem = null;
    this.startCanvasIndex = 0;		//Index of the first canvas to be copied onto the scroller.
    this.endCanvasIndex = 0;		//Index of the last canvas to be copied onto the scroller.
    this.startCanvasPosition = 0;	//Position at which the canvas at index startCanvasIndex started being copied.
    this.endCanvasPosition = 0;		//Position at which the canvas at index endCanvasIndex finished being copied.
    this.writeDirection = "forward";
    this.totalPixelsCopied = 0;
    this.writePosition = 0;
    this.holdPositions = [];
    
    //document.body.appendChild(document.createElement("div"));
    //document.body.appendChild(this.canvas);
}
/* Draw starting from beginning of scroller. */
Scroller.prototype.drawCanvasFromStart = function(canvas, currentItemPosition, scrollDirection) {	//canvas = item's canvas
    var context2D = canvas.getContext("2d"),
	pixelsRemaining = this.canvas.width - this.totalPixelsCopied,
	isCanvasCopied = false,
	pixelsCopied = 0,
	imageData = null,
	width;
	
    //Only set this on first time through.
    if (this.totalPixelsCopied == 0) {
	this.startCanvasPosition = currentItemPosition;
	this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    if (scrollDirection == "rtl") {
	if (currentItemPosition == 0) {	//All canvases except first one to be written.
	    width = canvas.width;
	}
	else {
	    width = canvas.width - currentItemPosition;
	}
    }
    else {
	width = canvas.width - currentItemPosition;
    }

    //Content that remains to be shown is shorter than the scroller.
    if (width <= pixelsRemaining) {
	imageData = context2D.getImageData(currentItemPosition, 0, width, canvas.height);
	pixelsCopied = width;
	this.totalPixelsCopied += pixelsCopied;
	currentItemPosition = 0;
	isCanvasCopied = true;
    }
    else {
	imageData = context2D.getImageData(currentItemPosition, 0, pixelsRemaining, canvas.height);
	pixelsCopied = pixelsRemaining;
	this.totalPixelsCopied += pixelsRemaining;
	currentItemPosition += pixelsRemaining;
    }

    //Paint the pixel data into the context.
    this.context.putImageData(imageData, this.writePosition, 0);
    this.writePosition += pixelsCopied;
    this.endCanvasPosition = currentItemPosition;	//Indicates how many pixels have been copied already.
    
    if (this.totalPixelsCopied >= this.canvas.width) {
	this.writePosition = 0;
    }
    
    imageData = null;
    
    return isCanvasCopied;
}
/* Draw starting from end of scroller. */
Scroller.prototype.drawCanvasFromEnd = function(canvas, currentItemPosition) {
    var context2D = canvas.getContext("2d"),
	pixelsRemaining = this.canvas.width - this.totalPixelsCopied,
	isCanvasCopied = false, pixelsCopied = 0, imageData, width;
	
    if (currentItemPosition == 0) {	//All canvases except first one to be written.
	width = canvas.width;	
	currentItemPosition = width;
    }
    else {
	width = currentItemPosition;
    }
    
    //Only set this on first time through. We're working backwards here.
    if (this.totalPixelsCopied == 0) {
	this.endCanvasPosition = width;
	this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    //Content that remains to be shown is shorter than the scroller.
    if (width <= pixelsRemaining) {
	imageData = context2D.getImageData(0, 0, width, canvas.height);
	pixelsCopied = width;
	this.totalPixelsCopied += pixelsCopied;
	currentItemPosition = 0;
	isCanvasCopied = true;
    }
    else {
	imageData = context2D.getImageData(width - pixelsRemaining, 0, pixelsRemaining, canvas.height);
	pixelsCopied = pixelsRemaining;
	this.totalPixelsCopied += pixelsRemaining;
	currentItemPosition -= pixelsRemaining;
    }

    //Paint the pixel data into the context.
    this.context.putImageData(imageData, this.canvas.width - this.totalPixelsCopied, 0);
    this.startCanvasPosition = currentItemPosition;	//Indicates how many pixels have been copied already.
    this.writePosition += pixelsCopied;
    
    if (this.totalPixelsCopied >= this.canvas.width) {
	this.writePosition = 0;
    }
    
    imageData = null;
    
    return isCanvasCopied;
}