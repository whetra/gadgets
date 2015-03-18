/* Primary functionality for the Weather Gadget. */
var RiseVision = RiseVision || {};
RiseVision.WeatherSettings = {};

/* Settings Start */
RiseVision.WeatherSettings = function() {
    this.settings = new RiseVision.Common.Settings();
}
//Populate settings from saved values.
RiseVision.WeatherSettings.prototype.initSettings = function() {
    var self = this;
        
    //Add event handlers.
    $(".colorPicker").on("click", function(event) {
	weather.showColorPicker($(this).data("for"));
    });
    
    $(".fontSelector").on("click", function(event) {
	weather.showFontSelector($(this).data("for"));
    });
    
    $("#layout").on("change", function(event) {		
	//Current Temperature Font only applies for layouts that show current weather.
	if ($(this).val() == "3Day") {
	    $("li.current").hide();
	}
	else {
	     $("li.current").show();
	}
	
	//Forecast Temperature Font and Forecast Day font only apply for layouts that show forecasted weather.
	if ($(this).val() == "current") {
	    $("li.forecast").hide();
	}
	else {
	     $("li.forecast").show();
	}
	
	//Show Layout URL for a custom layout.
	if ($(this).val() == "custom") {
	    $("li.layoutURL").show();
	}
	else {
	    $("li.layoutURL").hide();
	}
    });
    
    $("#address").on("change", function(event) {
	if ($(this).val() == "custom") {
	    $("li.customAddress").show();
	}
	else {
	    $("li.customAddress").hide();
	}
    });
    
    $("#description").on("change", function(event) {
	if ($(this).val() == "custom") {
	    $("li.customDescription").show();
	}
	else {
	    $("li.customDescription").hide();
	}
    });
    
    $("#showOther").on("click", function(event) {
	if ($(this).is(":checked")) {
	    $("li.other").show();
	}
	else {
	    $("li.other").hide();
	}
    });
    
    //Request additional parameters from the Viewer.
    gadgets.rpc.call("", "rscmd_getAdditionalParams", function(result) {
	if (result) {
	    result = JSON.parse(result);
	    
	    //Populate fields saved as UserPrefs.
	    $("#layout").val(prefs.getString("layout"));
	    $("#layoutURL").val(prefs.getString("layoutURL"));
	    $("#address").val(prefs.getString("address"));
	    $("#customAddress").val(prefs.getString("customAddress"));
	    $("#description").val(prefs.getString("description"));
	    $("#showOther").attr("checked", prefs.getBool("showOther"));
	    $("#language").val(prefs.getString("language"));
	    $("#unit").val(prefs.getString("unit"));
	    $("#windSpeed").val(prefs.getString("windSpeed"));
	    $("#bgColor").val(prefs.getString("bgColor"));	
	    $("#terms").attr("checked", prefs.getBool("terms"));	    
	    	    
	    self.populateColor($("#bgColor"), prefs.getString("bgColor"));
    
	    //Populate fields saved as additionalParams.
	    $("#temp_font-style").text(result["temp_font"]);
	    $("#temp_font-style").data("css", result["temp_font-style"]);	    
	    $("#forecastTemp_font-style").text(result["forecastTemp_font"]);
	    $("#forecastTemp_font-style").data("css", result["forecastTemp_font-style"]);
	    $("#forecastDay_font-style").text(result["forecastDay_font"]);
	    $("#forecastDay_font-style").data("css", result["forecastDay_font-style"]);
	    $("#address_font-style").text(result["address_font"]);
	    $("#address_font-style").data("css", result["address_font-style"]);
	    $("#customDescription").val(result["customDescription"]);
	    $("#other_font-style").text(result["other_font"]);
	    $("#other_font-style").data("css", result["other_font-style"]);
	}
	
	//Manually trigger event handlers so that the visibility of fields can be set.
	$("#layout").trigger("change");
	$("#address").trigger("change");
	$("#description").trigger("change");
	$("#showOther").triggerHandler("click");
	$("#settings").show();
    });    
}
RiseVision.WeatherSettings.prototype.populateColor = function($element, color) {
    $element.val(color);
    $element.css("background-color", color);
}
RiseVision.WeatherSettings.prototype.showColorPicker = function(id) {
    gadgets.rpc.call("", "rscmd_openColorPicker", null, id, $("#" + id).val()); 
}
RiseVision.WeatherSettings.prototype.showFontSelector = function(id) {
    gadgets.rpc.call("", "rscmd_openFontSelector", null, id, $("#" + id).data("css"));
}
RiseVision.WeatherSettings.prototype.setColor = function(id, color) {
    $("#" + id).val(color);
    $("#" + id).css("background-color", color);
}
RiseVision.WeatherSettings.prototype.setFont = function(id, css, style) {
    $("#" + id).data("css", css);
    $("#" + id).text(style);
}
RiseVision.WeatherSettings.prototype.getSettings = function() {
    var errorFound = false,
	errors = document.getElementsByClassName("errors")[0],
	params = "",
	settings = null;
    
    $(".errors").empty();
    
    //Perform validation.
    errorFound = (weather.settings.validateRequired($("#layoutURL"), errors, "Layout URL")) ? true : errorFound;
    errorFound = (weather.settings.validateRequired($("#customAddress"), errors, "Your Custom Address")) ? true : errorFound;
    errorFound = (weather.settings.validateRequired($("#customDescription"), errors, "Your Custom Description")) ? true : errorFound;    
    
    if (errorFound) {
	$(".errors").fadeIn(200).css("display", "inline-block");
	$("#wrapper").scrollTop(0);
	
	return null;
    }
    else {
	//Construct parameters string to pass to RVA.
	params = 
	    "up_layout=" + $("#layout").val() +
	    "&up_layoutURL=" + escape($("#layoutURL").val()) +
	    "&up_address=" + $("#address").val() +
	    "&up_customAddress=" + $("#customAddress").val() +
	    "&up_description=" + $("#description").val() +	    
	    "&up_language=" + $("#language").val() +
	    "&up_unit=" + $("#unit").val() +
	    "&up_windSpeed=" + $("#windSpeed").val() +
	    "&up_bgColor=" + $("#bgColor").val();
	
	if ($("#showOther").is(":checked")) {
	    params += "&up_showOther=true";
	}
	else {
	    params += "&up_showOther=false";
	}
	
	if ($("#terms").is(":checked")) {
	    params += "&up_terms=true";
	}
	else {
	    params += "&up_terms=false";
	}
	
	settings = {
	    "params": params,
	    "additionalParams": JSON.stringify(weather.saveAdditionalParams())
	};
    
	$(".errors").css({ display: "none" });
	
	return settings;
    }  
}
RiseVision.WeatherSettings.prototype.saveAdditionalParams = function() {
    var additionalParams = {};
	        
    additionalParams["temp_font"] = $("#temp_font-style").text();
    additionalParams["temp_font-style"] = $("#temp_font-style").data("css");    
    additionalParams["forecastTemp_font"] = $("#forecastTemp_font-style").text();
    additionalParams["forecastTemp_font-style"] = $("#forecastTemp_font-style").data("css");
    additionalParams["forecastDay_font"] = $("#forecastDay_font-style").text();
    additionalParams["forecastDay_font-style"] = $("#forecastDay_font-style").data("css");
    additionalParams["address_font"] = $("#address_font-style").text();
    additionalParams["address_font-style"] = $("#address_font-style").data("css");
    additionalParams["customDescription"] = $("#customDescription").val();
    additionalParams["other_font"] = $("#other_font-style").text();
    additionalParams["other_font-style"] = $("#other_font-style").data("css");
    
   return additionalParams;
}
/* Settings End */

/* Functionality Start */
RiseVision.Weather = {};
RiseVision.Weather = function() {
    var rsW = prefs.getInt("rsW"),
	rsH = prefs.getInt("rsH"),
	layout = prefs.getString("layout");    
           
    this.isLoading = true;
    this.refreshInterval = 1800000;	//30 minutes
    this.errorInterval = 60000;
    this.hostURL = "https://s3.amazonaws.com/Gadget-Weather/";
    this.url = unescape("%68%74%74%70%3a%2f%2f%77%77%77%2e%74%69%6e%62%75%77%65%61%74%68%65%72%2e%63%6f%6d%2f%77%78%5f%66%65%65%64%2f%77%78%5f%63%75%72%72%65%6e%74%5f%65%78%74%65%6e%64%65%64%5f%62%79%5f%6e%61%6d%65%2e%70%68%70%3f%70%61%73%73%63%6f%64%65%3d%72%69%73%65%64%69%73%70%6c%61%79%25%37%43%64%6b%61%63%26%6d%65%74%72%69%63%3d%66%61%6c%73%65");
    this.geoURL = unescape("%68%74%74%70%3a%2f%2f%77%77%77%2e%74%69%6e%62%75%77%65%61%74%68%65%72%2e%63%6f%6d%2f%77%78%5f%66%65%65%64%2f%77%78%5f%63%75%72%72%65%6e%74%5f%65%78%74%65%6e%64%65%64%5f%62%79%5f%6c%61%74%6c%6f%6e%2e%70%68%70%3f%70%61%73%73%63%6f%64%65%3d%72%69%73%65%64%69%73%70%6c%61%79%25%37%43%64%6b%61%63%26%6d%65%74%72%69%63%3d%66%61%6c%73%65");    
    
    //Determine which XML layout file to use.
    if (layout == "custom") {	//Custom
	this.layoutURL = prefs.getString("layoutURL");
    }
    else if (layout == "current") {	//Current Weather
	if (rsH > rsW) {
	    this.layoutURL = this.hostURL + "Current/Current-Portrait.xml";
	}
	else {
	    this.layoutURL = this.hostURL + "Current/Current-Landscape.xml";
	}
    }
    else if (layout == "3Day") {	//3 Day Forecast
	if (rsH > rsW) {
	    this.layoutURL = this.hostURL + "3Day/3Day-Portrait.xml";
	}
	else {
	    this.layoutURL = this.hostURL + "3Day/3Day-Landscape.xml";
	}
    }
    else {	//Current Weather and 3 Day Forecast
	if (rsH > rsW) {
	    this.layoutURL = this.hostURL + "CurrentAnd3Day/CurrentAnd3Day-Portrait.xml";
	}
	else {
	    this.layoutURL = this.hostURL + "CurrentAnd3Day/CurrentAnd3Day-Landscape.xml";
	}
    }
}
//Callback function for Rise Vision API.
RiseVision.Weather.prototype.getAdditionalParams = function(name, value) {
    var styleNode, address;
    
    if (name == "additionalParams") {
	if (value) {
	    styleNode = document.createElement("style");	    
	    value = JSON.parse(value);
	    
	    //Inject CSS font styles into the DOM.
	    styleNode.appendChild(document.createTextNode(value["temp_font-style"]));
	    styleNode.appendChild(document.createTextNode(value["forecastTemp_font-style"]));
	    styleNode.appendChild(document.createTextNode(value["forecastDay_font-style"]));
	    styleNode.appendChild(document.createTextNode(value["address_font-style"]));
	    styleNode.appendChild(document.createTextNode(value["other_font-style"]));  
	    document.getElementsByTagName("head")[0].appendChild(styleNode);
	    
	    weather.customDescription = value.customDescription;
	    weather.init();
	}
    }
    else if (name == "displayAddress") {
	if (value) {
	    address = JSON.parse(value);
	    //Only need to use and show city and province.
	    weather.weatherURL = weather.url + "&language=" + prefs.getString("language") + "&name=" + encodeURIComponent(address.city + "," + address.province) + "&dummy=" + Math.ceil(Math.random() * 100);
	    //weather.weatherURL = weather.url + "&language=" + prefs.getString("language") + "&name=" + encodeURIComponent(address.city.replace(/ /g,'') + "," + address.province.replace(/ /g,'')) + "&dummy=" + Math.ceil(Math.random() * 100);	    
	}
	
	weather.getWeather();
    }    
}
RiseVision.Weather.prototype.init = function() {
    var data, head, style,
	self = this,
	params = {};
    
    //Load XML layout.
    params[gadgets.io.RequestParameters.CONTENT_TYPE] = gadgets.io.ContentType.DOM;
    gadgets.io.makeRequest(this.layoutURL, function(obj) {
	data = obj.data;   
	
	//Load CSS.
	if (data.getElementsByTagName("Style").length > 0) {
	    //Keep this for backwards compatability.
	    if (data.getElementsByTagName("Style")[0].getAttribute("url")) {
		loadCSS(data.getElementsByTagName("Style")[0].getAttribute("url"));
	    }
	    else {
		head = document.getElementsByTagName("head")[0];
		style = document.createElement("style");
		    
		style.type = "text/css";
		style.innerHTML = data.getElementsByTagName("Style")[0].childNodes[1].nodeValue;
		head.appendChild(style);
	    }
	}
    
	$("#container").append(data.getElementsByTagName("Layout")[0].childNodes[1].nodeValue);
	self.getLocation();
    }, params);
}
RiseVision.Weather.prototype.getLocation = function() {
    var id = prefs.getString("id"),
	address = prefs.getString("address"),
	customAddress = prefs.getString("customAddress");
    
    //Use geolocation to determine the location of the display.
    if (address == "geolocation") {
	this.useGeolocation();
    }
    //Make a call to the Rise Vision API to get the address of the display.
    else if (address == "display") {
	if (id) {
	    gadgets.rpc.call("", "rsparam_get", null, id, "displayAddress");
	}
    }
    //Use custom address supplied by the user.
    else if (address == "custom") {
	if (customAddress != "") {
	    this.weatherURL = this.url + "&language=" + prefs.getString("language") + "&name=" + encodeURIComponent(customAddress) + "&dummy=" + Math.ceil(Math.random() * 100);
	    //this.weatherURL = this.url + "&language=" + prefs.getString("language") + "&name=" + encodeURIComponent(customAddress.replace(/ /g,'')) + "&dummy=" + Math.ceil(Math.random() * 100);
	    this.getWeather();
	}
    }
}
RiseVision.Weather.prototype.useGeolocation = function() {
    var self = this;
    
    if (this.supportsGeolocation()) {
	//This function will recover on its own if the Internet is disconnected.
	navigator.geolocation.getCurrentPosition(
	    function(position) {
		self.getPosition.call(self, position);
	    },
	    function(err) {
		//Unable to find geolocation coordinates. Try again every minute.
		console.log("Unable to obtain geolocation position.");
	
		setTimeout(function() {
		    self.getLocation();
		}, self.errorInterval); 
	});
    }
}
RiseVision.Weather.prototype.supportsGeolocation = function() {
    return !!navigator.geolocation;
}
RiseVision.Weather.prototype.getPosition = function(position) {
    this.weatherURL = this.geoURL + "&language=" + prefs.getString("language") + "&lat=" + position.coords.latitude + "&lon=" + position.coords.longitude + "&dummy=" + Math.ceil(Math.random() * 100);
    this.getWeather();
}
RiseVision.Weather.prototype.getWeather = function() {
    var self = this,
	params = {};  

    //This could occur in the case where the location to use is the display's address, but the Gadget is being previewed in the Viewer.
    if (!this.weatherURL) {	//Use geolocation.
	this.useGeolocation();
    }
    else {		
	params[gadgets.io.RequestParameters.CONTENT_TYPE] = gadgets.io.ContentType.DOM;    
	gadgets.io.makeRequest(this.weatherURL, function(obj) {
	    self.showWeather(obj);
	}, params);
    }
}
//Show weather for the selected layout.
RiseVision.Weather.prototype.showWeather = function(obj) {
    var self = this,
	forecasts = [],
	today = new Date().getDay() + 1,
	tomorrow = (today + 1) > 7 ? 1 : today + 1,
	nextDay = (tomorrow + 1 > 7) ? 1 : tomorrow + 1,
	hasAddInfo = false,
	hasCity = false,
	description = prefs.getString("description"),
	windSpeed = prefs.getString("windSpeed"),
	layout = prefs.getString("layout"),
	data, current, icon_name, forecast, language, location, place, dayOfWeek,
	humidity, wind, windDirection, windSpeed, atText, windSpeedText, mph, kph,
	low, high;	    
    
    //Unable to connect to the weather service. Try again every minute.
    if (obj.errors.length > 0) {
	console.log("Unable to connect to the weather service at " + new Date() + ". Please check your Internet connection.");
	
	setTimeout(function() {
	    self.getLocation();
	}, self.errorInterval);
	
	return;
    }    
	
    if (obj.data) {
	//No weather data found for this location.
	if (obj.data.getElementsByTagName("cw_error").length > 0) {
	    this.retry();
	}
	else {
	    data = obj.data;
	    
	    $("#outer").show();
	    $("#error").hide();
	    
	    //Issue 1029 Start - Find the observation tag that has an icon_name other than 'cw_no_report_icon'
	    //and use that one for current weather data.
	    $.each(data.getElementsByTagName("observation"), function(index, value) {
		icon_name = value.getAttribute("icon_name");
		
		if ((icon_name != null) && (icon_name != "cw_no_report_icon")) {
		    current = this;
		    return false;
		}
	    });
	    
	    //No observation data found that has an icon. Default to using the first one.
	    if (current == null) {
		current = data.getElementsByTagName("observation")[0];
	    }
	    //Issue 1029 - End
	    
	    //Current weather conditions.
	    if (current && (layout != "3Day")) {
		if (current.getAttribute("icon_name")) {
		    this.loadImage(current.getAttribute("icon_name"), $(".currentIcon"));
		    $(".currentIcon").attr("title", current.getAttribute("description"));
		}
		else {
		    $(".currentIcon").hide();
		}
	    
		//Temperature
		$(".currentTemp").html((prefs.getString("unit") == "celsius") ? this.convertTemp(current.getAttribute("temperature")) + "&#176;C" : this.convertTemp(current.getAttribute("temperature")) + "&#176;F");		
	    }
	    
	    //Description
	    if (description == "custom") {
		$("#city").text(this.customDescription);
		hasCity = true;
	    }
	    else if (description == "service") {
		location = data.getElementsByTagName("location")[0];
		
		if (location) {
		    place = location.getAttribute("city_name");
		    
		    if (location.getAttribute("state_name")) {
			place += ", " + location.getAttribute("state_name");
		    }
		    
		    $("#city").text(place);
		    hasCity = true;
		}
	    }	    
    
	    if (current) {
		//Wind and humidity
		if (prefs.getBool("showOther")){
		    language = prefs.getString("language");
		    windDirection = current.getAttribute("wind_short");
		    windSpeed = prefs.getString("windSpeed");
		    		   		    
		    if (language == "en") {
			humidity = "Humidity ";
			wind = "Wind ";
			atText = " at ";
			
			if (windSpeed == "mph") {
			    windSpeedText = " mph";
			}
			else {
			    windSpeedText = " kph";
			}
		    }
		    else if (language == "es") {
			humidity = "Humedad ";
			wind = "Viento ";
			atText = " en ";
			
			if (windSpeed == "mph") {
			    windSpeedText = " mph";
			}
			else {
			    windSpeedText = " kph";
			}
		    }
		    else if (language == "de") {
			humidity = "Luftfeuchtigkeit ";
			wind = "Wind ";
			atText = " bei ";
			
			if (windSpeed == "mph") {
			    windSpeedText = " mph";
			}
			else {
			    windSpeedText = " kph";
			}
		    }
		    else if (language == "fr") {
			humidity = "Humidit\u00E9 ";
			wind = "Vent ";
			atText = " \u00E0 ";
			
			if (windSpeed == "mph") {
			    windSpeedText = " mph";
			}
			else {
			    windSpeedText = " kph";
			}
		    }
		    //Russian
		    else {
			humidity = "\u0412\u043B\u0430\u0436\u043D\u043E\u0441\u0442\u044C ";
			wind = "\u0412\u0435\u0442\u0435\u0440";
			atText = ", ";
			
			if (windSpeed == "mph") {
			   windSpeedText = " \u043C\u0438\u043B\u044C/\u0447\u0430\u0441";
			}
			else {
			    windSpeedText = " \u043A\u043C/\u0447";
			}
			
			//Translations do not work when using geolocation. Need to account for both translated and not translated wind direction.
			switch (windDirection) {
			    case "N":
			    case "\u0421":
				windDirection = "\u0441\u0435\u0432\u0435\u0440\u043D\u044B\u0439";
				break;
			    case "S":
			    case "\u042E":
				windDirection = "\u044E\u0436\u043D\u044B\u0439";
				break;
			    case "E":
			    case "\u0412":
				windDirection = "\u0432\u043E\u0441\u0442\u043E\u0447\u043D\u044B\u0439";
				break;
			    case "W":
			    case "\u0417":
				windDirection = "\u0437\u0430\u043F\u0430\u0434\u043D\u044B\u0439";
				break;
			    case "NE":
			    case "\u0421\u0412":
				windDirection = "\u0441\u0435\u0432\u0435\u0440\u043E-\u0432\u043E\u0441\u0442\u043E\u0447\u043D\u044B\u0439";
				break;
			    case "SE":
			    case "\u042E\u0412":
				windDirection = "\u044E\u0433\u043E-\u0432\u043E\u0441\u0442\u043E\u0447\u043D\u044B\u0439";
				break;
			    case "NW":
			    case "\u0421\u0417":
				windDirection = "\u0441\u0435\u0432\u0435\u0440\u043E-\u0437\u0430\u043F\u0430\u0434\u043D\u044B\u0439";
				break;
			    case "SW":
			    case "\u042E\u0417":
				windDirection = "\u044E\u0433\u043E-\u0437\u0430\u043F\u0430\u0434\u043D\u044B\u0439";
				break;
			}
		    }
		    		    
		    if (!isNaN(current.getAttribute("humidity"))) {
			$("#humidity").text(humidity + current.getAttribute("humidity") + "%");
		    }
		    
		    if (windSpeed === "mph") {
			if (current.getAttribute("wind_short") && current.getAttribute("wind_speed")) {
			    $("#wind").text(wind + " " + windDirection + atText + parseInt(current.getAttribute("wind_speed")) + windSpeedText);
			}
		    }
		    else if (windSpeed === "kph") {
			if (current.getAttribute("wind_short") && current.getAttribute("wind_speed")) {
			    mph = parseInt(current.getAttribute("wind_speed"));
		    
			    kph = Math.round(mph * 1.609344);
			    $("#wind").text(wind + " " + windDirection + atText + kph + windSpeedText);
			}
		    }
		    
		    hasAddInfo = true;
		}
		else {
		    $("#humidityAndWind").hide();
		}
	    }
	    
	    if (!hasAddInfo && !hasCity) {
		$("#info").hide();
	    }
	    
	    forecast = data.getElementsByTagName("forecast");
	    
	    //Forecasted weather
	    if (forecast) {
		if (layout != "current") {
		    for (i = 0; i < forecast.length; i++) {	    
			dayOfWeek = forecast[i].getAttribute("day_of_week");
			
			if ((dayOfWeek == today)) {
			    forecasts[0] = forecast[i];
			}
			else if (dayOfWeek == tomorrow) {
			    forecasts[1] = forecast[i];
			}
			else if (dayOfWeek == nextDay) {
			    forecasts[2] = forecast[i];
			}
		    }
		}
	    
		$(".icon").each(function(index) {
		    if (forecasts[index].getAttribute("icon_name")) {
			self.loadImage(forecasts[index].getAttribute("icon_name"), $(this));
			$(this).attr("title", forecasts[index].getAttribute("description"));
		    }
		    else {
			$(this).hide();
		    }
		});
		
		$(".day").each(function(index) {
		    $(this).html(forecasts[index].getAttribute("weekday"));
		});
		
		$(".temp").each(function(index) {
		    low = self.convertTemp(forecasts[index].getAttribute("low_temp"));
		    high = self.convertTemp(forecasts[index].getAttribute("high_temp"));
			
		    $(this).html(low + "&#176; / " + high + "&#176;");
		});
	    }
	    
	    setTimeout(function() {
		self.getLocation();
	    }, this.refreshInterval);
	}	
    }
    else {
	this.retry();
    }

    if (this.isLoading) {
	this.isLoading = false;
	readyEvent();
    }
}
RiseVision.Weather.prototype.retry = function() {
    var self = this;
    
    //Issue 1029 - Only show message if Gadget is loading. Otherwise, continue to show stale weather data.
    if (this.isLoading) {
	$("#error").text("Unable to retrieve weather data for that location.").show();
	$("#outer").hide();
    }
    
    //Issue 985 Start
    setTimeout(function() {
	self.getLocation();
    }, this.errorInterval);
    //Issue 985 End
}
RiseVision.Weather.prototype.loadImage = function(icon, $element) {
    var img = new Image(),
	url = this.hostURL +"images/" + icon + ".png";
    
    img.onload = function() {
	$element.attr("src", url);
    }
    
    img.onerror = function() {
	console.log("Image " + icon + " not found on " + new Date() + " for " + $("#city").text());
    }

    img.src = url;
}
RiseVision.Weather.prototype.convertTemp = function(temp) {
    //Convert to Celsius.
    if (prefs.getString("unit") == "celsius") {
	return parseInt(((temp - 32) * 5 / 9.0));
    }
    //Default temperature unit is Fahrenheit.
    else {
	return parseInt(temp);
    }
}