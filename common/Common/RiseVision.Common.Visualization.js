var RiseVision = RiseVision || {};
RiseVision.Common = RiseVision.Common || {};
RiseVision.Common.Visualization = {};

RiseVision.Common.Visualization = function() {
    this.isVisualizationLoaded = false;
}
RiseVision.Common.Visualization.prototype.getData = function(opts) {
    this.query = null;
    this.url = opts.url;
    this.refreshInterval = opts.refreshInterval;
    this.callback = opts.callback;    
    
    if (opts.queryString) {
	this.queryString = opts.queryString;
    }
    
    //For some reason, trying to load the Visualization API more than once does not execute the callback function.
    if (!this.isVisualizationLoaded) {
	this.loadVisualizationAPI();
    }
    else {
        this.sendQuery();
    }
}
RiseVision.Common.Visualization.prototype.loadVisualizationAPI = function() {
    var self = this;
    
    google.load("visualization", "1", {"callback" : function() {
	self.isVisualizationLoaded = true;
	self.sendQuery();
    }});
}
RiseVision.Common.Visualization.prototype.sendQuery = function() {
    var self = this;
    
    if (this.query != null) {
        this.query.abort();	//Stop the automated query sending set by Refresh Interval.
    }

    this.query = new google.visualization.Query(this.url);
    this.query.setRefreshInterval(this.refreshInterval);
    
    if (this.queryString) {
	this.query.setQuery(this.queryString);
    }
    
    this.query.send(function(response) {
	if (response == null) {
	    self.callback(response);
	}
	else {
	    if (response.isError()) {
		console.log(response.getDetailedMessage());
		console.log(response.getReasons());
		self.callback(null);
	    }
	    else {
		self.callback(response.getDataTable());
	    }
	}
    });
}

RiseVision.Common.Utility = {};
/*
 * Dynamically load a CSS file.
 */
RiseVision.Common.Utility.loadCSS = function(url) {
    var link = $("<link>");	 
    
    link.attr({
	type: "text/css",
	rel: "stylesheet",
	href: url
    });
    
    $("head").append(link);
}
/*
 * Add commas to a number.
 */
RiseVision.Common.Utility.addCommas = function(number) {
    var x, x1, x2, regex;
    
    number += '';
    x = number.split('.');
    x1 = x[0];
    x2 = x.length > 1 ? '.' + x[1] : '';
    regex = /(\d+)(\d{3})/;
    
    while (regex.test(x1)) {
	x1 = x1.replace(regex, '$1' + ',' + '$2');
    }
    
    return x1 + x2;
}