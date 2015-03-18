function HorizontalScroll(settings, data) {
    //Private variables
    var scrollers = [],
	totalPixels = 0,f
	isStopped = false,
	interactivityTimerID = null;
    
    //Public variables
    this.scroller = document.createElement("canvas");
    this.scroller.id = "scroller"
    this.scroller.width = settings.width;
    this.scroller.height = settings.height;
    //this.scroller.height = 75;
    this.interactivityTimeout = settings.interactivityTimeout;
    this.context = this.scroller.getContext("2d");
    this.data = data;
    this.isHolding = false;
    this.isLoading = true;
    
    this.items = [];
    this.previousItemIndex = -1;
    this.itemCount = 0;
    this.currentItemIndex = 0;
    
    this.mouseDown = false;
    this.mouseMove = false;
    this.lastMouseX = 0;
    
    //Number of pixels to move per each redraw.
    if (settings.speed) {
	if (settings.speed == "fastest") {
	    this.speed = 5;
	}
	else if (settings.speed == "fast") {
	    this.speed = 4;
	}
	else if (settings.speed == "medium") {
	    this.speed = 3;
	}
	else if (settings.speed == "slow") {
	    this.speed = 2;
	}
	else if (settings.speed == "slowest") {
	    this.speed = 1;
	}
    }
    else {
	this.speed = 3;	//Backwards compatability.
    }
    
    if (settings.scrollDirection == "ltr") {
	this.speed = -this.speed;
    }
    
    //Getters
    this.getScrollBy = function() { return settings.scrollBy; }
    this.getScrollDirection = function() { return settings.scrollDirection; }
    this.getDuration = function() { return settings.duration; }
    this.getScroller = function(index) { return scrollers[index]; }
    this.getScrollers = function() { return scrollers; }
    this.getTotalPixels = function() { return totalPixels; }
    this.getIsStopped = function() { return isStopped; }
    this.getInteractivityTimerID = function() { return interactivityTimerID; }
    this.getSpacing = function() { return settings.spacing; }
    
    //Setters
    this.setScroller = function(index, value) { scrollers[index] = value; }
    this.setTotalPixels = function(value) { totalPixels = value; }
    this.setIsStopped = function(value) { isStopped = value; }
    
    document.body.appendChild(this.scroller);
    
    window.requestAnimFrame = (function(){
	return  window.requestAnimationFrame       || 
		window.webkitRequestAnimationFrame || 
		window.mozRequestAnimationFrame    || 
		window.oRequestAnimationFrame      || 
		window.msRequestAnimationFrame     ||
		function(/* function */ callback, /* DOMElement */ element){
		    return window.setTimeout(callback, 1000 / 60);
		};
    })();
    
    window.cancelRequestAnimFrame = ( function() {
	return window.cancelAnimationFrame          ||
	    window.webkitCancelRequestAnimationFrame    ||
	    window.mozCancelRequestAnimationFrame       ||
	    window.oCancelRequestAnimationFrame     ||
	    window.msCancelRequestAnimationFrame        ||
	    clearTimeout
    })();
}
//Create separate canvas for each data item.
HorizontalScroll.prototype.initialize = function() {
    var text = "",
	self = this;
    
    this.scroller.onmousemove = function(e) {
	self.handleMouseMove(e);
    }
    
    this.scroller.onmousedown = function(e) {
	self.handleMouseDown(e);
    }
    
    this.scroller.onmouseup = function(e) {
	self.handleMouseUp(e);
    }
    
    this.scroller.onmouseout = function(e) {
	self.handleMouseOut(e);
    }
    
    //Create 2 Scroller objects.
    for (var i = 0; i < 2; i++) {
	if (this.getScrollDirection() == "rtl") {
	    this.setScroller(i, new Scroller(i * this.scroller.width, this.scroller.width, this.scroller.height));
	}
	else {
	    this.setScroller(i, new Scroller(-i * this.scroller.width, this.scroller.width, this.scroller.height));
	}
    }
    
    this.totalWidth = 0;
    this.itemsCount = 1;
    
    var length = this.data.length;
    
    if (length > 0) {
	this.loadItem();
    }
}
HorizontalScroll.prototype.loadItem = function() {
    var item = new Item(this.data[this.currentItemIndex], this.scroller, this.getSpacing(), this.getScrollDirection()),
	self = this;
    
    item.initialize(function() {
	self.items[self.currentItemIndex] = this;
	self.totalWidth += this.getWidth();
	self.onItemInitialized();
    });
}
HorizontalScroll.prototype.onItemInitialized = function() {
    this.itemCount++;
	
    //All items have been loaded.
    if (this.itemCount == this.data.length) {
	for (var i = 0; i < this.getScrollers().length; i++) {
	    this.adjustCanvas(i);
	}
	
	this.currentItemIndex = 0;
	
	readyEvent();
    }
    else {
	this.currentItemIndex++;
	this.loadItem();
    }
}
HorizontalScroll.prototype.adjustCanvas = function(i, swipeDirection) {
    //var scroller = this.getScroller(i),
    var itemPosition = 0,
	isCopied = false,
	isMovingForward = true;
    
    if (!swipeDirection) {	//Auto-scroll
	swipeDirection = this.getScrollDirection();
    }
    
    if (this.getScrollDirection() == "rtl") {
	if (swipeDirection == "rtl") {
	    this.getScroller(i).writeDirection = "forward";
	}
	else {
	    this.getScroller(i).writeDirection = "backward";
	}
    }
    else {
	if (swipeDirection == "rtl") {
	    this.getScroller(i).writeDirection = "backward";
	}
	else {
	    this.getScroller(i).writeDirection = "forward";
	}
    }
    
    if (this.getScrollBy() == "item") {
	var j, index;
	
	//Get position at which to start copying based on position of other scroller at which copying was stopped.
	this.getScroller(i).holdPositions = [];
	itemPosition = this.getItemPosition(this.getNextScrollerIndex(i), swipeDirection);
	
	//Copy until the scroller is filled, or until we have finished copying all of the text associated with the current ID.
	while (this.getScroller(i).totalPixelsCopied < this.getScroller(i).canvas.width) {
	    if (this.getScroller(i).totalPixelsCopied == 0) {
		if (((this.getScrollDirection() == "rtl") && (swipeDirection == "rtl")) || ((this.getScrollDirection() == "ltr") && (swipeDirection == "rtl"))) {
		    //Save the index of the first item that is being copied.
		    this.getScroller(i).startCanvasIndex = this.currentItemIndex;
		    this.getScroller(i).startCanvasItem = this.items[this.currentItemIndex];
		}
		else {
		    this.getScroller(i).endCanvasIndex = this.currentItemIndex;
		    this.getScroller(i).endCanvasItem = this.items[this.currentItemIndex];
		}
	    }
	    
	    if (this.currentItemIndex != this.previousItemIndex) {
		if (this.getScrollDirection() == "rtl") {
		    if (swipeDirection == "rtl") {
			if (this.getScroller(i).writeDirection == "forward") {
			    this.getScroller(i).holdPositions.push({position: this.getScroller(i).writePosition, wasHeld: false});
			}
		    }
		    else {
			if (itemPosition != 0) {
			    this.getScroller(i).holdPositions.push({position: this.getScroller(i).writePosition, wasHeld: false});
			}
		    }
		}
		else {
		    this.getScroller(i).holdPositions.push({position: this.getScroller(i).writePosition, wasHeld: false});
		}
	    }
    
	    if (this.getScrollDirection() == "rtl") {
		if (swipeDirection == "rtl") {
		    isCopied = this.getScroller(i).drawCanvasFromStart(this.items[this.currentItemIndex].canvas, itemPosition, this.getScrollDirection());

		    //If the scroller is filled and the ending position is 0, move to the next item.
		    if (this.getScroller(i).endCanvasPosition == 0 && this.getScroller(i).writePosition == 0) {
			this.setNextItem(this.currentItemIndex);
		    }	    
		    
		    this.getScroller(i).endCanvasIndex = this.currentItemIndex;
		    this.getScroller(i).endCanvasItem = this.items[this.currentItemIndex];
		}
		else {
		    isCopied = this.getScroller(i).drawCanvasFromEnd(this.items[this.currentItemIndex].canvas, itemPosition);
		    this.getScroller(i).startCanvasIndex = this.currentItemIndex;
		    this.getScroller(i).startCanvasItem = this.items[this.currentItemIndex];
		}
	    }
	    else {
		if (swipeDirection == "ltr") {
		    isCopied = this.getScroller(i).drawCanvasFromEnd(this.items[this.currentItemIndex].canvas, itemPosition, this.getScrollDirection());
		    this.getScroller(i).startCanvasIndex = this.currentItemIndex;
		    this.getScroller(i).startCanvasItem = this.items[this.currentItemIndex];
		}
		else {
		    isCopied = this.getScroller(i).drawCanvasFromStart(this.items[this.currentItemIndex].canvas, itemPosition, this.getScrollDirection());
		    this.getScroller(i).endCanvasIndex = this.currentItemIndex;
		    this.getScroller(i).endCanvasItem = this.items[this.currentItemIndex];
		}
	    }
	    
	    if (isCopied) {	//This item has been copied. Copy the next item if it shares the same id.
		if (this.getScroller(i).writeDirection == "forward") {
		    this.setNextItem(this.currentItemIndex);
		}
		else {
		    this.setPreviousItem(this.currentItemIndex);
		}
	    }
	    
	    itemPosition = 0;
	}
    }
    else {
	itemPosition = this.getItemPosition(this.getNextScrollerIndex(i), swipeDirection);
	
	while (this.getScroller(i).totalPixelsCopied < this.getScroller(i).canvas.width) {
	    //Save the index of the first canvas that is being copied.
	    if (this.getScroller(i).totalPixelsCopied == 0) {
		if (((this.getScrollDirection() == "rtl") && (swipeDirection == "rtl")) || ((this.getScrollDirection() == "ltr") && (swipeDirection == "rtl"))) {
		    this.getScroller(i).startCanvasIndex = this.currentItemIndex;
		}
		else {
		    this.getScroller(i).endCanvasIndex = this.currentItemIndex;
		}
	    }

	    if (this.getScrollDirection() == "rtl") {
		if (swipeDirection == "rtl") {
		    isCopied = this.getScroller(i).drawCanvasFromStart(this.items[this.currentItemIndex].canvas, itemPosition, this.getScrollDirection());
		}
		else {
		    isCopied = this.getScroller(i).drawCanvasFromEnd(this.items[this.currentItemIndex].canvas, itemPosition, this.getScrollDirection(), this.getScroller(this.getNextScrollerIndex(i)).writeDirection);
		}
	    }
	    else {
		if (swipeDirection == "rtl") {
		    isCopied = this.getScroller(i).drawCanvasFromStart(this.items[this.currentItemIndex].canvas, itemPosition, this.getScrollDirection());
		}
		else {
		    isCopied = this.getScroller(i).drawCanvasFromEnd(this.items[this.currentItemIndex].canvas, itemPosition, this.getScrollDirection(), this.getScroller(this.getNextScrollerIndex(i)).writeDirection);
		}
	    }
	
	    if (isCopied) {
		if (this.getScroller(i).writeDirection == "forward") {
		    this.setNextItem(this.currentItemIndex);
		}
		else {
		    this.setPreviousItem(this.currentItemIndex);
		}
	    }
	    
	    itemPosition = 0;
	}
	
	//Save the index of the last canvas that is being copied.
	if (((this.getScrollDirection() == "rtl") && (swipeDirection == "rtl")) || ((this.getScrollDirection() == "ltr") && (swipeDirection == "rtl"))) {
	    this.getScroller(i).endCanvasIndex = this.currentItemIndex;
	}
	else {
	    this.getScroller(i).startCanvasIndex = this.currentItemIndex;
	}
    }
    
    this.isLoading = false;
    this.getScroller(i).totalPixelsCopied = 0;
}
HorizontalScroll.prototype.getItemPosition = function(j, swipeDirection) {
    var itemPosition;

    if (this.getScrollDirection() == "rtl") {
	if (swipeDirection == "rtl") {
	    //Row, Left, auto-scroll
	    itemPosition = this.getPositionFromEnd(j, swipeDirection);
	}
	else {
	    //Row, Left, swipe in opposite direction
	    itemPosition = this.getPositionFromStart(j, swipeDirection);
	}
    }
    else {
	if (swipeDirection == "rtl") {
	    //Row, Right, swipe in opposite direction
	    itemPosition = this.getPositionFromEnd(j, swipeDirection);
	}
	else {
	    //Row, Right, auto-scroll
	    itemPosition = this.getPositionFromStart(j, swipeDirection);
	}
    }
    
    return itemPosition;
}
HorizontalScroll.prototype.getPositionFromStart = function(j, swipeDirection) {
    var itemPosition;
    
    itemPosition = this.getScroller(j).startCanvasPosition;
    this.currentItemIndex = this.getScroller(j).startCanvasIndex;
    
    if (this.getScrollDirection() == "rtl" && swipeDirection == "ltr") {
	//If we're at the very beginning of a canvas, move to the previous canvas.
	if (itemPosition == 0) {
	    this.setPreviousItem(this.getScroller(j).startCanvasIndex);
	}
    }
    else if (this.getScrollDirection() == "ltr" && swipeDirection == "ltr") {
	//If we're at the very beginning of a canvas, move to the previous canvas.
	if (!this.isLoading) {
	    if (itemPosition == 0) {
		this.setNextItem(this.getScroller(j).startCanvasIndex);
	    }
	}
    }
    
    if (!this.isLoading) {
	this.previousItemIndex = this.currentItemIndex;
    }
    
    return itemPosition;
}
HorizontalScroll.prototype.getPositionFromEnd = function(j, swipeDirection) {
    var itemPosition;
    
    this.currentItemIndex = this.getScroller(j).endCanvasIndex;
    itemPosition = this.getScroller(j).endCanvasPosition;
    
    if (this.getScrollDirection() == "ltr" && swipeDirection == "rtl") {
	if (itemPosition == this.items[this.currentItemIndex].canvas.width) {
	    this.setPreviousItem(this.getScroller(j).endCanvasIndex);
	    itemPosition = 0;
	}
    }
    else if (this.getScrollDirection() == "rtl" && swipeDirection == "rtl") {
	//If we're at the very end of a canvas, move to the next canvas.
	if (itemPosition == this.items[this.currentItemIndex].canvas.width) {
	    this.setNextItem(this.getScroller(j).endCanvasIndex);
	    itemPosition = 0;
	}
    }
    
    if (!this.isLoading) {
	this.previousItemIndex = this.currentItemIndex;
    }
	
    return itemPosition;
}
HorizontalScroll.prototype.getNextScrollerIndex = function(index) {
    var next = ++index;
    
    if (next >= this.getScrollers().length) {
	next = 0;
    }
    
    return next;
}
HorizontalScroll.prototype.setNextItem = function(index) {
    var next = ++index;
    
    if (next >= this.items.length) {
	next = 0;
    }
    
    this.currentItemIndex = next;
    
    return next;
}
HorizontalScroll.prototype.setPreviousItem = function(index) {
    var previous = --index;
    
    if (previous < 0) {
	previous = this.items.length - 1;
    }
    
    this.currentItemIndex = previous;
    
    return previous;
}
HorizontalScroll.prototype.drawScene = function() {
    var self = this,
	difference;
    
    //if (!this.getMouseDown() && !this.isStopped) {
    if (!this.mouseDown && !this.isStopped) {
	this.context.clearRect(0, 0, this.scroller.width, this.scroller.height);
	
	for (var i = 0; i < this.getScrollers().length; i++) {
	    var scroller = this.getScroller(i);
	    
	    scroller.x = scroller.x - this.speed;
	    
	    if (this.getScrollDirection() == "rtl") {
		difference = scroller.x + this.scroller.width;
	    }
	    else {
		difference = scroller.x - this.scroller.width;
	    }
	    
	    if ((difference < 0) && (this.getScrollDirection() == "rtl")) {
		//Move canvas to the end.
		scroller.x = this.scroller.width;
		scroller.x = scroller.x - (-difference);
		this.adjustCanvas(i);
	    }
	    else if ((difference > 0) && (this.getScrollDirection() == "ltr")) {
		//Move canvas to the start.
		scroller.x = -this.scroller.width;
		scroller.x = scroller.x - (-difference);
		this.adjustCanvas(i);
	    }
	    
	    this.drawCanvas(scroller.x, i);    	    		
	}
	
	this.setTotalPixels(this.getTotalPixels() + Math.abs(this.speed));
	
	//PUD is implemented by counting the number of pixels that have been scrolled.
	if (this.getTotalPixels() > this.totalWidth) {
	    this.setTotalPixels(this.getTotalPixels() - this.totalWidth);
	    $(this).trigger("done");
	}
    }
}
HorizontalScroll.prototype.drawSceneByItem = function() {
    //if (!this.getMouseDown() && !this.isStopped) {
    if (!this.mouseDown && !this.isStopped) {
	var difference = 0;
	
	//Check if either of the Scrollers should be held.
	for (var i = 0; i < this.getScrollers().length; i++) {
	    var scroller = this.getScroller(i);
	    
	    if (scroller.holdPositions.length > 0) {
		for (var j = 0; j < scroller.holdPositions.length; j++) {
		    if ((scroller.x <= -scroller.holdPositions[j].position) && !scroller.holdPositions[j].wasHeld && this.getScrollDirection() == "rtl") {
			//Position scroller at the hold position.
			difference = scroller.x + scroller.holdPositions[j].position;
			scroller.x = -scroller.holdPositions[j].position;
			this.holdScroller(scroller, i, j);
			
			break;
		    }
		    else if ((scroller.x >= scroller.holdPositions[j].position) && !scroller.holdPositions[j].wasHeld && this.getScrollDirection() == "ltr") {
			//Position scroller at the hold position.
			difference = scroller.x - scroller.holdPositions[j].position;
			scroller.x = scroller.holdPositions[j].position;
			this.holdScroller(scroller, i, j);
			
			break;
		    }
		    else {
			this.isHolding = false;
		    }
		}
		
		if (this.isHolding) {
		    //Adjust other scroller by the same number of pixels.
		    var index = this.getNextScrollerIndex(i);
		    
		    this.getScroller(index).x = this.getScroller(index).x - difference;
		    this.moveCanvas(i);
		    this.drawCanvas(this.getScroller(index).x, index);
			
		    break;
		}
	    }
	    else {
		this.isHolding = false;
	    }
	}
	
	//Draw only if the scroller is not holding.
	if (!this.isHolding) {
	    this.context.clearRect(0, 0, this.scroller.width, this.scroller.height);
	    
	    for (var i = 0; i < this.getScrollers().length; i++) {
		var scroller = this.getScroller(i),
		    newX = scroller.x - this.speed;
		    
		    scroller.x = newX;
		    this.moveCanvas(i);
		    this.drawCanvas(scroller.x, i);
	    }
	}
    }
}
HorizontalScroll.prototype.holdScroller = function(scroller, i, j) {
    scroller.holdPositions[j].wasHeld = true;
			
    this.context.clearRect(0, 0, this.scroller.width, this.scroller.height);
    this.moveCanvas(i);
    this.drawCanvas(scroller.x, i);
    this.setHoldTimer();
    this.isHolding = true;
}
HorizontalScroll.prototype.moveCanvas = function(i) {
    var scroller = this.getScroller(i),
	difference;
    
    if (this.getScrollDirection() == "rtl") {
	difference = scroller.x + this.scroller.width;
    }
    else {
	difference = scroller.x - this.scroller.width;
    }

    //Move canvas to the end.
    if ((difference < 0) && (this.getScrollDirection() == "rtl")) {
	scroller.x = this.scroller.width;
	scroller.x = scroller.x - (-difference);
	this.adjustCanvas(i);
    }
    //Move canvas to the beginning.
    else if ((difference > 0) && (this.getScrollDirection() == "ltr")) {
	scroller.x = -this.scroller.width;
	scroller.x = scroller.x - (-difference);
	this.adjustCanvas(i);
    }
}
//Draw entire Scroller piece onto scroller at 0, 0.
HorizontalScroll.prototype.drawCanvas = function(x, i) {
    var canvas = this.getScroller(i).canvas;
    
    this.context.save();
    this.context.translate(x, 0);
    this.context.drawImage(canvas, 0, 0, canvas.width, canvas.height);
    this.context.restore(); 
}
HorizontalScroll.prototype.setHoldTimer = function() {
    var self = this;
    
    clearTimeout(this.holdTimerID);

    //PUD is implemented by counting the number of items that have been shown.
    if (this.itemsCount > this.items.length - 1) {
	this.itemsCount = 0;
	$(this).trigger("done");
    }
    else {
	this.isHolding = true;
	this.isStopped = true;
	this.holdTimerID = setTimeout(function() {
	    self.isHolding = false;
	    self.isStopped = false;
	    self.itemsCount++;
	}, this.getDuration());    
    }
}
HorizontalScroll.prototype.handleMouseDown = function(event) {
    this.mouseDown = true;
    this.lastMouseX = event.clientX;
}
HorizontalScroll.prototype.handleMouseUp = function(event) {
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
HorizontalScroll.prototype.handleMouseOut = function(event) {
    this.mouseDown = false;
}
HorizontalScroll.prototype.handleMouseMove = function(event) {
    if (!this.mouseDown) {
	return;
    }
    
    clearTimeout(this.holdTimerID);
    this.isHolding = false;
    
    var newX = event.clientX,
	deltaX = this.lastMouseX - newX,
	difference;
    
    this.mouseMove = true;
    this.context.clearRect(0, 0, this.scroller.width, this.scroller.height);
    
    for (var i = 0; i < this.getScrollers().length; i++) {
	var scroller = this.getScroller(i);
	
	scroller.x = scroller.x - deltaX;
	
	if (this.getScrollDirection() == "rtl") {
	    if (deltaX > 0) {	//Swipe left
		difference = scroller.x + this.scroller.width;
		
		if (difference < 0) {
		    scroller.x = this.scroller.width;
		    scroller.x = scroller.x - (-difference);		
		    this.adjustCanvas(i, "rtl");
		}
	    }
	    else if (deltaX < 0) {	//Swipe right
		difference = scroller.x - this.scroller.width;
		
		if (difference > 0) {
		    scroller.x = -this.scroller.width;
		    scroller.x = scroller.x - (-difference);		
		    this.adjustCanvas(i, "ltr");
		}
	    }
	    
	    //Flag hold position(s) as having been held when swiping past it.
	    for (var j = 0; j < scroller.holdPositions.length; j++) {
		if ((scroller.x <= -scroller.holdPositions[j].position) && !scroller.holdPositions[j].wasHeld) {
		    scroller.holdPositions[j].wasHeld = true;
		}
	    }
	}
	else {	//right
	    if (deltaX > 0) {	//Swipe left
		difference = scroller.x + this.scroller.width;
		
		if (difference < 0) {
		    scroller.x = this.scroller.width;
		    scroller.x = scroller.x - (-difference);		
		    this.adjustCanvas(i, "rtl");
		}
	    }
	    else if (deltaX < 0) {	//Swipe right
		difference = scroller.x - this.scroller.width;
		
		if (difference > 0) {
		    scroller.x = -this.scroller.width;
		    scroller.x = scroller.x - (-difference);		
		    this.adjustCanvas(i, "ltr");
		}
	    }
	    
	    //Flag hold position(s) as having been held when swiping past it.
	    //Prevent scroller from snapping back to hold position if user has swiped past it.
	    for (var j = 0; j < scroller.holdPositions.length; j++) {
		if ((scroller.x <= -scroller.holdPositions[j].position) && !scroller.holdPositions[j].wasHeld && scroller.writeDirection == "forward") {
		    scroller.holdPositions[j].wasHeld = true;
		}
		else if ((scroller.x >= scroller.holdPositions[j].position) && !scroller.holdPositions[j].wasHeld && scroller.writeDirection == "backward") {
		    scroller.holdPositions[j].wasHeld = true;
		}
	    }
	}
	
	this.drawCanvas(scroller.x, i);
    }
    
    this.isStopped = false;
    this.lastMouseX = newX;
}
HorizontalScroll.prototype.tick = function() {
    var self = this;
    
    this.request = requestAnimFrame(function() {
	self.tick();
    });
    
    if (this.getScrollBy() == "item") {
	this.drawSceneByItem();
    }
    else {
	this.drawScene();
    }
}
HorizontalScroll.prototype.pause = function() {
    cancelRequestAnimFrame(this.request); 
}
HorizontalScroll.prototype.updateItem = function(index, data, callback) {
    var self = this,
	oldItem = this.items[index],
	newItem = null;
    
    if (!oldItem) {
	console.log(index);
    }
    else {
	this.totalWidth -= oldItem.getWidth();
	this.items[index] = null;
	oldItem.destroy();

	newItem = new Item(data, this.scroller, this.getSpacing(), this.getScrollDirection(), index);
	newItem.initialize(function() {
	    self.items[index] = this;
	    self.totalWidth += this.getWidth();
	    newItem = null;
	    
	    if (callback) {
		callback();
	    }
	});
    }
}