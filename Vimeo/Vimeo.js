var prefs = new gadgets.Prefs();
var chMode = prefs.getBool("channelMode");
var autoPlay = prefs.getBool("autoPlay");
var isLoading = true;
var currentVideo = 0;
var videoTotal = 0;
var bytesLoaded = 0;
var moogaloop = null;

function initVimeo() {
    var params = {};
    
    params[gadgets.io.RequestParameters.CONTENT_TYPE] = gadgets.io.ContentType.JSON;
    
    if (chMode) {
	gadgets.io.makeRequest("http://vimeo.com/api/v2/channel/" + prefs.getString("File") + "/videos.json", function(videos) {
	    if (videos.data) {
		videoTotal = videos.data.length;
		channelVideos = videos.data;
		videoID = channelVideos[currentVideo].id;
		embedPlayer();
	    }
	    else {
		console.log("No videos found in channel");
	    }
	}, params);
    }
    else {
	videoID = prefs.getString("File");
	embedPlayer();
    }
}
function embedPlayer() {
    var flashvars = {
        clip_id: videoID,
        api: 1,
	player_id: "moogaloop",
	api_ready: "onLoad"
    }, params = {
        allowscriptaccess: "always",
        allowfullscreen: "true",
        wmode: "transparent"
    };
    
    bytesLoaded = 0;
    
    swfobject.embedSWF("http://vimeo.com/moogaloop.swf", "moogaloop", "100%", "100%", "9.0.0","expressInstall.swf", flashvars, params);
}
//Called when the Vimeo player is ready to accept commands.
function onLoad(playerID) {
    moogaloop = document.getElementById(playerID);
    moogaloop.api_setVolume(prefs.getInt("volume") / 100);
    
    //Can't invoke these callback functions on an object.   
    moogaloop.api_addEventListener("play", "onPlay");
    moogaloop.api_addEventListener("loadProgress", "onLoadProgress");
    moogaloop.api_addEventListener("finish", "onFinish");  
    
    if (isLoading) {
	readyEvent();
    }
    else if (chMode) {
	play();
    }
}
function onPlay() {
    autoPlay = true;
}
function onLoadProgress(data) {
    try {
	bytesLoaded = parseFloat(data.percent);
    }
    catch(err) {
        console.log(args);
    }
}
function onFinish() {
    if (chMode) {
	currentVideo++;
      
	if (currentVideo >= videoTotal) {
	    doneEvent();
	}
	else {
	    videoID = channelVideos[currentVideo].id;
	    embedPlayer();
	}
    }
    else {
	doneEvent();
    }
}
function play() {
    if (autoPlay) {
	if (chMode) {
	    if (isLoading) {
		start();
	    }
	    else if (currentVideo >= videoTotal) {
		currentVideo = 0;
		videoID = channelVideos[currentVideo].id;
		embedPlayer();
	    }
	    else if (currentVideo == 0) {
		if (prefs.getBool("loop")) {
		    start();
		}
	    }
	    else {
		start();
	    }
	}
	else {
	    if (isLoading || (!isLoading && prefs.getBool("loop"))) {
		start();
	    }
	}
    }
    
    isLoading = false;
}
function start() {
    moogaloop.api_play();
    
    setTimeout(function() {
	if (bytesLoaded == 0) {
	    if (chMode) {
		currentVideo++;
  
		if (currentVideo >= videoTotal) {
		    doneEvent();
		}
		else {
		    videoID = channelVideos[currentVideo].id;
		    embedPlayer();
		}
	    }
	}
    }, 5000);
}
function pause() {
    moogaloop.api_pause();
}

function stop() {
    moogaloop.api_pause();
}