var RiseVision = RiseVision || {};
RiseVision.Common = RiseVision.Common || {};
RiseVision.Common.Sports = {};

RiseVision.Common.Sports = function(displayID) {
  var self = this;

  if (displayID) {
   this.displayID = displayID;
  }
  else {  //Use dummy ID.
   this.displayID = "xxx";
  }

  this.sport = prefs.getString("sport");
  this.collegeGames = prefs.getString("collegeGames");
  this.allSportsIndex = 0;
  this.updateInterval = 60000;
  this.allSports = ["NFL", "MLB", "NBA", "NHL", "CFOOT", "CBASK"];
  this.viz = new RiseVision.Common.Visualization();
}
RiseVision.Common.Sports.prototype.getData = function() {
  var self = this;

  this.wasReset = false;

  if (this.sport == "ALL") {
   this.processData("http://contentsports.appspot.com/sports/" + this.allSports[this.allSportsIndex] + ".aspx?View=Scoreboard&LogoStyle=Default" + this.getGroup() + "&DisplayId=" + this.displayId, function() {
      self.onSportLoaded();
     });
  }
  else {
    var group = "";

    if ((this.sport == "CFOOT") || (this.sport == "CBASK")) {
      group = "&Group=" + this.collegeGames;
    }

    this.processData("http://contentsports.appspot.com/sports/" + this.sport + ".aspx?View=Scoreboard&LogoStyle=Default" + group + "&DisplayId=" + this.displayID, function() {
        self.onDataLoaded();
      });
  }
}
RiseVision.Common.Sports.prototype.processData = function(url, callback) {
  var self = this;

  //Get sports data.
  $.ajax({
    url: url,
    success: function(data) {
      if (data) {
        var game = data.getElementsByTagName("Game"),
          sportCode = "", sportName, i;

        if (!self.wasReset) {
          self.sports = [];
          self.games = [];
          self.wasReset = true;
        }

        if (data) {
          if (data.getElementsByTagName("Sport").length > 0) {
            sportCode = data.getElementsByTagName("Sport")[0].getAttribute("Code");
          }

          if (game.length > 0) {
            sportName = self.getNodeValue(data.getElementsByTagName("Title"));

            self.sports.push({
              sportCode: sportCode,
              name: sportName
            });
          }

          //Get game stats.
          for (i = 0; i < game.length; i++) {
            var status = "",
              extendedStatus = "",
              team = game[i].getElementsByTagName("Team"),
              overUnder = "",
              host, visitor, home, j, date;

            if (game[i].getElementsByTagName("Status").length > 0) {
              status = game[i].getElementsByTagName("Status")[0].getAttribute("Code");
            }

            extendedStatus = self.getNodeValue(game[i].getElementsByTagName("Extended"));

            if (game[i].getElementsByTagName("Over_Under").length > 0) {
              if (game[i].getElementsByTagName("Over_Under")[0].getElementsByTagName("Casino").length > 0) {
                overUnder = "O/U " + game[i].getElementsByTagName("Over_Under")[0].getElementsByTagName("Casino")[0].getAttribute("value");
              }
            }

            date = self.getNodeValue(game[i].getElementsByTagName("Date"));

            if (date) {
              date = Date.parse(date);
            }

            for (j = 0; j < team.length; j++) {
              host = team[j].getAttribute("Host");

              if (host == "Visiting") {
                visitor = self.getTeamInfo(team[j], sportCode);
              }
              else if (host == "Home") {
                home = self.getTeamInfo(team[j], sportCode);
              }
            }

            self.games.push({
              sportCode: sportCode,
              date: date,
              status: status,
              extendedStatus: extendedStatus,
              overUnder: overUnder,
              visitor: visitor,
              home: home
            });
          }

          callback();
        }
        else {
          console.log("Invalid data source URL");
        }
      }
      else {
        setTimeout(function() {
          $(self).trigger("updateTimerExpired");
        }, self.updateInterval);
      }
    },
    dataType: "xml"
  });
}
RiseVision.Common.Sports.prototype.onSportLoaded = function() {
  var self = this, group;

  this.allSportsIndex++;

  group = this.getGroup();

  if (this.allSportsIndex == this.allSports.length) { //All games for all sports have been loaded.
    this.allSportsIndex = 0;
    this.onDataLoaded();
  }
  else {  //Load games for next sport.
    this.processData("http://contentsports.appspot.com/sports/" + this.allSports[this.allSportsIndex] + ".aspx?View=Scoreboard&LogoStyle=Default" + group + "&DisplayId=" + this.displayID, function() {
        self.onSportLoaded();
      });
  }
}
RiseVision.Common.Sports.prototype.getGroup = function() {
  var group = "";

  if ((this.allSports[this.allSportsIndex] == "CFOOT") || (this.allSports[this.allSportsIndex] == "CBASK")) {
    group = "&Group=" + this.collegeGames;
  }

  return group;
}
RiseVision.Common.Sports.prototype.getTeamInfo = function(team, sportCode) {
  var spread = "",
    img = new Image();

  if (team.getElementsByTagName("Casino").length > 0) {
    spread = team.getElementsByTagName("Casino")[0].getAttribute("value");
  }

  return {
    name: this.getNodeValue(team.getElementsByTagName("Name")),
    rank: this.getNodeValue(team.getElementsByTagName("Rank")),
    overall: this.getNodeValue(team.getElementsByTagName("Overall")),
    score: this.getNodeValue(team.getElementsByTagName("Total")),
    spread: spread
  };
}
RiseVision.Common.Sports.prototype.getNodeValue = function(node) {
  if (node.length > 0) {
    if (node[0].childNodes.length > 0) {
      return node[0].childNodes[0].nodeValue;
    }
    else {
      return "";
    }
  }

  return "";
}
RiseVision.Common.Sports.prototype.onDataLoaded = function() {
  var self = this;

  if (this.sports.length === 0) {
    $(this).trigger("noData");
  }
  else {
    setTimeout(function() {
      $(self).trigger("updateTimerExpired");
    }, this.updateInterval);

    $(this).trigger("imagesLoaded");
  }
}