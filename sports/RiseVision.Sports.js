var RiseVision = RiseVision || {};
RiseVision.Sports = {};

RiseVision.Sports = function(displayID) {
    var prefs = new gadgets.Prefs(),
  self = this;

    this.duration = prefs.getInt("duration") * 1000;
    this.displayOdds = prefs.getBool("displayOdds");
    this.layout = prefs.getString("layout");

    if (this.layout == "single") {
  this.layoutURL = "http://3e0b2e35e630ddeda037-b278a7924c8db845e077fc70aa73c08d.r1.cf2.rackcdn.com/single.xml";
    }
    else if (this.layout == "stacked") {
  this.layoutURL = "http://3e0b2e35e630ddeda037-b278a7924c8db845e077fc70aa73c08d.r1.cf2.rackcdn.com/stacked.xml";
    }
    else {
  //If Custom layout is selected but no Layout URL has been specified, then use Single layout.
  this.layoutURL = prefs.getString("layoutURL") ? prefs.getString("layoutURL") : "http://3e0b2e35e630ddeda037-b278a7924c8db845e077fc70aa73c08d.r1.cf2.rackcdn.com/single.xml";
    }

    this.isLoading = true;
    this.isLastGame = false;
    this.gameIndex = 0;
    this.sportIndex = 0;
    this.sportsData = new RiseVision.Common.Sports(displayID);

    $(this.sportsData).bind({
  imagesLoaded: function() {
      self.onImageLoaded.call(self);
  },
  updateTimerExpired: function() {
      clearTimeout(self.contentTimer);
      self.sportsData.getData();
  }
    });
}
//Load the layout and CSS.
RiseVision.Sports.prototype.loadLayout = function() {
    var params = {},
  self = this,
  link = $("<link>");

    if (this.layoutURL) {
  params[gadgets.io.RequestParameters.CONTENT_TYPE] = gadgets.io.ContentType.DOM;
  gadgets.io.makeRequest(this.layoutURL, function(obj) {
      var data = obj.data;

      if (data.getElementsByTagName("Style").length > 0) {
    var head = document.getElementsByTagName("head")[0],
        style = document.createElement("style");

    style.type = "text/css";
    style.innerHTML = data.getElementsByTagName("Style")[0].childNodes[1].nodeValue;
    head.appendChild(style);
      }

      if (data.getElementsByTagName("Layout").length == 0) {
    return;
      }

      //Set the layout for the first page.
      $("#container").html(data.getElementsByTagName("Layout")[0].childNodes[1].nodeValue);
      self.sportsData.getData();
  }, params);
    }
}
RiseVision.Sports.prototype.onImageLoaded = function() {
    if (this.isLoading) {
  readyEvent();
    }
    else {
  //Don't fade games in and out if there is only one game and the single layout is selected OR
  //if there are 2 games or less and the stacked layout is selected.
  if ((this.layout == "single" && this.sportsData.games.length <= 1) || (this.layout == "stacked" && this.sportsData.games.length <= 2)) {
      //Start the timer because we still need to check for updates.
      this.startTimer();
  }
  else {
      this.showGame();
  }
    }
}
RiseVision.Sports.prototype.showGame = function() {
    var self = this,
  $content = $("#content"),
  previousSportCode,
  today = Date.today(),
  isDone = false;

  $(".header").hide();
  $("#spacer").hide();
  $(".sportLogoContainer").hide();
  $(".visitorName").addClass("noLogo");
  $(".homeName").addClass("noLogo");

    if (!this.displayOdds) {
  $(".status").addClass("noOdds");
    }

    $content.bind("webkitTransitionEnd", function(event) {
  $(".game").each(function(index) {
      var sportCode, game, visitorName, homeName, parent;

      //If it's the first iteration and the last game was previously shown (ie. gameIndex = games.length), call done right away.
      if (index == 0 && (self.gameIndex == self.sportsData.games.length)) {
    self.gameIndex = 0;
    isDone = true;
      }
      else {
    //If the last game is encountered, but there is a game that still needs to be shown, then show these games first before calling done.
    if (self.gameIndex >= self.sportsData.games.length) {
        $(".stats:gt(" + (index - 1) + ")").css("visibility", "hidden");
        $(".game:gt(" + (index - 1) + ")").css("visibility", "hidden");

        self.isLastGame = true;
        self.gameIndex = 0;

        return false;
    }
      }

      game = self.sportsData.games[self.gameIndex];

      if (game) {
    sportCode = game.sportCode;

    if (previousSportCode && (previousSportCode != sportCode)) {  //This will not execute for the first game.
        //If the second game is for a different sport, then don't show it until the next iteration
        //when the correct sport logo will be shown.
        $(".stats:gt(" + (index - 1) + ")").css("visibility", "hidden");
        $(".game:gt(" + (index - 1) + ")").css("visibility", "hidden");

        return false;
    }
    else {
        $(".stats").css("visibility", "visible");
        $(".game").css("visibility", "visible");

        previousSportCode = sportCode;
    }

    if (index == 0) {
      //Find the corresponding data for the sport.
      for (var i = 0; i < self.sportsData.sports.length; i++) {
        if (sportCode == self.sportsData.sports[i].sportCode) {
          self.sportIndex = i;
          break;
        }
      }

      $(".sportLogoContainer").css("background", "").hide();
    }

    if (Date.compare(today, game.date) == -1) { //Future game
        $(".status").eq(index).text(game.date.toString("ddd"));
    }
    else {  //Today's game
        $(".status").eq(index).text(game.extendedStatus);
    }

    if (self.displayOdds) {
        $(".overUnder").eq(index).text(game.overUnder);
    }
    else {
        $(".overUnder").hide();
    }

    if (game.visitor.rank > 0) {
        visitorName = "(" + game.visitor.rank + ") " + game.visitor.name;
    }
    else {
        visitorName = game.visitor.name;
    }

    if (game.home.rank > 0) {
        homeName = "(" + game.home.rank + ") " + game.home.name;
    }
    else {
        homeName = game.home.name;
    }

    $(".visitorName").eq(index).text(visitorName);
    $(".homeName").eq(index).text(homeName);

    if (game.status != "not started") { //Show score.
        $(".visitorRecord").eq(index).text(game.visitor.score);
        $(".homeRecord").eq(index).text(game.home.score);
        self.showRecord(index);
    }
    else if (self.displayOdds) {  //Show odds.
        if (game.visitor.spread) {
      $(".visitorSpread").eq(index).text(game.visitor.spread);
        }
        else {
      $(".visitorSpread").eq(index).empty();
        }

        if (game.home.spread) {
      $(".homeSpread").eq(index).text(game.home.spread);
        }
        else {
      $(".homeSpread").eq(index).empty();
        }

        self.showSpread(index);
    }
    else {  //Show record.
      if (game.visitor.overall) {
       $(".visitorRecord").eq(index).text(game.visitor.overall);
      }
      else {
        $(".visitorRecord").eq(index).text("");
      }

      if (game.home.overall && game.home.overall != "0-0") {
        $(".homeRecord").eq(index).text(game.home.overall);
      }
      else {
        $(".homeRecord").eq(index).text("");
      }

      self.showRecord(index);
    }

    self.gameIndex++;
      }
  });

  $(this).unbind(event);

  if (!isDone) {
      $(this).bind("webkitTransitionEnd", function(event) {
    self.startTimer();
    $(this).unbind(event);
      });
  }
  else {
      doneEvent();
  }

  //Adjust line height for the single layout, since it won't work if using percentages.
  if (self.layout == "single") {
      var lineHeight = $(".visitorName").height();

      $(".visitor > div, .home > div").css("line-height", lineHeight + "px");
  }

  $content.addClass("fadeIn").removeClass("fadeOut");
    });

    $content.addClass("fadeOut").removeClass("fadeIn");
}
RiseVision.Sports.prototype.showRecord = function(index) {
    $(".visitorSpread").eq(index).hide();
    $(".homeSpread").eq(index).hide();
    $(".visitorRecord").eq(index).show();
    $(".homeRecord").eq(index).show();
}
RiseVision.Sports.prototype.showSpread = function(index) {
    $(".visitorSpread").eq(index).show();
    $(".homeSpread").eq(index).show();
    $(".visitorRecord").eq(index).hide();
    $(".homeRecord").eq(index).hide();
}
RiseVision.Sports.prototype.startTimer = function() {
    var self = this;

    clearTimeout(this.contentTimer);

    this.contentTimer = setTimeout(function() {
  if (self.isLastGame) {
      doneEvent();
  }
  else {
      //Don't fade games in and out if there is only one game and the single layout is selected OR
      //if there are 2 games or less and the stacked layout is selected.
      if ((self.layout == "single" && self.sportsData.games.length <= 1) || (self.layout == "stacked" && self.sportsData.games.length <= 2)) {
    doneEvent();  //Issue 821
      }
      else {
    self.showGame();
      }
  }
    }, this.duration);
}
RiseVision.Sports.prototype.play = function() {
    if (this.isLoading) {
  this.isLoading = false;
  this.showGame();
    }
    else {
  if ((this.layout == "single" && this.sportsData.games.length > 1) || (this.layout == "stacked" && this.sportsData.games.length > 2)) {
      //Last game has already been shown. Move directly to next game.
      if (this.isLastGame) {
    this.isLastGame = false;
    this.showGame();
      }
      else {
    this.startTimer();
      }
  }
  else {
      this.startTimer();
  }
    }
}
RiseVision.Sports.prototype.pause = function () {
    clearTimeout(this.contentTimer);
}