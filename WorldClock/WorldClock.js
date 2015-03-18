var RiseVision = RiseVision || {};
RiseVision.WorldClock = {};
RiseVision.WorldClock.Settings = {};
RiseVision.WorldClock.Controller = {};

/*
 * The Settings class handles the display and behavior of Gadget settings in the editor.
 */
RiseVision.WorldClock.Settings = function() {
    this.settings = new RiseVision.Common.Settings();
}
/*
 * Populate settings from saved values.
 */
RiseVision.WorldClock.Settings.prototype.initSettings = function() {
    var self = this;
        
    //Add event handlers.
    $(".colorPicker").click(function() {
	clockSettings.showColorPicker($(this).data("for"));
    });
    
    $(".fontSelector").click(function() {
	clockSettings.showFontSelector($(this).data("for"));
    });
    
    $("#placement").change(function() {
	var val = $(this).val();
	
	if ((val == "top") || (val == "bottom")) {
	    $("li.horizontalAlign").show();
	    $("li.verticalAlign").hide();
	}
	else {
	    $("li.horizontalAlign").hide();
	    $("li.verticalAlign").show();
	}
    });
    
    $("input:checkbox").change(function() {
	if ($(this).val() == "useLocalTime") {
	    $(this).is(":checked") ? $("li.timeZone").hide() : $("li.timeZone").show();
	}
	else if ($(this).val() == "showTitle") {
	    $(this).is(":checked") ? $("li.title").show() : $("li.title").hide();
	}
	else if ($(this).val() == "showSecondHand") {
	    $(this).is(":checked") ? $("li.secondHand").show() : $("li.secondHand").hide();
	}
    });
    
    $("input[name='clockType']").change(function() {
	var val = $(this).val();
	
	if ($(this).is(":checked")) {
	    if (val == "analog") {
		$("li.analog").show();
		$("li.digital").hide();
	    }
	    else {
		$("li.analog").hide();
		$("li.digital").show();
	    }
	}
    });
    
    //Request additional parameters from the Viewer.
    gadgets.rpc.call("", "rscmd_getAdditionalParams", function(result) {
	if (result) {
	    var prefs = new gadgets.Prefs();	    
	    
	    result = JSON.parse(result);
	    
	    $("#useLocalTime").attr("checked", prefs.getBool("useLocalTime"));
	    $("#timeZone").val(prefs.getString("timeZone"));
	    $("#showTitle").attr("checked", prefs.getBool("showTitle"));
	    $("#title").val(prefs.getString("title"));
	    $("#placement").val(prefs.getString("placement"));
	    $("#padding").val(prefs.getInt("padding"));
	    $("#horizontalAlign").val(prefs.getString("horizontalAlign"));
	    $("#verticalAlign").val(prefs.getString("verticalAlign"));
	    $("#frameColor").val(prefs.getString("frameColor"));
	    $("#faceColor").val(prefs.getString("faceColor"));
	    $("#handColor").val(prefs.getString("handColor"));
	    $("#frameWidth").val(prefs.getInt("frameWidth"));
	    $("#hourTickWidth").val(prefs.getInt("hourTickWidth"));
	    $("#minuteTickWidth").val(prefs.getInt("minuteTickWidth"));
	    $("#handWidth").val(prefs.getInt("handWidth"));
	    $("#showSecondHand").attr("checked", prefs.getBool("showSecondHand"));
	    $("#secondHandColor").val(prefs.getString("secondHandColor"));
	    $("#secondHandWidth").val(prefs.getInt("secondHandWidth"));
	    $("#format").val(prefs.getString("format"));
	    $("#digitalColor").val(prefs.getString("digitalColor"));
	    $("#bgColor").val(prefs.getString("bgColor"));
	    
	    $("input[type='radio'][name='clockType']").each(function() {
		if ($(this).val() == prefs.getString("clockType")) {
		    $(this).attr("checked", "checked");
		}
	    });
	    
	    //Fonts
	    $("#title_font-style").text(result["title_font"]);
	    $("#title_font-style").data("css", result["title_font-style"]);
	    $("#numbers_font-style").text(result["numbers_font"]);
	    $("#numbers_font-style").data("css", result["numbers_font-style"]);
	    $("#digitalFont").val(result["digitalFont"]);
	    
	    //Colors
	    self.populateColor($("#frameColor"), prefs.getString("frameColor"));
	    self.populateColor($("#faceColor"), prefs.getString("faceColor"));
	    self.populateColor($("#handColor"), prefs.getString("handColor"));
	    self.populateColor($("#secondHandColor"), prefs.getString("secondHandColor"));
	    self.populateColor($("#digitalColor"), prefs.getString("digitalColor"));
	    self.populateColor($("#bgColor"), prefs.getString("bgColor"));
	}
	
	$("form ol li ol.drillDown li:visible:last").css({
	    "clear": "left",
	    "float": "left",
	    "margin-bottom": "10px"
	});
	    
	$("#settings").show();
	
	//Manually trigger event handlers so that the visibility of fields can be set.
	$("input:checkbox").trigger("change");
	$("input[name='clockType']").trigger("change");
	$("#placement").trigger("change");
    });
}
RiseVision.WorldClock.Settings.prototype.populateColor = function($element, color) {
    $element.val(color);
    $element.css("background-color", color);
}
RiseVision.WorldClock.Settings.prototype.showColorPicker = function(id) {
    gadgets.rpc.call("", "rscmd_openColorPicker", null, id, $("#" + id).val()); 
}
RiseVision.WorldClock.Settings.prototype.showFontSelector = function(id) {
    gadgets.rpc.call("", "rscmd_openFontSelector", null, id, $("#" + id).data("css"));
}
RiseVision.WorldClock.Settings.prototype.setColor = function(id, color) {
    $("#" + id).val(color);
    $("#" + id).css("background-color", color);
}
RiseVision.WorldClock.Settings.prototype.setFont = function(id, css, style) {
    $("#" + id).data("css", css);
    $("#" + id).text(style);
}
RiseVision.WorldClock.Settings.prototype.getSettings = function() {
    var errorFound = false,
	errors = document.getElementsByClassName("errors")[0],
	params = "",
	settings = null,
	selected;
    
    $(".errors").empty();
    
    errorFound = (clockSettings.settings.validateNumeric($("#padding"), errors, "Padding")) ? true : errorFound;
    errorFound = (clockSettings.settings.validateNumeric($("#frameWidth"), errors, "Frame Width")) ? true : errorFound;
    errorFound = (clockSettings.settings.validateNumeric($("#hourTickWidth"), errors, "Hour Tick Width")) ? true : errorFound;
    errorFound = (clockSettings.settings.validateNumeric($("#minuteTickWidth"), errors, "Minute Tick Width")) ? true : errorFound;
    errorFound = (clockSettings.settings.validateNumeric($("#handWidth"), errors, "Hour / Minute Hand Width")) ? true : errorFound;
    errorFound = (clockSettings.settings.validateNumeric($("#secondHandWidth"), errors, "Second Hand Width")) ? true : errorFound;
    
    if (errorFound) {
	$(".errors").fadeIn(200).css("display", "inline-block");
	$("#wrapper").scrollTop(0);
	
	return null;
    }
    else {
	//Construct parameters string to pass to RVA.
	params = ($("#useLocalTime").is(":checked")) ? "up_useLocalTime=true" : "up_useLocalTime=false";
	params +="&up_timeZone=" + $("#timeZone").val();
	params += ($("#showTitle").is(":checked")) ? "&up_showTitle=true" : "&up_showTitle=false";
	params += "&up_title=" + $("#title").val() +
	    "&up_placement=" + $("#placement").val();
	params += ($("#padding").val() == "") ? "&up_padding=0" : "&up_padding= " + $("#padding").val();
	params +=  "&up_horizontalAlign=" + $("#horizontalAlign").val() + 
	    "&up_verticalAlign=" + $("#verticalAlign").val();
	    
	//Clock Type
	selected = $("input[type='radio'][name='clockType']:checked");
	
	if (selected.length > 0) {
	    params += "&up_clockType=" + selected.val();
	}
	
	params += "&up_frameColor=" + $("#frameColor").val() +
	    "&up_faceColor=" + $("#faceColor").val() +
	    "&up_handColor=" + $("#handColor").val();
	    
	params += ($("#showSecondHand").is(":checked")) ? "&up_showSecondHand=true" : "&up_showSecondHand=false";
	params += "&up_secondHandColor=" + $("#secondHandColor").val() +
	    "&up_frameWidth=" + $("#frameWidth").val() +
	    "&up_hourTickWidth=" + $("#hourTickWidth").val() +
	    "&up_minuteTickWidth=" + $("#minuteTickWidth").val() +
	    "&up_handWidth=" + $("#handWidth").val() +
	    "&up_secondHandWidth=" + $("#secondHandWidth").val() +
	    "&up_format=" + $("#format").val() +
	    "&up_digitalColor=" + $("#digitalColor").val() +
	    "&up_bgColor=" + $("#bgColor").val();
	
	settings = {
	    "params": params,
	    "additionalParams": JSON.stringify(clockSettings.saveAdditionalParams())
	};
    
	$(".errors").css({ display: "none" });
	
	return settings;
    }  
}
RiseVision.WorldClock.Settings.prototype.saveAdditionalParams = function() {
    var additionalParams = {};  
    
    additionalParams["title_font"] = $("#title_font-style").text();
    additionalParams["title_font-style"] = $("#title_font-style").data("css");
    additionalParams["numbers_font"] = $("#numbers_font-style").text();
    additionalParams["numbers_font-style"] = $("#numbers_font-style").data("css");
    additionalParams["digitalFont"] = $("#digitalFont").val();
    
    return additionalParams;
}

RiseVision.WorldClock.Controller = function() {
    this.rsW = prefs.getInt("rsW");
    this.rsH = prefs.getInt("rsH");
    this.useLocalTime = prefs.getBool("useLocalTime");
    this.timeZone = prefs.getString("timeZone");
    this.placement = prefs.getString("placement");
    this.horizontalAlign = prefs.getString("horizontalAlign");
    this.verticalAlign = prefs.getString("verticalAlign");
    this.frameColor = prefs.getString("frameColor");
    this.faceColor = prefs.getString("faceColor");
    this.handColor = prefs.getString("handColor");
    this.frameWidth = prefs.getInt("frameWidth");
    this.hourTickWidth = prefs.getInt("hourTickWidth");
    this.minuteTickWidth = prefs.getInt("minuteTickWidth");
    this.handWidth = prefs.getInt("handWidth");
    this.showSecondHand = prefs.getBool("showSecondHand");
    this.secondHandColor = prefs.getString("secondHandColor");
    this.secondHandWidth = prefs.getInt("secondHandWidth");
    this.format = prefs.getString("format");
    this.digitalColor = prefs.getString("digitalColor");
}
RiseVision.WorldClock.Controller.prototype.getAdditionalParams = function(name, value) {
    var styleNode, rules;
    
    if (name == "additionalParams") {
	if (value) {
	    styleNode = document.createElement("style");
	    value = JSON.parse(value);
	    
	    //Inject CSS font styles into the DOM.
	    styleNode.appendChild(document.createTextNode(value["title_font-style"]));
	    styleNode.appendChild(document.createTextNode(value["numbers_font-style"]));
	    document.getElementsByTagName("head")[0].appendChild(styleNode);
	    
	    //Get Numbers Font.
	    controller.numbersFont = "";
	    rules = RiseVision.Common.Utility.parseCSSRule(RiseVision.Common.Utility.getStyle(".numbers_font-style"));
	    
	    //Issue 967 Start
	    if ((rules[3] != null) && (rules[3] != "normal")) {
		controller.numbersFont += rules[3] + " ";
	    }
	    
	    if ((rules[4] != null) && (rules[4] != "normal")) {
		controller.numbersFont += rules[4] + " ";
	    }
	    
	    controller.numbersFont += rules[2] + " " + rules[0];
	    //Issue 967 End
	    controller.numbersColor = rules[1];
	    
	    //Digital font
	    $("#digitalClock").css("font-family", value["digitalFont"]);
	}
    }
    
    controller.init();
}
RiseVision.WorldClock.Controller.prototype.init = function init() {
    var $title, canvas,
	showTitle = prefs.getBool("showTitle"),
	$analogClock = $("#analogClock");
    
    //Title
    if (showTitle) {
	$title = $("<div id='title' class='title_font-style'></div>")
	$title.text(prefs.getString("title"));
	$title.addClass(prefs.getString("clockType") + " " + this.placement);
	
	if ((this.placement == "top") || (this.placement == "bottom")) {
	    $title.addClass("halign" + this.horizontalAlign);
	    
	    if (this.placement == "top") {
		$("#container").prepend($title);
	    }
	    else {
		$("#container").append($title);
	    }
	}
	else {	//Left or Right
	    $title.addClass("valign" + this.verticalAlign);
	    
	    if (this.verticalAlign == "middle") {
		$title.css("line-height", this.rsH - prefs.getInt("padding") * 2 + "px");
	    }
	    
	    $("#container").prepend($title);
	}
    }
    
    timezoneJS.timezone.zoneFileBasePath = "https://s3.amazonaws.com/Common-Production/TimezoneJS/Olson";
    timezoneJS.timezone.init({async: false});
    
    if (prefs.getString("clockType") == "analog") {
	canvas = document.getElementById("analogClock");
	
	$("#digitalClock").hide();
	
	//Calculate dimensions of clock canvas. Must be a square.
	if (showTitle) {
	    if ((this.placement == "top") || (this.placement == "bottom")) {
		this.clockSize = this.rsH - $("#title").outerHeight();
		
		if (this.clockSize > this.rsW) {
		    this.clockSize = this.rsW;
		}
		
		canvas.width = this.clockSize;
		canvas.height = this.clockSize;
		
		$("#container").addClass("haligncenter");
	    }
	    else {
		if (this.verticalAlign == "middle") {
		    this.clockSize = this.rsW - $("#title").outerWidth();
		    
		    if (this.clockSize > this.rsH) {
			this.clockSize = this.rsH;
		    }
		    
		    //Vertical alignment
		    $analogClock.addClass("valign");
		    $analogClock.css("margin-top", -this.clockSize / 2 + "px");
		}
		else {
		    this.clockSize = this.rsH - $("#title").outerHeight();
		    
		    if (this.clockSize > this.rsW) {
			this.clockSize = this.rsW
		    }
		    
		    $("#container").addClass("haligncenter");
		}
		
		canvas.width = this.clockSize;
		canvas.height = this.clockSize;
	    }
	}
	else {
	    //Ensure clock's canvas is a square.
	    if (this.rsW > this.rsH) {
		this.clockSize = this.rsH;
		
		//Center horizontally.
		$("#container").addClass("haligncenter");
	    }
	    else if (this.rsW < this.rsH) {
		this.clockSize = this.rsW;
		
		//Center vertically.
		$analogClock.addClass("valign");
		$analogClock.css("margin-top", -this.clockSize / 2 + "px");
	    }
	    else {
		this.clockSize = this.rsW;
	    }
	    
	    canvas.width = this.clockSize;
	    canvas.height = this.clockSize;
	}
	
	this.drawAnalog();
    }
    else {
	$analogClock.hide();
	
	//Vertical alignment
	if (showTitle) {
	    if ((this.placement == "top") || (this.placement == "bottom")) {
		$("#digitalClock").css("line-height", this.rsH - $("#title").outerHeight() + "px");
	    }
	    else {
		$("#digitalClock").css("line-height", this.rsH + "px");
	    }
	}
	else {
	    $("#digitalClock").css("line-height", this.rsH + "px");
	}
	
	this.drawDigital();
	this.setBodyScale();
    }
    
    readyEvent();
}
/* This function is adapted from code located at http://www.neilwallis.com/projects/html5/clock/ */
RiseVision.WorldClock.Controller.prototype.drawAnalog = function() {
    var self = this,
	canvas = document.getElementById("analogClock"),
	c2d, now, hours, minutes, seconds;
     
    if (canvas.getContext) {
	c2d = canvas.getContext("2d");
	
	c2d.clearRect(0, 0, this.clockSize, this.clockSize);
	
	c2d.font = this.numbersFont;
	c2d.textBaseline = "middle";
	c2d.textAlign = "center";
	c2d.lineWidth = 1;
	c2d.save();
	
	//Frame and face
	c2d.strokeStyle = this.frameColor;
	c2d.fillStyle = this.faceColor;
	c2d.lineWidth = this.frameWidth;
	c2d.beginPath();
	c2d.arc(this.clockSize / 2, this.clockSize / 2, (this.clockSize / 2) - (this.frameWidth / 2), 0, Math.PI * 2, true);
	c2d.fill();
	c2d.stroke();

	c2d.strokeStyle = this.numbersColor;
	c2d.fillStyle = this.numbersColor;
	c2d.save();
	
	c2d.translate(this.clockSize / 2, this.clockSize / 2);
	
	//Ticks and numerals
	for (var i = 1; i <= 60; i++) {
	    ang = Math.PI / 30 * i;
	    sang = Math.sin(ang);
	    cang = Math.cos(ang);
	    
	    //If modulus of divide by 5 is zero then draw an hour marker/numeral.
	    if (i % 5 == 0) {
		c2d.lineWidth = this.hourTickWidth;
		sx = sang * this.clockSize / 2.9;
		sy = cang * -this.clockSize / 2.9;
		ex = sang * this.clockSize / 2.3;
		ey = cang * -this.clockSize / 2.3;
		nx = sang * this.clockSize / 3.55;
		ny = cang * -this.clockSize / 3.55;
		
		c2d.fillText(i / 5, nx, ny);
	    //Else this is a minute marker.
	    }
	    else {
		c2d.lineWidth = this.minuteTickWidth;
		sx = sang * this.clockSize / 2.5;
		sy = cang * this.clockSize / 2.5;
		ex = sang * this.clockSize / 2.3;
		ey = cang * this.clockSize / 2.3;
	    }
	    
	    c2d.beginPath();
	    c2d.moveTo(sx, sy);
	    c2d.lineTo(ex, ey);
	    c2d.stroke();
	}
	 
	//Get the time.
	now = this.useLocalTime ? new Date() : new timezoneJS.Date(new Date(), this.timeZone);
	hours = now.getHours();
	minutes = now.getMinutes();
	seconds = now.getSeconds();
	
	c2d.strokeStyle = this.handColor;
	c2d.lineWidth = this.handWidth;
	c2d.save();
	
	//Draw clock pointers but this time rotate the canvas rather than
	//calculating x/y start/end positions.
	//Hour hand
	c2d.rotate(Math.PI / 6 * (hours + (minutes / 60) + (seconds / 3600)));
	c2d.beginPath();
	c2d.moveTo(0, this.clockSize / 30);
	c2d.lineTo(0, -this.clockSize / 5);
	c2d.stroke();
	c2d.restore();
	c2d.save();
	
	//Minute hand
	c2d.rotate(Math.PI / 30 * (minutes + (seconds / 60)));
	c2d.beginPath();
	c2d.moveTo(0, this.clockSize / 15);			
	c2d.lineTo(0, -this.clockSize / 2.5);
	c2d.stroke();
	c2d.restore();
	c2d.save();
	
	//Second hand
	if (this.showSecondHand) {
	    c2d.rotate(Math.PI / 30 * seconds);
	    c2d.strokeStyle = this.secondHandColor;
	    c2d.lineWidth = this.secondHandWidth;
	    c2d.beginPath();
	    c2d.moveTo(0, this.clockSize / 15);			
	    c2d.lineTo(0, -this.clockSize / 2.5);	
	    c2d.stroke();
	}
	
	c2d.restore();
      
	//Additional restore to go back to state before translate.
	//Alternative would be to simply reverse the original translate.
	c2d.restore();
	
	setTimeout(function() {
	    self.drawAnalog();
	}, 1000);
    }
}
RiseVision.WorldClock.Controller.prototype.drawDigital = function() {
    var self = this,
	ampm = " AM",
	now = this.useLocalTime ? new Date() : new timezoneJS.Date(new Date(), this.timeZone),
	hours = now.getHours(),
	minutes = now.getMinutes(),
	seconds = now.getSeconds(),
	dispTime = "";
    
    if (hours >= 12) {
	ampm = " PM";
    }
	
    if (minutes <= 9) {
	minutes = "0" + minutes;
    }
    
    if (seconds <= 9) {
	seconds = "0" + seconds;
    }
    
    if ((this.format == "12HourSeconds") || (this.format == "12Hour")) {
	if (hours > 12) {
	    hours = hours - 12;
	}
	
	if (hours == 0) {
	    hours = 12;
	}
	
	if (this.format == "12HourSeconds") {	//4:13:47 PM
	    dispTime = hours + ":" + minutes + ":" + seconds + ampm;
	}
	else {	//4:13 PM
	    dispTime = hours + ":" + minutes + ampm;
	}
    }
    else if (this.format == "24HourSeconds") {	//16:13:47
	dispTime = hours + ":" + minutes  + ":" + seconds;
    }
    else {	//16:13
	dispTime = hours + ":" + minutes;
    }

    $("#digitalClock").html(dispTime).css("color", this.digitalColor);
    
    setTimeout(function() {
	self.drawDigital();
    }, 1000);
}
RiseVision.WorldClock.Controller.prototype.setBodyScale = function() {
    var fontSize = parseInt($("#digitalClock").css("font-size")),
	width,
	height = this.rsH;
	
    if (((this.placement == "left") || (this.placement == "right")) && (this.verticalAlign == "middle")) {
	width = this.rsW - $("#title").outerWidth();
    }
    else {
	width = this.rsW;
    }
    
    //Continually increase the font size until the content grows bigger than the Placeholder.
    while ((document.getElementById("digitalClock").offsetWidth < width) && (document.getElementById("digitalClock").offsetHeight < height)) {
	$("#digitalClock").css("font-size", ++fontSize);
    }
    
    //It's too big; back up one.
    $("#digitalClock").css("font-size", --fontSize);
}
RiseVision.WorldClock.Controller.prototype.play = function() {
    //this.clockTimer = setTimeout(this.draw, 1000);
}
RiseVision.WorldClock.Controller.prototype.pause = function() {
    //clearTimeout(this.clockTimer);
}