if (!window['rd']) { window['rd'] = {}; }
if (!window['rd']['ip']) { window['rd']['ip'] = {}; }

rd.ip.Filter = function(filterBoxId, filterListId) {
    this.filterBox = document.getElementById(filterBoxId);
    this.main = document.getElementById(filterListId);
    this.onClick = null;
    this.items = [];
    this.filterStr = "";
    this.originalLabel = this.filterBox ? this.filterBox.innerHTML : "Filter";
};

rd.ip.Filter.prototype.updateLabel = function(labelText) {
    if (labelText && this.filterBox) {
        if (this.filterBox.innerHTML == this.originalLabel) {
            this.filterBox.innerHTML = labelText;
        }
        this.originalLabel = labelText;
    }
};

rd.ip.Filter.prototype.setVisible = function(visible) {
    if (this.main) {
        this.main.parentElement.style.display = visible ? "block" : "none";
    }
};

rd.ip.Filter.prototype.hide = function() {
    this.setVisible(false);
};

rd.ip.Filter.prototype.show = function() {
    this.setVisible(true);
};

rd.ip.Filter.prototype.toggleVisibility = function() {
	if (this.main) {
	    var visible = (this.main.parentElement.style.display != "none");
	    if (!visible) {
	        rd.ip.core.clearUI();
	        this.populate();
	    }
	    this.setVisible(!visible);
	}
};

rd.ip.Filter.prototype.populate = function() {
	if (this.main && this.filterBox) {
	    var str = "";
	    for (var i in this.items) {
	        if (i != 0) {
	            str += "<br />"
	        }
	        str += this.items[i];
	    }
	    this.main.innerHTML = str;
	    var newHeight = this.filterBox.offsetHeight * this.items.length;
	    this.main.style.height = newHeight + "px";
	    if (this.items.length > 9) {
	        newHeight = this.filterBox.offsetHeight * 9;
	    }
	    this.main.parentElement.style.marginTop = -newHeight + "px";
	    this.main.parentElement.style.height = newHeight + "px";
	}
};

rd.ip.Filter.prototype.clear = function() {
    this.filterStr = "";
    if (this.filterBox) {
        this.filterBox.innerHTML = this.originalLabel;
    }
};

rd.ip.Filter.prototype.handleClick = function(e) {
    try {
        if (this.filterBox) {
            var evt = window.event || e;
            var index = Math.floor(evt.offsetY / 63);

            this.filterStr = this.items[index];
            this.filterBox.innerHTML = this.filterStr;

            this.hide();
            if (this.onClick) {
                this.onClick();
            }
        }

        //stop event bubble up
//        if (evt && evt.stopPropagation) {
//            evt.stopPropagation();
//        }
//        else {
//            evt.cancelBubble = true;
//        }
    }
    catch (err) {
        //nothing to do at this point
    }
};
