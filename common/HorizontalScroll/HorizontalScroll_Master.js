/* HorizontalScroll.js */
function HorizontalScroll(settings, data) {
    this.scroller = document.createElement("canvas");
    this.scroller.id = "scroller"
    this.scroller.width = settings.width;
    this.scroller.height = settings.height;
    //this.scroller.height = 125;
    this.context = this.scroller.getContext("2d");
    this.data = data;
    this.totalPixels = 0;
    this.spacing = settings.spacing;
    this.isHolding = false;
    this.isLoading = true;
    this.isStopped = false;
    this.scrollers = [];
    this.items = [];
    this.previousItemIndex = -1;
    this.itemCount = 0;
    this.currentItemIndex = 0;
    this.dataIndex = 0;
    this.scrollBy = settings.scrollBy;
    this.scrollDirection = settings.scrollDirection;
    this.duration = settings.duration;
    this.interactivityTimeout = settings.interactivityTimeout;
    this.interactivityTimerID = null;
    this.mouseDown = false;
    this.mouseMove = false;
    this.lastMouseX = 0;
    
    //Number of pixels to move per each redraw.
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
    else {
	this.speed = 3;	//Backwards compatability.
    }
    
    if (settings.scrollDirection == "ltr") {
	this.speed = -this.speed;
    }
        
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
	if (this.scrollDirection == "rtl") {
	    this.scrollers[i] = new Scroller(i * this.scroller.width, this.scroller.width, this.scroller.height);
	}
	else {
	    this.scrollers[i] = new Scroller(-i * this.scroller.width, this.scroller.width, this.scroller.height);
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
    var item = new Item(this.data[this.currentItemIndex], this.scroller, this.spacing, this.scrollDirection),
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
	for (var i = 0; i < this.scrollers.length; i++) {
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
    var itemPosition = 0,
	isCopied = false,
	isMovingForward = true;
    
    if (!swipeDirection) {	//Auto-scroll
	swipeDirection = this.scrollDirection;
    }
    
    if (this.scrollDirection == "rtl") {
	if (swipeDirection == "rtl") {
	    this.scrollers[i].writeDirection = "forward";
	}
	else {
	    this.scrollers[i].writeDirection = "backward";
	}
    }
    else {
	if (swipeDirection == "rtl") {
	    this.scrollers[i].writeDirection = "backward";
	}
	else {
	    this.scrollers[i].writeDirection = "forward";
	}
    }
    
    if (this.scrollBy == "item") {
	var j, index;
	
	//Get position at which to start copying based on position of other scroller at which copying was stopped.
	this.scrollers[i].holdPositions = [];
	itemPosition = this.getItemPosition(this.getNextScrollerIndex(i), swipeDirection);
	
	//Copy until the scroller is filled, or until we have finished copying all of the text associated with the current ID.
	while (this.scrollers[i].totalPixelsCopied < this.scrollers[i].canvas.width) {
	    if (this.scrollers[i].totalPixelsCopied == 0) {
		if (((this.scrollDirection == "rtl") && (swipeDirection == "rtl")) || ((this.scrollDirection == "ltr") && (swipeDirection == "rtl"))) {
		    //Save the index of the first item that is being copied.
		    this.scrollers[i].startCanvasIndex = this.currentItemIndex;
		    this.scrollers[i].startCanvasItem = this.items[this.currentItemIndex];
		}
		else {
		    this.scrollers[i].endCanvasIndex = this.currentItemIndex;
		    this.scrollers[i].endCanvasItem = this.items[this.currentItemIndex];
		}
	    }
	    
	    if (this.currentItemIndex != this.previousItemIndex) {
		if (this.scrollDirection == "rtl") {
		    if (swipeDirection == "rtl") {
			if (this.scrollers[i].writeDirection == "forward") {
			    this.scrollers[i].holdPositions.push({position: this.scrollers[i].writePosition, wasHeld: false});
			}
		    }
		    else {
			if (itemPosition != 0) {
			    this.scrollers[i].holdPositions.push({position: this.scrollers[i].writePosition, wasHeld: false});
			}
		    }
		}
		else {
		    this.scrollers[i].holdPositions.push({position: this.scrollers[i].writePosition, wasHeld: false});
		}
	    }
    
	    if (this.scrollDirection == "rtl") {
		if (swipeDirection == "rtl") {
		    isCopied = this.scrollers[i].drawCanvasFromStart(this.items[this.currentItemIndex].canvas, itemPosition, this.scrollDirection);

		    //If the scroller is filled and the ending position is 0, move to the next item.
		    if (this.scrollers[i].endCanvasPosition == 0 && this.scrollers[i].writePosition == 0) {
			this.setNextItem(this.currentItemIndex);
		    }	    
		    
		    this.scrollers[i].endCanvasIndex = this.currentItemIndex;
		    this.scrollers[i].endCanvasItem = this.items[this.currentItemIndex];
		}
		else {
		    isCopied = this.scrollers[i].drawCanvasFromEnd(this.items[this.currentItemIndex].canvas, itemPosition);
		    this.scrollers[i].startCanvasIndex = this.currentItemIndex;
		    this.scrollers[i].startCanvasItem = this.items[this.currentItemIndex];
		}
	    }
	    else {
		if (swipeDirection == "ltr") {
		    isCopied = this.scrollers[i].drawCanvasFromEnd(this.items[this.currentItemIndex].canvas, itemPosition, this.scrollDirection);
		    this.scrollers[i].startCanvasIndex = this.currentItemIndex;
		    this.scrollers[i].startCanvasItem = this.items[this.currentItemIndex];
		}
		else {
		    isCopied = this.scrollers[i].drawCanvasFromStart(this.items[this.currentItemIndex].canvas, itemPosition, this.scrollDirection);
		    this.scrollers[i].endCanvasIndex = this.currentItemIndex;
		    this.scrollers[i].endCanvasItem = this.items[this.currentItemIndex];
		}
	    }
	    
	    if (isCopied) {	//This item has been copied. Copy the next item if it shares the same id.
		if (this.scrollers[i].writeDirection == "forward") {
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
	
	while (this.scrollers[i].totalPixelsCopied < this.scrollers[i].canvas.width) {
	    //Save the index of the first canvas that is being copied.
	    if (this.scrollers[i].totalPixelsCopied == 0) {
		if (((this.scrollDirection == "rtl") && (swipeDirection == "rtl")) || ((this.scrollDirection == "ltr") && (swipeDirection == "rtl"))) {
		    this.scrollers[i].startCanvasIndex = this.currentItemIndex;
		}
		else {
		    this.scrollers[i].endCanvasIndex = this.currentItemIndex;
		}
	    }

	    if (this.scrollDirection == "rtl") {
		if (swipeDirection == "rtl") {
		    isCopied = this.scrollers[i].drawCanvasFromStart(this.items[this.currentItemIndex].canvas, itemPosition, this.scrollDirection);
		}
		else {
		    isCopied = this.scrollers[i].drawCanvasFromEnd(this.items[this.currentItemIndex].canvas, itemPosition, this.scrollDirection, this.scrollers[this.getNextScrollerIndex(i)].writeDirection);
		}
	    }
	    else {
		if (swipeDirection == "rtl") {
		    isCopied = this.scrollers[i].drawCanvasFromStart(this.items[this.currentItemIndex].canvas, itemPosition, this.scrollDirection);
		}
		else {
		    isCopied = this.scrollers[i].drawCanvasFromEnd(this.items[this.currentItemIndex].canvas, itemPosition, this.scrollDirection, this.scrollers[this.getNextScrollerIndex(i)].writeDirection);
		}
	    }
	
	    if (isCopied) {
		if (this.scrollers[i].writeDirection == "forward") {
		    this.setNextItem(this.currentItemIndex);
		}
		else {
		    this.setPreviousItem(this.currentItemIndex);
		}
	    }
	    
	    itemPosition = 0;
	}
	
	//Save the index of the last canvas that is being copied.
	if (((this.scrollDirection == "rtl") && (swipeDirection == "rtl")) || ((this.scrollDirection == "ltr") && (swipeDirection == "rtl"))) {
	    this.scrollers[i].endCanvasIndex = this.currentItemIndex;
	}
	else {
	    this.scrollers[i].startCanvasIndex = this.currentItemIndex;
	}
    }
    
    this.isLoading = false;
    this.scrollers[i].totalPixelsCopied = 0;
}
HorizontalScroll.prototype.getItemPosition = function(j, swipeDirection) {
    var itemPosition;

    if (this.scrollDirection == "rtl") {
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
    
    itemPosition = this.scrollers[j].startCanvasPosition;
    this.currentItemIndex = this.scrollers[j].startCanvasIndex;
    
    if (this.scrollDirection == "rtl" && swipeDirection == "ltr") {
	//If we're at the very beginning of a canvas, move to the previous canvas.
	if (itemPosition == 0) {
	    this.setPreviousItem(this.scrollers[j].startCanvasIndex);
	}
    }
    else if (this.scrollDirection == "ltr" && swipeDirection == "ltr") {
	//If we're at the very beginning of a canvas, move to the previous canvas.
	if (!this.isLoading) {
	    if (itemPosition == 0) {
		this.setNextItem(this.scrollers[j].startCanvasIndex);
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
    
    this.currentItemIndex = this.scrollers[j].endCanvasIndex;
    itemPosition = this.scrollers[j].endCanvasPosition;
    
    if (this.scrollDirection == "ltr" && swipeDirection == "rtl") {
	if (itemPosition == this.items[this.currentItemIndex].canvas.width) {
	    this.setPreviousItem(this.scrollers[j].endCanvasIndex);
	    itemPosition = 0;
	}
    }
    else if (this.scrollDirection == "rtl" && swipeDirection == "rtl") {
	//If we're at the very end of a canvas, move to the next canvas.
	if (itemPosition == this.items[this.currentItemIndex].canvas.width) {
	    this.setNextItem(this.scrollers[j].endCanvasIndex);
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
    
    if (next >= this.scrollers.length) {
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
    
    if (!this.mouseDown && !this.isStopped) {
	this.context.clearRect(0, 0, this.scroller.width, this.scroller.height);
	
	for (var i = 0; i < this.scrollers.length; i++) {
	    var scroller = this.scrollers[i];
	    
	    scroller.x = scroller.x - this.speed;
	    
	    if (this.scrollDirection == "rtl") {
		difference = scroller.x + this.scroller.width;
	    }
	    else {
		difference = scroller.x - this.scroller.width;
	    }
	    
	    if ((difference < 0) && (this.scrollDirection == "rtl")) {
		//Move canvas to the end.
		scroller.x = this.scroller.width;
		scroller.x = scroller.x - (-difference);
		this.adjustCanvas(i);
	    }
	    else if ((difference > 0) && (this.scrollDirection == "ltr")) {
		//Move canvas to the start.
		scroller.x = -this.scroller.width;
		scroller.x = scroller.x - (-difference);
		this.adjustCanvas(i);
	    }
	    
	    this.drawCanvas(scroller.x, i);    	    		
	}
	
	this.totalPixels = this.totalPixels + Math.abs(this.speed);
	
	//PUD is implemented by counting the number of pixels that have been scrolled.
	if (this.totalPixels > this.totalWidth) {
	    this.totalPixels = this.totalPixels - this.totalWidth;
	    $(this).trigger("done");
	}
    }
}
HorizontalScroll.prototype.drawSceneByItem = function() {
    if (!this.mouseDown && !this.isStopped) {
	var difference = 0;
	
	//Check if either of the Scrollers should be held.
	for (var i = 0; i < this.scrollers.length; i++) {
	    var scroller = this.scrollers[i];
	    
	    if (scroller.holdPositions.length > 0) {
		for (var j = 0; j < scroller.holdPositions.length; j++) {
		    if ((scroller.x <= -scroller.holdPositions[j].position) && !scroller.holdPositions[j].wasHeld && this.scrollDirection == "rtl") {
			//Position scroller at the hold position.
			difference = scroller.x + scroller.holdPositions[j].position;
			scroller.x = -scroller.holdPositions[j].position;
			this.holdScroller(scroller, i, j);
			
			break;
		    }
		    else if ((scroller.x >= scroller.holdPositions[j].position) && !scroller.holdPositions[j].wasHeld && this.scrollDirection == "ltr") {
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
		    
		    this.scrollers[index].x = this.scrollers[index].x - difference;
		    this.moveCanvas(i);
		    this.drawCanvas(this.scrollers[index].x, index);
			
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
	    
	    for (var i = 0; i < this.scrollers.length; i++) {
		var scroller = this.scrollers[i],
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
    var scroller = this.scrollers[i],
	difference;
    
    if (this.scrollDirection == "rtl") {
	difference = scroller.x + this.scroller.width;
    }
    else {
	difference = scroller.x - this.scroller.width;
    }

    //Move canvas to the end.
    if ((difference < 0) && (this.scrollDirection == "rtl")) {
	scroller.x = this.scroller.width;
	scroller.x = scroller.x - (-difference);
	this.adjustCanvas(i);
    }
    //Move canvas to the beginning.
    else if ((difference > 0) && (this.scrollDirection == "ltr")) {
	scroller.x = -this.scroller.width;
	scroller.x = scroller.x - (-difference);
	this.adjustCanvas(i);
    }
}
//Draw entire Scroller piece onto scroller at 0, 0.
HorizontalScroll.prototype.drawCanvas = function(x, i) {
    var canvas = this.scrollers[i].canvas;
    
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
	}, this.duration);    
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
    
    for (var i = 0; i < this.scrollers.length; i++) {
	var scroller = this.scrollers[i];
	
	scroller.x = scroller.x - deltaX;
	
	if (this.scrollDirection == "rtl") {
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
    
    if (this.scrollBy == "item") {
	this.drawSceneByItem();
    }
    else {
	this.drawScene();
    }
}
HorizontalScroll.prototype.pause = function() {
    cancelRequestAnimFrame(this.request); 
}
HorizontalScroll.prototype.updateItem = function(data) {
    var self = this,
	oldItem = null,
	newItem = null;
	
    if (data.length > 0) {
	this.isStopped = true;
	oldItem = this.items[this.dataIndex];
	
	//Item exists at this location. Replace it with the new one.
	if (oldItem) {
	    //Remove all traces of old item.
	    this.totalWidth -= oldItem.getWidth();
	    this.items[this.dataIndex] = null;
	    oldItem.destroy();
    
	    //New item replaces old item.
	    newItem = new Item(data.shift(), this.scroller, this.spacing, this.scrollDirection, this.dataIndex);
	    newItem.initialize(function() {
		self.items[self.dataIndex] = this;
		self.totalWidth += this.getWidth();
		newItem = null;
		
		self.dataIndex++;
		self.updateItem(data);
	    });
	}
	//No existing item, so just add the new one. This would occur if new rows were added.
	else {
	    newItem = new Item(data.shift(), this.scroller, this.spacing, this.scrollDirection, this.dataIndex);
	    newItem.initialize(function() {
		self.items.push(this);
		self.totalWidth += this.getWidth();
		newItem = null;
		
		self.dataIndex++;
		self.updateItem(data);
	    });
	}
    }
    else {
	var totalItems = this.items.length;
	
	//If there are still more existing items, remove them. This would occur if existing rows were deleted.
	for (var i = totalItems - 1; i >= this.dataIndex; i--) {
	    oldItem = this.items[i];
	    this.totalWidth -= oldItem.getWidth();
	    this.items.pop();
	    oldItem.destroy();
	}
	
	this.dataIndex = 0;
	this.isStopped = false;
    }
}
/* Scroller.js */
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
	if (width > 0) {
	    imageData = context2D.getImageData(currentItemPosition, 0, width, canvas.height);
	}
	
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
    if (imageData) {
	this.context.putImageData(imageData, this.writePosition, 0);
    }
    
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

/* Item.js */
var svgCanvases = [];

function Item(data, scroller, spacing, scrollDirection, position, isRefreshing) {
    this.canvas = document.createElement("canvas");
    this.canvas.className = "item";
    this.context = this.canvas.getContext("2d");
    this.context.canvas.height = scroller.height;
    
    this.data = data;	//Array of JSON objects representing contents to be drawn for a single item.
    this.index = 0;
    this.width = 0;
    this.writePosition = 0;
    this.scroller = scroller;
    this.spacing = spacing;
    this.scrollDirection = scrollDirection;
    this.isRefreshing = isRefreshing;
    this.dataIndex = 0;
    
    if (typeof position === "undefined") {
	this.position = -1;
    }
    else {
	this.position = position;
    }
}
Item.prototype.getWidth = function() {
    return this.context.canvas.width;
}
Item.prototype.initialize = function(callback) {
    this.callback = callback;
    this.getImage();
}
Item.prototype.getImage = function() {
    var self = this,
	data = this.data[this.dataIndex];
    
    if (data) {
	//Check if there are any images to load.
	if (data.type == "image") {
	    this.index = this.dataIndex;
	    
	    //First check if the image has been cached.
	    if (svgCanvases.length > 0) {
		$.each(svgCanvases, function(index, canvas) {
		    if (canvas.url == data.value) {
			data.svg = svgCanvases[index].canvas;
			return false;
		    }
		});
		
		if (data.svg) {
		    this.width += data.svg.width + this.spacing;
		    this.dataIndex++;
		    this.getImage();
		}
		else {
		    this.loadImage(data.value);
		}
	    }
	    else {
		this.loadImage(data.value);
	    }
	}
	else {	//Text
	    this.createTempText(this.data[this.dataIndex].value, this.data[this.dataIndex].fontRule);
	    this.dataIndex++;
	    this.getImage();
	}
    }
    else {	//All images loaded.
	this.drawCanvas();
    }
}
Item.prototype.loadImage = function(url) {
    var params = {},
	self = this;
	
    //Need to use makeRequest to get around cross-domain issues for loading SVG images.
    params[gadgets.io.RequestParameters.CONTENT_TYPE] = gadgets.io.ContentType.TEXT;
    gadgets.io.makeRequest(url, function(obj) {
	//Save the SVG data.
	if (obj.data) {
	    var data = self.data[self.dataIndex];
	    
	    data.svg = obj.data;
	    self.createTempImage(self.dataIndex, data.svg, data.value);
	}
	
	self.dataIndex++;
	self.getImage();
    }, params);
    
    //Load regular images.
//    var image = new Image();
//    
//    image.onload = function() {
//	callback(this);
//    };
//    image.onerror = function(e) {
//	callback(this);
//    };	
//    image.crossOrigin = 'anonymous'; // no credentials flag
//    image.src = this.logo;
//    this.image = image;
}
//Necessary for getting the width of the image when drawn onto the canvas.
Item.prototype.createTempImage = function(i, svg, url) {
    var svgCanvas = document.createElement("canvas"),	//Canvas on which the SVG image will be drawn.
	svgContext = svgCanvas.getContext("2d"),
	id = "svg";
   
    svgCanvas.id = id;
    svgCanvas.height = this.scroller.height - 10;	//Leave 5px of padding at top and bottom.
    svgCanvas.width = this.scroller.height - 10;		//Necessary in order for scaling to work.

    document.body.appendChild(svgCanvas);
    
    //Draw the image and scale the height to fill the scroller.
    canvg(id, svg, { scaleHeight: true, ignoreDimensions: true });
    
    this.width += svgCanvas.width + this.spacing;
    this.data[i].svg = svgCanvas;
    
    svgCanvases.push({
	"url": url,
	"canvas": svgCanvas
    });

    document.body.removeChild(svgCanvas);
}
Item.prototype.createImage = function(i, svg) {
    //Scale the non-SVG image if necessary.
//    var ratio = 1;
//   
//    if (this.image.height > scroller.height) {
//	ratio = scroller.height / this.image.height;
//    }
//    else if (this.image.width > scroller.width) {
//	ratio = scroller.width / this.image.width;
//    }

    //Draw the image after the text and starting 5px from the top.
    if (this.scrollDirection == "rtl") {
	this.context.drawImage(this.data[i].svg, 0, 0, this.data[i].svg.width, this.data[i].svg.height, this.writePosition, 5, this.data[i].svg.width, this.data[i].svg.height);
	this.writePosition += this.data[i].svg.width + this.spacing;
    }
    else {
	this.context.drawImage(this.data[i].svg, 0, 0, this.data[i].svg.width, this.data[i].svg.height, this.writePosition + this.spacing, 5, this.data[i].svg.width, this.data[i].svg.height);
	this.writePosition += this.data[i].svg.width + this.spacing;
    }
}
/* Text is written to a temporary canvas first so that the width of the text can be determined.
   This is then used to set the width of the actual canvas, which needs to be done before being written to. */
Item.prototype.createTempText = function(value, fontRule) {
    var textCanvas = document.createElement("canvas"),
	textContext = textCanvas.getContext("2d");
	
    this.writeText(value, fontRule, textContext);
    this.width += textContext.measureText(value).width + this.spacing;
}
/* Write the text to the actual canvas. */
Item.prototype.createText = function(value, fontRule) {
    this.writeText(value, fontRule, this.context);
    this.writePosition += this.context.measureText(value).width + this.spacing;
}
Item.prototype.writeText = function(text, fontRule, context) {
    var topOffset = context.canvas.height / 2,	//Y coordinate at which to being drawing (vertical alignment).
	rules, canvasFont;
    
    rules = this.parseCSSRule(fontRule);
    canvasFont = rules[3] + rules[2] + rules[0];

    context.font = canvasFont;
    context.strokeStyle = rules[1];
    context.textAlign = "left";
    context.textBaseline = "middle";
    
    context.save();
    context.translate(0, topOffset);
    
    context.fillStyle = rules[1];
    
    if (this.scrollDirection == "rtl") {
	context.fillText(text, this.writePosition, 0);
    }
    else {	//ltr
	context.fillText(text, this.writePosition + this.spacing, 0);
    }

    context.restore();
}
Item.prototype.drawCanvas = function() {
    var length = this.data.length;
    
    this.context.canvas.width = this.width;
    //this.context.canvas.style.display = "none";
    
    //Draw to canvas.
    for (var i = 0; i < length; i++) {
	if (this.data[i].type == "text") {
	    this.createText(this.data[i].value, this.data[i].fontRule);
	}
	else if (this.data[i].type == "image") {
	    if (this.data[i].svg) {
		this.createImage(i, this.data[i].svg);
	    }
	}
    }
    
    this.addCanvas();
    this.callback();
}
Item.prototype.addCanvas = function() {
    if (this.position != -1) {
	var $item = $(".item").eq(this.position);
	
	if ($item.length > 0) {
	    $(this.canvas).insertBefore($item);
	}
	else {	//Add it to the end.
	    document.body.appendChild(this.canvas);
	}
    }
    else {
	document.body.appendChild(this.canvas);
    }
}
Item.prototype.destroy = function() {
    document.body.removeChild(this.canvas);
    this.context = null;
    this.canvas = null;
    this.data = null;
    this.scroller = null;
    this.callback = null;
}
Item.prototype.getFontHeight = function(fontStyle) {
    var body = document.getElementsByTagName("body")[0],
	dummy = document.createElement("div"),
	dummyText = document.createTextNode("M"),
	result;
    
    dummy.setAttribute("style", fontStyle);
    body.appendChild(dummy);
    dummy.appendChild(dummyText);
    
    result = dummy.offsetHeight;
    
    dummy.removeChild(dummyText);
    body.removeChild(dummy);
    
    body = null;
    dummy = null;
    dummyText = null;
    
    return result;
}
//TODO: Find a better way to parse this and make this code common.
Item.prototype.parseCSSRule = function(fontRule) {
    var a = fontRule.indexOf("{"),
	b = fontRule.indexOf("}"),
	selector = fontRule.substring(0, a),
	rules = fontRule.substring(++a, b).split(";"),
	values = [];
    
    //Now remove property name and just keep the value.
    for (var i = 0; i < rules.length; i++) {
	values.push(rules[i].substring(rules[i].indexOf(":", 0) + 1));
    }

    return values;
}