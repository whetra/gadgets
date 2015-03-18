var RiseVision = RiseVision || {};

RiseVision.Common = RiseVision.Common || {};
RiseVision.Common.News = {};
RiseVision.Common.News.Settings = {};

/*
 * The Settings class handles the display and behavior of Gadget settings in the editor.
 */
RiseVision.Common.News.Settings = function() {
    this.isValidURL = true;
    this.settings = new RiseVision.Common.Settings();
}
/*
 * Populate settings from saved values.
 */
RiseVision.Common.News.Settings.prototype.initSettings = function() {
    var self = this;
        
    //Add event handlers.
    $(".colorPicker").click(function() {
	newsSettings.showColorPicker($(this).data("for"));
    });
    
    $(".fontSelector").click(function() {
	newsSettings.showFontSelector($(this).data("for"));
    });
    
    $("#url").blur(function() {
	if ($(this).val != "") {
	    var feed = new google.feeds.Feed($(this).val());
	    
	    feed.setNumEntries(1);
	    feed.load(function(result) {
		if (result.error) {
		    self.isValidURL = false;
		}
		else {
		    self.isValidURL = true;
		}
	    });
	}
    });
    
    $(".meta").change(function() {
	var val = $(this).val();
	
	if (val == "author") {
	    $(this).is(":checked") ? $("li.author").show() : $("li.author").hide();
	}
	else if (val == "date") {
	    ($(this).is(":checked") && $("input[name='layout']").val() != "background.xml") ? $("li.date").show() : $("li.date").hide();
	}	
    });
    
    //Reuters News
    $(".news").change(function() {
	var val = $(this).val();
	
	if ($(this).hasClass("news")) {
	    $(".news").each(
		function(i) {
		    //All News selected.
		    if (val == "all") {
			if ($(this).val() != "all") {
			    $(this).prop("checked", false);
			}
		    }
		    //Entertainment, Sports or Top selected.
		    else {
			$(".news").eq(0).prop("checked", false);
			return false;
		    }
		}
	    );
	}
    });
    
    $("input[name='layout']").change(function() {
	var val = $(this).val();
	
	if ($("#scrollDirection").is(":visible") && (($("#scrollDirection").val() == "ltr") || (($("#scrollDirection").val() == "rtl")))) {
	    $("li.headline").show();
	    $("li.story").show();
	    $("li.media").hide();
	}
	else {	
	    if ($(this).is(":checked")) {
		if ((val == "4x1-headline.xml") || (val == "2x1-headline.xml") || (val == "1x2-headline.xml") || (val == "custom")) {
		    $("li.headline").show();
		    $("li.story").show();
		    $("li.media").show();
		}
		else if (val == "4x1-no-image.xml") {
		    $("li.headline").show();
		     $("li.story").show();
		    $("li.media").hide();
		}
		else if ((val == "4x1-no-headline.xml") || (val == "2x1-no-headline.xml") || (val == "1x2-no-headline.xml")) {
		    $("li.headline").hide();
		     $("li.story").show();
		    $("li.media").show();
		}
		else if (val == "4x1-no-image-no-headline.xml") {
		    $("li.headline").hide();
		     $("li.story").show();
		    $("li.media").hide();
		}
		else {	//background.xml
		    $("li.headline").hide();
		    $("li.story").hide();
		    $("li.media").show();
		}
	    }
	}
	
	if ($(this).is(":checked")) {
	    if ($("#date").is(":checked") && ($(this).val() != "background.xml")) {
		$("li.date").show();
	    }
	    else {
		$("li.date").hide();
	    }
	}
    });
    
    $("#transition").change(function() {
	if (($(this).val() == "continuous") || (($(this).val() == "page") && (($("#scrollDirection").val() == "ltr") || ($("#scrollDirection").val() == "rtl")))) {
	    $("li.transitionHold").hide();
	}
	else {
	    $("li.transitionHold").show();
	}
	
	if (($(this).val() != "fade") && ($(this).val() != "none")) {
	    $("li.transition").show();
	    
	    if (($(this).val() == "item") || ($(this).val() == "continuous")) {
		$("li.separator").show();
	    }
	    else {
		$("li.separator").hide();
	    }
	    
	    if (($("#scrollDirection").val() == "ltr") || (($("#scrollDirection").val() == "rtl"))) {
		$("li.itemsCount").hide();
		$("li.layout").hide();
		$("li.headlineColor").hide();
		$("li.storyColor").hide();
		$("li.authorColor").hide();
		$("li.dateColor").hide();
	    }
	}
	else {
	    $("li.itemsCount").show();
	    $("li.transition").hide();
	    $("li.layout").show();	    
	    $("li.headlineColor").show();
	    $("li.storyColor").show();
	    $("li.authorColor").show();
	    $("li.dateColor").show();
	}
	
	$("input[name='layout']").trigger("change");
	self.setSeparatorVisibility();
    });
    
    $("#scrollDirection").change(function() {
	if (($(this).is(":visible")) && (($(this).val() == "ltr") || (($(this).val() == "rtl")))) {
	    $("li.itemsCount").hide();
	    $("li.layout").hide();
	    $("li.media").hide();
	    $("li.headlineColor").hide();
	    $("li.storyColor").hide();
	    $("li.authorColor").hide();
	    $("li.dateColor").hide();
	    
	    if ($("#transition").val() == "page") {
		$("li.transitionHold").hide();
	    }
	}
	else {
	    $("li.itemsCount").show();
	    $("li.layout").show();
	    $("li.media").show();
	    $("li.headlineColor").show();
	    $("li.storyColor").show();
	    $("li.authorColor").show();
	    $("li.dateColor").show();
	    
	    if ($("#transition").val() != "continuous") {
		$("li.transitionHold").show();
	    }
	}
	
	$("input[name='layout']").trigger("change");
	self.setSeparatorVisibility();
    });
    
    $("#separator").change(function() {
	if ($(this).is(":visible") && $(this).is(":checked")) {
	    $("li.separatorDetails").show();
	}
	else {
	    $("li.separatorDetails").hide();
	}
    });
    
    //Request additional parameters from the Viewer.
    gadgets.rpc.call("", "rscmd_getAdditionalParams", function(result) {
	if (result) {
	    var prefs = new gadgets.Prefs();
	    
	    result = JSON.parse(result);	    
	    
	    //RSS
	    $("#url").val(prefs.getString("url"));
	    
	    //Reuters news
	    $("#all").attr("checked", prefs.getBool("all"));
	    $("#entertainment").attr("checked", prefs.getBool("entertainment"));
	    $("#sports").attr("checked", prefs.getBool("sports"));
	    $("#top").attr("checked", prefs.getBool("top"));
	    
	    $("#queue").val(prefs.getString("queue"));	   
	    $("#itemsCount").val(prefs.getString("itemsCount"));
	    $("#transition").val(prefs.getString("transition"));
	    $("#scrollDirection").val(prefs.getString("scrollDirection"));
	    $("#scrollSpeed").val(prefs.getString("scrollSpeed"));
	    $("#separator").attr("checked", prefs.getBool("separator"));
	    $("#separatorColor").val(prefs.getString("separatorColor"));
	    $("#separatorSize").val(prefs.getString("separatorSize"));
	    $("#transitionHold").val(prefs.getString("transitionHold"));
	    $("#transitionResumes").val(prefs.getString("transitionResumes"));
	    $("#bgColor").val(prefs.getString("bgColor"));
	    $("#acceptance").attr("checked", prefs.getBool("acceptance"));
	    
	    $("input[type='radio'][name='contentType']").each(function() {
		if ($(this).val() == prefs.getString("contentType")) {
		    $(this).attr("checked", "checked");
		}
	    });
	    
	    $("#author").attr("checked", prefs.getBool("author"));
	    $("#date").attr("checked", prefs.getBool("date"));
	    
	    $("input[type='radio'][name='layout']").each(function() {
		if ($(this).val() == prefs.getString("layout")) {
		    $(this).attr("checked", "checked");
		}
	    });
	    
	    $("#layoutURL").val(prefs.getString("layoutURL"));
	    
	    if (prefs.getBool("separator")) {
		$("li.separatorDetails").show();
	    }
	    
	    //Populate colors and show color as background of text box.
	    self.populateColor($("#separatorColor"), prefs.getString("separatorColor"));
	    self.populateColor($("#bgColor"), prefs.getString("bgColor"));
	    self.populateColor($("#headlineColor"), result["headlineColor"]);
	    self.populateColor($("#storyColor"), result["storyColor"]);
	    self.populateColor($("#authorColor"), result["authorColor"]);
	    self.populateColor($("#dateColor"), result["dateColor"]);
	    
	    //Populate fields saved as additionalParams.
	    $("#headline_font-style").text(result["headline_font"]);
	    $("#headline_font-style").data("css", result["headline_font-style"]);
	    $("#headlinePadding").val(result["headlinePadding"]);
	    $("#headlineColor").val(result["headlineColor"]);
	    
	    $("#story_font-style").text(result["story_font"]);
	    $("#story_font-style").data("css", result["story_font-style"]);
	    $("#storyPadding").val(result["storyPadding"]);
	    $("#storyColor").val(result["storyColor"]);
	    
	    $("#mediaPadding").val(result["mediaPadding"]);
	    
	    $("#author_font-style").text(result["author_font"]);
	    $("#author_font-style").data("css", result["author_font-style"]);
	    $("#authorPadding").val(result["authorPadding"]);
	    $("#authorColor").val(result["authorColor"]);
	    
	    $("#date_font-style").text(result["date_font"]);
	    $("#date_font-style").data("css", result["date_font-style"]);
	    $("#datePadding").val(result["datePadding"]);
	    $("#dateColor").val(result["dateColor"]);
	}
	
	$("form ol li ol.drillDown li:visible:last").css({
	    "clear": "left",
	    "float": "left",
	    "margin-bottom": "10px"
	});
	
	$("#settings").show();
	
	//Manually trigger event handlers so that the visibility of fields can be set.
	$(".meta").trigger("change");
	$("#transition").trigger("change");
	$("#scrollDirection").trigger("change");
    });    
}
RiseVision.Common.News.Settings.prototype.setSeparatorVisibility = function() {
    if ((($("#scrollDirection").val() == "up") || ($("#scrollDirection").val() == "down")) &&
	(($("#transition").val() == "item") || ($("#transition").val() == "continuous"))) {
	$("li.separator").show();
    }
    else {
	$("li.separator").hide();
    }
    
    $("#separator").trigger("change");
}
RiseVision.Common.News.Settings.prototype.populateColor = function($element, color) {
    $element.val(color);
    $element.css("background-color", color);
}
RiseVision.Common.News.Settings.prototype.showColorPicker = function(id) {
    gadgets.rpc.call("", "rscmd_openColorPicker", null, id, $("#" + id).val()); 
}
RiseVision.Common.News.Settings.prototype.showFontSelector = function(id) {
    gadgets.rpc.call("", "rscmd_openFontSelector", null, id, $("#" + id).data("css"));
}
RiseVision.Common.News.Settings.prototype.setColor = function(id, color) {
    $("#" + id).val(color);
    $("#" + id).css("background-color", color);
}
RiseVision.Common.News.Settings.prototype.setFont = function(id, css, style) {
    $("#" + id).data("css", css);
    $("#" + id).text(style);
}
RiseVision.Common.News.Settings.prototype.getSettings = function() {
    var errorFound = false,
	errors = document.getElementsByClassName("errors")[0],
	params = "",
	settings = null,
	selected;
    
    $(".errors").empty();
    
    //RSS URL
    errorFound = (newsSettings.settings.validateRequired($("#url"), errors, "RSS URL")) ? true : errorFound;
    
    if (!errorFound && !newsSettings.isValidURL) {
	errors.innerHTML += "RSS URL is invalid.<br />";
	errorFound = true;
    }
    
    //Queue
    errorFound = (newsSettings.settings.validateRequired($("#queue"), errors, "Queue")) ? true : errorFound;
    errorFound = (newsSettings.settings.validateNumeric($("#queue"), errors, "Queue")) ? true : errorFound;
    
    if (parseInt($("#queue").val()) <= 0) {
	errors.innerHTML += "Queue must be greater than 0.<br />";
	errorFound = true;
    }
    
    //Items Count
    errorFound = (newsSettings.settings.validateRequired($("#itemsCount"), errors, "Items Count")) ? true : errorFound;
    errorFound = (newsSettings.settings.validateNumeric($("#itemsCount"), errors, "Items Count")) ? true : errorFound;
    
    if ($("#itemsCount").is(":visible") && parseInt($("#itemsCount").val()) <= 0) {
	errors.innerHTML += "Items Count must be greater than 0.<br />";
	errorFound = true;
    }
    
    //Separator Size
    if ($("#separatorSize").is(":visible")) {
	errorFound = (newsSettings.settings.validateNumeric($("#separatorSize"), errors, "Separator Size")) ? true : errorFound;
	
	if (parseInt($("#separatorSize").val()) <= 0) {
	    errors.innerHTML += "Separator Size must be greater than 0.<br />";
	    errorFound = true;
	}
    }    
    
    //Transition Hold
    errorFound = (newsSettings.settings.validateRequired($("#transitionHold"), errors, "Transition Hold")) ? true : errorFound;
    errorFound = (newsSettings.settings.validateNumeric($("#transitionHold"), errors, "Transition Hold")) ? true : errorFound;
    
    if ($("#transitionHold").is(":visible") && parseInt($("#transitionHold").val()) <= 0) {
	errors.innerHTML += "Transition Hold must be greater than 0.<br />";
	errorFound = true;
    }
    
    //Transition Resumes
    errorFound = (newsSettings.settings.validateRequired($("#transitionResumes"), errors, "Transition Resumes")) ? true : errorFound;
    errorFound = (newsSettings.settings.validateNumeric($("#transitionResumes"), errors, "Transition Resumes")) ? true : errorFound;
    
    if ($("#transitionResumes").is(":visible") && parseInt($("#transitionResumes").val()) <= 0) {
	errors.innerHTML += "Transition Resumes must be greater than 0.<br />";
	errorFound = true;
    }
    
    //Padding
    errorFound = (newsSettings.settings.validateNumeric($("#headlinePadding"), errors, "Headline Padding")) ? true : errorFound;
    errorFound = (newsSettings.settings.validateNumeric($("#storyPadding"), errors, "Summary / Story Padding")) ? true : errorFound;
    errorFound = (newsSettings.settings.validateNumeric($("#mediaPadding"), errors, "Media Padding")) ? true : errorFound;
    errorFound = (newsSettings.settings.validateNumeric($("#authorPadding"), errors, "Author Padding")) ? true : errorFound;
    errorFound = (newsSettings.settings.validateNumeric($("#datePadding"), errors, "Date Padding")) ? true : errorFound;
	
    //Required fields
    if ($("input[type='radio'][name='layout']:checked").val() == "custom") {
	errorFound = (newsSettings.settings.validateRequired($("#layoutURL"), errors, "Layout URL")) ? true : errorFound;
    }
    
    if (errorFound) {
	$(".errors").fadeIn(200).css("display", "inline-block");
	$("#wrapper").scrollTop(0);
	
	return null;
    }
    else {
	//Construct parameters string to pass to RVA.
	if ($("#url").val() != null) {
	    params = "up_url=" + escape($("#url").val());
	}
	else {
	    params = ($("#all").is(":checked")) ? "up_all=true" : "up_all=false";
	    params += ($("#entertainment").is(":checked")) ? "&up_entertainment=true" : "&up_entertainment=false";
	    params += ($("#sports").is(":checked")) ? "&up_sports=true" : "&up_sports=false";
	    params += ($("#top").is(":checked")) ? "&up_top=true" : "&up_top=false";
	}
	
	params += "&up_queue=" + $("#queue").val() +
	    "&up_itemsCount=" + $("#itemsCount").val() +
	    "&up_transition=" + $("#transition").val() +
	    "&up_scrollDirection=" + $("#scrollDirection").val() +
	    "&up_scrollSpeed=" + $("#scrollSpeed").val();	    
	params += "&up_separatorColor=" + $("#separatorColor").val() +
	    "&up_separatorSize=" + $("#separatorSize").val() +
	    "&up_transitionHold=" + $("#transitionHold").val() +
	    "&up_transitionResumes=" + $("#transitionResumes").val() +
	    "&up_bgColor=" + $("#bgColor").val();
	params += ($("#separator").is(":checked")) ? "&up_separator=true" : "&up_separator=false";
	
	//Summary or Story
	selected = $("input[type='radio'][name='contentType']:checked");
	
	if (selected.length > 0) {
	    params += "&up_contentType=" + selected.val();
	}
	
	params += ($("#author").is(":checked")) ? "&up_author=true" : "&up_author=false";
	params += ($("#date").is(":checked")) ? "&up_date=true" : "&up_date=false";
	
	//Layout
	selected = $("input[type='radio'][name='layout']:checked");
	
	if (selected.length > 0) {
	    params += "&up_layout=" + selected.val();
	}
	
	params += "&up_layoutURL=" + $("#layoutURL").val();
	
	if ($("#acceptance").is(":checked")) {
	    params += "&up_acceptance=true";
	}
	else {
	    params += "&up_acceptance=false";
	}
	
	settings = {
	    "params": params,
	    "additionalParams": JSON.stringify(newsSettings.saveAdditionalParams())
	};
    
	$(".errors").css({ display: "none" });
	
	return settings;
    }  
}
RiseVision.Common.News.Settings.prototype.saveAdditionalParams = function() {
    var additionalParams = {};  
    
    additionalParams["headline_font"] = $("#headline_font-style").text();
    additionalParams["headline_font-style"] = $("#headline_font-style").data("css");
    additionalParams["headlinePadding"] = $("#headlinePadding").val() == "" ? 0 : $("#headlinePadding").val();
    additionalParams["headlineColor"] = $("#headlineColor").val();
    
    additionalParams["story_font"] = $("#story_font-style").text();
    additionalParams["story_font-style"] = $("#story_font-style").data("css");
    additionalParams["storyPadding"] = $("#storyPadding").val() == "" ? 0 : $("#storyPadding").val();
    additionalParams["storyColor"] = $("#storyColor").val();
    
    additionalParams["mediaPadding"] = $("#mediaPadding").val() == "" ? 0 : $("#mediaPadding").val();
    
    additionalParams["author_font"] = $("#author_font-style").text();
    additionalParams["author_font-style"] = $("#author_font-style").data("css");
    additionalParams["authorPadding"] = $("#authorPadding").val() == "" ? 0 : $("#authorPadding").val();
    additionalParams["authorColor"] = $("#authorColor").val();
    
    additionalParams["date_font"] = $("#date_font-style").text();
    additionalParams["date_font-style"] = $("#date_font-style").data("css");
    additionalParams["datePadding"] = $("#datePadding").val() == "" ? 0 : $("#datePadding").val();
    additionalParams["dateColor"] = $("#dateColor").val();
    
   return additionalParams;
}