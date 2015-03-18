/* jQuery plugin to continuously cycle through information by item or by page. */ 
(function ($) {	
    $.fn.infiniteScroll = function(options) {
	var scrollTimerID = null,
	    settings = {
		scrollBy: "item",
		direction: "up",
		duration: 10000,
		cloneItem: null
	    };
	    
	//Merge options with default settings.
	if (options) {
	    //Duration has to be at least one second since the animation itself takes 600ms.
	    if (settings.duration < 1) {
		settings.duration = 1;
	    }
	    
	    $.extend(settings, options);
	}
	    
	return this.each(function() {
	    var $element = $(this),	//scrollContainer
		$page = $element.find(".page");
	    
	    //Duplicate all items to ensure that the viewable area is always filled.
	    if (settings.scrollBy == "page" && ($page.height() > $element.height())) {
		//Only clone items not marked for deletion.
		$page.find(".item").each(function(index) {
		    if (!$(this).hasClass("delete")) {
			$page.append($(this).clone());
		    }
		});
	    }
	    
	    /* Public methods */   
	    $.fn.infiniteScroll.start = function() {	
		scrollTimerID = setInterval(function() {
		    if (settings.scrollBy == "item") {
			scrollByItem(true);
		    }
		    else if (settings.scrollBy == "page") {
			scrollByPage();
		    }
		    else {
			$.error(settings.scrollBy + " is not a valid value for scrollBy parameter.");
		    }
		}, settings.duration);
	    };
		
	    $.fn.infiniteScroll.pause = function() {
		clearInterval(scrollTimerID);
	    }
	    
	    $.fn.infiniteScroll.canScroll = function() {
		return $page.height() > $element.height();
	    }
	    
	    $.fn.infiniteScroll.scrollToClass = function(className, animate) {
		var success = false;
		
		$(".item").each(function(i) {
		    if ($(this).hasClass(className)) {
			success = true;
			return false;
		    }
		    else {
			scrollByItem(animate);
		    }
		});
		
		return success;
	    }
    
	    /* Private methods */
	    /* Scroll the content one item at a time. */
	    function scrollByItem(animate) {
		var $items = $element.find(".item"),
		    self = this;

		//Content is larger than viewable area.
		if ($page.height() > $element.height()) {
		    if (settings.direction == "up") {
			var $item = $element.find(".item:first"),
			    top = 0;
			
			if ($item) {			
			    //Append the cloned item and then scroll by altering the top margin.
			    top = $item.position().top + $item.outerHeight(true);
			    
			    //Append the cloned item and then scroll by altering the top margin.
			    if (settings.cloneItem) {
				settings.cloneItem();
			    }
			    else {
				if (!$(".item:first").hasClass("delete")) {
				    $page.append($item.clone());
				}
			    }

			    if (animate) {
				$page.animate({"margin-top": $page.position().top - parseInt($page.css("margin-top")) - top + "px"}, "slow", function() {
				    $page.css("margin-top", "0px");
				    $item.remove();
				    $element.trigger("onScroll");
				});
			    }
			    else {
				$page.css("margin-top", "0px");
				$item.remove();
				$element.trigger("onScroll");
			    }
			}
		    }
		    else {
			var $item = $element.find(".item:last"),
			    bottom = 0;
			    
			if ($item) {
			    //TODO: This assumes that the item is positioned right at the very bottom, without any margins/padding etc. on its parent.
			    bottom = $item.outerHeight(true);
			    
			    //Prepend the cloned item and then scroll by altering the bottom margin.
			    if (settings.cloneItem) {
				settings.cloneItem();
			    }
			    else {
				if (!$(".item:last").hasClass("delete")) {
				    $page.prepend($item.clone());
				}				
			    }
			    
			    if (animate) {
				$page.animate({"margin-bottom": parseInt($page.css("margin-bottom")) - bottom + "px"}, "slow", function() {
				    $page.css("margin-bottom", "0px");
				    $item.remove();
				    $element.trigger("onScroll");
				});
			    }
			    else {
				$page.css("margin-bottom", "0px");
				$item.remove();
				$element.trigger("onScroll");
			    }
			}
		    }
		}
	    };
	    
	    /* Scroll the content by page (viewable area) */
	    function scrollByPage() {
		var count = 0,
		    scrollBy = 0,
		    isLastItemVisible = true;
		
		//Find item that is cut off at the bottom.
		$(".item").each(function(i) {
		    var height = $(this).outerHeight(true);
		    var top = $(this).position().top;
    
		    if ((top + height) > ($element.height() + $element.position().top)) {
			//Since this item is cut off at the bottom, show it in its entirety when it scrolls to the top.
			scrollBy = $element.height() + $element.position().top - $(this).position().top;	//Works for Financial, but not Spreadsheet.
			//scrollBy = $element.height() - $(this).position().top;
			isLastItemVisible = false;
			
			return false;
		    }
		});
		
		//If the last item was fully visible, then scroll by the height of the page element.
		if (isLastItemVisible) {
		    scrollBy = $element.height();
		}
		
		//Content is larger than viewable area.
		if ($page.height() > $element.height()) {
		    if (settings.direction == "up") {
			$page.animate({"margin-top": parseInt($page.css("margin-top")) - $element.height() + scrollBy + "px"}, "slow", function() {
			    //Starting at the last item, work backwards to find which items have scrolled off-screen.
			    for (var i = $(".item").length - 1; i >= 0; i--) {	
				var $item = $(".item").eq(i),
				    top = $item.position().top,
				    height = $item.outerHeight(true);	    
				    
				//Item has scrolled off-screen. Remove it and add a new one at the bottom.
				if ((top + height) < $element.position().top) {	//top could be auto
				    if (!$item.hasClass("delete")) {
					var $clone = $item.clone();
					
					if (count == 0) {
					    $page.append($clone);
					}
					else {
					    var $elem;
					    
					    //If more than one item has scrolled off-screen, they have to be inserted into the
					    //right position since we are working backwards.
					    if (count == 1) {
						$elem = $page.find(".item:last");
					    }
					    else {
						$elem = $page.find(".item").slice(-count, -count + 1);
					    }
					    
					    $clone.insertBefore($elem);			    
					}
				    }
				    
				    pageTop = parseInt($page.css("margin-top"));
				    $item.remove();
				    $page.css("margin-top", pageTop + $page.position().top - top);
				    count++;
				}
			    }
			    
			    $element.trigger("onScroll");
			});
		    }
		    else if (settings.direction == "down") {
		    }
		}
	    };
	});
    };
})(jQuery);