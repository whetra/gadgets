function CoverFlow(imageProps, onLastPhotoShown) {
    var prefs = new gadgets.Prefs();
    
    this.duration = prefs.getInt("duration") * 1000;
    this.interactivityTimeout = prefs.getInt("interactivityTimeout");
    this.imageProps = imageProps;
    this.onLastPhotoShown = onLastPhotoShown;
    this.autoAdvance = false;
    this.advancePhotos = null;
    this.interactivityTimer = null;
    this.isPaused = false;
    this.timeLeft = 0;
    this.startTimeout = new Date();
    this.cf = null;
    this.isLoading = true;
    this.isInitialLoad = true;
    this.imageCount = 0;
}
CoverFlow.prototype.setPhotos = function(imageProps) {
    this.imageProps = imageProps;
};
//Render the UI for the cover flow. When this is called after the feed has been refreshed,
//a separate cover flow is populated in the background. Once it is ready, the old cover flow
//is removed and the new one is shown.
CoverFlow.prototype.render = function(onRendered, photoAlbum) {
    var self = this,
	totalImages = this.imageProps.length;    
    
    if (this.isInitialLoad) {
	var prefs = new gadgets.Prefs(),
	    $oldContentFlow = $(".ContentFlow"),
	    $contentFlow = $("<div>"),
	    $loadIndicator = $("<div>"),
	    $indicator = $("<div>"),
	    $flow = $("<div>"),
	    $globalCaption = $("<div>"),
	    rsW = prefs.getInt("rsW"),
	    rsH = prefs.getInt("rsH"),
	    showNavigation = prefs.getBool("showNavigation"),
	    showCaptions = prefs.getBool("showCaptions"),
	    scrollbarThickness = prefs.getInt("scrollbarThickness"),
	    scrollbarColor = prefs.getString("scrollbarColor");
    
	$contentFlow.attr("id", "cf");
	$contentFlow.addClass("ContentFlow");
	$loadIndicator.addClass("loadIndicator");
	$indicator.addClass("indicator");
	$flow.addClass("flow");
	$globalCaption.addClass("globalCaption");
	$loadIndicator.append($indicator);
	$contentFlow.append($loadIndicator);
	$contentFlow.append($flow);
	$contentFlow.append($globalCaption);
	$("#container").append($contentFlow);
	
	//Configure scrollbar.
	if (showNavigation) {
	    var $scrollbar = $("<div>"),
		$slider = $("<div>"),
		$position = $("<div>"),
		$hr = $("<hr>");
		
	    $scrollbar.addClass("scrollbar");
	    $slider.addClass("slider");
	    $position.addClass("position");
	    
	    $slider.css({
		"background": scrollbarColor,
		"width" : scrollbarThickness + "px",
		"height": scrollbarThickness + "px",
		"-webkit-border-radius": (scrollbarThickness * 2) + "px",
		"-moz-border-radius": (scrollbarThickness * 2) + "px",
		"border-radius": (scrollbarThickness * 2) + "px"
	    });
	    $hr.css({
		"color": scrollbarColor
	    });
	    $position.css({
		"color": scrollbarColor
	    });
	    
	    $slider.append($position);
	    $scrollbar.append($hr);
	    $scrollbar.append($slider);
	    $contentFlow.append($scrollbar);
	}
    
	if (rsW > rsH) {
	    //Set maxItemHeight to rsH / 2 to ensure that flow div does not get larger than height of Placeholder. Dividing it by 2 was somewhat random.
	    this.cf = new ContentFlow("cf", {
		flowSpeedFactor: 2.0,
		scaleFactor: 2.0,
		maxItemHeight: $("#container").height() / 2,	//Issue 554 - Reflection shifts if the area for displaying the reflection is not large enough.
		//relativeItemPosition: "center",	//Issue 554
		reflectionHeight: 0.0
	    });
	}
	else {
	    this.cf = new ContentFlow("cf", {
		flowSpeedFactor: 2.0,
		scaleFactor: 2.0,
		relativeItemPosition: "center",
		reflectionHeight: 0.0
	    });
	}
	
	$.each(this.imageProps, function(index, value) {
	    //Add all images.
	    self.addImage(self.imageProps[index].caption, "last", value.src, $contentFlow, function() {
		self.imageCount++;
	    
		//Add all images.
		if (self.imageCount == totalImages) {
		    self.imageCount = 0;
		    self.isInitialLoad = false;
		    self.autoAdvance = true;
		    self.cf.moveTo("first", self.onMoved);
		    self.configureSwipe();
		    $("#container").append($contentFlow);
		    
		    //If there's only one image, onMoved will not fire. Fire it manually.
		    if (self.cf.getNumberOfItems() == 1) {
			self.onMoved(self);
		    }
		    
		    //Show scrollbar indicator again as it's hidden when adding items.
		    $(".slider").css("visibility", "visible");
		}
	    });
	});
    }
    else {	//ContentFlow elements and object already created.
	var imageChanged = false,
	    newImages = [],
	    oldImages = [];
	
	$.each(this.imageProps, function(index, value) {
	    var coverFlowItem = self.cf.getItem(index),
		oldImageCount = self.cf.getNumberOfItems();
	    
	    //Remove any images that may have been deleted from the feed.
	    for (var i = oldImageCount; i > totalImages; i--) {
		self.cf.rmItem(i);
	    }
	    
	    if (index < oldImageCount) {	//Image already exists at this index.
		if (self.cf.getItemSrc(index) == value.src) {
		    //Keep track of the indexes for the images that have not changed.
		    oldImages.push(index);
		}
		else {	//Image returned by feed is not the same one displayed at this position in the cover flow.
		    newImages.push({
			src: value.src,
			caption: self.imageProps[index].caption});
		    imageChanged = true;
		}
	    }
	    else {	//Item doesn't exist in cover flow. Append a new item for this image.
		newImages.push({
		    src: value.src,
		    caption: self.imageProps[index].caption});
		imageChanged = true;
	    }
	    
	    if (index == totalImages - 1) {
		//If any image has changed, remove them all from the cover flow and re-populate.
		//We can't add and remove individually, because these are asynchronous operations.
		if (imageChanged) {
		    var count = 0,
			matchFound = false,
			numItems = self.cf.getNumberOfItems();
		    
		    for (var i = 0; i < newImages.length; i++) {
			//Add all images.
			self.addImage(newImages[i].caption, "last", newImages[i].src, $(".ContentFlow"), function() {
			    count++;

			    if (count == newImages.length) {	//All new images have been added.
				//Now remove the old one's.
				for (var j = 0; j < numItems; j++) {
				    for (var k = 0; k < oldImages.length; k++) {
					if (j == oldImages[k]) {
					    matchFound = true;
					    break;
					}
				    }
				    
				    if (!matchFound) {
					self.cf.rmItem(0);
				    }
				    
				    matchFound = false;
				}
		    
				self.cf.moveTo("first");	//This calls onMoveTo in ContentFlow, which starts interactivity timer.
								//Problem if Interactivity Timeout is not the same as the Duration.
				$(".slider").css("visibility", "visible");	//Show scrollbar indicator again as it's hidden when adding items.
			    }
			});
		    }
		}
		else {
		    self.cf.moveTo("first");	//Same problem as above.
		}
	    }
	});
	
	this.play();
    }
}
CoverFlow.prototype.addImage = function(caption, position, src, $contentFlow, callback) {
    var $item = $("<div>"),
	$content = $("<img>"),
	totalImages = this.imageProps.length,
	showCaptions = prefs.getBool("showCaptions"),
	self = this;
	
    $item.addClass("item");
    $content.addClass("content");

    if (showCaptions) {
	var $caption = $("<div>");
	$caption.addClass("caption");
	$caption.addClass("caption_font-style");
	$caption.text(caption);
    }
    
    //Append image once it has loaded.
    $content.load(function() {
	$item.append($content);
	
	if ($caption) {
	    $item.append($caption);
	}
	
	//Add image as last item in cover flow.
	self.cf.addItem($item.get(0), position, function() {
	    if (callback) {
		callback();
	    }
	});
    });
    
    $content.error(function() {
	console.log("Image could not be loaded: " + src);
	self.imageCount++;
    });
    
    $content.attr("src", src);
}
CoverFlow.prototype.configureSwipe = function() {
    var self = this;
    var swipeOptions = {
	swipe: function(event, direction) {
	    if (direction == "left" || direction == "right") {
		self.showNextPhoto(direction);
	    }
	},
	threshold:50
    }
    
    $(".ContentFlow").swipe(swipeOptions);
}
CoverFlow.prototype.onMoved = function(self) {
    if (self.isLoading) {
	window.photoAlbum.onRendered(window.photoAlbum);
	self.isLoading  = false;
    }
}
CoverFlow.prototype.showNextPhoto = function(direction) {
    var nextIndex;
    
    if (direction) {
	if (direction == "left") {
	    nextIndex = this.cf.getActiveItem().index + 1;
	}
	else {
	    nextIndex = this.cf.getActiveItem().index - 1;
	}
    }
    else {
	nextIndex = this.cf.getActiveItem().index + 1;
    }
    //Re-load when last image starts to show, then show new div on next iteration.
    if (nextIndex > this.imageProps.length - 1) {
	this.autoAdvance = true;
	this.timeLeft = null;
	this.isLoading = true;
	this.onLastPhotoShown.call(window.photoAlbum);	//Fire callback to refresh feed.
    }
    else {
	this.autoAdvance = true;
	this.cf.moveTo(nextIndex);
    
	if (!this.isPaused) {
	    this.startTimer();
	}
    }
}
CoverFlow.prototype.play = function() {
    this.isPaused = false;
    
    if (this.duration > 0) {
	this.resumeTimer();
    }
}
CoverFlow.prototype.pause = function() {
    this.isPaused = true;
    
    if (this.duration > 0) {
	this.pauseTimer();
    }
}
CoverFlow.prototype.startTimer = function() {
    var self = this;
    
    this.advancePhotos = setTimeout(function() {
	self.showNextPhoto();
    }, this.duration);

    if (!this.isPaused) {
	this.startTimeout = new Date();
    }
}
CoverFlow.prototype.resumeTimer = function() {
    var self = this;

    if (!this.timeLeft) {
	this.timeLeft = this.duration;
    }
    
    this.advancePhotos = setTimeout(function() {
	self.showNextPhoto();
    }, this.timeLeft);
}
CoverFlow.prototype.pauseTimer = function() {
    var seconds;
    
    clearTimeout(this.advancePhotos);
    this.timeLeft = this.duration;
    this.timeLeft -= new Date() - this.startTimeout;

    //Round to nearest second, since duration is counted in seconds.
    seconds = Math.round(this.timeLeft / 1000);
    this.timeLeft = seconds * 1000;

    //Show next entry.
    if (seconds <= 0) {
	this.timeLeft = 0;
    }
}