
(function($){
    $.fn.alphaNav = function(options) {
	var defaults = {
	    items: ["all","a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z"],
	    position: "left",
	    selectedColor: "white",
	    selectedBackground: "black",
	    uppercase: true
	};
	var settings = $.extend(defaults, options);
	var $nav = $("<nav>");
	var $ul = $("<ul>");
	
	$nav.attr("id", "nav");
	
	if (settings.uppercase) {
	    $nav.addClass("upper");
	}
	else {
	    $nav.addClass("lower");
	}
	
	$.each(settings.items, function(index, value){
	    var $item = $("<li>"),
		$link = $("<a>");
	    
	    $item.attr("id", value);
	    $link.html(value);
	    
	    if (value == "all") {
		$item.addClass("selected");
	    }
	    
	    $link.attr("href", "#");
	    $item.append($link);
	    $ul.append($item);
	});
	
	$nav.append($ul);
	
	if (settings.position == "left") {
	    $nav.addClass("left");
	    this.prepend($nav);
	}
	else if (settings.position == "right") {
	    $nav.addClass("right");
	    this.prepend($nav);
	}
	else if (settings.position == "top") {
	    $nav.addClass("top");
	    this.prepend($nav);
	}
	else if (settings.position == "bottom") {
	    $nav.addClass("bottom");
	    this.append($nav);
	}
	
	$("#nav ul li a").addClass("nav_font-style");
	$.fn.alphaNav.setSelectedStyle(settings);
	
	$("#nav ul li a").click(function() {
	    var letter = $(this).parent().attr("id");

	    $("#nav ul li.selected a").css({
		"background": "",
		"-webkit-border-radius": "",
		"-moz-border-radius": "",
		"border-radius": ""
	    });
	    $("#nav ul li.selected a").css("color", "");
	    $("#nav ul li.selected").removeClass("selected");
	    $(this).parent().addClass("selected");
	    $.fn.alphaNav.setSelectedStyle(settings);
	    settings.onclick(letter);
	    
	    return false;
	});
    };
    
    $.fn.alphaNav.setSelectedStyle = function(settings) {
	var radius = $("#nav ul li a").width() / 2 + "em";

	$("#nav ul li.selected a").css({
	    "background": settings.selectedBackground,
	    "-webkit-border-radius": radius,
	    "-moz-border-radius": radius,
	    "border-radius": radius
	});
	$("#nav ul li.selected a").css("color", settings.selectedColor);
    };
})(jQuery);