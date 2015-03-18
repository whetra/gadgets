var RiseVision = RiseVision || {};
RiseVision.SportsScroller = {};

RiseVision.SportsScroller = function(displayID) {
    var self = this;
    
    this.isLoading = true;
    this.isPaused = true;
    this.sportsData = new RiseVision.Common.Sports(displayID);
    
    $(this.sportsData).bind({
	imagesLoaded: function() {
	    self.onImageLoaded.call(self);
	},
	noData: function() {
	    readyEvent();
	},
	updateTimerExpired: function() {
	    self.sportsData.getData();
	}
    });
    
    this.sportsData.getData();	    
}
RiseVision.SportsScroller.prototype.onImageLoaded = function() {
    var self = this; 
    
    //Get data ready to pass to the horizontal scroller.
    if (this.isLoading) {
	var data = [];
	
	this.sports = this.sportsData.sports;
	this.games = this.sportsData.games;
	this.getFontRules();
	
	$.each(this.sports, function(index, sport) {
	    var parentValue = sport;
	    
	    data.push(self.prepareSportData(sport));
	    
	    $.each(self.games, function(index, game) {
		if (game.sportCode == parentValue.sportCode) {
		    data.push(self.prepareGameData(game));
		}
	    });
	});

	this.horizontalScroll = new HorizontalScroll({
	    width: prefs.getString("rsW"),
	    height: prefs.getString("rsH"),
	    scrollBy: prefs.getString("scrollBy"),
	    scrollDirection: prefs.getString("scrollDirection"),
	    duration: prefs.getInt("duration") * 1000,
	    spacing: prefs.getInt("spacing"),
	    interactivityTimeout: prefs.getInt("interactivityTimeout") * 1000
	}, data);
	
	$(this.horizontalScroll).bind({
	    done: function() {
		doneEvent();
	    }
	});
	
	//Need to add a delay that allows sufficient time for the custom font to be loaded by the div tag.
	//If the font is not already loaded, the canvas can't use it.
	setTimeout(function() {
	    self.horizontalScroll.initialize();
	}, 1000);
	
	data = null;
	this.isLoading = false;
    }
    else {	//Refreshing
	//Save old and new data so that they can be compared.
	this.oldSports = this.sports;
	this.oldGames = this.games;
	this.sports = this.sportsData.sports;
	this.games = this.sportsData.games;
	
	//Refresh the whole thing if sports or games have been added or removed.
	if ((this.sports.length != this.oldSports.length) || (this.games.length != this.oldGames.length)) {
	    this.currentSportIndex = 0;
	    this.currentGameIndex = 0;
	    this.updateSports();
	}
	else {
	    //Check if game details have changed. We're assuming that the Sports data will never change, which it shouldn't.
	    this.currentGameIndex = 0;
	    this.updateGame();
	}
    }
}
RiseVision.SportsScroller.prototype.updateSports = function() {
    var sport = this.sports[this.currentSportIndex],
	self = this,
	data = null,
	itemIndex;
	
    if (sport) {
	data = this.prepareSportData(sport);
	itemIndex = this.getSportItemIndex(sport.sportCode);
	this.horizontalScroll.updateItem(itemIndex, data, function() {
	    self.updateGames(sport.sportCode);
	});
    }
    
    data = null;
}
RiseVision.SportsScroller.prototype.updateGames = function(sportCode) {
    var game = this.games[this.currentGameIndex],
	self = this,
	data = null,
	itemIndex;
     
    if (game) {
	if (sportCode == game.sportCode) {
	    data = this.prepareGameData(game);
	    itemIndex = this.getGameItemIndex(game.sportCode);
	    this.horizontalScroll.updateItem(itemIndex, data, function() {
		self.currentGameIndex++;
		self.updateGames(sportCode);
	    });
	}
	else {	//Update next sport.
	    this.currentSportIndex++;
	    this.updateSports();
	}
    }
    else {	//Update next sport.
	this.currentSportIndex++;
	this.updateSports();
    }

    data = null;
}
RiseVision.SportsScroller.prototype.hasGameChanged = function() {
    var game = this.games[this.currentGameIndex],
	oldGame = this.oldGames[this.currentGameIndex];
	
    if (game.visitor.logo != oldGame.visitor.logo) {
	return true;
    }
    
    if (game.visitor.name != oldGame.visitor.name) {
	return true;
    }
    
    if (game.visitor.rank != oldGame.visitor.rank) {
	if (game.visitor.rank > 0) {
	    return true;
	}
    }
    
    if (game.status != oldGame.status) {
	if (game.status != "not started") {
	    if (game.visitor.score != oldGame.visitor.score) {
		return true;
	    }
	    
	    if (game.home.score != oldGame.home.score) {
		return true;
	    }
	}
	else {
	    if (game.visitor.spread != oldGame.visitor.spread) {
		return true;
	    }
	    
	    if (game.home.spread != oldGame.home.spread) {
		return true;
	    }
	}
    }
    
    if (game.home.logo != oldGame.home.logo) {
	return true;
    }
    
    if (game.home.name != oldGame.home.name) {
	return true;
    }
    
    if (game.home.rank != oldGame.home.rank) {
	if (game.home.rank > 0) {
	    return true;
	}
    }
    
    if (game.overUnder != oldGame.overUnder) {
	return true;
    }
    
    if (Date.compare(game.date, oldGame.date) != 0) {
	if (Date.compare(today, game.date) == -1) {
	    if (game.date.toString("ddd") != oldGame.date.toString("ddd")) {
		return true;
	    }
	}
	else {
	    if (game.extendedStatus != oldGame.extendedStatus) {
		return true;
	    }
	}
    }
}
RiseVision.SportsScroller.prototype.updateGame = function() {
    var itemIndex,
	self = this,
	data = [],
	game = this.games[this.currentGameIndex];
		
    if (game) {
	if (this.hasGameChanged()) {
	    itemIndex = this.getGameItemIndex(game.sportCode);
	    data = this.prepareGameData(game);
	    
	    this.horizontalScroll.updateItem(itemIndex, data, function() {
		self.currentGameIndex++;
		self.updateGame();
	    });
	}
	else {
	    this.currentGameIndex++;
	    this.updateGame();
	}
    }
    
    data = null;
}
RiseVision.SportsScroller.prototype.getSportItemIndex = function(sportCode) {
    var itemIndex = 0,
	sport = this.sports[this.currentSportIndex];
	
    if (this.currentSportIndex == 0) {
	itemIndex = 0;
    }
    else {
	$.each(this.games, function(index, game) {
	    if (sportCode == game.sportCode) {
		itemIndex += this.currentSportIndex;
		return false;
	    }
	    else {
		itemIndex++;
	    }
	});
    }
    
    return itemIndex;
}
RiseVision.SportsScroller.prototype.getGameItemIndex = function(sportCode) {
    var itemIndex,
	self = this;
    
    $.each(this.sports, function(index, sport) {
	if (sportCode == sport.sportCode) {
	    itemIndex = self.currentGameIndex + index + 1;
	    return false;
	}
    });
    
    return itemIndex;
}
RiseVision.SportsScroller.prototype.prepareSportData = function(sport) {
    var item = [];
    
    //Sport
    if (sport.logo) {
	item.push({
	    type: "image",
	    value: sport.logo,
	    fontRule: ""
	});
    }
	    
    item.push({
	type: "text",
	value: sport.name,
	fontRule: this.sportFont
    });
    
    return item;
}
RiseVision.SportsScroller.prototype.prepareGameData = function(game) {
    var item = [], visitor = "", home = "", gameStatus = "",
	today = Date.today();
    
    if (game.visitor.logo) {
	item.push({
	    type: "image",
	    value: game.visitor.logo,
	    fontRule: ""
	});
    }
    
    //Visiting team
    if (game.visitor.rank > 0) {
	visitor = "(" + game.visitor.rank + ") " + game.visitor.name + " ";
    }
    else {
	visitor = game.visitor.name + " ";
    }	
    
    if (game.status != "not started") {
	visitor += game.visitor.score;	//Show score.	
    }
    else {
	if (game.visitor.spread) {
	    visitor += game.visitor.spread;	//Show odds.
	}
    }
    
    item.push({
	type: "text",
	value: visitor + " @",
	fontRule: this.teamFont
    });
    
    //Home team
    if (game.home.logo) {
	item.push({
	    type: "image",
	    value: game.home.logo,
	    fontRule: ""
	});
    }
    
    if (game.home.rank > 0) {
	home = "(" + game.home.rank + ") " + game.home.name + " ";
    }
    else {
	home = game.home.name + " ";
    }
    
    if (game.status != "not started") {
	home += game.home.score;	//Show score.	
    }
    else {
	if (game.home.spread) {
	    home += game.home.spread;	//Show odds.
	}
    }
    
    item.push({
	type: "text",
	value: home,
	fontRule: this.teamFont
    });
    
    //Odds - Over/Under
    item.push({
	type: "text",
	value: game.overUnder,
	fontRule: this.gameFont
    });
    
    //Game status
    if (Date.compare(today, game.date) == -1) {	//Future game
	gameStatus = game.date.toString("ddd");
    }
    else {	//Today's game
	gameStatus = game.extendedStatus;
    }
    
    item.push({
	type: "text",
	value: gameStatus,
	fontRule: this.gameFont
    });
    
    return item;
}
RiseVision.SportsScroller.prototype.getFontRules = function() {
    this.teamFont = document.styleSheets[1].cssRules[0].cssText;
    
    //CSS might be @font-face when a custom font has been specified.
    //Need to handle that case for each of the fonts.
    if (document.styleSheets[1].cssRules[1] instanceof CSSStyleRule) {
	this.gameFont = document.styleSheets[1].cssRules[1].cssText;
	
	//Sport font
	if (document.styleSheets[1].cssRules[2] instanceof CSSStyleRule) {
	    this.sportFont = document.styleSheets[1].cssRules[2].cssText;
	}
	else {
	    this.sportFont = document.styleSheets[1].cssRules[3].cssText;
	}	
    }
    else {
	this.gameFont = document.styleSheets[1].cssRules[2].cssText;
	
	//Sport font
	if (document.styleSheets[1].cssRules[3] instanceof CSSStyleRule) {
	    this.sportFont = document.styleSheets[1].cssRules[3].cssText;
	}
	else {
	    this.sportFont = document.styleSheets[1].cssRules[4].cssText;
	}
    }
}
RiseVision.SportsScroller.prototype.play = function() {
    if (this.isPaused) {
	this.isPaused = false;
	
	if (this.horizontalScroll) {
	    this.horizontalScroll.tick();
	}
    } 
}
RiseVision.SportsScroller.prototype.pause = function () {
    this.isPaused = true;
    
    if (this.horizontalScroll) {
	this.horizontalScroll.pause();
    }
}