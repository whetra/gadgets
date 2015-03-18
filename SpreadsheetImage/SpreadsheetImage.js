Function.prototype.bind = function() {
    if (arguments.length < 2 && arguments[0] === undefined) {
        return this;
    }
    var thisObj = this,
        args = Array.prototype.slice.call(arguments),
        obj = args.shift();
    return function() {
        return thisObj.apply(obj, args.concat(Array.prototype.slice.call(arguments)));
    };
};
Function.bind = function() {
    var args = Array.prototype.slice.call(arguments);
    return Function.prototype.bind.apply(args.shift(), args);
}

function Gallery(preferences) {
    this.url = preferences.url;
    this.containerWidth = preferences.containerWidth;
    this.boxCount = preferences.boxCount;
    this.boxMargin = preferences.boxMargin;
    this.scrollbarThickness = preferences.scrollbarWidth;
    this.scrollbarColor = preferences.scrollbarColor;
    this.showCaption = preferences.showCaption;
    this.showDescription = preferences.showDescription;
    this.interval = preferences.interval;
    this.gutter = 10;
    this.isLoading = true;
    this.isScrolling = false;
    
    //Account for scrollbar and scrollbar gutter.
    this.boxSize = Math.floor(($("#container").innerWidth() - this.scrollbarThickness - this.gutter - (2 * this.boxMargin * this.boxCount)) / this.boxCount);
    //this.boxSize = (4 * this.boxMargin) + (4 * ((this.containerWidth - 6 * this.boxCount * this.boxMargin - this.scrollbarThickness - this.gutter) / (4 * this.boxCount + 2)));
    //this.padding = (this.containerWidth - 6 * this.boxCount * this.boxMargin - this.scrollbarThickness - this.gutter) / (4 * this.boxCount + 2);
};

Gallery.prototype.itemsCount = 0;
Gallery.prototype.imageCount = 0;
Gallery.prototype.imageSrcs = [];
Gallery.prototype.images = [];
Gallery.prototype.captions = [];
Gallery.prototype.descriptions = [];
Gallery.prototype.qrCodes = [];

Gallery.prototype.didShow = function() {
    //Read data from spreadsheet.
    this._getData = function(json) {
	if (json) {
	    this.imageSrcs = [];
	    this.images = [];
	    this.captions = [];
	    this.descriptions = [];
	    this.qrCodes = [];
	    this.imageCount = 0;
	    this.itemsCount = 0;

	    for (var row = 0; row < json.rows.length; row++) {
		if (json.rows[row].c[0]) {
		    //There must be an image.
		    if (json.rows[row].c[0].v != "") {
			this.imageSrcs.push(json.rows[row].c[0].v);
		    }
		    else {
			continue;
		    }
		}
		else {
		    continue;
		}

		if (json.rows[row].c[1]) {
		    this.captions.push(json.rows[row].c[1].v);
		}
		else {
		    this.captions.push("");
		}

		if (json.rows[row].c[2]) {
		    this.descriptions.push(json.rows[row].c[2].v);
		}
		else {
		    this.descriptions.push("");
		}
		
		if (json.rows[row].c[3]) {
		    this.qrCodes.push(json.rows[row].c[3].v);
		}
		else {
		    this.qrCodes.push("");
		}
		
		this.itemsCount++;
	    }
	}
	
	this.processImages();
    }.bind(this);
    
    getData(this.url, this.interval, this._getData, 2);
}
Gallery.prototype.processImages = function() {
	this.loadImage(this.imageSrcs.shift());
}
Gallery.prototype.loadImage = function(imageSrc) {
    var self = this;
    var img = new Image();

    img.onload = function () {
	self.onImageLoaded(self, img);
    }
    img.onerror = function() {
	self.onImageLoaded(self, img);
    }
    img.src = imageSrc;
}
Gallery.prototype.onImageLoaded = function(self, img) {
    self.images.push(img);
	
    if (self.imageSrcs.length == 0) {
	self.construct();
    }
    else {
	self.processImages();
    }
}
Gallery.prototype.construct = function() {
    var $content = $(".content");
    
    //Remove all existing data from container if applicable.
    if (this.isLoading || AC.Detector.isiPad()) {
	$content.empty();
    }
    
    //Build UI.
    for (var i = 0; i < this.itemsCount; i++) {
	var $dissolve = $("<div>");
	var $image = $("<div>");
	var $captionContainer = $("<div>");
	var $captionFront = $("<p>");
	var $info = $("<div>");
	var $header = $("<div>");
	var $captionBack = $("<p>");
	var $scroll = $("<div>").attr("id", "scroll" + (i + 1));
	var $customScrollBox = $("<div>").addClass("customScrollBox");
	var $scrollContainer = $("<div>").addClass("container");
	var $scrollContent = $("<div>").addClass("content");
	var $draggerWrapper = $("<div>").addClass("dragger_wrapper");
	var $draggerContainer = $("<div>").addClass("dragger_container");
	var $dragger = $("<div>").addClass("dragger");
	
	var $description = $("<div>");
	var $qrCode = $("<img>");
	var $bottomDiv;
	
	$dissolve.css({
	    "width" : this.boxSize + "px",
	    "height" : this.boxSize + "px",
	    "margin": this.boxMargin + "px"
	});
	
	//Image (front)
	$image.addClass("opaque");
	$image.css({opacity: 0});
	$image.append($("<div>").addClass("logo").append(this.images[i]));
	$captionContainer.addClass("captionContainer");
	$captionFront.addClass("captionFront");
	$captionFront.addClass("caption_font-style");
	
	if (this.showCaption) {
	    $captionFront.html(this.captions[i]);
	}
	
	$captionContainer.append($captionFront);
	$image.append($captionContainer);
	
	//Description (back)
	$info.addClass("transparent");
	$info.addClass("info");
	$header.addClass("header");
	$captionBack.addClass("captionBack");
	$captionBack.addClass("caption_font-style");
	$scroll.addClass("scroll");
	
	$captionBack.html(this.captions[i]);
	$description.html(this.descriptions[i]).addClass("description description_font-style");
	$description.css("width", "90%");
	
	$header.append($captionBack);
	$scrollContent.append($description);
	//$scroll.append($description);	
	
	if (this.qrCodes[i]) {
	    $qrCode.attr("src", "https://chart.googleapis.com/chart?cht=qr&chs=100x100&chl=" + encodeURIComponent(this.qrCodes[i]));
	    $scrollContent.append($("<div>").addClass("qrCode").append($qrCode));
	    //$scroll.append($("<div>").addClass("qrCode").append($qrCode));
	}
	
	$scrollContainer.append($scrollContent);
	$customScrollBox.append($scrollContainer);
	$draggerContainer.append($dragger);
	$draggerWrapper.append($draggerContainer);
	$customScrollBox.append($draggerWrapper);
	$scroll.append($customScrollBox);
	$info.append($header);
	$info.append($scroll);
	
	//Put it all together.
	$dissolve.addClass("dissolve");
	$dissolve.append($image);
	$dissolve.append($info);
	$content.append($dissolve);

	if (!this.showDescription) {	//Caption width is the same as the size of the box.
	    $captionContainer.width(this.boxSize);
	}
	
	//Scale logo.
	this.scaleLogo(i, $image, $captionFront.height());
	
	//Scale thumbnail.
	this.scaleThumbnail(i, $info);
    }
}
Gallery.prototype.scaleLogo = function(i, $image, height) {
    var self = this;
    var maxHeight;

    //Account for the height, padding and positioning of the caption.
    if (this.showCaption) {
	maxHeight = this.boxSize - height - 5;
    }
    else {
	maxHeight = this.boxSize;
    }

    //Scale the image to fit inside a box where boxSize is the width and height of the box.
    var settings = {
	url: this.images[i].src,
	rsW: this.boxSize,
	rsH: maxHeight,
	callback: function(imageWidth, imageHeight) {     
	    if (imageWidth && imageHeight) {
		self.images[i].width = imageWidth;
		self.images[i].height = imageHeight;

		//Change height of div containing image to facilitate vertical alignment.
		$image.find(".logo").height($image.height() - height);
		
		//Pull top margin of image back up by half of its height.
		self.images[i].style.marginTop = -(self.images[i].offsetHeight / 2);
		
		var logoHeight = $image.find(".logo").height();
		var result = (logoHeight - imageHeight) / 2;
		
		$image.find(".logo").height(logoHeight - result);
		$image.css("opacity", "");
	    }
	    
	    self.imageCount++;

	    //All images have been scaled.
	    if (self.imageCount == self.itemsCount) {
		self.init();
	    }
	},
	onerror: function(image) {
	    $image.find(".logo").height($image.height() - height);
	    $image.css("opacity", "");	    
	    self.imageCount++;

	    //All images have been scaled.
	    if (self.imageCount == self.itemsCount) {
		self.init();
	    }
	}
    };

    scaleToFit(settings);
}
//Create the thumbnail.
Gallery.prototype.scaleThumbnail = function(i, $info) {
    var thumbnail = new Image();
    var $scroll = $info.find(".scroll");
    var $captionBack = $info.find(".captionBack");
    var $qrCode = $scroll.find(".qrCode");
    var captionHeight = $captionBack.height();	//Height of caption.
    var percentHeight = 0.25 * $info.height();	//25% of box height
    var self = this;
    var maxHeight;
    
    //Use the larger of the two heights.
    if (captionHeight >= percentHeight)
	maxHeight = captionHeight;
    else {
	maxHeight = percentHeight;
	$captionBack.height(maxHeight);
    }
    
    thumbnail.src = this.images[i].src;

    //Scale the image to fit inside a box where boxSize is the width and height of the box.
    var settings = {
	url: thumbnail.src,
	rsW: this.boxSize,
	rsH: maxHeight,
	callback: function(imageWidth, imageHeight) {
	    if (imageWidth && imageHeight) {
		thumbnail.width = imageWidth;
		thumbnail.height = imageHeight;
		$info.find(".header").prepend(thumbnail);
		$info.find(".header img").addClass("thumbnail");
		//Size the description last, once the QR Code and thumbnail are sized.
		$scroll.height($info.outerHeight(true) - $info.find(".header").outerHeight(true) - parseInt($scroll.css("margin-top")));
		
		//If there's no QR Code, add some padding to the bottom of the description text.
		if (!$qrCode.outerHeight(true)) {
		    $info.find(".description").css("padding-bottom", "25px");
		}		
	    }
	},
	onerror: function(image) {
	    $info.find(".header").prepend(thumbnail);
	    $info.find(".header img").addClass("thumbnail");
	    $scroll.height($info.outerHeight(true) - $info.find(".header").outerHeight(true) - $qrCode.outerHeight(true) - parseInt($scroll.css("margin-top")));
	    
	    //If there's no QR Code, add some padding to the bottom of the description text.
	    if (!$qrCode.outerHeight(true)) {
		$info.find(".description").css("padding-bottom", "25px");
	    }	
	}
    };

    scaleToFit(settings);
}
Gallery.prototype.init = function() {
    var self = this;
    
    this._isClose = false;
    this.setupListeners();
    
    if (this.isLoading) {
	this.isLoading = false;
	this.configureScrolling(this);
    }
    else {
	this.configureScrolling(this);
    }
}
Gallery.prototype.setupListeners = function() {
    var self = this;

    this._clickHandler = function(event) {
	if (self._isClose != true) {
	    $(".dissolve").each(function(index) {
		if (event.currentTarget == this) {
		    $(this).addClass("closeup");
		    self.showInViewport(this);
		}
		else {
		    $(this).addClass("background");
		}
	    });
	    
	    self._isClose = true;
	}
	else {	//Has closeup class.
	    var closeClicked = false;
	    
	    $(".dissolve").each(function(index) {
		if (event.currentTarget == this) {
		    if ($(this).hasClass("closeup")) {
			if ($(this).find(".scroll").data("dragging")) {
			    self.isScrolling = true;
			}

			if (self.showDescription && !self.isScrolling) {
			    var $image = $(this).find("> div:nth-child(1)");
			    var $info = $(this).find("> div:nth-child(2)");

			    $image.toggleClass("transparent");
			    $image.toggleClass("opaque");
			    $info.toggleClass("transparent");
			    $info.toggleClass("opaque");
			}
			else {
			    self.isScrolling = false;
			}
			
			closeClicked = true;
			//return false;
		    }
		}
	    });
	    
	    if (!closeClicked) {	//Background clicked.
		$(".dissolve").each(function(index) {
		    if ($(this).hasClass("closeup")) {
			if (self.showDescription) {
			    var $image = $(this).find("> div:nth-child(1)");
			    var $info = $(this).find("> div:nth-child(2)");

			    $image.removeClass("transparent").addClass("opaque");
			    $info.removeClass("opaque").addClass("transparent");
			}
		    
			$(this).css("zIndex", 5);
			
			this._backgroundClicked = function(event) {
			    $(this).css("zIndex", "");
			    this.removeEventListener("webkitTransitionEnd", arguments.callee, false);
			}.bind(this);
			
			this.addEventListener("webkitTransitionEnd", this._backgroundClicked, false);
			$(this).removeClass("closeup");
			$(this).css("top", "");
			$(this).css("left", "");
			//$(this).animate({"left": "", "top": ""});
		    }
		    else {
			$(this).removeClass("background");
		    }
		});
		
		self._isClose = false;
	    }
	}
	
        arr = null;
    }
    
    $(".dissolve").each(function(index) {
        this.addEventListener("click", self._clickHandler, false);
    });
}
Gallery.prototype.showInViewport = function(element) {
    var containerTop = -$(".container").position().top;
    var newTop, newLeft;
    var containerBottom = containerTop + $("#container").height();
    var containerLeft = $("#container").offset().left;
    var containerRight = containerLeft + $("#container").width();
    
    //Need to calculate the true values as the transformed dimensions are not returned by offsetHeight/offsetTop.
    var trueHeight = element.offsetHeight * 1.5;
    var heightDiff = trueHeight - element.offsetHeight;    
    var trueImageTop = element.offsetTop - (heightDiff / 2);
    var trueImageBottom = trueImageTop + trueHeight;
    
    //Now do the same thing for width.
    var trueWidth = element.offsetWidth * 1.5;
    var widthDiff = trueWidth - element.offsetWidth;
    var trueImageLeft = element.offsetLeft - (widthDiff / 2);
    var trueImageRight = trueImageLeft + trueWidth;
    
    if (trueImageBottom > containerBottom) {
	newTop = containerBottom - trueImageBottom - parseInt($(element).css("margin-bottom"));
    }
    else if (trueImageTop < containerTop) {
	newTop = containerTop - trueImageTop + parseInt($(element).css("margin-top"));
    }
    
    if (trueImageRight > containerRight) {
	newLeft = containerRight - trueImageRight - parseInt($(element).css("margin-right")) - this.scrollbarThickness;
    }
    else if (trueImageLeft < containerLeft) {
	newLeft = containerLeft - trueImageLeft + parseInt($(element).css("margin-left"));
    }
    
    $(element).animate({left: newLeft, top: newTop});
}
Gallery.prototype.configureScrolling = function(self) {
    if (!AC.Detector.isiPad()) {
	//Container scrollbar
	$("#container > .customScrollBox > .dragger_wrapper").css({
	    "height": $("#container > .customScrollBox").height() + "px",
	    "width": self.scrollbarThickness + "px"
	});
	$("#container > .customScrollBox > .dragger_wrapper .dragger_container").css({
	    "height": $("#container > .customScrollBox").height() - self.scrollbarThickness + "px",
	    "margin-top": self.scrollbarThickness / 2 + "px",
	    "margin-right": "0px",
	    "margin-bottom": "0px",
	    "border-left-color": self.scrollbarColor
	});
	$("#container > .customScrollBox > .dragger_wrapper .dragger").css({
	    "background": self.scrollbarColor,
	    "width" : self.scrollbarThickness + "px",
	    "height": self.scrollbarThickness + "px",
	    "margin-left": - Math.ceil(self.scrollbarThickness / 2) + "px",
	    "-webkit-border-radius": (self.scrollbarThickness * 2) + "px",
	    "-moz-border-radius": (self.scrollbarThickness * 2) + "px",
	    "border-radius": (self.scrollbarThickness * 2) + "px"
	});
	$(".dragger_pressed").css("background", self.scrollbarColor);
	$("#container > .customScrollBox > .container").width($("#container").width() - $("#container > .customScrollBox > .dragger_wrapper").width());
    
	//Scrollbars on each box.
	$(".scroll > .customScrollBox > .dragger_wrapper").css({
	    "height": $(".scroll > .customScrollBox").height() + "px",
	    "width": self.scrollbarThickness + "px"
	});
	$(".scroll > .customScrollBox > .dragger_wrapper .dragger_container").css({
	    "height": $(".scroll > .customScrollBox").height() - self.scrollbarThickness + "px",
	    "margin-top": self.scrollbarThickness / 2 + "px",
	    "margin-right": "0px",
	    "margin-bottom": "0px",
	    "border-left-color": self.scrollbarColor
	});
	$(".scroll > .customScrollBox > .dragger_wrapper .dragger").css({
	    "background": self.scrollbarColor,
	    "width" : self.scrollbarThickness + "px",	//When box is scaled, scrollbar handle will get 0.5 times larger. Need to account for this.
	    "height": self.scrollbarThickness + "px",
	    "margin-left": - Math.ceil(self.scrollbarThickness / 2) + "px",
	    "-webkit-border-radius": (self.scrollbarThickness * 2) + "px",
	    "-moz-border-radius": (self.scrollbarThickness * 2) + "px",
	    "border-radius": (self.scrollbarThickness * 2) + "px"
	});
	$(".scroll > .customScrollBox > .container").width($(".scroll").width() - $(".scroll > .customScrollBox > .dragger_wrapper").width());
	
	if (isTouchDevice() && navigator.platform.indexOf("Android 3.0") == -1) {
	    $(".customScrollBox").css("overflow", "auto");
	    $(".dragger_container").css("display", "none");
	} else if (!isTouchDevice()) {
	    $("#container").mCustomScrollbar("vertical", 500, "easeOutCirc", 1, "fixed", "yes", "no", 0);
	    $(".scroll").each(function(index) {
		$(this).mCustomScrollbar("vertical", 500, "easeOutCirc", 1, "fixed", "yes", "no", 0);
	    });
	}
    }
    
    readyEvent();
}