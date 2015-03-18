//Get the dimenions of an image that will cause it to scale to fit within a placeholder.
function scaleToFit(settings) {
	var objImage = new Image();	
	
	//Use an Image object in order to get the actual dimensions of the image.				
	objImage.onload = function() {
		var imageWidth, imageHeight, ratioX, ratioY, scale, newWidth, newHeight;
		
		imageWidth = objImage.width;
		imageHeight = objImage.height;

		//Scale down images only. Don't scale up.
		if ((imageWidth > 0) && (imageHeight > 0) && ((imageWidth > settings.rsW) || (imageHeight > settings.rsH))) {
		    //Calculate scale ratios.
		    ratioX = settings.rsW / imageWidth;
		    ratioY = settings.rsH / imageHeight;
		    scale = ratioX < ratioY ? ratioX : ratioY;

		    //Calculate and set new image dimensions.
		    newWidth = parseInt(imageWidth * scale, 10);
		    newHeight = parseInt(imageHeight * scale, 10);
		    
		    //Call the callback function and pass the new dimensions.
		    settings.callback(newWidth, newHeight);
		}
		else {	//Pass the original dimensions unchanged.
		    settings.callback(imageWidth, imageHeight);
		}
	}
	
	//Call the error handler if the image could not be loaded.
	objImage.onerror = function() {
		settings.onerror(objImage);
	}

	objImage.setAttribute("src", settings.url);
}

function loadScrollingScript(swipeEnabled, callback) {
    var js;
    var overscroll = "http://c499672.r72.cf2.rackcdn.com/common/overscroll/jquery.overscroll.js";
    var jScrollPane = "http://c499672.r72.cf2.rackcdn.com/common/jScrollPane/script/jquery.jscrollpane.min.js";
    var jScrollPaneMouseWheel = "http://c499672.r72.cf2.rackcdn.com/common/jScrollPane/script/jquery.mousewheel.js";
    
    //Load the Overscroll library for swiping.
    if (swipeEnabled) {
	js = new Array(overscroll);
    }
    //Load the jScrollPane library for scrolling.
    else {
	js = new Array(jScrollPaneMouseWheel, jScrollPane);
    }
    
    this.loadScripts(js, callback);
}
//To be removed.
function loadScripts(js, callback) {
    var scriptsLoaded = 0;
    var script = null;
    var head = document.getElementsByTagName("head")[0];
    
    //Load JavaScript.
    for (var i = 0; i < js.length; i++) {
	script = document.createElement("script");
	script.type = "text/javascript";
	script.onload = function() {
	    scriptsLoaded++;
	    
	    //When the last script file has loaded, execute the callback function, if applicable.
	    if (scriptsLoaded == js.length) {
		if (callback) {
		    callback();
		}
	    }
	};
	    
	script.src = js[i];
	head.appendChild(script);
    }
}

//Load a custom font.
function loadCustomFont(fontName, fontURL) {
    var fontFace = "@font-face { font-family: " + fontName + "; src: url('" + fontURL +"'); }"
    var css = document.createElement("style");
    
    css.type = "text/css";
    css.appendChild(document.createTextNode(fontFace));
    document.getElementsByTagName("head")[0].appendChild(css);
}

//Check if this is a touch device.
function isTouchDevice() {	
    try {
	document.createEvent("TouchEvent");
	return true;
    }
    catch(e) {
	return false;
    }
}

function loadJS(filename, callback) {
    var fileref = document.createElement("script");
    
    fileref.type = "text/javascript";
    fileref.onload = function() {
	if (callback) {
	    callback();
	}
    };
    fileref.src = filename;
    
    if (typeof fileref != "undefined") {
	document.getElementsByTagName("head")[0].appendChild(fileref);
    }
}

function loadCSS(filename, onLoad) {
    var fileref = document.createElement("link");
    
    fileref.rel = "stylesheet";
    fileref.type = "text/css";
    fileref.href = filename;
    
    if (typeof fileref != "undefined") {
	document.getElementsByTagName("head")[0].appendChild(fileref);
    }
}
function unescapeHTML(html) {
   var htmlNode = document.createElement("div");
   
   htmlNode.innerHTML = html;
   
   if(htmlNode.innerText !== undefined) {
      return htmlNode.innerText; // IE
   }
   
   return htmlNode.textContent;
}