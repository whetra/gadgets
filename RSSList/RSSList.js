function RSSList() {
    this.isLoading = true;
    this.isPaused = true;
    this.itemsCount = 0;
    this.feedLoadFailedTimer = null;
    this.feedLoadFailedInterval = 5000;  
    this.murl = prefs.getString("murl");
    this.interactivityTimeout = prefs.getInt("interactivityTimeout") * 1000;
    this.spacing = parseInt(prefs.getInt("spacing") / 2) + "px";
    this.spacing = parseInt(prefs.getInt("spacing") / 2) + "px";
    this.maxItems = prefs.getInt("totalItems");
    this.scrollBy = prefs.getString("scrollBy");
    this.scrollDirection = prefs.getString("scrollDirection");
    this.timerSet = false;
    this.updateInterval = 60000;
    this.updatesTimerExpired = false;
}
RSSList.prototype.loadFeed = function() {
    var self = this;
    
    this.feed = new google.feeds.Feed(this.murl);
    this.feed.setNumEntries(this.maxItems);
    this.feed.load(function(result) {
	if (!result.error) {
	    if (self.isHorizontal()) {
		if (self.isLoading) {
		    var data = [];
		    
		    $(".carousel").remove();
		    self.feedData = result.feed;    
		    
		    if ((self.feedData) && (self.feedData.entries) && (self.feedData.entries.length > 0)) {
			for (var i = 0; i < self.feedData.entries.length; i++) {
			    data.push(self.prepareFeedData(self.feedData.entries[i]));
			}
			
			var settings = {
			    width: prefs.getString("rsW"),
			    height: prefs.getString("rsH"),
			    scrollBy: prefs.getString("scrollBy"),
			    scrollDirection: prefs.getString("scrollDirection"),
			    duration: prefs.getInt("delay") * 1000,
			    spacing: prefs.getInt("spacing"),
			    interactivityTimeout: self.interactivityTimeout
			};
			
			self.horizontalScroll = new HorizontalScroll(settings, data);
			
			$(self.horizontalScroll).bind({
			    done: function() {
				doneEvent();
			    }
			});
			
			self.horizontalScroll.initialize();
		    }
		}
		else {	//Refreshing
		    //Save old and new data so that they can be compared.
		    self.oldData = self.feedData;
		    self.feedData = result.feed;
		    
		    //Refresh the whole thing if entries have been added or removed.
		    //This would likely be a rare occurrence.
		    if (self.feedData.entries.length != self.oldData.entries.length) {
			$.each(self.feedData.entries, function(index, entry) {
			    self.updateEntry(index, entry);
			});
		    }
		    else {	//Check if the details have changed.
			$.each(self.feedData.entries, function(index, entry) {
			    var oldEntry = self.oldData.entries[index],
				isChanged = false;
			    
			    //Author and Date
			    if (prefs.getString("showAuthor") != "none") {
				if (entry.author != oldEntry.author) {
				    isChanged = true;
				}
			    }
			    
			    //Snippet
			    if (entry.contentSnippet != oldEntry.contentSnippet) {
				isChanged = true;
			    }
			    
			    //Title
			    if (prefs.getBool("showTitle")) {
				if (entry.title != oldEntry.title) {
				    isChanged = true;
				}
			    }
			    
			    if (isChanged) {
				self.updateEntry(index, entry);
			    }
			});
		    }
		}
	    }
	    else {
		if (self.feedData) {
		    self.oldData = self.feedData;
		}
	    
		self.feedData = result.feed;
	    
		//Update feed entries in-place if they have changed.
		if (self.oldData) {
		    $.each(self.oldData.entries, function(key, entry) {
			//var entry = self.feedData.entries[key];
			
			//If the link has changed, it's a different story.
			//If the title has changed, it may be the same story with a new title.
			if ((self.link != entry.link) || (self.title != entry.title)) {
			    var $entry = $(".entry" + (key + 1));
			    
			    $entry.find("div > a").attr("href", entry.link);
			    $entry.find(".title").text(unescapeHTML(entry.title));
			    
			    if (self.author) {
				$entry.find(".author").text(new Date(entry.publishedDate).toString("MMMM dS, yyyy") + " by " + unescapeHTML(entry.author));
			    }
			    else {
				$entry.find(".author").text(new Date(entry.publishedDate).toString("MMMM dS, yyyy"));
			    }
					    
			    $entry.find(".snippet").text(unescapeHTML(entry.contentSnippet));
			}
		    });
		}
		else {	//Initial load.
		    $(".page").empty();
		    self.renderEntries();
		    
		    $("li").css({
			"padding-top": self.spacing,
			"padding-bottom": self.spacing
		    });
		    
		    $(".carousel").infiniteScroll({
			scrollBy: self.scrollBy,
			direction: prefs.getString("scrollDirection"),
			duration: prefs.getString("delay") * 1000,
			swipingTimeout: self.interactivityTimeout
		    })
		    .bind("onScroll", function(event) {
			self.onScroll.call(self, event);
		    });
		    
		    readyEvent();
		}
	    }
	} 
    });
}
//This function will be called if the feed fails to load, for example, when there is no Internet connection.
//In that case, continue playing the same feed entries.
RSSList.prototype.feedLoadFailed = function() {
    this.renderEntries();
}
RSSList.prototype.updateEntry = function(index, entry) {
    var data = [];
				
    data = this.prepareFeedData(entry);
    this.horizontalScroll.updateItem(index, data);
    data = null;
}
RSSList.prototype.prepareFeedData = function(entry) {
    var title, snippet, author, snippetFontRule, authorFontRule, item = [];
    
    //Author and Date
    if (prefs.getString("showAuthor") != "none") {
	if (entry.author) {
	    author = new Date(entry.publishedDate).toString("MMMM dS, yyyy") + " by " + unescapeHTML(entry.author);
	}
	else {
	    author = new Date(entry.publishedDate).toString("MMMM dS, yyyy");
	}
    }
    
    //Snippet
    snippet = unescapeHTML(entry.contentSnippet);
    
    //Title
    if (prefs.getBool("showTitle")) {
	title = unescapeHTML(entry.title);
    }
    
    if (title) {
	item.push({
	    type: "text",
	    value: title,
	    fontRule: document.styleSheets[1].cssRules[10].cssText
	});
    }
    
    if (document.styleSheets[1].cssRules[11].cssText.slice(0, 1) == "@") {	//Custom font
	snippetFontRule = document.styleSheets[1].cssRules[12].cssText;
	
	//Check if snippet is using a custom font.
	if (document.styleSheets[1].cssRules[13].cssText.slice(0, 1) == "@") {	//Custom font
	    authorFontRule = document.styleSheets[1].cssRules[14].cssText;
	}
	else {
	    authorFontRule = document.styleSheets[1].cssRules[13].cssText;
	}
    }
    else {
	snippetFontRule = document.styleSheets[1].cssRules[11].cssText;
	
	//Check if snippet is using a custom font.
	if (document.styleSheets[1].cssRules[12].cssText.slice(0, 1) == "@") {	//Custom font
	    authorFontRule = document.styleSheets[1].cssRules[13].cssText;
	}
	else {
	    authorFontRule = document.styleSheets[1].cssRules[12].cssText;
	}
    }
    
    item.push({
	type: "text",
	value: snippet,
	fontRule: snippetFontRule
    });
    
    if (author) {
	item.push({
	    type: "text",
	    value: author,
	    fontRule: authorFontRule
	});
    }
    
    return item;
}
RSSList.prototype.renderEntries = function() {
    if ((this.feedData) && (this.feedData.entries) && (this.feedData.entries.length > 0)) {
	//Only show as many entries as were returned from the feed.
	if (this.maxItems > this.feedData.entries.length) {
	    this.maxItems = this.feedData.entries.length;
	}
	
	for (var i = 0; i < this.feedData.entries.length; i++) {
	    this.renderEntry(i);
	}
	
	//Add 'last' class to last item so doneEvent can be called when the last item has scrolled.
	$(".item:last").addClass("last");
    }
}
RSSList.prototype.renderEntry = function(i) {
    var entry = this.feedData.entries[i],
	$entry = $("<li>"),
	$textSpan = $("<div>");
    
    $entry.addClass("item entry" + (i + 1));
    
    //Title
    if (prefs.getBool("showTitle")) {
	var $titleSpan = $("<div>");
	
	$titleSpan.addClass("title title_font-style");
	
	if (prefs.getBool("titleLink")) {
	    var $titleLink = $("<a>");
	
	    $titleLink.addClass("title title_font-style");
	    $titleLink.attr("href", entry.link);
	    $titleLink.attr("target", "_blank");
	    $titleLink.html(unescapeHTML(entry.title));
	    $titleSpan.append($titleLink);
	}
	else {
	    $titleSpan.html(unescapeHTML(entry.title));
	}
					
	$entry.append($titleSpan);
    }
    
    //Text
    $textSpan.addClass("snippet snippet_font-style");
    $textSpan.html(unescapeHTML(entry.contentSnippet));
	
    $entry.append($textSpan);
    
    if (prefs.getString("scrollDirection") == "up") {
	$(".page").append($entry);
    }
    else {
	$(".page").prepend($entry);
    }

    this.renderAuthorAndDate($entry.find(".snippet"), entry);
}
RSSList.prototype.renderAuthorAndDate = function($text, entry) {
    var showAuthor = prefs.getString("showAuthor");
		    
    if (showAuthor != "none") {
	var $authorDiv = $("<div>");
	
	$authorDiv.addClass("author author_font-style");
	
	//Alignment
	if ((showAuthor == "headerRight") || (showAuthor == "footerRight")) {
	    $authorDiv.addClass("authorRight");
	}
	else {
	    $authorDiv.addClass("authorLeft");
	}
	//Set Author and Date text.
	if (entry.author)
	    $authorDiv.text(new Date(entry.publishedDate).toString("MMMM dS, yyyy") + " by " + unescapeHTML(entry.author));
	else
	    $authorDiv.text(new Date(entry.publishedDate).toString("MMMM dS, yyyy"));
	    
	//Placement
	if ((showAuthor == "headerRight") || (showAuthor == "headerLeft")) {
	    $authorDiv.insertBefore($text);
	}
	else {
	    $authorDiv.insertAfter($text);
	}
    }	
}
RSSList.prototype.onScroll = function(e) {
    if (this.scrollBy == "item") {
	//Scroll off last item, then move to next playlist item, if applicable.
	if ($(".item:last").hasClass("last")) {
	    doneEvent();
	}
    }
    else if (this.scrollBy == "page") {
	//Scroll off page containing last item, then move to next playlist item, if applicable.
	if (this.isItemVisible($(".last:first"))) {
	    this.setTimer();
	}
    }
}
RSSList.prototype.isItemVisible = function($item) {
    if (($item.outerHeight(true) + $item.position().top) <= $(".carousel").outerHeight(true)) {
	return true;
    }
    else {
	return false;
    }
}
RSSList.prototype.isHorizontal = function() {
    return this.scrollDirection == "rtl" || this.scrollDirection == "ltr";
}
//RSSList.prototype.drawHorizontalScroller = function() {
//    if (this.horizontalScroll.getScrollBy() == "item") {
//	this.horizontalScroll.drawSceneByItem();
//    }
//    else {
//	this.horizontalScroll.drawScene();
//    }
//}
RSSList.prototype.play = function() {
    var self = this;
    
    if (this.scrollDirection != "none") {
	if (!this.isHorizontal()) {
	    if (!$(".carousel").infiniteScroll.canScroll()) {	//Vertical, not enough content to scroll.	
		this.setTimer();	
	    }
	}
    }
    else {	//No scrolling.
	this.setTimer();
    }
    
    if (this.isPaused) {
	this.isPaused = false;
	
	if (this.isHorizontal()) {
	    //this.horizontalScroll.request = tick();
	    this.horizontalScroll.tick();
	}
	else {
	    $(".carousel").infiniteScroll.start();
	}
    }
    
    if (this.isLoading) {
	this.isLoading = false;
	
	setInterval(function() {
	    self.loadFeed();
	}, this.updateInterval);
    }
}
RSSList.prototype.pause = function() {
    this.isPaused = true;
    
    if (this.isHorizontal()) {
	this.horizontalScroll.pause();
    }
    else {
	$(".carousel").infiniteScroll.pause();
    }
}
RSSList.prototype.setTimer = function() {
    var self = this;
    
    if (!this.timerSet) {
	setTimeout(function() {
	    doneEvent();
	    self.timerSet = false;	//Sometimes this fires and then onScroll fires immediately afteward.
	}, prefs.getInt("delay") * 1000);
	
	this.timerSet = true;
    }
}