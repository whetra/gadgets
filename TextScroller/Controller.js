function Controller(scroller, prefs) {
    this.scroller = scroller;
    this.text = RiseVision.Common.Utility.unescapeHTML(prefs.getString("text"));
    this.direction = prefs.getString("direction");
    this.prefs = prefs;
    this.item = null;
    this.scrollers = [];
    this.mouseDown = false;
    this.mouseMove = false;
    this.lastMouseX = 0;
    this.interactivityTimeout = 5000;
    this.interactivityTimerID;
    this.isStopped = false;
    this.totalPixels = 0;
    
    window.requestAnimFrame = (function(){
	return  window.requestAnimationFrame       || 
		window.webkitRequestAnimationFrame || 
		window.mozRequestAnimationFrame    || 
		window.oRequestAnimationFrame      || 
		window.msRequestAnimationFrame     || 
		function( callback ){
		  window.setTimeout(callback, 1000 / 60);
		};
      })();
    
    window.cancelRequestAnimFrame = ( function() {
	return window.cancelAnimationFrame          ||
	    window.webkitCancelRequestAnimationFrame    ||
	    window.mozCancelRequestAnimationFrame       ||
	    window.oCancelRequestAnimationFrame     ||
	    window.msCancelRequestAnimationFrame        ||
	    clearTimeout
    } )();
}
Controller.prototype.initCanvas = function() {
    this.context = this.scroller.getContext("2d");
    this.scroller.width = this.prefs.getString("rsW");
    this.scroller.height = this.prefs.getString("rsH");
    //this.scroller.height = 75;
}
//Create separate canvas for each text and image.
Controller.prototype.initContent = function() {
    //Create 3 Scroller objects.
    for (var i = 0; i < 3; i++) {
	if (this.direction === "rtl") {
	    this.scrollers[i] = new Scroller(i * this.scroller.width, this.scroller.width, this.scroller.height);
	    this.speed = 3;	//Move 3 pixels per redraw.
	}
	else {
	    this.scrollers[i] = new Scroller(-i * this.scroller.width, this.scroller.width, this.scroller.height);
	    this.speed = -3;	//Move -3 pixels per redraw.
	}
    }
    
    this.item = new Item(this.text);
	
    for (var i = 0; i < this.scrollers.length; i++) {
	this.adjustCanvas(i);
    }
	
    readyEvent();
}
//This should draw something slightly different each time.
Controller.prototype.drawScene = function() {
    var difference;
    
    if (!this.mouseDown && !this.isStopped) {
	this.context.clearRect(0, 0, this.scroller.width, this.scroller.height);
	
	for (var i = 0; i < this.scrollers.length; i++) {
	    this.scrollers[i].setX(this.speed);
	    
	    if (this.direction === "rtl") {
		difference = this.scrollers[i].getX() + this.scroller.width;
	    }
	    else {
		difference = this.scrollers[i].getX() - this.scroller.width;
	    }
	    
	    //Move canvas back to the end.
	    if ((difference < 0) && (this.direction === "rtl")) {
		this.scrollers[i].resetX(this.scroller.width * 2);
		this.scrollers[i].setX(-difference);
		this.adjustCanvas(i);
	    }
	    else if ((difference > 0) && (this.direction === "ltr")) {
		this.scrollers[i].resetX(-this.scroller.width * 2);
		this.scrollers[i].setX(-difference);
		this.adjustCanvas(i);
	    }
	    
	    this.context.save();
	    this.context.translate(this.scrollers[i].getX(), 0);
	    this.drawCanvas(i);
	    this.context.restore();    	    		
	}
	
	this.totalPixels += Math.abs(this.speed);
	
	if (this.totalPixels > this.item.getWidth()) {
	    this.totalPixels = this.totalPixels - this.item.getWidth();
	    doneEvent();
	}
    }
}
//Draw entire Scroller piece onto scroller at 0, 0.
Controller.prototype.drawCanvas = function(i) {
    this.context.drawImage(this.scrollers[i].canvas, 0, 0, this.scrollers[i].canvas.width, this.scrollers[i].canvas.height);
}
Controller.prototype.adjustCanvas = function(i, swipeDirection) {
    var itemPosition = 0;
    
    if (!swipeDirection) {	//Auto-scroll
	swipeDirection = this.direction;
    }
    
    itemPosition = this.getItemPosition(i, swipeDirection);
    
    if (this.direction === "rtl") {
	if (swipeDirection === "rtl") {
	    this.scrollers[i].setWritePosition(0);					
	    this.scrollers[i].drawCanvasFromStart(this.item.canvas, itemPosition);
	}
	else {
	    this.scrollers[i].setWritePosition(this.scroller.width);			
	    this.scrollers[i].drawCanvasFromEnd(this.item.canvas, itemPosition);
	}
    }
    else {
	if (swipeDirection === "rtl") {
	    this.scrollers[i].setWritePosition(0);					
	    this.scrollers[i].drawCanvasFromStart(this.item.canvas, itemPosition);
	}
	else {
	    this.scrollers[i].setWritePosition(this.scroller.width);			
	    this.scrollers[i].drawCanvasFromEnd(this.item.canvas, itemPosition);
	}
    }
}
Controller.prototype.getItemPosition = function(scrollerIndex, swipeDirection) {
    var j = scrollerIndex, itemPosition;
	
    if (this.direction === "rtl") {
	if (swipeDirection === "rtl") {
	    j--;
    
	    if (j < 0) {
		j = this.scrollers.length - 1;
	    }
	    
	    itemPosition = this.scrollers[j].getEndCanvasPosition();
	    
	    if (itemPosition === this.item.canvas.width) {
		itemPosition = 0;
	    }
	}
	else {
	    j++;
    
	    if (j >= this.scrollers.length) {
		j = 0;
	    }
	    
	    itemPosition = this.scrollers[j].getStartCanvasPosition();
	    
	    if (itemPosition === 0) {
		itemPosition = this.item.canvas.width;
	    }
	}
    }
    else {
	if (swipeDirection === "rtl") {
	    j++;
	
	    if (j >= this.scrollers.length) {
		j = 0;
	    }
	    
	    itemPosition = this.scrollers[j].getEndCanvasPosition();
	    
	    if (itemPosition === this.item.canvas.width) {
		itemPosition = 0;
	    }
	}
	else {
	    j--;
    
	    if (j < 0) {
		j = this.scrollers.length - 1;
	    }
	    
	    itemPosition = this.scrollers[j].getStartCanvasPosition();
	    
	    if (itemPosition === 0) {
		itemPosition = this.item.canvas.width;
	    }
	}
    }
    
    return itemPosition;
}
Controller.prototype.handleMouseDown = function(event) {
    this.mouseDown = true;
    this.lastMouseX = event.clientX;
}
Controller.prototype.handleMouseUp = function(event) {
    var self = this;
    
    this.mouseDown = false;
    
    if (!this.mouseMove) {
	clearTimeout(this.interactivityTimerID);
	this.isStopped = true;
	this.interactivityTimerID = setTimeout(function() {
	    self.isStopped = false;
	}, this.interactivityTimeout);
    }
    else {
	this.mouseMove = false;
    }
}
Controller.prototype.handleMouseOut = function(event) {
    this.mouseDown = false;
}
Controller.prototype.handleMouseMove = function(event) {
    if (!this.mouseDown) {
	return;
    }
    
    var newX = event.clientX,
	deltaX = this.lastMouseX - newX,
	difference;
    
    this.mouseMove = true;
    this.context.clearRect(0, 0, this.scroller.width, this.scroller.height);
    
    for (var i = 0; i < this.scrollers.length; i++) {
	this.scrollers[i].setX(deltaX);
	
	if (this.direction === "rtl") {
	    if (deltaX > 0) {	//Swipe left
		difference = this.scrollers[i].getX() + this.scroller.width;
		
		if (difference < 0) {
		    this.scrollers[i].resetX(this.scroller.width * 2);
		    this.scrollers[i].setX(-difference);		
		    this.adjustCanvas(i, "rtl");
		}
	    }
	    else if (deltaX < 0) {	//Swipe right
		difference = this.scrollers[i].getX() - this.scroller.width * 2;
		
		if (difference > 0) {
		    this.scrollers[i].resetX(-this.scroller.width);
		    this.scrollers[i].setX(-difference);		
		    this.adjustCanvas(i, "ltr");
		}
	    }
	}
	else {	//RTL
	    if (deltaX > 0) {	//Swipe left
		difference = this.scrollers[i].getX() + this.scroller.width * 2;
		
		if (difference < 0) {
		    this.scrollers[i].resetX(this.scroller.width);
		    this.scrollers[i].setX(-difference);		
		    this.adjustCanvas(i, "rtl");
		}
	    }
	    else if (deltaX < 0) {	//Swipe right
		difference = this.scrollers[i].getX() - this.scroller.width;
		
		if (difference > 0) {
		    this.scrollers[i].resetX(-this.scroller.width * 2);
		    this.scrollers[i].setX(-difference);		
		    this.adjustCanvas(i, "ltr");
		}
	    }
	}
	
	this.context.save();
	this.context.translate(this.scrollers[i].getX(), 0);
	this.drawCanvas(i);
	this.context.restore();
    }
    
    this.isStopped = false;
    this.lastMouseX = newX;
}
Controller.prototype.tick = function() {
    var self = this;
    
    this.request = requestAnimFrame(function() {
	self.tick();
    });
    
    this.drawScene();
}
Controller.prototype.pause = function() {
    cancelRequestAnimFrame(this.request); 
}
Controller.prototype.initialize = function() {
    this.initCanvas();
    this.initContent();
}	    