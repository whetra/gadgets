var url = null;
var refreshInterval = null;
var callback = null;
var version = 1;
var isVisualizationLoaded = false;
var query = null;
var queryString = null;
var handler = null;
var heartbeatTimerId = 0;
                
function getData(url, refreshInterval, callback, version) {
    var settings = {
	url: url,
	refreshInterval: refreshInterval,
	callback: callback
    };
    
    handler = version == 1 ? processResponseAsCustomJSON : processResponse;
    initializeQuery(settings);
}

function getRawData(settings) {
    handler = processResponseAsDataTable;
    initializeQuery(settings);
}

function getFilteredData(settings) {
    handler = processResponseAsDataTable;
    initializeQuery(settings);
}
//function getFilteredData(url, refreshInterval, callback, version, queryString) {
//    var settings = {
//	url: url,
//	refreshInterval: refreshInterval,
//	callback: callback
//    };
//    this.queryString = queryString;
//    handler = version == 1 ? processResponseAsCustomJSON : processResponse
//    initializeQuery(settings);
//}

function initializeQuery(settings) {
    this.url = settings.url;
    this.refreshInterval = settings.refreshInterval;
    this.callback = settings.callback;
    
    if (settings.queryString) {
	this.queryString = settings.queryString;
    }
    
    //For some reason, trying to load the Visualization API more than once does not execute the callback function.
    if (!isVisualizationLoaded) {
	loadVisualizationAPI();
    }
    else {
        sendQuery();
    }
}

/**
* Load the APIs and run sendQuery when the load is complete
*/
function loadVisualizationAPI() {
    google.load("visualization", "1", {"callback" : function() {
	isVisualizationLoaded = true;
	sendQuery();
    }});
}

/**
* Create a query , then send it to the spreadsheet data source.
*  Also give the name of a function ("handleQueryResponse") to
*  run once the spreadsheet data is retrieved.
*/
function sendQuery() {
    if (query !== null) {
        query.abort(); //Stop the automated query sending set by Refresh Interval.
    }

    query = new google.visualization.Query(url);
    query.setRefreshInterval(refreshInterval);
    
    if (queryString) {
	query.setQuery(queryString);
    }
    
    query.send(handler);
}

/**
* The core logic. Process the spreadsheet data however you want. 
* In this case, we create HTML to be presented back to the user. 
* We'll use inline comments to provide a step-by-step description 
* of what we're doing:
*/
function processResponseAsCustomJSON(response) {
    var data, propertyName, label, item;
    var cols = new Array();
    var rows = new Array();
    var json = {
	"cols": [],
        "rows": []
    };
    
    if (response.isError()) {
	console.log(response.getDetailedMessage());
	console.log(response.getReasons());
    }
    else {
	restartHeartbeatTimer();
    
	//Get spreadsheet data.
	data = response.getDataTable();
	
	//Get the column headings.
	for (var col = 0; col < data.getNumberOfColumns(); col++) {
	    label = new Object();
	    //id property removes any whitespace from the column label.
	    //label property is the unaltered column label.
	    label["id"] = data.getColumnLabel(col).split(' ').join('');
	    label["label"] = data.getColumnLabel(col);
	    cols[col] = label;
	}
	
	//Get the row values.
	for (var row = 0; row < data.getNumberOfRows(); row++) {
	    item = new Object();
	    
	    for (var col = 0; col < data.getNumberOfColumns(); col++) {
		propertyName = cols[col].id;
		item[propertyName] = data.getFormattedValue(row, col);
	    }
	    
	    rows[row] = item;
	}
    
	json.cols = cols;
	json.rows = rows;
	
	//Call the callback function.
	callback(json);
    }
}

function processResponse(response) {
    var data, text, json;
    
    if (response.isError()) {
	console.log(response.getDetailedMessage());
	console.log(response.getReasons());
    }
    else {
	restartHeartbeatTimer();
	
	//Get spreadsheet data.
	data = response.getDataTable();
	text = data.toJSON();
	json = JSON.parse(text);
    
	//Call the callback function.
	callback(json);
    }
}

function processResponseAsDataTable(response) {
    if (response.isError()) {
	console.log(response.getDetailedMessage());
	console.log(response.getReasons());
    }
    else {
	//restartHeartbeatTimer();	/*Removed to prevent scrolling from starting again at the top.*/
	callback(response.getDataTable());
    }
}
            
/**
* Monitor Visualization API refresh updates with Heartbeat Timer.
* This is a work around for Visualization API bug when it stops 
* refreshing data if data hadn't change for 2 consequent data requests.
* As of August 2, 2011 it looks like this code is longer needed.
*/
function restartHeartbeatTimer() {
    clearTimeout(heartbeatTimerId);
    var interval = 0;
    
    try
    {
        //Set Heartbeat Timer to 3x times longer then refresh interval.
	var interval = 3 * 1000 * refreshInterval;
    }
    catch(err)
    {}
    if (interval > 0) {
        heartbeatTimerId = setTimeout(function() {
	    sendQuery();
	}, interval);
    }
}
function resumeRefresh() {
    query.setRefreshInterval(refreshInterval);
}
function abortRefresh() {
    query.abort();
}