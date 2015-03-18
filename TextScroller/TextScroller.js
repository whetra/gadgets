function Scroller(x, width, height) {
    this.x = x;
    this.canvas = document.createElement("canvas");
    this.canvas.width = width;
    this.canvas.height = height;
    this.context = this.canvas.getContext("2d");
    this.totalPixelsCopied = 0;
    this.writePosition = 0;
    this.startCanvasPosition = 0;	//Point on the Item canvas at which this scroller starts.
    this.endCanvasPosition = 0;		//Point on the Item canvas at which this scroller ends.	
    //document.body.appendChild(document.createElement("div"));
    //document.body.appendChild(this.canvas);
}
Scroller.prototype.getX = function() {
    return this.x;
}
Scroller.prototype.setX = function(x) {
    this.x = this.x - x;
}
Scroller.prototype.resetX = function(x) {
    this.x = x;
}
Scroller.prototype.getStartCanvasPosition = function() {
    return this.startCanvasPosition;
}
Scroller.prototype.getEndCanvasPosition = function() {
    return this.endCanvasPosition;
}
Scroller.prototype.setWritePosition = function(value) {
    this.writePosition = value;
}
//Prepare scroller canvas from sections of other canvases.
Scroller.prototype.drawCanvasFromStart = function(canvas, currentItemPosition) {
    var context2D = canvas.getContext("2d"),
	difference = this.canvas.width - this.totalPixelsCopied,
	pixelsCopied = 0,
	imageData;
	
    //Only set this on first time through.
    if (this.totalPixelsCopied === 0) {
	this.startCanvasPosition = currentItemPosition;
    }

    //Content that remains to be shown is shorter than the scroller.
    if ((canvas.width - currentItemPosition) < difference) {		    
	imageData = context2D.getImageData(currentItemPosition, 0, canvas.width - currentItemPosition, canvas.height);	//left, top, width, height
	pixelsCopied = canvas.width - currentItemPosition;
	this.totalPixelsCopied += pixelsCopied;
	currentItemPosition = 0;	    
    }
    else {
	imageData = context2D.getImageData(currentItemPosition, 0, difference, canvas.height);	//left, top, width, height
	pixelsCopied = difference;
	currentItemPosition += difference;
	this.totalPixelsCopied += difference;
    }

    //Use putImageData() to paint the pixel data into the context.
    this.context.putImageData(imageData, this.writePosition, 0);
    this.writePosition = this.writePosition + pixelsCopied;
    
    if (this.totalPixelsCopied < this.canvas.width) {
	currentItemPosition = this.drawCanvasFromStart(canvas, currentItemPosition);
    }
    else {
	this.totalPixelsCopied = 0;
	this.writePosition = 0;
    }
    
    this.endCanvasPosition = currentItemPosition;
    
    return currentItemPosition;
}
Scroller.prototype.drawCanvasFromEnd = function(canvas, currentItemPosition) {
    var context2D = canvas.getContext("2d"),
	difference = this.canvas.width - this.totalPixelsCopied,
	pixelsCopied = 0,
	imageData;
	
    //Only set this on first time through. We're working backwards here.
    if (this.totalPixelsCopied === 0) {
	this.endCanvasPosition = currentItemPosition;
    }

    //Content that remains to be shown is shorter than the scroller.
    if (currentItemPosition < difference) {	
	imageData = context2D.getImageData(0, 0, currentItemPosition, canvas.height);	//left, top, width, height
	pixelsCopied = currentItemPosition;
	this.totalPixelsCopied += pixelsCopied;
	currentItemPosition = canvas.width;	    
    }
    else {
	imageData = context2D.getImageData(currentItemPosition - difference, 0, difference, canvas.height);	//left, top, width, height
	pixelsCopied = difference;
	currentItemPosition -= difference;
	this.totalPixelsCopied += difference;
    }

    //Use putImageData() to paint the pixel data into the context.
    this.context.putImageData(imageData, this.canvas.width - this.totalPixelsCopied, 0);
    this.writePosition = this.writePosition - pixelsCopied;
    
    if (this.totalPixelsCopied < this.canvas.width) {
	currentItemPosition = this.drawCanvasFromEnd(canvas, currentItemPosition);
    }
    else {
	this.totalPixelsCopied = 0;
	this.writePosition = 0;
    }
    
    this.startCanvasPosition = currentItemPosition;
    
    return currentItemPosition;
}