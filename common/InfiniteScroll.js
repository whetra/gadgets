/* jQuery plugin to continuously cycle through information by item or by page. */ 
(function ($) {	
    $.fn.infiniteScroll = function(options) {
	var scrollTimer = null,
	    interactivityTimer = null,
	    topIndex = 0,
	    mouseDown = false,
	    isStopped = false,
	    lastMouseY = 0,
	    settings = {
		scrollBy: "item",
		direction: "up",
		duration: 10000,
		swipingTimeout: 5000,
		cloneItem: null
	    };
	    
	$.fn.reverse = [].reverse;
	    
	//Merge options with default settings.
	if (options) {
	    $.extend(settings, options);
	    
	    //Duration has to be at least one second since the animation itself takes 600ms.
	    if (settings.duration < 1000) {
		settings.duration = 1000;
	    }
	}
	    
	return this.each(function() {
	    var $element = $(this),
		$page = $element.find(".page");
	    
	    /* Public methods */   
	    $.fn.infiniteScroll.start = function() {
		if ($.fn.infiniteScroll.canScroll() && (settings.direction != "none")) {
		    clearInterval(scrollTimer);
		    
		    if (settings.scrollBy == "continuous") {
			scrollTimer = setInterval(function() {
			    startContinuousScroll();
			}, 50);
		    }
		    else {
			scrollTimer = setInterval(function() {
			    startScroll();
			}, settings.duration);
		    }
		}
	    };
	    
	    $.fn.infiniteScroll.stop = function() {
		$element.enabled = false;
	
		clearInterval(scrollTimer);
		clearTimeout(interactivityTimer);
	
		//detach the event handlers
		//$element.off('.idleTimer');
	    };
		
	    $.fn.infiniteScroll.pause = function() {
		clearInterval(scrollTimer);
	    }
	    
	    //Check if content is larger than viewable area.
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
	    
	    if ($.fn.infiniteScroll.canScroll()) {
		//Add event handlers for swiping.
		$element.bind({
		    mousemove: function(e) {
			handleMouseMove(e);
		    },
		    mousedown: function(e) {
			handleMouseDown(e);
		    },
		    mouseup: function(e) {
			handleMouseUp(e);
		    },
		    mouseleave: function(e) {
			handleMouseLeave(e);
		    }
		});
	    }
	    
	    //Duplicate all items to ensure that the viewable area is always filled.
	    if (settings.scrollBy == "page" && $.fn.infiniteScroll.canScroll()) {
		topIndex = $(".item").length;
		$page.append($(".item").clone());
		
		//Move to second instance of first item so that there are items available to scroll on from the top.
		if (settings.direction == "down") {
		    $page.css("margin-top", $page.position().top - $(".item").eq(topIndex).position().top + "px");
		}
	    }
	    
	    /* Private methods */
	    function scrollNow() {
		if ($.fn.infiniteScroll.canScroll() && (settings.direction != "none")) {
		    clearInterval(scrollTimer);
		    
		    if (settings.scrollBy == "continuous") {
			startContinuousScroll();
			    
			scrollTimer = setInterval(function() {
			    startContinuousScroll();
			}, 50);
		    }
		    else {
			startScroll();
			
			scrollTimer = setInterval(function() {
			    startScroll();
			}, settings.duration);
		    }
		}
	    }
	    
	    function startContinuousScroll() {
		if (!mouseDown && !isStopped) {
		    scrollContinuously();
		}
	    }
	    
	    function startScroll() {
		if (!mouseDown && !isStopped) {
		    if (settings.scrollBy == "item") {
			scrollByItem(true);
		    }
		    else if (settings.scrollBy == "page") {
			scrollByPage();
		    }
		    else {
			$.error(settings.scrollBy + " is not a valid value for scrollBy parameter.");
		    }
		}
	    }
	    
	    /* Scroll the content one item at a time. */
	    function scrollByItem(animate) {
		var $items = $element.find(".item");

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
			    $page.animate({"margin-top": $page.position().top + parseInt($page.css("margin-top")) - top + "px"}, "slow", function() {
				$item.remove();
				$page.css("margin-top", "0px");
				$element.trigger("onScroll");
			    });
			}
			else {
			    $item.remove();
			    $page.css("margin-top", "0px");
			    $element.trigger("onScroll");
			}
		    }
		}
		else {	//Down
		    var $first = $element.find(".item:first"),
			$last = $element.find(".item:last"),
			scrollBy = 0, isCloned = false;
			
		    if ($first) {
			//Clone the item at the bottom if the top item is fully visible.
			if ($first.position().top >= $page.position().top) {
			    if (settings.cloneItem) {
				settings.cloneItem();
			    }
			    else {
				if (!$(".item:last").hasClass("delete")) {
				    $page.prepend($last.clone());	
				}				
			    }
			    
			    $page.css("margin-top", parseInt($page.css("margin-top")) - $last.outerHeight(true) + "px");
			    scrollBy = $last.outerHeight(true);
			    isCloned = true;
			}
			else {
			    scrollBy = $page.position().top - $first.position().top;
			}
			
			if (animate) {
			    $page.animate({"margin-top": parseInt($page.css("margin-top")) + scrollBy + "px"}, "slow", function() {
				if (isCloned) {
				    $last.remove();
				}
				
				$element.trigger("onScroll");
			    });
			}
			else {
			    $last.remove();
			    $page.css("margin-top", "0px");
			    $element.trigger("onScroll");
			}
		    }
		}
	    };
	    
	    /* Scroll the content by page (viewable area) */
	    function scrollByPage() {
		var count = 0,
		    scrollBy = 0,
		    isLastItemVisible = true;
		
		if (settings.direction == "up") {
		    //Find item that is cut off at the bottom.
		    $(".item").each(function(i) {
			var height = $(this).outerHeight(true),
			    top = $(this).position().top;
	
			if ((top + height) > ($element.height() + $element.position().top)) {
			    //Since this item is cut off at the bottom, show it in its entirety when it scrolls to the top.
			    scrollBy = $element.height() - $(this).position().top;
			    isLastItemVisible = false;
			    
			    return false;
			}
		    });
		    
		    //If the last item was fully visible, then scroll by the height of the page element.
		    if (isLastItemVisible) {
			scrollBy = $element.height();
		    }
	    
		    $page.animate({"margin-top": $element.position().top - $element.height() + scrollBy + "px"}, "slow", function() {
			//Starting at the last item, work backwards to find which items have scrolled off-screen.
			for (var i = $(".item").length - 1; i >= 0; i--) {	
			    var $item = $(".item").eq(i),
				top = $item.position().top,		
				height = $item.outerHeight(true);	
				
			    //Item has scrolled off-screen. Remove it and add a new one at the bottom.
			    if ((top + height) <= $page.position().top) {
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
				
				$item.remove();
				$page.css("margin-top", parseInt($page.css("margin-top")) + height + "px");
				count++;
			    }
			}
			
			$element.trigger("onScroll");
		    });
		}
		else if (settings.direction == "down") {
		    var totalHeight = 0;
		    
		    //Working backwards from top item, calculate how many items can be fully displayed within the viewable area.
		    do {
			topIndex--;
			
			if (topIndex < 0) {
			    topIndex = $(".item").length - 1;
			}
			
			var $item = $(".item").eq(topIndex);
			
			if ((totalHeight + $item.outerHeight(true)) < $element.height()) {
			    totalHeight += $item.outerHeight(true);
			}
			
		    } while ((totalHeight + $item.outerHeight(true)) < $element.height())
		    
		    $page.animate({"margin-top": parseInt($page.css("margin-top")) + totalHeight + "px"}, "slow", function() {
			//The item that is at the top is the one that has a positive top position.
			$(".item").each(function(index) {
			    if ($(this).position().top >= $page.position().top) {
				topIndex = index;
				return false;
			    }
			});
			
			//Starting at the last item, work backwards to find which items have scrolled off-screen.
			$(".item").reverse().each(function() {
			    if ($(this).position().top > ($element.outerHeight(true) + $page.position().top)) {
				$page.prepend($(this));
				$page.css("margin-top", parseInt($page.css("margin-top")) -$(this).outerHeight(true) + "px");
			    }
			    else {	//Found them all.
				return false;
			    }
			});
			
			$element.trigger("onScroll");
		    });
		}
	    };
	    
	    /* Scroll items continuously without stopping. */
	    function scrollContinuously() {
		if (settings.direction == "up") {
		    $page.css("margin-top", parseInt($page.css("margin-top")) - 1 + "px");
			
		    //Move first item to the bottom if it has scrolled off at the top.
		    if (($(".item:first").position().top + $(".item:first").outerHeight(true)) < $page.position().top) {
			$page.append($(".item:first"));
			$page.css("margin-top", parseInt($page.css("margin-top")) + $(".item:last").outerHeight(true));
		    }
		}
		else {
		    //Move last item to the top if the first item is fully visible.
		    if ($(".item:first").position().top == $page.position().top) {
			$page.prepend($(".item:last"));
			$page.css("margin-top", -$(".item:first").outerHeight(true));
		    }
		    
		    $page.css("margin-top", parseInt($page.css("margin-top")) + 1 + "px");
		}
	    };
	    
	    function handleMouseDown(event) {
		clearInterval(scrollTimer);
		lastMouseY = event.clientY;
		mouseDown = true;
	    }
	    
	    function handleMouseUp(event) {
		clearTimeout(interactivityTimer);
		interactivityTimer = setTimeout(function() {
		    //Need to move items around in case swiping has occurred.
		    if (settings.direction != "none") {
			if (settings.scrollBy == "item") {}
			else {
			    if (settings.direction == "up") {
				$(".item").each(function() {
				    if (($(this).position().top + $(this).outerHeight(true)) < 0) {
					$page.append($(this));
					$page.css("margin-top", parseInt($page.css("margin-top")) + $(this).outerHeight(true) + "px");
				    }
				    else {	//Found them all.
					return false;
				    }
				});
			    }
			    else {
				$(".item").reverse().each(function() {
				    if ($(this).position().top > $element.outerHeight(true)) {
				    //if ($(this).position().top > ($page.outerHeight(true) + $page.position().top)) {
					$page.prepend($(this));
					$page.css("margin-top", parseInt($page.css("margin-top")) - $(this).outerHeight(true) + "px");
				    }
				    else {	//Found them all.
					return false;
				    }
				});
			    }
			}
		    }
		    
		    isStopped = false;
		    scrollNow();
		}, settings.swipingTimeout);
		
		isStopped = true;
		mouseDown = false;
	    }
	    
	    function handleMouseLeave(event) {
		if (mouseDown) {
		    mouseDown = false;
		    $.fn.infiniteScroll.start();
		}
	    }
	    
	    function handleMouseMove(event) {
	        if (!mouseDown) {
		    return;
	        }
		
		var newY = event.clientY,
		    delta = lastMouseY - newY;
		
		if (delta > 0) {	//Swiping up
		    if (settings.scrollBy == "item") {
			var $firstItem = $(".item:first");
			
			$page.css("margin-top", parseInt($page.css("margin-top")) - delta + "px")
			
			//If the item has scrolled off the top, move it to the bottom.
			if (($firstItem.position().top + $firstItem.outerHeight(true)) < $page.position().top) {
			    $page.append($firstItem);
			    $page.css("margin-top", "0px");
			}
		    }
		    else {
			$page.css("margin-top", parseInt($page.css("margin-top")) - delta + "px");
			
			$(".item").each(function() {
			    if (($(this).position().top + $(this).outerHeight(true)) < $page.position().top) {
				$page.append($(this));
				$page.css("margin-top", parseInt($page.css("margin-top")) + $(this).outerHeight(true) + "px");
			    }
			    else {	//Found them all.
				return false;
			    }
			});
		    }
		}
		else if (delta < 0) {	//Swiping down
		    if (settings.scrollBy == "item") {
			if ($(".item:first").position().top >= $page.position().top) {	//Move the last item to the top before swiping.
			    $page.prepend($(".item:last"));
			    $page.css("margin-top", -$(".item:first").outerHeight(true) + "px");
			}
		    }
		    else {
			//Work backwards to find which items are hidden at the bottom and move them to the top.
			$(".item").reverse().each(function() {
			    if ($(this).position().top > ($element.outerHeight(true) + $page.position().top)) {
				$page.prepend($(this));
				$page.css("margin-top", parseInt($page.css("margin-top")) - $(this).outerHeight(true) + "px");
			    }
			    else {	//Found them all.
				return false;
			    }
			});
		    }
		    
		    $page.css("margin-top", parseInt($page.css("margin-top")) - delta + "px");
		}
		
		lastMouseY = newY;
		isStopped = false;
	    }
	});
    };
})(jQuery);