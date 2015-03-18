/* Javascript used to validate Gadget settings. */
var RiseVision = RiseVision || {};
RiseVision.Common = {};
RiseVision.Common.Settings = {};

RiseVision.Common.Settings = function() {}
RiseVision.Common.Settings.prototype.validateRequired = function ($element, errors, fieldName) {
    //Don't validate element if it's hidden.
    if (!$element.is(":visible")) {
	return false;
    }
    else {
	if (!$.trim($element.val())) {	
	    errors.innerHTML += fieldName + " is a required field.<br />";
	    return true;
	}
	else {
	    return false;
	}
    }
}
RiseVision.Common.Settings.prototype.validateNumeric = function ($element, errors, fieldName) {
    //Don't validate element if it's hidden.
    if (!$element.is(":visible")) {
	return false;
    }
    else {
	if (isNaN($element.val())) {
	    errors.innerHTML += "The " + fieldName + " field must contain only numbers.<br />";
	    return true;
	}
	else {
	    return false;
	}
    }
}