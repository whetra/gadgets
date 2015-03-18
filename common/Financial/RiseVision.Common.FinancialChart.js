var RiseVision = RiseVision || {};
RiseVision.Common = RiseVision.Common || {};
RiseVision.Common.Financial = {};

RiseVision.Common.Financial = function(displayID, instruments, duration) {
    var self = this;
    
    if (displayID) {
	this.displayID = displayID;
    }
    else {
	this.displayID = "preview";
    }
    
    //Trim any whitespace from instruments.
    instruments = instruments.split(",");
	
    $.each(instruments, function(index, value) {
	instruments[index] = $.trim(instruments[index]);
    });
    
    this.instruments = instruments;
    this.duration = duration;
    
    this.isLoading = true;
    this.isHistoricalLoading = true;
    this.updateInterval = 60000;
    this.conditions = {};
    this.collectionTimes = [];
    this.url = "http://contentfinancial2.appspot.com/data?";
    this.historicalURL = "http://contentfinancial2.appspot.com/data/historical?";
    this.logosURL = "https://s3.amazonaws.com/risecontentlogos/financial/";
    // Need two seperate instances so that data can be loaded asynchronously.
    this.viz = new RiseVision.Common.Visualization();
    this.historicalViz = new RiseVision.Common.Visualization();    
}
/* fields is an array of fields to request from data server. Note: instrument column is always requested. */
/* Financial Data */
RiseVision.Common.Financial.prototype.getData = function(fields, loadLogos, callback) {
    var self = this,
	duplicateFound = false,
	fieldCount = 0,
	queryString = "select instrument",
	codes = "";
	
    this.dataFields = {};
    this.dataFields["instrument"] = 0;
    this.startTimeIndex = 1;	//Used to determine where collection data columns are.
    
    //Build the query string.
    $.each(fields, function(index, field) {
	duplicateFound = false;
	
	//Do nothing as instrument is already being requested.
	if (field == "instrument") {
	}
	else {
	    //Visualization API doesn't allow requesting the same field more than once.
	    $.each(self.dataFields, function(i, dataField) {
		if (i == field) {
		    duplicateFound = true;
		    return false;
		}
	    });
	    
	    if (!duplicateFound) {
		queryString += ", " +  field;
		//Create a mapping between field names and column indices.
		self.dataFields[field] = fieldCount + 1;
		fieldCount++;
		self.startTimeIndex++;
	    }
	}
    });
    
    queryString += ", startTime, endTime, daysOfWeek, timeZoneOffset"
    codes = this.getCodes();
    
    //Perform a search for the instruments.
    if (codes) {
	var self = this,
	    options = {
		url: this.url + "id=" + this.displayID + "&codes=" + codes,
		refreshInterval: 0,
		queryString: queryString,
		callback: function(data) {
		    if (data != null) {
			clearTimeout(self.getDataTimer);
			self.data = data;
			self.callback = callback;
			
			if (self.isLoading) {
			    self.isLoading = false;
			    
			    if (self.collectionTimes.length == 0) {
				self.saveCollectionTimes();
			    }
			    
			    if (loadLogos) {
				self.loadLogos();
			    }
			    else {
				if (self.callback) {
				    self.callback(self.data);
				} 
			    }
			}
			else {
			    if (self.callback) {
				self.callback(self.data);
			    } 
			}
		    }
		}
	    };
	
	//Start a timer in case there is a problem loading the data (i.e. Internet has been disconnected).
	this.getDataTimer = setTimeout(function() {
	    self.getData(fields, loadLogos, callback);
	}, this.updateInterval);
	
	this.viz.getData(options);
    }
    else {
	callback(null);
    }
}
RiseVision.Common.Financial.prototype.getCodes = function() {
    var self = this;
    
    this.logoCount = 0;
    
    if (this.isLoading) {
	return this.instruments.join("|");
    }
    else {
	var dayOfWeek = new Date().getDay(),
	    len = this.collectionTimes.length,
	    instruments = [];
	    
	$.each(this.instruments, function(i, instrument) {
	    for (var j = 0; j < len; j++) {
		if (instrument == self.collectionTimes[j].instrument) {
		    var today = new Date(),
			hours = today.getHours(),
			minutes = today.getMinutes(),
			startTime = self.collectionTimes[j].startTime,
			endTime = self.collectionTimes[j].endTime,
			daysOfWeek = self.collectionTimes[j].daysOfWeek;
		    
		    //Check if the instrument should be requested again based on its collection data.
		    $.each(daysOfWeek, function(j, day) {
			//Check collection day.
			if (day == dayOfWeek) {		    
			    //Check collection time.
			    if (new Date("Jan 1, 1970 " + hours + ":" + minutes).between(startTime, endTime)) {
				instruments.push(self.instruments[i]);
			    }
			    
			    return false;
			}
		    });
		}
	    }	    
	});
	
	return instruments.join("|");
    }
}
RiseVision.Common.Financial.prototype.saveCollectionTimes = function() {
    var numRows, timeZoneOffset, startTime, endTime, isDaylightSavingTime;
	    
    if (this.data != null) {
	numRows = this.data.getNumberOfRows();
	isDaylightSavingTime = Date.today().isDaylightSavingTime();
	
	//Only need to save collection time once for the entire chain.
	//Use the collection data from the first stock since the rest should all be the same.
	if (this.isChain()) {
	    if ((this.data.getValue(0, 0) != "INVALID_SYMBOL")) {
		timeZoneOffset = this.data.getValue(0, this.startTimeIndex + 3);
		startTime = this.data.getValue(0, this.startTimeIndex);    	
		endTime = this.data.getValue(0, this.startTimeIndex + 1);
		
		if (startTime && endTime && timeZoneOffset != "N/P") {
		    if (isDaylightSavingTime) {
			startTime.addHours(1);
			endTime.addHours(1);
		    }
			
		    this.collectionTimes.push({
			"instrument": this.instruments[0],	    
			"startTime": startTime.setTimezoneOffset(timeZoneOffset),
			"endTime": endTime.setTimezoneOffset(timeZoneOffset),
			"daysOfWeek": this.data.getFormattedValue(0, this.startTimeIndex + 2).split(",")
		    });
		}
	    }
	}
	//Save collection data for each stock.
	else {
	    for (var row = 0; row < numRows; row++) {
		if (this.data.getValue(row, 0) != "INVALID_SYMBOL") {
		    timeZoneOffset = this.data.getValue(row, this.startTimeIndex + 3);
		    startTime = this.data.getValue(row, this.startTimeIndex);
		    endTime = this.data.getValue(row, this.startTimeIndex + 1);
		    
		    if (startTime && endTime && timeZoneOffset != "N/P") {
			if (isDaylightSavingTime) {
			    startTime.addHours(1);
			    endTime.addHours(1);
			}
			
			this.collectionTimes.push({
			    "instrument": this.instruments[row],
			    "startTime": startTime.setTimezoneOffset(timeZoneOffset),
			    "endTime": endTime.setTimezoneOffset(timeZoneOffset),
			    "daysOfWeek": this.data.getFormattedValue(row, this.startTimeIndex + 2).split(",")
			});
		    }
		}
	    }
	}
    }
}
/* Historical Financial data - Only one stock can be requested at a time. */
RiseVision.Common.Financial.prototype.getHistoricalData = function(fields, callback, options) {
    var self = this,
	queryString = "select " + fields.join() + " ORDER BY tradeTime",
	codes = "";
	
    //Customize the query string.
    if (options) {
	if (options.sortOrder) {
	    if (options.sortOrder == "desc") {
		queryString += " desc";
	    }
	}
	
	if (options.limit) {
	    queryString += " LIMIT " + options.limit;
	}
    }
    
    codes = this.getCodes();
    
    //Perform a search for the instruments.
    if (codes) {    
	options = {
	    url: this.historicalURL + "id=" + this.displayID + "&code=" + this.instruments[0] + "&kind=" + this.duration,
	    refreshInterval: 0,
	    queryString: queryString,
	    callback: function(data) {
		if (data != null) {
		    clearTimeout(self.getHistoricalDataTimer);
		    self.historicalData = data;
		    self.getHistoricalTimes(function(result) {
			callback(result);
		    });
		}
	    }
	};
	
	//Start a timer in case there is a problem loading the data (i.e. Internet has been disconnected).
	this.getHistoricalDataTimer = setTimeout(function() {
	    self.getHistoricalData(fields, callback, options);
	}, this.updateInterval);
	
	this.historicalViz.getData(options);
    }
    else {
	callback(null);
    }
}
RiseVision.Common.Financial.prototype.getHistoricalTimes = function(callback) {
    var self = this,
	options = {
	    url: "http://contentfinancial2.appspot.com/info?codes=" + this.instruments[0],
	    refreshInterval: 0,
	    queryString: "select startTime, endTime, daysOfWeek, timeZoneOffset, updateInterval",
	    callback: function(result) {
		if (result != null) {
		    clearTimeout(self.getHistoricalTimesTimer);
		    self.historicalTimes = result;
		    
		    if (self.isHistoricalLoading) {
			self.isHistoricalLoading = false;
			self.saveHistoricalTimes();
			
			if (self.historicalData != null) {
			    callback({
				"data": self.historicalData,
				"collectionData": self.historicalTimes
			    });
			}
			else {
			    callback({
				"collectionData": self.historicalTimes
			    });
			}
		    }
		    else {
			if (self.historicalData != null) {
			    callback({
				"data": self.historicalData,
				"collectionData": self.historicalTimes
			    });
			}
			else {
			    callback({
				"collectionData": self.historicalTimes
			    });
			} 
		    }
		}		
	    }
	};
	
    //Start a timer in case there is a problem loading the data (i.e. Internet has been disconnected).
    this.getHistoricalTimesTimer = setTimeout(function() {
	self.getHistoricalTimes(callback);
    }, this.updateInterval);
    
   this.historicalViz.getData(options);
}
RiseVision.Common.Financial.prototype.saveHistoricalTimes = function() {
    var numRows, isDaylightSavingTime, startTime, endTime, timeZoneOffset;
	
    if (this.historicalTimes != null) {
	numRows = this.historicalTimes.getNumberOfRows();
	isDaylightSavingTime = Date.today().isDaylightSavingTime();
	
	for (var row = 0; row < numRows; row++) {	
	    startTime = this.historicalTimes.getValue(row, 0);
	    endTime = this.historicalTimes.getValue(row, 1);
	    timeZoneOffset = this.historicalTimes.getValue(row, 3);
	    
	    if (isDaylightSavingTime) {
		startTime.addHours(1);
		endTime.addHours(1);
	    }
	    
	    this.collectionTimes.push({
		"instrument": this.instruments[0],
		"startTime": startTime.setTimezoneOffset(timeZoneOffset),
		"endTime": endTime.setTimezoneOffset(timeZoneOffset),
		"daysOfWeek": this.historicalTimes.getFormattedValue(row, 2).split(",")
	    });		
	}
    }
}
RiseVision.Common.Financial.prototype.loadLogos = function() {
    var self = this,	
	numRows = this.data.getNumberOfRows();
    
    //Load all company logos.
    for (var row = 0; row < numRows; row++) {	
	var img = new Image();
	
	img.onload = function () {
	    self.onLogoLoaded();
	}
	
	img.onerror = function() {
	    self.onLogoLoaded();
	}
	
	img.src = this.logosURL + this.data.getValue(row, 0) + ".svg";
    }    
}
RiseVision.Common.Financial.prototype.onLogoLoaded = function() {
    this.logoCount++;
    
    //One logo per row.
    if (this.logoCount >= this.data.getNumberOfRows()) {
	if (this.callback) {
	    this.callback(this.data);
	} 
    }
}
RiseVision.Common.Financial.prototype.isChain = function() {
    //This is a chain if there is only one instrument being requested, but multiple rows of data are returned.
    return this.instruments.length == 1 && this.data.getNumberOfRows() > 1;
}
/* Conditions */
RiseVision.Common.Financial.prototype.checkSigns = function(field) {
    var row = 0,
	signs = [],
	current, sign;
    
    for (row = 0, numRows = this.data.getNumberOfRows(); row < numRows; row++) {
	current = this.data.getValue(row, this.dataFields[field]);

	if (isNaN(current)) {
	    current = current.replace(/[^0-9\.-]+/g,"");
	    current = parseFloat(current);
	}

	if (!isNaN(current)) {
	    if (current >= 0) {
		sign = 1;
	    }
	    else {
		sign = -1;
	    }
	    
	    signs.push(sign);
	}
    }
    
    return signs;
}
/* Return 1 if current value is greater than the previous value.
   Return 0 if both values are equal.
   Return -1 if current value is less than the previous value. */
RiseVision.Common.Financial.prototype.compare = function(field) {
    var self = this,
	current = 0,
	previous = 0,
	result = [],
	matchFound = false;
    
    if (this.conditions[field]) {
	for (row = 0, numRows = this.data.getNumberOfRows(); row < numRows; row++) {
	    current = this.data.getValue(row, this.dataFields[field]);
	    matchFound = false;
		
	    $.each(this.conditions[field], function(index, value) {
		//Instrument is used to ensure that the rows that are being compared are for the same stock.
		//In chains, rows may be added or deleted.
		if (value.instrument == self.data.getValue(row, 0)) {
		    previous = value.value;
		    
		    if (isNaN(current)) {
			current = current.replace(/[^0-9\.-]+/g,"");
			current = parseFloat(current);
		    }
		    
		    if (isNaN(previous)) {
			previous = previous.replace(/[^0-9\.-]+/g,"");
			previous = parseFloat(previous);
		    }	
	    
		    //The data type of a column can still be a number even if there is string data in it.
		    //To be sure, let's check that the values we are comparing are numbers.
		    if (!isNaN(current) && !isNaN(previous)) {
			if (current != previous) {
			    if (current > previous) {
				result.push(1);
			    }
			    else {
				result.push(-1);
			    }
			}
			//They are equal.
			else {
			    result.push(0);
			}
		    }
	    
		    matchFound = true;
		    
		    return false;
		}
	    });
	    
	    //No match found for this instrument (ie it's new).
	    if (!matchFound) {
		result.push(0);
	    }
	}
    }
    
    this.saveBeforeValues([field]);
    
    return result;
}
RiseVision.Common.Financial.prototype.saveBeforeValues = function(fields) {
    var self = this;
    
    $.each(fields, function(index, value) {
	self.conditions[value] = [];
	self.saveBeforeValue(value, self.dataFields[value]);
    });
}
/* Store the current values so they can be compared to new values on a refresh. */
RiseVision.Common.Financial.prototype.saveBeforeValue = function(field, colIndex) {
    for (var row = 0, numRows = this.data.getNumberOfRows(); row < numRows; row++) {
	this.conditions[field].push({
	    "instrument": this.data.getValue(row, 0),
	    "value": this.data.getValue(row, colIndex)
	});
    }				
}