function Collage(onLastPhotoShown) {
    this.onLastPhotoShown = onLastPhotoShown;
    this.current = 0;
    this.totalImages = 0;
    this.timeLeft = 0;
    this.timerID = null;
    this.isFirstCycle = true;
    this.isPaused = false;
    this.zoom = 150;
    this.startTimeout = new Date();
    this.duration = new gadgets.Prefs().getInt("duration") * 1000;
}
Collage.prototype.initialize = function() {
    var $gallery = $("<div>");
    $gallery.attr("id", "gallery");
    $("#container").append($gallery);
}
Collage.prototype.addImage = function(imageProps) {
    var $div = $("<div>"),
	$image = $("<img>"),
	galleryWidth = $("#gallery").width(),
	galleryHeight = $("#gallery").height(),
	offsetLeft = 0,
	offsetBottom = 0,
	degrees = Math.floor(Math.random() * 40) - 20,
	rotations = "rotate(" + degrees + "deg)",
	showCaptions = new gadgets.Prefs().getBool("showCaptions");
	
    $div.addClass("new");
    $image.addClass("new");
    $image.width(imageProps.width + this.zoom);
    $image.height(imageProps.height + this.zoom);	
    $image.attr("src", imageProps.src);

    if (imageProps.caption && showCaptions) {
	var $caption = $("<span>");
	$caption.addClass("caption caption_font-style");
	$caption.text(imageProps.caption);
	$div.append($caption);
    }
    
    $div.append($image);
    //Prepend each image so that it's easier to keep track of both old and new images in order to remove old images and show new one's.
    $("#gallery").prepend($div);
    
    //Ensure that no more than half the image will be cut off by the edge of the Placeholder.
    offsetLeft = Math.floor(Math.random() * galleryWidth) - (imageProps.width / 2);
    offsetBottom = Math.floor(Math.random() * galleryHeight) - (imageProps.height / 2);
    
    $image.parent().css({
	"left" : offsetLeft  + "px",
	"bottom" : offsetBottom  + "px",
	"transform" : rotations,
	"-moz-transform" : rotations,
	"-ms-transform" : rotations,
	"-o-transform" : rotations,
	"-webkit-transform" : rotations
    }).attr({
	height : $image.height() + this.zoom,
	width : $image.width() + this.zoom
    });
    
    this.totalImages++;
}
Collage.prototype.showNextPhoto = function() {
    var self = this,
	$photo = $("#gallery div").eq(this.current);
	
    //Assign all of the current images a class of 'old' and remove the 'new' class.
    //Older images will have a lower z-index so that newer images will always be shown on top.
    if (this.current > this.totalImages - 1) {
	$(".new").toggleClass("old new");
	this.current = 0;
	this.totalImages = 0;
	this.timeLeft = null;
	this.isFirstCycle = false;
	this.onLastPhotoShown.call(window.photoAlbum);	//Fire callback to refresh feed.
    }
    else {
	//Remove old image after the Gadget has cycled through once.
	if (!this.isFirstCycle) {
	    $("#gallery div").eq(this.totalImages).fadeOut("fast", function() {
		$(this).remove();
	    });
	}
	
	$photo.animate({
	    height: "-=" + this.zoom + "px",
	    width: "-=" + this.zoom + "px",
	    opacity: 1.0,
	    leaveTransforms: true
	}, 1000);	//Need to check that this is not larger than duration.
	$("#gallery img").eq(this.current).animate({
	    height: "-=" + this.zoom + "px",
	    width: "-=" + this.zoom + "px",
	    opacity: 1.0,
	    leaveTransforms: true
	}, 1000);	//Need to check that this is not larger than duration.

	this.current++;
	
	if (!this.isPaused) {
	    this.startTimer();
	}
    }
}
Collage.prototype.play = function() {
    this.isPaused = false;
    
    if (this.duration > 0) {
	this.resumeTimer();
    }
}
Collage.prototype.pause = function() {
    this.isPaused = true;
    
    if (this.duration > 0) {
	this.pauseTimer();
    }
}
Collage.prototype.startTimer = function() {
    var self = this;
    
    this.timerID = setTimeout(function() {
	self.showNextPhoto();
    }, this.duration);

    if (!this.isPaused) {
	this.startTimeout = new Date();
    }
}
Collage.prototype.resumeTimer = function() {
    var self = this;

    if (!this.timeLeft) {
	this.timeLeft = this.duration;
    }

    this.timerID = setTimeout(function() {
	self.showNextPhoto();
    }, this.timeLeft);
}
Collage.prototype.pauseTimer = function() {
    var seconds;
    
    clearTimeout(this.timerID);
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