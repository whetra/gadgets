var svgCanvases = [];

function Item(data, scroller, spacing, scrollDirection, position, isRefreshing) {
    this.canvas = document.createElement("canvas");
    this.canvas.className = "item";
    this.context = this.canvas.getContext("2d");
    this.context.canvas.height = scroller.height;
    
    this.data = data;	//Array of JSON objects representing contents to be drawn for a single item.
    this.index = 0;
    this.width = 0;
    this.writePosition = 0;
    this.scroller = scroller;
    this.spacing = spacing;
    this.scrollDirection = scrollDirection;
    this.isRefreshing = isRefreshing;
    this.dataIndex = 0;
    
    if (typeof position === "undefined") {
	this.position = -1;
    }
    else {
	this.position = position;
    }
}
Item.prototype.getWidth = function() {
    return this.context.canvas.width;
}
Item.prototype.initialize = function(callback) {
    this.callback = callback;
    this.getImage();
}
Item.prototype.getImage = function() {
    var self = this,
	data = this.data[this.dataIndex];
    
    if (data) {
	//Check if there are any images to load.
	if (data.type == "image") {
	    this.index = this.dataIndex;
	    
	    //First check if the image has been cached.
	    if (svgCanvases.length > 0) {
		$.each(svgCanvases, function(index, canvas) {
		    if (canvas.url == data.value) {
			data.svg = svgCanvases[index].canvas;
			return false;
		    }
		});
		
		if (data.svg) {
		    this.width += data.svg.width + this.spacing;
		    this.dataIndex++;
		    this.getImage();
		}
		else {
		    this.loadImage(data.value);
		}
	    }
	    else {
		this.loadImage(data.value);
	    }
	}
	else {	//Text
	    this.createTempText(this.data[this.dataIndex].value, this.data[this.dataIndex].fontRule);
	    this.dataIndex++;
	    this.getImage();
	}
    }
    else {	//All images loaded.
	this.drawCanvas();
    }
}
Item.prototype.loadImage = function(url) {
    var params = {},
	self = this;
	
    //Need to use makeRequest to get around cross-domain issues for loading SVG images.
    params[gadgets.io.RequestParameters.CONTENT_TYPE] = gadgets.io.ContentType.TEXT;
    gadgets.io.makeRequest(url, function(obj) {
	//Save the SVG data.
	if (obj.data) {
	    var data = self.data[self.dataIndex];
	    
	    data.svg = obj.data;
	    self.createTempImage(self.dataIndex, data.svg, data.value);
	}
	
	self.dataIndex++;
	self.getImage();
    }, params);
    
    //Load regular images.
//    var image = new Image();
//    
//    image.onload = function() {
//	callback(this);
//    };
//    image.onerror = function(e) {
//	callback(this);
//    };	
//    image.crossOrigin = 'anonymous'; // no credentials flag
//    image.src = this.logo;
//    this.image = image;
}
//Necessary for getting the width of the image when drawn onto the canvas.
Item.prototype.createTempImage = function(i, svg, url) {
    var svgCanvas = document.createElement("canvas"),	//Canvas on which the SVG image will be drawn.
	svgContext = svgCanvas.getContext("2d"),
	id = "svg";
   
    svgCanvas.id = id;
    svgCanvas.height = this.scroller.height - 10;	//Leave 5px of padding at top and bottom.
    svgCanvas.width = this.scroller.height;		//Necessary in order for scaling to work.

    document.body.appendChild(svgCanvas);
    
    //Draw the image and scale the height to fill the scroller.
    canvg(id, svg, { scaleHeight: true, ignoreDimensions: true });
    
    this.width += svgCanvas.width + this.spacing;
    this.data[i].svg = svgCanvas;
    
    svgCanvases.push({
	"url": url,
	"canvas": svgCanvas
    });

    document.body.removeChild(svgCanvas);
}
Item.prototype.createImage = function(i, svg) {
    //Scale the non-SVG image if necessary.
//    var ratio = 1;
//   
//    if (this.image.height > scroller.height) {
//	ratio = scroller.height / this.image.height;
//    }
//    else if (this.image.width > scroller.width) {
//	ratio = scroller.width / this.image.width;
//    }

    //Draw the image after the text and starting 5px from the top.
    if (this.scrollDirection == "rtl") {
	this.context.drawImage(this.data[i].svg, 0, 0, this.data[i].svg.width, this.data[i].svg.height, this.writePosition, 5, this.data[i].svg.width, this.data[i].svg.height);
	this.writePosition += this.data[i].svg.width + this.spacing;
    }
    else {
	this.context.drawImage(this.data[i].svg, 0, 0, this.data[i].svg.width, this.data[i].svg.height, this.writePosition + this.spacing, 5, this.data[i].svg.width, this.data[i].svg.height);
	this.writePosition += this.data[i].svg.width + this.spacing;
    }
}
/* Text is written to a temporary canvas first so that the width of the text can be determined.
   This is then used to set the width of the actual canvas, which needs to be done before being written to. */
Item.prototype.createTempText = function(value, fontRule) {
    var textCanvas = document.createElement("canvas"),
	textContext = textCanvas.getContext("2d");
	
    this.writeText(value, fontRule, textContext);
    this.width += textContext.measureText(value).width + this.spacing;
}
/* Write the text to the actual canvas. */
Item.prototype.createText = function(value, fontRule) {
    this.writeText(value, fontRule, this.context);
    this.writePosition += this.context.measureText(value).width + this.spacing;
}
Item.prototype.writeText = function(text, fontRule, context) {
    var topOffset = context.canvas.height / 2,	//Y coordinate at which to being drawing (vertical alignment).
	rules, canvasFont;
    
    rules = this.parseCSSRule(fontRule);
    canvasFont = rules[2] + rules[3] + rules[0];

    context.font = canvasFont;
    context.strokeStyle = rules[1];
    context.textAlign = "left";
    context.textBaseline = "middle";
    
    context.save();
    context.translate(0, topOffset);
    
    context.fillStyle = rules[1];
    
    if (this.scrollDirection == "rtl") {
	context.fillText(text, this.writePosition, 0);
    }
    else {	//ltr
	context.fillText(text, this.writePosition + this.spacing, 0);
    }

    context.restore();
}
Item.prototype.drawCanvas = function() {
    var length = this.data.length;
    
    this.context.canvas.width = this.width;
    this.context.canvas.style.display = "none";
    
    //Draw to canvas.
    for (var i = 0; i < length; i++) {
	if (this.data[i].type == "text") {
	    this.createText(this.data[i].value, this.data[i].fontRule);
	}
	else if (this.data[i].type == "image") {
	    if (this.data[i].svg) {
		this.createImage(i, this.data[i].svg);
	    }
	}
    }
    
    this.addCanvas();
    this.callback();
}
Item.prototype.addCanvas = function() {
    if (this.position != -1) {
	var $item = $(".item").eq(this.position);
	
	if ($item.length > 0) {
	    $(this.canvas).insertBefore($item);
	}
	else {	//Add it to the end.
	    document.body.appendChild(this.canvas);
	}
    }
    else {
	document.body.appendChild(this.canvas);
    }
}
Item.prototype.destroy = function() {
    document.body.removeChild(this.canvas);
    this.context = null;
    this.canvas = null;
    this.data = null;
    this.scroller = null;
    this.callback = null;
}
Item.prototype.getFontHeight = function(fontStyle) {
    var body = document.getElementsByTagName("body")[0],
	dummy = document.createElement("div"),
	dummyText = document.createTextNode("M"),
	result;
    
    dummy.setAttribute("style", fontStyle);
    body.appendChild(dummy);
    dummy.appendChild(dummyText);
    
    result = dummy.offsetHeight;
    
    dummy.removeChild(dummyText);
    body.removeChild(dummy);
    
    body = null;
    dummy = null;
    dummyText = null;
    
    return result;
}
//TODO: Find a better way to parse this and make this code common.
Item.prototype.parseCSSRule = function(fontRule) {
    var a = fontRule.indexOf("{"),
	b = fontRule.indexOf("}"),
	selector = fontRule.substring(0, a),
	rules = fontRule.substring(++a, b).split(";"),
	values = [];
    
    //Now remove property name and just keep the value.
    for (var i = 0; i < rules.length; i++) {
	values.push(rules[i].substring(rules[i].indexOf(":", 0) + 1));
    }

    return values;
}