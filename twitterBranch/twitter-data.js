// Requires:
// jquery-1.4.2.js
// jquery.timers-1.2.js
var URL = "http://search.twitter.com/search.json?q=";
var LIST_LENGTH = 10;
var tweetList = new Array();
var lastTweet = null;
var currentTweet = -1;

function initDataProvider() {
	startJSONCall(URL, query);
	
	$(document).everyTime("60s", "dataTimer", function() {
		startJSONCall(URL, query);
	}, 0);
}

function startJSONCall(url, dataString) {
    try {
	    var params = "";
		if (tweetList.length > 0) {
		    params = "&since_id=" + tweetList[tweetList.length - 1].id_str;
		} 
		
	    var newDataString = encodeURIComponent(dataString);
	    
    	url = url + newDataString + params + "&callback=?";

    	jQuery.getJSON(url, function(result) {
    	    try {   	    	
	    		reportDataReady(result);

	    		if (lastTweet == null) {
					readyEvent();
	    		}
    	    }
    	    catch (err) {
    	    	writeToLog("reportDataReady - " + result + " - " + err.message);
    	    }
		}, "json");
    	writeToLog("startJSONCall - " + url + " - Started successfully");
    }
    catch (err) {
    	writeToLog("startJSONCall - " + url + " - " + err.message);
    }
}

function reportDataReady(result) {
	if (result.results == null || result.results.length == 0) {
    	writeToLog("reportDataReady - 0 tweets in your query");
	}
	else {
		var tweetUpdateLocation = Math.min(LIST_LENGTH, result.results.length); 
		for (i = tweetUpdateLocation - 1; i >= 0; i--) {
			pushNewTweet(result.results[i]);
		}
		writeToLog("reportDataReady - " + tweetUpdateLocation + " tweets added");
	}
}

function pushNewTweet(tweet) {
	var len = tweetList.push(tweet);
	
	currentTweet = -1;
	// too many tweets in the stack? throw away an older tweet
	if (len > LIST_LENGTH) {
		tweetList.shift();
	}
}

function getNextTweet() {
	if (tweetList != null) {
		currentTweet--;
		if (currentTweet < 0) {
			currentTweet = tweetList.length - 1;
		}
		
		lastTweet = tweetList[currentTweet];

		return lastTweet;
	}
	return null;
}
