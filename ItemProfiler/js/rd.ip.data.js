if (!window['rd']) { window['rd'] = {}; }
if (!window['rd']['ip']) { window['rd']['ip'] = {}; }

rd.ip.data = {};

rd.ip.data.query = null;
rd.ip.data.gadgetHelper = null;
rd.ip.data.heartbeatTimerId = 0;
rd.ip.data.refreshInterval = 60; //in seconds
rd.ip.data.onDataLoaded = null;

rd.ip.data.init = function(onDataLoadedHandler) {
    //    rd.ip.data.onDataLoaded = onDataLoadedHandler;
    //    google.load("visualization", "1");
    //    google.setOnLoadCallback(rd.ip.data.sendQuery);
    this.onDataLoaded = onDataLoadedHandler;
    this.sendQuery();
};

rd.ip.data.sendQuery = function() {
    try {
        var me = rd.ip.data;
        if (me.gadgetHelper === null) {
            me.gadgetHelper = new google.visualization.GadgetHelper();
        }
        if (me.query !== null) {
            me.query.abort(); //Stop the automated query sending set by Refresh Interval
            me.query = null;
        }
        me.query = new google.visualization.Query(_dataUrl_);
        //var refreshInterval = prefs.getInt('_table_query_refresh_interval');
        me.query.setRefreshInterval(me.refreshInterval);
        me.query.send(me.handleQueryResponse);
        me.restartHeartbeatTimer();
    }
    catch (err) {
        //writeLog("sendQuery error: " + err.message);
    }
};

rd.ip.data.handleQueryResponse = function(response) {

    var me = rd.ip.data;
    var res = [];  //list of profiles

    me.restartHeartbeatTimer();

    //rd.ip.core.progressBar.percent = 20;
    //rd.ip.core.progressBar.draw();

    // Use the visualization GadgetHelper class to handle errors 
    if (!me.gadgetHelper.validateResponse(response)) {
        return res;     // Default error handling was done, just leave. 
    }

    var data = response.getDataTable();

    if (data.getNumberOfColumns() < rd.ip.globals.NUMBER_OF_COLUMNS) {
        return res;
    }

    //check if received date has labels
    var labelsExist = false;
    for (var col = 0; col < rd.ip.globals.NUMBER_OF_COLUMNS; col++) {
        if ('' != data.getColumnLabel(col)) {
            labelsExist = true;
            break;
        }
    }

    var firstDataRow = labelsExist ? 0 : 1; //if not labelsExist, then label is included in data

    var headerData = [];
    if (labelsExist) {
        for (var col = 0; col < rd.ip.globals.NUMBER_OF_COLUMNS; col++) {
            headerData.push(data.getColumnLabel(col));
        }
    } else {
        for (var col = 0; col < rd.ip.globals.NUMBER_OF_COLUMNS; col++) {
            headerData.push(data.getFormattedValue(0, col));
        }
    }

    for (var row = firstDataRow; row < data.getNumberOfRows(); row++) {
        var rowData = [];
		var notNullValues = false;
        for (var col = 0; col < rd.ip.globals.NUMBER_OF_COLUMNS; col++) {
			var objData = data.getFormattedValue(row, col);
            rowData.push(objData);
			if('' != objData)
				notNullValues = true;
        }
		if(notNullValues)
			res.push(new rd.ip.Profile(rowData));
    }

    if (me.onDataLoaded) { me.onDataLoaded(res, headerData); }

};

/**
* Monitor Visualization API refresh updates with Heartbeat Timer.
* This is a work around for Visualization API bug when it stops 
* refreshing data if data hadn't change for 2 consequent data requests.
*/
rd.ip.data.restartHeartbeatTimer = function() {
    var me = rd.ip.data;
    clearTimeout(me.heartbeatTimerId);
    var interval = 0;
    try {
        // set Heartbeat Timer to 3x times longer then refresh interval
        var interval = 3 * 1000 * me.refreshInterval;
    }
    catch (err)
		{ }
    if (interval > 0) {
        me.heartbeatTimerId = setTimeout('rd.ip.data.sendQuery()', interval);
    }
};
