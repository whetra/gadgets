/**
 * extracted from:
 * http://twitter.com/javascripts/widgets/widget.js
 */

/**
 * relative time calculator
 * 
 * @param {string}
 *            twitter date string returned from Twitter API
 * @return {string} relative time like "2 minutes ago"
 */
var timeAgo = function(dateString) {
	var rightNow = new Date();
	var then = new Date(dateString);

	if (browser.ie) {
		// IE can't parse these crazy Ruby dates
		then = Date.parse(dateString.replace(/( \+)/, ' UTC$1'));
	}

	var diff = rightNow - then;

	var second = 1000, minute = second * 60, hour = minute * 60, day = hour * 24, week = day * 7;

	if (isNaN(diff) || diff < 0) {
		return ""; // return blank string if unknown
	}

	if (diff < second * 2) {
		// within 2 seconds
		return "right now";
	}

	if (diff < minute) {
		return Math.floor(diff / second) + " seconds ago";
	}

	if (diff < minute * 2) {
		return "about 1 minute ago";
	}

	if (diff < hour) {
		return Math.floor(diff / minute) + " minutes ago";
	}

	if (diff < hour * 2) {
		return "about 1 hour ago";
	}

	if (diff < day) {
		return Math.floor(diff / hour) + " hours ago";
	}

	if (diff > day && diff < day * 2) {
		return "yesterday";
	}

	if (diff < day * 365) {
		return Math.floor(diff / day) + " days ago";
	}

	else {
		return "over a year ago";
	}
};

var browser = function() {
	var ua = navigator.userAgent;
	return {
		ie : ua.match(/MSIE\s([^;]*)/)
	};
}();


/**
 * The Twitalinkahashifyer!
 * http://www.dustindiaz.com/basement/ify.html
 * Eg:
 * ify.clean('your tweet text');
 */
var ify = {
  link: function(tweet, enableLink) {
    return tweet.replace(/\b(((https*\:\/\/)|www\.)[^\"\']+?)(([!?,.\)]+)?(\s|$))/g, function(link, m1, m2, m3, m4) {
      var http = m2.match(/w/) ? 'http://' : '';
      var linkText = '';
      if (enableLink) { 
    	  linkText = ' target="_blank" href="' + http + m1 + '"';
      }
      return '<a' + linkText + '>' + ((m1.length > 25) ? m1.substr(0, 24) + '...' : m1) + '</a>' + m4;
    });
  },

  at: function(tweet, enableLink) {
    return tweet.replace(/\B[@＠]([a-zA-Z0-9_]{1,20})/g, function(m, username) {
        var linkText = '';
        if (enableLink) { 
      	  linkText = ' target="_blank" href="http://twitter.com/' + username + '"';
        }
        return '@<a' + linkText + '>' + username + '</a>';
    });
  },

  list: function(tweet, enableLink) {
    return tweet.replace(/\B[@＠]([a-zA-Z0-9_]{1,20}\/\w+)/g, function(m, userlist) {
        var linkText = '';
        if (enableLink) { 
      	  linkText = ' target="_blank" href="http://twitter.com/' + userlist + '"';
        }
        return '@<a"' + linkText + '>' + userlist + '</a>';
    });
  },

  hash: function(tweet, enableLink) {
    return tweet.replace(/(^|\s+)#(\w+)/gi, function(m, before, hash) {
        var linkText = '';
        if (enableLink) { 
      	  linkText = ' target="_blank" href="http://twitter.com/search?q=%23' + hash + '"';
        }
        return before + '<a"' + linkText + '>#' + hash + '</a>';
    });
  },

  clean: function(tweet, enableLink) {
    return this.hash(this.at(this.list(this.link(tweet, enableLink), enableLink), enableLink), enableLink);
  }
};

