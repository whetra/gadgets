function SlideShow(onLastPhotoShown) {
    var prefs = new gadgets.Prefs();
    
    this.duration = prefs.getInt("duration") * 1000 - 1200;
    this.interactivityTimeout = prefs.getInt("interactivityTimeout");
    this.totalImagesPrevious = 0;
    this.totalImages = 0;
    this.current = 0;
    this.nextIndex = 0;
    this.isLoading = false;
    this.isInteracting = false;
    this.onLastPhotoShown = onLastPhotoShown;
    this.showPhotoTimer = null;
    this.interactivityTimer = null;
    this.isPaused = false;
    this.timeLeft = 0;
    this.startTimeout = new Date();
    this.isFadingIn = false;	//Issue 795
    this.isFadingOut = false;	//Issue 795
}
SlideShow.prototype.initialize = function() {
    var event,
	self = this,
	$slideshow = $("<div>"),
	$ul = $("<ul>"),
	prefs = new gadgets.Prefs(),
	showNavigation = prefs.getBool("showNavigation");
    
    $slideshow.attr("id", "slideshow");
    $ul.addClass("slides");
    $slideshow.append($ul);
    
    //Navigation arrows
    if (showNavigation) {
	var $previous = $("<span>"),
	    $next = $("<span>");
	    
	$previous.addClass("arrow previous");
	$next.addClass("arrow next");
	$slideshow.append($previous).append($next);
    }
    
    $("#container").append($slideshow);
    
    //Issue 953 Start
    if (RiseVision.Common.Utility.isTouchDevice()) {
	event = "touchstart";
    }
    else {
	event = "click";
    }
    
    $("#slideshow .arrow").on(event, function() {
	//Issue 953 End
	self.cancelAutoCycling();
	
	// Depending on whether this is the next or previous
	// arrow, calculate the index of the next photo accordingly.
	if ($(this).hasClass("next")) {
	    self.nextIndex = self.current >= self.totalImages - 1 ? 0 : self.current + 1;
	}
	else {
	    self.nextIndex = self.current <= 0 ? self.totalImages - 1 : self.current - 1;
	}

	self.transitionOut();
    });
    
    this.configureSwipe();
}
SlideShow.prototype.addImage = function(imageProps) {
    var self = this,
	prefs = new gadgets.Prefs(),
	rsW = prefs.getInt("rsW"),
	rsH = prefs.getInt("rsH"),
	showCaptions = prefs.getBool("showCaptions"),
	$ul = $("#slideshow ul");	

    var $li = $("<li>"),
	$div = $("<div>"),
	$image = $("<img>");

    $image.width(imageProps.width);
    $image.height(imageProps.height);	
    $image.attr("src", imageProps.src);
    
    $div.css({
	"margin-top": imageProps.marginTop,	//Vertical alignment.
	"margin-left": imageProps.marginLeft   //Horizontal alignment.
    }); 

    if (imageProps.caption && showCaptions) {
	var $caption = $("<span>");
	
	$caption.addClass("caption caption_font-style");
	$caption.text(imageProps.caption);
	$li.append($caption);
    }
    
    $div.append($image);
    $li.hide();
    $li.append($div);
    $ul.append($li);
    
    this.totalImages++;
}
SlideShow.prototype.configureSwipe = function() {
    var self = this;
    var swipeOptions = {
	swipe: function(event, direction) {
	    if (direction == "left" || direction == "right") {
		self.cancelAutoCycling();
		
		// Depending on the direction the user is swiping,
		// calculate the index of the next photo accordingly.
		if (direction == "left") {
		    self.nextIndex = self.current >= self.totalImages - 1 ? 0 : self.current + 1;
		}
		else {
		    self.nextIndex = self.current <= 0 ? self.totalImages - 1 : self.current - 1;
		}
		
		self.showNextPhoto(true, direction);
	    }
	},
	threshold:50
    }
    
    $("#slideshow").swipe(swipeOptions);
}
SlideShow.prototype.cancelAutoCycling = function() {
    if (this.duration > 0) {
	var self = this;
	
	clearTimeout(this.showPhotoTimer);
	clearTimeout(this.interactivityTimer);
	
	this.isInteracting = true;
	this.interactivityTimer = setTimeout(function() {
	    self.isInteracting = false;
	    self.transitionOut();
	}, this.interactivityTimeout * 1000);
    }
}
SlideShow.prototype.showNextPhoto = function(isSwiping, direction) {
    var $slides = $("#slideshow li"),
	$li = $slides.eq(this.current),
	self = this,
	$next;
    
    $next = $slides.eq(this.nextIndex);
    this.current = this.nextIndex;

    //Fade - Auto cycling or manual navigation.
    if (!isSwiping) {
	//Issue 795 - Only fade in if photo is not already in the middle of transitioning.
	if (!this.isFadingIn && !this.isFadingOut) {
	    this.isFadingIn = true;
	    
	    $next.fadeIn("slow", function() {
		self.isFadingIn = false;
		$(this).addClass("visible");
		
		if (!self.isPaused && !self.isInteracting) {
		    self.startTimer();
		}
		
		if (self.duration > 0) {
		    self.getNextIndex();
		}
	    });
	}
    }
    else {	//Slide when swiping.
	var slideIn, slideOut;
	
	if (direction == "left") {
	    slideIn = "slideInLeft";
	    slideOut = "slideOutLeft";
	}
	else {
	    slideIn = "slideInRight";
	    slideOut = "slideOutRight";
	}
	
	$next.bind("webkitAnimationEnd", function() {
	    $next.removeClass(slideIn);
	    $next.unbind("webkitAnimationEnd");
	});
	
	//Hide old photo once slide out has completed.
	$li.bind("webkitAnimationEnd", function() {
	    self.getNextIndex();
	    $li.hide();
	    $li.removeClass(slideOut);
	    $li.unbind("webkitAnimationEnd");
	});
			
	$next.removeClass(slideOut).addClass(slideIn).show();
	$li.removeClass(slideIn).addClass(slideOut);
    }
}
SlideShow.prototype.getNextIndex = function() {
    this.nextIndex = this.current >= this.totalImages - 1 ? 0 : this.current + 1;
}
SlideShow.prototype.startTimer = function() {
    var self = this;
    
    //Ensure timer is cleared before starting it again.
    clearTimeout(this.showPhotoTimer);
    
    this.showPhotoTimer = setTimeout(function() {
	self.transitionOut();
    }, this.duration);

    if (!this.isPaused) {
	this.startTimeout = new Date();
    }
}
SlideShow.prototype.resumeTimer = function() {
    var $slides = $("#slideshow li"),
	$first = $("#slideshow li:first"),
	self = this;
    
    if (this.timeLeft == 0) {	//Issue 795
	this.timeLeft = this.duration;
	
	//Fade the first photo out (this was the last photo that was moved to be first before more photos were added).
	if (this.isLoading) {
	    this.isLoading = false;
	    
	   //Issue 795 - Only fade out if photo is not already in the middle of transitioning.
	  if (this.totalImages == 0) {
          this.transitionOut(); // handles 0 images too
      } else if (this.totalImagesPrevious == 0) {
          // there were no previous photo's, so no fade out and don't remove first, just show next photo
          if (!self.isPaused) {
              self.showNextPhoto(false);
          }
      } else if (!this.isFadingIn && !this.isFadingOut) {
		this.isFadingOut = true;
		
		$first.fadeOut("slow", function() {
		    self.isFadingOut = false;
		    $(this).removeClass("visible");
		    $first.remove();
		    
		    if (!self.isPaused) {
			self.showNextPhoto(false);
		    }
		});
	    }
	}
	else {
	    //Issue 795 - Transition previous photo out before showing next one.
	    if ($(".visible").length > 0) {
		this.transitionOut();
        } else if (this.totalImages == 0) {
            this.transitionOut(); // handles 0 images too
	    }
	    else {
		this.showNextPhoto(false);
	    }
	}
	
	return;
    }

    //Ensure timer is cleared before starting it again.
    clearTimeout(this.showPhotoTimer);
    
    this.showPhotoTimer = setTimeout(function() {
	self.transitionOut();
    }, this.timeLeft);
}
SlideShow.prototype.pauseTimer = function() {
    var seconds;
    
    clearTimeout(this.showPhotoTimer);
    
    this.timeLeft = this.duration;
    this.timeLeft -= new Date() - this.startTimeout;

    //Round to nearest second, since duration is counted in seconds.
    seconds = Math.round(this.timeLeft / 1000);
    this.timeLeft = seconds * 1000;

    //Show next entry.
    if (seconds <= 0) {
	this.timeLeft = 0;
	this.transitionOut();	//Issue 795		
    }
}
SlideShow.prototype.play = function() {
    this.isPaused = false;
    this.resumeTimer();
}
SlideShow.prototype.pause = function() {
    this.isPaused = true;
    this.pauseTimer();
}
SlideShow.prototype.transitionOut = function() {
    var $slides = $("#slideshow li"),
	$li = $slides.eq(this.current),
	self = this;
	
    this.showPhotoTimer = null;
    
    //Issue 713 - Need to check if totalImages is not 0.
    if (this.totalImages == 0) {
        this.totalImagesPrevious = 0;
        this.timeLeft = 0;
        this.current = 0;
        this.isLoading = true;
        this.onLastPhotoShown.call(window.photoAlbum); //Fire callback to refresh feed.
    } else if (this.totalImages > 0 && (this.current >= this.totalImages - 1)) {
	//Remove all images except the one that is currently showing. New images will be added as they are loaded.
	this.totalImagesPrevious = this.totalImages;
	$("#slideshow li:not(:last)").remove();
	this.timeLeft = 0;
	this.current = 0;
	this.totalImages = 0;
	this.isLoading = true;
	this.onLastPhotoShown.call(window.photoAlbum);	//Fire callback to refresh feed.
    }
    else {
	//Issue 795 - Only fade out if photo is not already in the middle of transitioning.
	if (!this.isFadingIn && !this.isFadingOut) {
	    this.isFadingOut = true;
	    
	    $li.fadeOut("slow", function() {
		self.isFadingOut = false;
		$(this).removeClass("visible");
		
		if (!self.isPaused) {
		    self.showNextPhoto(false);
		}
	    });
	}
    }
}
