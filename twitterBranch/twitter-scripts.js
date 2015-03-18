var BRANCHES_IMAGE = "http://risegadgets.googlecode.com/svn/trunk/twitterBranch/branches.png";
var BRANCHES_IMAGE_SMALL = "http://risegadgets.googlecode.com/svn/trunk/twitterBranch/branches_s.png";
var BACKGROUND_WIDTH = 4167, BACKGROUND_HEIGHT = 798;
var BIRD_BOX = "http://risegadgets.googlecode.com/svn/trunk/twitterBranch/bird_Right_box.png";
var BIRD_WIDTH = Math.round(762/6), BIRD_HEIGHT = Math.round(649/6);
var AVATAR_WIDTH = 44, AVATAR_HEIGHT = 44;
var TWEET_WIDTH = 260, TWEET_HEIGHT = 140;

var isiPad = navigator.userAgent.match(/iPad/i) != null;

var prefs = new gadgets.Prefs();
// this is the query that should be requested
var query = gadgets.util.unescapeString(prefs.getString("query"));
var gadgetWidth = prefs.getString("rsW")
var gadgetHeight = prefs.getString("rsH") > TWEET_HEIGHT ? prefs.getString("rsH") : TWEET_HEIGHT;
var tweetTime = parseInt(prefs.getString("tweetTime")) > 5 ? parseInt(prefs.getString("tweetTime")) : 5;
var enableLinks = prefs.getString("enableLinks") != "false";
                  
// Spacer
// Number of vertical tweets
var vTweetNumber = Math.floor(gadgetHeight / TWEET_HEIGHT);
var spacerUnit = Math.round((gadgetHeight % TWEET_HEIGHT) / vTweetNumber);
var moveBy = (TWEET_WIDTH + spacerUnit) / vTweetNumber;	

var activeBackground = 0, moveCounter = 0;
var backgroundWidth = Math.round(gadgetHeight * BACKGROUND_WIDTH / BACKGROUND_HEIGHT);
			
function gadgetLoaded() {
	initDataProvider();
}
				
function startTweetDeck() {
	showNextTweet();
	
	// init tweet refresh timer
	$(document).oneTime(tweetTime + "s", "tweetTimer", function() {
		startTweetDeck();
	});
}

function stopTweetDeck() {
	$(document).stopTime("tweetTimer");
	removeBird(lastTweet);
}

function showNextTweet() {
	var tweet = getNextTweet();

	if (tweet != null) {
		tweetDeckMove();
		
		var mainDiv = document.getElementById('bgDiv_' + activeBackground);
		
		var top = ((TWEET_HEIGHT + spacerUnit) * (moveCounter % vTweetNumber)) + randomSpacer();
		var left = BIRD_WIDTH + 20 + randomSpacer();
		if ((left + TWEET_WIDTH) > gadgetWidth) {
			left = gadgetWidth - TWEET_WIDTH - randomSpacer();
		}

		left = left - parseInt($("#" + 'bgDiv_' + activeBackground).css("left"));

		var tweetDiv = createTweet(tweet, top, left);
		var birdDiv = createBird(tweet, top, left);
		
		moveCounter++;

		// create tweet and put it on the canvas
		mainDiv.appendChild(tweetDiv);
		
		$(document).oneTime("3s", "moveTimer", function() {
			// create tweet bird and put it on the canvas
			mainDiv.appendChild(birdDiv);

			tweetDiv.style["opacity"] = 1;
		});	
		
		$(document).oneTime(tweetTime + "s", "removeBirdTimer", function() {
			removeBird(tweet);
		});	
	}
}

function randomSpacer() {
	return (Math.random() * spacerUnit); 
}

function tweetDeckMove() {
	// background count = view distance (gadgetW/bgW) + move distance (moveDistance/bgW)
	var backgroundCount = 1 + Math.ceil(gadgetWidth / backgroundWidth) + Math.ceil((TWEET_WIDTH + spacerUnit + BIRD_WIDTH) / backgroundWidth);
	var moveWidth = (TWEET_WIDTH + spacerUnit) / vTweetNumber;
	
	// iterate through backgrounds
	for (i = 0; i < backgroundCount; i++) {
		var backgroundDiv = document.getElementById('bgDiv_' + i);
		
		// background doesn't exist, create it
		if (backgroundDiv == null) {
			var offset = 0;
			
			backgroundDiv = updateBackground(i, gadgetWidth - (backgroundWidth * (i + 1)));
			backgroundDiv.style['zIndex'] = 1;
		}
		else {
			var currentLeft = parseInt($("#" + 'bgDiv_' + i).css("left"));
			
			// check if the background is no longer visible
			if (currentLeft > gadgetWidth) {
				currentLeft = currentLeft - (backgroundWidth * backgroundCount);
				backgroundDiv = updateBackground(i, currentLeft);
			}
			
			// move background
			currentLeft += moveWidth;
			
			// check if this is the current active background
			if (currentLeft < 0 && Math.abs(currentLeft) < backgroundWidth) {
				activeBackground = i;
			}
			
			$("#" + 'bgDiv_' + i).css("left", currentLeft + 'px');	
		}		
	}
}

function createTweet(tweet, top, left) {										   
	var tweetTextDiv = createNewElement('text_' + tweet.id_str, 'div', TWEET_WIDTH - 24, "", top, left);
	tweetTextDiv.style["opacity"] = 0;
	tweetTextDiv.className = "fade tweetBorder";
	tweetTextDiv.style['zIndex'] = 2;
	
    var linkStart = "", linkEnd = "";
    if (enableLinks) {
  	  linkStart = '<a target="_blank" href="http://twitter.com/' + tweet.from_user + '">';
  	  linkEnd = '</a>';
    }
	
	tweetTextDiv.innerHTML = '<b>' + linkStart + tweet.from_user + linkEnd + '</b> - ' + ify.clean(tweet.text, enableLinks);
	tweetTextDiv.innerHTML += (timeAgo(tweet.created_at) == "" ? '' : ' - ') + timeAgo(tweet.created_at);
	
	return tweetTextDiv;
}

function createBird(tweet, top, left) {
	if (top < 20) {
		top = 20;
	}
	
	// put avatar image inside tweet bird
	var birdDiv = createNewElement('bird_' + tweet.id_str, 'div', BIRD_WIDTH, BIRD_HEIGHT, top - 20, left - BIRD_WIDTH - 15);
	birdDiv.style['zIndex'] = 2;

	var html = '<img src="' + BIRD_BOX + '" style="width:' + BIRD_WIDTH + 'px;height:' + BIRD_HEIGHT + 'px;top:0px;left:0px;position:absolute;">';
	html += '<img src="' + tweet.profile_image_url + '" style="width:' + AVATAR_WIDTH + 'px;height:' + AVATAR_HEIGHT + 'px;top:25px;left:61px;position:absolute;">';
	birdDiv.innerHTML = html;
	
	return birdDiv;
}

function removeBird(tweet) {
	if (tweet != null) {
		$('#text_' + tweet.id_str).addClass('tweetExpire');
		
		if($('#bird_' + tweet.id_str)) {
			$('#bird_' + tweet.id_str).remove();
		}
	}  
}

function updateBackground(count, left) {
    var mainDiv = document.getElementById('main');  
    
    var backgroundDiv = createNewElement('bgDiv_' + count, 'div', backgroundWidth, gadgetHeight, 0, left);
	backgroundDiv.className = "tweetDeckMove";

    var img_url = isiPad ? BRANCHES_IMAGE_S : BRANCHES_IMAGE;
	var html = '<img src="' + img_url + '" style="width:' + backgroundWidth + 'px;height:' + gadgetHeight + 'px;top:0px;left:' + left + 'px;">';
	backgroundDiv.innerHTML = html;
	
	mainDiv.appendChild(backgroundDiv);
	
	return backgroundDiv;
}

function createNewElement(frameName, type, width, height, top, left) {
    try {
		var myFrame = document.getElementById(frameName);
		if (myFrame != null) {
			myFrame.parentNode.removeChild(myFrame);
		}
		
        myFrame = document.createElement(type);

        if (myFrame != null) {
            myFrame.setAttribute('id', frameName);

            myFrame.style["position"] = "absolute";

            myFrame.style["left"] = left + "px";
            myFrame.style["top"] = top + "px";
            myFrame.style["width"] = width + "px";
            myFrame.style["height"] = height + "px";
        }
        return myFrame;
    }
    catch (err) {
    	writeToLog("createNewElement - " + frameName + " - " + err.message);
    }
}
