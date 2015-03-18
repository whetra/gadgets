var RiseVision = RiseVision || {};
RiseVision.Events = {};
RiseVision.Events.Settings = {};
RiseVision.Events.EventWidget = {};

/*
 * The Settings class handles the display and behavior of a Widget's settings in the editor.
 */
RiseVision.Events.Settings = function() {
    this.settings = new RiseVision.Common.Settings();
}
//Populate settings from saved values.
RiseVision.Events.Settings.prototype.initSettings = function() {
    var self = this;
        
    //Add event handlers.    
    $(".colorPicker").on("click", function(event) {
	eventSettings.showColorPicker($(this).data("for"));
    });
    
    $(".fontSelector").on("click", function(event) {
	eventSettings.showFontSelector($(this).data("for"));
    });
    
    $("#visualOption").on("change", function(event) {
	if ($(this).val() == "tab") {
	    $("li.tabs").show();
	    $("li.list").hide();
	}
	else {
	    $("li.tabs").hide();
	    $("li.list").show();
	}
    });
    
    $("#scrollBy").on("change", function(event) {
	if ($(this).val() == "none") {
	    $("li.scroll").hide();
	}
	else {
	    $("li.scroll").show();
	}
    });
    
    $("#useDefault").on("click", function(event) {
	if ($(this).is(":checked")) {
	    $("li.layoutURL").hide();
	}
	else {
	    $("li.layoutURL").show();
	}
    });
    
    //Request additional parameters from the Viewer.
    gadgets.rpc.call("", "rscmd_getAdditionalParams", function(result) {
	if (result) {
	    result = JSON.parse(result);	    
	    
	    $("#visualOption").val(prefs.getString("visualOption"));
	    $("#daysCount").val(prefs.getString("daysCount"));	    
	    $("#scrollBy").val(prefs.getString("scrollBy"));
	    $("#scrollHold").val(prefs.getString("scrollHold"));    
	    $("#scrollResumes").val(prefs.getString("scrollResumes"));
	    $("#bgColor").val(prefs.getString("bgColor"));	    
	    $("#activeTabBgColor").val(prefs.getString("activeTabBgColor"));
	    $("#activeTabColor").val(prefs.getString("activeTabColor"));
	    $("#inactiveTabBgColor").val(prefs.getString("inactiveTabBgColor"));
	    $("#inactiveTabColor").val(prefs.getString("inactiveTabColor"));
	    $("#showDate").attr("checked", prefs.getBool("showDate"));
	    $("#useDefault").attr("checked", prefs.getBool("useDefault"));	    	    	
	    
	    //Populate colors and show color as background of text box.
	    self.populateColor($("#bgColor"), prefs.getString("bgColor"));
	    self.populateColor($("#activeTabBgColor"), prefs.getString("activeTabBgColor"));
	    self.populateColor($("#activeTabColor"), prefs.getString("activeTabColor"));
	    self.populateColor($("#inactiveTabBgColor"), prefs.getString("inactiveTabBgColor"));
	    self.populateColor($("#inactiveTabColor"), prefs.getString("inactiveTabColor"));	    
	    
	    //Populate fields saved as additionalParams.
	    $("#calendarID").val(result["calendarID"]);
	    $("#tab_font-style").text(result["tab_font"]);
	    $("#tab_font-style").data("css", result["tab_font-style"]);
	    $("#day_font-style").text(result["day_font"]);
	    $("#day_font-style").data("css", result["day_font-style"]);	    
	    $("#title_font-style").text(result["title_font"]);
	    $("#title_font-style").data("css", result["title_font-style"]);
	    $("#location_font-style").text(result["location_font"]);
	    $("#location_font-style").data("css", result["location_font-style"]);
	    $("#description_font-style").text(result["description_font"]);
	    $("#description_font-style").data("css", result["description_font-style"]);
	    $("#layoutURL").val(result["layoutURL"]);
	}
	
	$("form ol li ol.drillDown li:visible:last").css({
	    "clear": "left",
	    "float": "left",
	    "margin-bottom": "10px"
	});
	
	//Manually trigger event handlers so that the visibility of fields can be set.
	$("#visualOption").trigger("change");
	$("#scrollBy").trigger("change");
	$("#useDefault").triggerHandler("click");
	$("#settings").show();
    });    
}
RiseVision.Events.Settings.prototype.populateColor = function($element, color) {
    $element.val(color);
    $element.css("background-color", color);
}
RiseVision.Events.Settings.prototype.showColorPicker = function(id) {
    gadgets.rpc.call("", "rscmd_openColorPicker", null, id, $("#" + id).val()); 
}
RiseVision.Events.Settings.prototype.showFontSelector = function(id) {
    gadgets.rpc.call("", "rscmd_openFontSelector", null, id, $("#" + id).data("css"));
}
RiseVision.Events.Settings.prototype.setColor = function(id, color) {
    $("#" + id).val(color);
    $("#" + id).css("background-color", color);
}
RiseVision.Events.Settings.prototype.setFont = function(id, css, style) {
    $("#" + id).data("css", css);
    $("#" + id).text(style);
}
RiseVision.Events.Settings.prototype.getSettings = function() {
    var errorFound = false,
	errors = document.getElementsByClassName("errors")[0],
	service = null, query = null, settings = null,
	params = "";
    
    $(".errors").empty();
    $(".errors").css({ display: "none" });
    
    //Validate the Calendar ID to ensure that it returns data.
    if ($("#calendarID").val() != "") {
	service = new google.gdata.calendar.CalendarService("");
	query = new google.gdata.calendar.CalendarEventQuery("http://www.google.com/calendar/feeds/" + $("#calendarID").val() + "/public/full"); 

	query.setMaxResults(1);
	
	service.getEventsFeed(query,
	    //Data was returned. Validate all other settings.
	    function(result) {   
		//Required fields
		errorFound = (eventSettings.settings.validateRequired($("#scrollHold"), errors, "Scroll Hold")) ? true : errorFound;
		errorFound = (eventSettings.settings.validateRequired($("#scrollResumes"), errors, "Scroll Resumes")) ? true : errorFound;
		errorFound = (eventSettings.settings.validateRequired($("#layoutURL"), errors, "Layout URL")) ? true : errorFound;
		
		//Numeric fields
		errorFound = (eventSettings.settings.validateNumeric($("#scrollHold"), errors, "Scroll Hold")) ? true : errorFound;
		errorFound = (eventSettings.settings.validateNumeric($("#scrollResumes"), errors, "Scroll Resumes")) ? true : errorFound; 
		
		if (errorFound) {
		    $(".errors").fadeIn(200).css("display", "inline-block");
		    $("#wrapper").scrollTop(0);
		    
		    return null;
		}
		else {
		    //Construct parameters string to pass to RVA.
		    params = "up_visualOption=" + escape($("#visualOption").val()) +
			"&up_activeTabBgColor=" + $("#activeTabBgColor").val() +
			"&up_activeTabColor=" + $("#activeTabColor").val() +
			"&up_inactiveTabBgColor=" + $("#inactiveTabBgColor").val() +
			"&up_inactiveTabColor=" + $("#inactiveTabColor").val() +
			"&up_daysCount=" + $("#daysCount").val() +
			"&up_scrollBy=" + $("#scrollBy").val() + 
			"&up_scrollHold=" + $("#scrollHold").val() +
			"&up_scrollResumes=" + $("#scrollResumes").val() +
			"&up_bgColor=" + $("#bgColor").val();
			
		    if ($("#showDate").is(":checked")) {
			params += "&up_showDate=true";		
		    }
		    else {
			params += "&up_showDate=false";
		    }
		    
		    if ($("#useDefault").is(":checked")) {
			params += "&up_useDefault=true";		
		    }
		    else {
			params += "&up_useDefault=false";
		    }
		    
		    settings = {
			"params": params,
			"additionalParams": JSON.stringify(eventSettings.saveAdditionalParams())
		    };
		    
		    gadgets.rpc.call("", "rscmd_saveSettings", null, settings);
		}  
	    },
	    //Either the Calendar ID is invalid or the calendar is not public.
	    function(error) {
		$(".errors").append("The calendar could not be read. Please ensure that the Calendar ID is correct and that the calendar is public.");
		$(".errors").fadeIn(200).css("display", "inline-block");
		$("#wrapper").scrollTop(0);
			
		return null;
	    }
	);
    }
    else {
	errorFound = (eventSettings.settings.validateRequired($("#calendarID"), errors, "Calendar ID")) ? true : errorFound;
	
	if (errorFound) {
	    $(".errors").fadeIn(200).css("display", "inline-block");
	    $("#wrapper").scrollTop(0);
	    
	    return null;
	} 
    }
}
RiseVision.Events.Settings.prototype.saveAdditionalParams = function() {
    var additionalParams = {};  
    
    additionalParams["calendarID"] = $("#calendarID").val();
    additionalParams["tab_font"] = $("#tab_font-style").text();
    additionalParams["tab_font-style"] = $("#tab_font-style").data("css");
    additionalParams["day_font"] = $("#day_font-style").text();
    additionalParams["day_font-style"] = $("#day_font-style").data("css");
    additionalParams["title_font"] = $("#title_font-style").text();
    additionalParams["title_font-style"] = $("#title_font-style").data("css");
    additionalParams["location_font"] = $("#location_font-style").text();
    additionalParams["location_font-style"] = $("#location_font-style").data("css");
    additionalParams["description_font"] = $("#description_font-style").text();
    additionalParams["description_font-style"] = $("#description_font-style").data("css");
    additionalParams["layoutURL"] = $("#layoutURL").val();
    
   return additionalParams;
}
/* Settings End */

/* Functionality Start */
RiseVision.Events.EventWidget = function() {
    var prefs = new gadgets.Prefs(),
	defaultLayout = "",
	defaultStyle = "";
	
    this.visualOption = prefs.getString("visualOption");
    this.isTabbed = this.visualOption == "tab" ? true : false;    
    this.daysCount = prefs.getInt("daysCount");
    this.scrollBy = prefs.getString("scrollBy");
    this.scrollHold = prefs.getInt("scrollHold") * 1000;
    this.scrollResumes = prefs.getInt("scrollResumes") * 1000;
    this.showDate = prefs.getBool("showDate");
    this.isLoading = true;
    this.isPaused = true;
    this.service = null;
    this.layout = null;
    this.scrollTimerID = null;
    this.interactivityTimerID = null;
    this.eventsCount = 0;
    this.isScrolling = null;
    this.isDown = false;
    this.lastY = 0;
    
    if (this.daysCount <= 0) {
	this.daysCount = 1;
    }
    else if (this.daysCount > 7) {
	this.daysCount = 7;
    }
    
    if (this.isTabbed) {
	this.tabs = null;
    }
}
RiseVision.Events.EventWidget.prototype.getAdditionalParams = function(name, value) {
    if (name == "additionalParams") {
	if (value) {
	    var styleNode = document.createElement("style");
	    
	    value = JSON.parse(value);
	    
	    eventWidget.url = "http://www.google.com/calendar/feeds/" + value.calendarID + "/public/full";
	    
	    if (prefs.getBool("useDefault")) {
		eventWidget.layoutURL = eventWidget.isTabbed ? "https://s3.amazonaws.com/Gadget-Events/Layouts/Tabs/Tabs.xml" : "https://s3.amazonaws.com/Gadget-Events/Layouts/List/List.xml";
	    }
	    else {	
		eventWidget.layoutURL = value.layoutURL;
	    }
	    
	    //Inject CSS font styles into the DOM.
	    if (value["tab_font-style"]) {
		styleNode.appendChild(document.createTextNode(value["tab_font-style"]));
	    }
	    
	    if (value["day_font-style"]) {
		styleNode.appendChild(document.createTextNode(value["day_font-style"]));
	    }
	    
	    if (value["title_font-style"]) {
		styleNode.appendChild(document.createTextNode(value["title_font-style"]));
	    }
	    
	    if (value["location_font-style"]) {
		styleNode.appendChild(document.createTextNode(value["location_font-style"]));
	    }
	    
	    if (value["description_font-style"]) {
		styleNode.appendChild(document.createTextNode(value["description_font-style"]));
	    }
	    
	    document.getElementsByTagName("head")[0].appendChild(styleNode);
	}
    }
    
    eventWidget.init();
}
//Load the layout and CSS files.
RiseVision.Events.EventWidget.prototype.init = function() {
    var self = this,
	params = {};
    
    params[gadgets.io.RequestParameters.CONTENT_TYPE] = gadgets.io.ContentType.DOM;
    gadgets.io.makeRequest(this.layoutURL, function(obj) {
	var data = obj.data;
    
	//Set the navigation structure.
	if (data.getElementsByTagName("Navigation").length > 0) {
	    self.navigation = data.getElementsByTagName("Navigation")[0].childNodes[1].nodeValue;
	}
	
	if (data.getElementsByTagName("Style").length > 0) {
	    var head = document.getElementsByTagName("head")[0],
		style = document.createElement("style");
		
	    style.type = "text/css";
	    style.innerHTML = data.getElementsByTagName("Style")[0].childNodes[1].nodeValue;
	    head.appendChild(style);
	}
	
	if (data.getElementsByTagName("Content").length == 0) {
	    console.log("No Content tag specified in custom layout file.");
	    return;
	}
    
	//Save the Event layout.
	self.layout = data.getElementsByTagName("Content")[0].childNodes[1].nodeValue;

	if (self.isTabbed) {	    
	    RiseVision.Common.Utility.loadJS("https://s3.amazonaws.com/Gadget-Events/Layouts/Tabs/Tabs.js", function() {
		$("#container").append(self.navigation);
		self.tabs = new Tabs();
		self.tabs.initTabs(self.daysCount);
		self.getCalendar();
	    });
	}
	else {	//List or custom layout.
	    $("#container").append(self.navigation);
	    self.initDays();
	    self.getCalendar();
	}
    }, params);
}
RiseVision.Events.EventWidget.prototype.initDays = function() {
    var i = 0,
	currentDay = Date.today();
	    
    for (; i < this.daysCount; i++) {
	var $day = $(".day").eq(i);
	
	$day.empty();
	
	if (i == 0) {
	    $day.text("Today");
	}
	else {
	    $day.text(currentDay.toString("dddd"));
	}
	
	currentDay.setDate(currentDay.getDate() + 1);
    }
    
    //Remove any days that are not needed.
    for (i = 6; i >= this.daysCount; i--) {
	$(".content > ul > li").eq(i).remove();	//This should be changed to be generic.
    }
}
RiseVision.Events.EventWidget.prototype.setupService = function() {
    this.service = new google.gdata.calendar.CalendarService("");
}
RiseVision.Events.EventWidget.prototype.getCalendar = function() {
    var query = new google.gdata.calendar.CalendarEventQuery(this.url); 
    var today = Date.today();
    var lastDay = Date.today().set({ hour: 23, minute: 59, second: 59 });
    var self = this;
    
    lastDay.add({ days: this.daysCount - 1 });
    
    //Only return events for the next 7 days.
    query.setOrderBy("starttime");
    query.setSortOrder("ascending");
    query.setMinimumStartTime(new google.gdata.DateTime(today)); 
    query.setMaximumStartTime(new google.gdata.DateTime(lastDay));
    query.setMaxResults(100);
    query.setSingleEvents(true);
    
    this.isDataLoading = true;	//Issue 935
    this.setupService();
    this.service.getEventsFeed(query, function(result) {
	self.showEvents(result);
	self.scrollerHeight = $("#scroller").height();
	
	if (self.isLoading) {
	    if (self.isTabbed) {
		self.tabs.setScrollContainerTop();
	    }
	    
	    self.configureScrolling();
	}
	else {
	    if (!self.isTabbed) {
		self.configureScrolling();
	    }
	    
	    if (!self.isPaused) {
		self.setScroll();
	    }
	}
	
	setTimeout(function() {
	    clearInterval(self.scrollTimerID);
	    
	    if (self.isTabbed) {
		self.tabs.stopTimer();
		self.tabs.initTabs(self.daysCount);
	    }
	    
	    self.isScrolling = null;
	    self.getCalendar();
	}, 300000);	//5 minutes
	
	self.isDataLoading = false;	//Issue 935
	
	if (self.isLoading) {
	    self.isLoading = false;
	    readyEvent();
	}
    }, function(error) {
	setTimeout(function() {
	    clearInterval(self.scrollTimerID);
	    
	    if (self.isTabbed) {
		self.tabs.initTabs(self.daysCount);
	    }
	    
	    self.isScrolling = null;
	    self.getCalendar();
	}, 300000);	//5 minutes
	
	self.isDataLoading = false;	//Issue 935
	console.log(error);
	
	if (self.isLoading) {
	    self.isLoading = false;
	    readyEvent();
	}
    }); 
}
RiseVision.Events.EventWidget.prototype.configureScrolling = function() {
    var self = this;
    
    if (this.isTouchDevice()) {
	$(".scrollContainer").bind({		    
	    touchstart: function(e) {
		self.handleStart(e);
	    },
	    touchmove: function(e) {
		self.handleMove(e);
	    },
	    touchend: function() {
		self.handleEnd();
	    }
	});
    }
    else {
	$(".scrollContainer").bind({		    
	    mousedown: function(e) {
		self.handleStart(e);
	    },
	    mousemove: function(e) {
		self.handleMove(e);
	    },
	    mouseup: function() {
		self.handleEnd();
	    }
	});
    }
}
RiseVision.Events.EventWidget.prototype.showEvents = function(result) {
    var entries = result.feed.entry;
    var today = Date.today();
   
    if (this.isTabbed) {
	this.tabs.clear();
    }
    else {
	$("#container").empty();
	$("#container").append(this.navigation);
	this.initDays();
    }
    
    for (var i = 0; i < entries.length; i++) {
	var eventEntry = entries[i];
	var eventTitle = eventEntry.getTitle().getText();
	var locations = eventEntry.getLocations();
	var location = locations.length > 0 ? locations[0].valueString : "";
	var times = eventEntry.getTimes();
	var $content = null;

	//Recurring events will return an array of times.
	for (var j = 0; j < times.length; j++) {
	    var startTime = times[j].getStartTime();
	    var isAllDay = false;

	    if (startTime.isDateOnly()) {	//All Day event
		isAllDay = true;
	    }
	
	    if (this.isTabbed) {
		$content = this.tabs.addEvent(this.layout, startTime);
	    }
	    else {
		var self = this,
		    currentDay = Date.today();

		//Add event to appropriate day.
		$(".day").each(function (i) {
		    if (currentDay.compareTo(startTime.getDate().clone().clearTime()) == 0) {
			$content = $(".events").eq(i);
			$content.append(self.layout);
		    }
		    
		    currentDay.setDate(currentDay.getDate() + 1);
		});
	    }

	    //Add event.
	    if ($content) {
		$content.find(".title:last").html($content.find(".title:last").html() + eventTitle);
		
		if (this.showDate) {
		    $content.find(".date:last").html($content.find(".date:last").html() + startTime.getDate().toString("dddd"));
		}
		
		if (isAllDay) {
		    $content.find(".time:last").html(" - All Day");
		}
		else {
		    if (this.showDate) {
			$content.find(".time:last").html($content.find(".time:last").html() + startTime.getDate().toString("h:mmtt").toLowerCase());
		    }
		    else {
			$content.find(".time:last").html(startTime.getDate().toString("h:mmtt").toLowerCase());
		    }
		}
		
		if (location == "") {
		    $content.find(".location:last").html(location);
		}
		else {
		    $content.find(".location:last").html($content.find(".location:last").html() + location);
		}
		
		$content.find(".description:last").html(eventEntry.getContent().getText());
	    }
	}	
    }
}
RiseVision.Events.EventWidget.prototype.isTouchDevice = function() {
	return "ontouchstart" in window;
}
RiseVision.Events.EventWidget.prototype.play = function() {
    if (this.isPaused) {
	this.isPaused = false;
	
	//Issue 935 Start
	if (!this.isDataLoading) {
	    this.setScroll();
	}
	//Issue 935 End
    }
}
RiseVision.Events.EventWidget.prototype.pause = function() {
    clearInterval(this.scrollTimerID);
    this.isPaused = true;
}
RiseVision.Events.EventWidget.prototype.setScroll = function() {
    var self = this;
    
    if (this.scrollBy != "none") {
	this.scrollTimerID = setInterval(function() {
	    if (self.scrollBy == "row") {
		self.scrollByRow();
	    }
	    else {
		self.scrollByPage();
	    }
	}, this.scrollHold);
    }
}
RiseVision.Events.EventWidget.prototype.scrollByRow = function() {
    var self = this;
    
    if (this.isTabbed) {
	clearInterval(this.scrollTimerID);
	this.tabs.scrollByRow();
    }
    else {
	var $clone = null,
	    $eventsContainer = $(".eventsContainer:first"),
	    $day = $eventsContainer.find(".day"),
	    $events = $eventsContainer.find(".events"),
	    $event = $events.find(".event:first"),
	    $scroller = $("#scroller"),
	    scrollerTop = parseInt($scroller.css("margin-top")),
	    top = 0;
	    
	if (this.scrollerHeight > $("#container").height()) {
	    //If it's the last one, top should be height of eventsContainer to prevent jerky scroll.
	    if ($events.find(".event").length > 0) {
		if ($events.find(".event").length == 1) {
		    top = $eventsContainer.offset().top + $eventsContainer.outerHeight(true);
		}
		else {
		    top = $event.offset().top + $event.outerHeight(true);
		}
	    }
	    else if ($events.find(".day").length > 0) {
		top = $day.offset().top + $day.outerHeight(true);
	    }
	    else {
		top = $eventsContainer.offset().top + $eventsContainer.outerHeight(true);
	    }
	    
	    //1st event for that day scrolls.
	    if (this.eventsCount <= 0) {
		this.eventsCount = $events.find(".event").length;
		$clone = $eventsContainer.clone();
		$clone.find(".event").slice(1).remove();	//Remove all events except the first one.
		$scroller.append($clone);
		$scroller.animate({"margin-top": scrollerTop - top + "px"}, "slow", function() {
		    $scroller.css("margin-top", "0px");
		    $day.remove();
		    $event.remove();
		    self.eventsCount--;
		    
		    if (self.eventsCount <= 0) {
			$eventsContainer.remove();
		    }
		});
	    }
	    else {
		$clone = $event.clone();
		$scroller.find(".events:last").append($clone);
		$scroller.animate({"margin-top": scrollerTop - top + "px"}, "slow", function() {
		    $scroller.css("margin-top", "0px");
		    $event.remove();
		    self.eventsCount--;
		    
		    if (self.eventsCount == 0) {
			$eventsContainer.remove();
		    }
		});
	    }
	}
    }
}
RiseVision.Events.EventWidget.prototype.scrollByPage = function() {
    var self = this;
    
    if (this.isTabbed) {
	clearInterval(this.scrollTimerID);
	this.tabs.scrollByPage();
    }
    else {
	var $scroller = $("#scroller"),
	    scrollerTop = parseInt($scroller.css("margin-top")),
	    containerHeight = $("#container").height(),
	    count = 0;
	    
	if (this.isScrolling == null) {
	    //Not all events are visible. Duplicate all events to ensure that the Placeholder is always filled.
	    if (this.scrollerHeight > containerHeight) {
		var $clone = $scroller.children().clone();
		
		$scroller.append($clone);
		this.isScrolling = true;
	    }
	    else {	//Scrolling is not necessary.
		this.isScrolling = false;
	    }
	}
	
	if (this.isScrolling) {
	    //Scroll by the height of the container.
	    $scroller.animate({"margin-top": scrollerTop - containerHeight + "px"}, "slow", function() {
		//Remove event if it is outside of the visible area.
		for (var i = $(".eventsContainer").length - 1; i >= 0; i--) {
		    var $eventsContainer = $(".eventsContainer").eq(i);
		    var top = $eventsContainer.offset().top;
		    var height = $eventsContainer.outerHeight(true);	    
			
		    //Day has scrolled off-screen, so remove it and add a new one at the bottom.
		    if ((top + height) < 0) {		
			var $clone = $eventsContainer.clone();
			
			if (count == 0) {
			    $scroller.append($clone);
			}
			else {
			    var $elem;
			    
			    if (count == 1) {
				$elem = $scroller.find(".eventsContainer:last");
			    }
			    else {
				$elem = $scroller.find(".eventsContainer").slice(-count, -count + 1);
			    }
			    
			    $clone.insertBefore($elem);			    
			}
			
			$eventsContainer.remove();
			scrollerTop = parseInt($scroller.css("margin-top"));
			$scroller.css("margin-top", scrollerTop + height);
			count++;
		    }
		}
	    });
	}
    }
}
RiseVision.Events.EventWidget.prototype.handleStart = function(event) {
    clearInterval(this.scrollTimerID);
    
    //Cancel auto-scrolling and interactivity timeout when user is manually swiping.
    if (this.isTabbed) {
	this.tabs.stopTimer();
    }
    
    if (this.isTouchDevice()) {
	if (event.originalEvent.targetTouches.length == 1) {
	    var touch = event.originalEvent.targetTouches[0];
	    
	    this.lastY = touch.clientY;
	}
    }
    else {		    
	this.lastY = event.clientY;		    
    }
    
    this.isDown = true;
}
RiseVision.Events.EventWidget.prototype.handleEnd = function(event) {
    var self = this;
    
    clearTimeout(this.interactivityTimerID);
    
    //Resume auto-scrolling when timer expires.
    this.interactivityTimerID = setTimeout(function() {
	$(".content:visible").stop().animate({"margin-top": "0px"}, 500, function() {
	    self.setScroll();
	});
    }, this.scrollResumes);

    this.isDown = false;
}
RiseVision.Events.EventWidget.prototype.handleMove = function(event) {
    var touch, newY, delta, $content, marginTop, containerHeight;
    
    if (!this.isDown) {
	return;
    }
    
    if (this.isTouchDevice()) {
	if (event.originalEvent.targetTouches.length == 1) {
	    touch = event.originalEvent.targetTouches[0];
	    newY = touch.clientY;
	}
    }
    else {
	newY = event.clientY;
    }
    
    delta = this.lastY - newY;
    $content = $(".content:visible");
    marginTop = $content.css("margin-top");
    containerHeight = $content.height();
	
    if (delta > 0) {
	if (parseInt($content.css("margin-top")) > -(containerHeight - $(".scrollContainer:visible").height())) {
	    $content.css("margin-top", parseInt($content.css("margin-top")) - delta + "px");
	}
    }
    else if (delta < 0) {
	if ((parseInt($content.css("margin-top")) - delta) > 0) {
	    $content.css("margin-top", "0px");
	}
	else {
	    $content.css("margin-top", parseInt($content.css("margin-top")) - delta + "px");
	}
    }
    
    this.lastY = newY;
}