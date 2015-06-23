// Rise Display Licensing module
//
// there are 2 ways to use this class
// 1) Manual: Create class instance and call checkAuth() whenever you need.
// 2) Automatic: Create class instance and call Start(callback).
//    This way class object will check licensing status every 24 hours as return results in callback.
//    If callback is not provided, function will only display results in errDivId tag (assuming errDivId is provided).
//
// compress with http://closure-compiler.appspot.com before deployment

if (!window['rd']) { window['rd'] = {}; }

rd.Lic = function(productId, displayId, companyId, errDivId) {
    this.isAuth = null; //is Authorized
    this.productId = productId;
    this.displayId = displayId;
    this.companyId = companyId;
    this.errDivId = errDivId; //ID of the HTML DIV element to display "Not Authorized" message
    this.timerId = 0;
}

rd.Lic.prototype.checkAuth = function() {
    if (this.isAuth === null) {
        this.isAuth = this.callLicensingServer();
    }
    this.showAuthMessage(!this.isAuth);
    return this.isAuth;
};


rd.Lic.prototype.start = function(callback) {
    this.callback = callback;
    this.restartTimer();
    return this.checkAuth();
}

rd.Lic.prototype.restartTimer = function() {
    clearTimeout(this.timerId);
    var interval = 24 * 60 * 60 * 1000; //24 hours
    var _this = this;
    this.timerId = setTimeout(function() { _this.onTimer(); }, interval);
};

rd.Lic.prototype.onTimer = function() {
    this.restartTimer();
    this.checkAuth();
    if (this.callback) {
        callback(this.isAuth);
    }
};

rd.Lic.prototype.showAuthMessage = function(visible) {
    var el = document.getElementById(this.errDivId);
    if (el) {
        var elIsVisible = el.style.visibility == "visible";
        if (visible != elIsVisible) {
            el.style.visibility = visible ? "visible" : "hidden";
            if (visible) {
                el.style.width = window.innerWidth + "px";
                el.style.height = window.innerHeight + "px";
                el.style.lineHeight = window.innerHeight + "px";
                el.innerHTML = "Not Authorized";
            }
        }
    }
};

rd.Lic.prototype.callLicensingServer = function() {
    var res = false;
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            var resp = eval('(' + xmlhttp.responseText + ')');
            if (resp && resp.riselicensor && resp.riselicensor.result && resp.riselicensor.result == "yes") {
                res = true;
            }
        }
    }
    var paramProductId = "?id=" + this.productId;
    var paramDisplayId = this.displayId ? "&d=" + this.displayId : "";
    var paramCompanyId = this.companyId ? "&c=" + this.companyId : "";
    var baseUrl = "http://riselicensing.appspot.com/api";
    //var baseUrl = "http://localhost:8888/api";
    xmlhttp.open("GET", baseUrl + paramProductId + paramDisplayId + paramCompanyId, false);
    xmlhttp.send();
    return res;
};
