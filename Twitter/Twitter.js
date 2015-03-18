var RiseVision = RiseVision || {};
RiseVision.TwitterList = {};
RiseVision.Tweet = {};

RiseVision.TwitterList = function() {
    var prefs = new gadgets.Prefs();
    
    this.query = gadgets.util.unescapeString(prefs.getString("query"));
    this.tweetTime = prefs.getInt("tweetTime") > 5 ? prefs.getInt("tweetTime") * 1000 : 5000;
    this.tweetNumber = prefs.getInt("tweetNumber") > 5 ? prefs.getInt("tweetNumber") : 5;
    this.avatarSize = prefs.getString("avatarSize");					
    this.scrollDirection = prefs.getString("scrollDirection");
    this.showSeparator = prefs.getBool("showSeparator");
    this.separatorWidth = prefs.getInt("separatorWidth");
    this.separatorColor = prefs.getString("separatorColor");
    this.width = prefs.getString("rsW");
    this.height = prefs.getString("rsH");
    
    this.sinceId = -1;
    this.results = [];
    this.newResults = [];
    this.scrollCount = 0;
    this.updateInterval = 60000;
    this.updatesTimerExpired = false;
}
RiseVision.TwitterList.prototype.getData = function() {
    gadgets.rpc.call("", "rsparam_get", null, prefs.getString("id"), "social:twitter");
}
RiseVision.TwitterList.prototype.processData = function(name, value) {
    if (value) {
	var json = JSON.parse(value);

	twitterList.tokens = JSON.parse(json.access);
	
	if (!json.access) {	//No social connection has been set up.
	    twitterList.showError("Please create a Twitter Social Connection for your Company or Display before using this Gadget.");
	    readyEvent();
	}
	else {    
	    twitterList.loadTweets();
	}
    }
    else {
	twitterList.isLoading = false;
	twitterList.showError("Please create a Twitter Social Connection for your Company or Display before using this Gadget.");
	readyEvent();
    }
}
RiseVision.TwitterList.prototype.showError = function(message) {
    var self = this;
    
    $("#container").hide();
    $(".error").text(message).show();
    setTimeout(function() { self.getData(); }, this.updateInterval);
}
RiseVision.TwitterList.prototype.loadTweets = function() {		
    var params = {},
	self = this,
	showSince = "";
    
    if (this.sinceId != -1) {
	showSince = "&since_id=" + this.sinceId;
    }
    
    params[gadgets.io.RequestParameters.CONTENT_TYPE] = gadgets.io.ContentType.JSON; 
    params[gadgets.io.RequestParameters.REFRESH_INTERVAL] = 60;
    params[gadgets.io.RequestParameters.AUTHORIZATION] = gadgets.io.AuthorizationType.OAUTH;
    params[gadgets.io.RequestParameters.OAUTH_REQUEST_TOKEN] = twitterList.tokens[0];
    params[gadgets.io.RequestParameters.OAUTH_REQUEST_TOKEN_SECRET] = twitterList.tokens[1];

    gadgets.io.makeRequest("https://api.twitter.com/1.1/search/tweets.json?q=" + encodeURIComponent(this.query) + "&count=" + this.tweetNumber + showSince,
	function(response) {
	    if (response.error) {
		console.log(response.error);
	    }
	    else if (response.data.statuses && response.data.statuses.length > 0) {
		var newResults = response.data.statuses;
		
		self.newResults = [];
		self.newResults.push.apply(self.newResults, newResults);
		self.newResults.sort(function(a, b) {
		    self.sort(a, b);
		});
		
		self.sinceId = response.data.search_metadata.max_id_str;
		self.results.unshift.apply(self.results, newResults);	//Add new tweets to the beginning of the array.
		self.results = self.results.slice(0, self.tweetNumber);	//Remove oldest tweets.
		
		//This is an update.
		if (self.updatesTimerExpired) {
		    self.scrollCount = self.newResults.length == self.results.length ? 0 : self.newResults.length;
		    self.updatesTimerExpired = false;
		}
		else {
		    $("#scrollContainer").infiniteScroll({
			direction: self.scrollDirection,
			duration: self.tweetTime,
			cloneItem: function() {
			    self.cloneItem.call(self);
			}
			})
			.bind("onScroll", function(event) {
			    self.onScroll.call(self);
		    });
		}		
				
		if (self.newResults.length > 0) {
		    //Remove first tweet that may have been cloned before update occurred (depends on timing).
		    if ($(".tweet").length > self.results.length) {
			if (self.scrollDirection == "down") {
			    $(".tweet:first").remove();
			}
			else {
			    $(".tweet:last").remove();
			}
		    }
		    		    
		    //Flag old tweets with the delete class so they can be removed after scrolling off.
		    if (self.scrollDirection == "down") {
			$(".tweet").slice(0, self.newResults.length).addClass("delete");
		    }
		    else {
			$(".tweet").slice(self.results.length - self.newResults.length).addClass("delete");
		    }
		}
		
		self.createTweets();		
	    }
	    
	    readyEvent();
	}
    , params);
}
RiseVision.TwitterList.prototype.sort = function(a, b) {
    var getDater = function(dateString) {
	return new Date(dateString).getTime();
    };
		
    if (getDater(a.created_at) > getDater(b.created_at)) {
	return -1;
    }
    else if (getDater(a.created_at) < getDater(b.created_at)) {
	return 1;
    }
    else {
	return 0;
    }
}
RiseVision.TwitterList.prototype.createTweets = function() {
    for (var i = 0; i < this.newResults.length; i++) {
	this.createTweet(this.newResults[i]);
    }
    
    //Duplicate all tweets until Placeholder is filled.
    while ($(".page").height() < $(".tweets").height()) {
	if (this.scrollDirection == "up") {
	    $(".page").append($(".tweet").clone());
	}
	else {
	    $(".page").prepend($(".tweet").clone());
	}
    }
}
RiseVision.TwitterList.prototype.createTweet = function(result) {
    var tweet = new Object();
	
    tweet.id = result.id;
    tweet.id_str = result.id_str;
    tweet.user = result.user.name;
    tweet.userName = result.user.screen_name;
    tweet.tweet = result.text;
    
    if (result.entities) {
	//User mentions
	if (result.entities.user_mentions) {
	    tweet.user_mentions = [];
	    
	    for (var i = 0; i < result.entities.user_mentions.length; i++) {
		tweet.user_mentions.push(result.entities.user_mentions[i]);
	    }
	}
	
	//Hashtags
	if (result.entities.hashtags) {
	    tweet.hashtags = [];
	    
	    for (var i = 0; i < result.entities.hashtags.length; i++) {
		tweet.hashtags.push(result.entities.hashtags[i]);
	    }
	}
	
	//URLs
	if (result.entities.urls) {
	    tweet.urls = [];
	    
	    for (var i = 0; i < result.entities.urls.length; i++) {
		tweet.urls.push(result.entities.urls[i]);
	    }
	} 
    }
    
    //Retweets
    if (result.retweeted_status) {
	if (result.retweeted_status.user) {
	    tweet.retweetName = result.retweeted_status.user.name;
	    tweet.retweetScreenName = result.retweeted_status.user.screen_name;
	}
    }
    
    if (this.avatarSize == "large") {
	tweet.avatar = result.user.profile_image_url.replace(/_normal\./, '_bigger.');
    }
    else {
	tweet.avatar = result.user.profile_image_url;
    }
    
    tweet.createdAt = this.timeAgo(result.created_at);
    tweet.metadata = result.metadata;
    this.tweet = new RiseVision.Tweet(tweet, {
	avatarSize: this.avatarSize,
	showSeparator: this.showSeparator,
	scrollDirection: this.scrollDirection
    });
}
RiseVision.TwitterList.prototype.cloneItem = function() {
    //Only clone the tweet if it has not been flagged for deletion.
    if (this.scrollDirection == "down") {
	if (!$(".tweet:last").hasClass("delete")) {
	    this.createTweet(this.results[this.scrollCount]);
	}
	else {
	    //Adjust scrollCount since we are not cloning a tweet and the scrollCount will be incremented
	    //on the next scroll, which would give us an off-by-one error.
	    this.scrollCount--;
	}
    }
    else {
	if (!$(".tweet:first").hasClass("delete")) {
	    this.createTweet(this.results[this.scrollCount]);
	}
	else {
	    //Adjust scrollCount since we are not cloning a tweet and the scrollCount will be incremented
	    //on the next scroll, which would give us an off-by-one error.
	    this.scrollCount--;
	}
    }
}
RiseVision.TwitterList.prototype.onScroll = function() {
    this.scrollCount++;
    
    //All tweets have been scrolled through.
    if (this.scrollCount == this.results.length) {
	this.scrollCount = 0;
	
	//Check for new tweets.
	if (this.updatesTimerExpired) {
	    this.loadTweets();
	}
    }
}
RiseVision.TwitterList.prototype.play = function() {
    var self = this;
    
    if ($("#scrollContainer").infiniteScroll.start) {
	$("#scrollContainer").infiniteScroll.start();
    }
    
    setInterval(function() {
	self.expireUpdatesTimer();
    }, this.updateInterval);
}
RiseVision.TwitterList.prototype.pause = function() {
    if ($("#scrollContainer").infiniteScroll.pause) {
	$("#scrollContainer").infiniteScroll.pause();
    }
}
RiseVision.TwitterList.prototype.expireUpdatesTimer = function() {
    this.updatesTimerExpired = true;
}
RiseVision.TwitterList.prototype.timeAgo = function(dateString) {
    var rightNow = new Date(),
	then = new Date(dateString),
	diff = rightNow - then,
	second = 1000,
	minute = second * 60,
	hour = minute * 60,
	day = hour * 24,
	week = day * 7;
  
    if (isNaN(diff) || diff < 0) {
	return new Date(dateString).toString("d MMM");
    }
  
    if (diff < minute) {
	return Math.floor(diff / second) + "s";
    }
  
    if (diff < hour) {
	return Math.floor(diff / minute) + "m";
    }
  
    if (diff < day) {
	return  Math.floor(diff / hour) + "h";
    }
    
    return new Date(dateString).toString("d MMM");
}

RiseVision.Tweet = function(tweet, settings) {
    var $tweet = $("<li class='tweet item'>"),
	$avatar = $("<div class='avatar'>"),
	$profileImage = $("<img class='profile-image'>"),
	$details = $("<div class='details'>"),
	$permalink = $("<a class='permalink timestamp_font-style'>"),
	$date = $("<time class='date'>"),
	$header = $("<div class='header'>"),
	$profile = $("<a>"),
	$fullName = $("<span class='fullName tweet_font-style'>"),
	$userName = $("<span class='userName tweet_font-style'>"),
	$content = $("<div class='content'>"),
	$text = $("<div class='text tweet_font-style'>"),
	$retweet = $("<div class='retweet tweet_font-style'>"),
	$retweetIcon = $("<i class='retweetIcon'>"),
	$retweetLink = $("<a>"),
	mentions = [],
	hashtags = [],
	urls = [],
	tweetText = tweet.tweet,
	i = 0;
	    
    //Avatar
    if (settings.avatarSize == "large") {
	$profileImage.addClass("large");	
    }
    else {
	$profileImage.addClass("small");
    }
    
    $profileImage.attr("src", tweet.avatar);
    
    //Timestamp
    $permalink.attr("href", 'http://twitter.com/' + tweet.userName + '/status/' + tweet.id_str);
    $permalink.attr("target", "_blank");
    $date.html(tweet.createdAt);
    
    //Full name / user name
    $profile.attr("href", "https://twitter.com/" + tweet.userName);
    $profile.attr("target", "_blank");
    $fullName.html(tweet.user);
    $userName.html("@" + tweet.userName);
    
    //User_mentions must link to the mentioned user’s profile.
    for (i = 0; i < tweet.user_mentions.length; i++) {
	mentions.push("<a class='tweet_font-style' href='https://twitter.com/" +
	    encodeURIComponent(tweet.user_mentions[i].screen_name) + "' target='blank'>" +
	    "@" + tweet.user_mentions[i].screen_name + "</a>");
    }
    
    //Hashtags must link to a twitter.com search with the hashtag as the query.
    for (i = 0; i < tweet.hashtags.length; i++) {
	hashtags.push("<a class='tweet_font-style' href='https://twitter.com/search?q=" +
	    encodeURIComponent("#" + tweet.hashtags[i].text) + "' target='blank'>" +
	    tweet.tweet.slice(tweet.hashtags[i].indices[0], tweet.hashtags[i].indices[1]) + "</a>");
    }
    
    //Links in Tweet text must be displayed using the display_url field in the URL entities API response, and link to the original t.co url field.
    for (i = 0; i < tweet.urls.length; i++) {
	urls.push("<a class='tweet_font-style' href='" + tweet.urls[i].url + "' target='blank'>" + tweet.urls[i].display_url + "</a>");
    }
    
    $.each(mentions, function(index, value) {
	tweet.tweet = tweet.tweet.replace("@" + tweet.user_mentions[index].screen_name, value);
    });
    
    $.each(hashtags, function(index, value) {
	tweet.tweet = tweet.tweet.replace("#" + tweet.hashtags[index].text, value);
    });
    
    $.each(urls, function(index, value) {
	tweet.tweet = tweet.tweet.replace(tweet.urls[index].url, value);
    });
    
    $text.html(tweet.tweet);
    
    //Add elements to the DOM.
    $avatar.append($profile.clone()).find("a").append($profileImage);
    
    $permalink.append($date);
    $profile.append($fullName).append($userName);
    $header.append($profile);
    $content.append($text);
    $details.append($permalink).append($header).append($content);
    
    //Retweet
    if (tweet.retweetName) {
	$retweetLink.addClass("tweet_font-style");
	$retweetLink.attr("href", "https://twitter.com/" + tweet.retweetScreenName);
	$retweetLink.attr("target", "_blank");
	$retweetLink.html(tweet.retweetName);
	$retweet.append($retweetIcon).append("Retweeted by ").append($retweetLink);
	$details.append($retweet);
    }
    
    $tweet.append($avatar).append($details);

    if (settings.showSeparator) {
	$tweet.addClass("separator");
    }

    if (settings.scrollDirection == "up") {
	$(".page").append($tweet);
    }
    else {
	$(".page").prepend($tweet);
    }
}