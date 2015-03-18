var RiseVision = RiseVision || {};
RiseVision.Flash = {};

/*
 * Initialize the Gadget.
 */
RiseVision.Flash = function() {
    //Generate a random number to append to the URL so that the Flash will not be cached. 
    this.url = prefs.getString("url") + "?dummyVar=" + Math.ceil(Math.random() * 100); 				    
}
/*
 *  Embed the Flash player.
 */
RiseVision.Flash.prototype.embedPlayer = function() {
    $("#player").flash({
	swf: this.url,		
	width: prefs.getInt("rsW"),
	height: prefs.getInt("rsH"),
	allowScriptAccess: "always",
	play: true,
	loop: false,
	wmode: "transparent"
    });
}

/*
 * Check the state of the movie to see if it is still playing.
 */	
RiseVision.Flash.prototype.checkState = function() {
    var self = this;
    
    $("#player").flash(
	function() {
	    if (this.IsPlaying()) {	    
		setTimeout(function() {
		    self.checkState();
		}, 1000);
	    }
	    //Movie has ended.
	    else {
		//A SWF file with only one frame has no discernible start or end.
		if ((this.PercentLoaded() == 100) && (this.TotalFrames() <= 1)) {}
		else {
		    doneEvent();
		}
	    }
	}
    );
}

/*
 * Play the Flash movie.
 */
RiseVision.Flash.prototype.play = function() {
    var self = this;
    
    this.embedPlayer();
	    
    //Only check state for Flash movies.
    //Flash applications will never send the Done event.
    if (prefs.getString("fileType") == "movie") {
	setTimeout(function() {
	    self.checkState();
	}, 1000);
    }
}
/*
 * Pause the Flash movie.
 */
RiseVision.Flash.prototype.pause = function() {
    $("#player").flash().remove();
}