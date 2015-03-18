function Item(text) {
    this.canvas = document.createElement("canvas");
    this.canvas.setAttribute('id', 'item');
    this.context = this.canvas.getContext("2d");
    this.text = text;
    
    this.createCanvas();
}
Item.prototype.getWidth = function() {
    return this.context.canvas.width;
}
Item.prototype.createCanvas = function() {
    var textCanvas = document.createElement("canvas"),	//Canvas to which the text is written so that the width of that text can be determined.
	textContext = textCanvas.getContext("2d"),
	width = 0;
    
    //Write the text to textCanvas.
    this.writeText(textContext);
    
    //Width = scaled text width + 10px padding
    width = textContext.measureText(this.text).width + 10;
    
    this.context.canvas.width = width;
    this.context.canvas.height = scroller.height;
    this.context.canvas.style.display = "none";
    
    //Write the text to the properly sized canvas.
    this.writeText(this.context);

    document.body.appendChild(this.canvas);
    
    return this.canvas;
}
Item.prototype.writeText = function(context) {
    var topOffset = context.canvas.height / 2,	//Y coordinate at which to being drawing (vertical alignment).
	rules = "", canvasFont = "";
	
    rules = this.parseCSSRule(document.styleSheets[1].cssRules[1].cssText);	//Issue 1030
    
    //Issue 1030 Start
    if ((rules[3] != null) && (rules[3] != "normal")) {
	canvasFont += rules[3] + " ";
    }
    
    if ((rules[4] != null) && (rules[4] != "normal")) {
	canvasFont += rules[4] + " ";
    }
    
    canvasFont += rules[2] + " " + rules[0];
    //Issue 1030 End
    
    context.font = canvasFont;
    context.strokeStyle = rules[1];
    context.textAlign = 'left';
    context.textBaseline = 'middle';
    
    context.save();
    context.translate(0, topOffset);
    
    context.fillStyle = rules[1];
    context.fillText(this.text, 0, 0);
    
    context.restore();
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
//Find a better way to parse this and make this code common.
Item.prototype.parseCSSRule = function(s) {
    var a = s.indexOf('{'),
	b = s.indexOf('}'),
	selector = s.substring(0, a),
	rules = s.substring(++a, b).split(';'),
	values = [],
	position;
	
    //Now remove property name and just keep the value.
    for (var i = 0; i < rules.length; i++) {
	position = -1;
	
	//Issue 1030 Start - font-weight and font-style can switch positions.
	//Ensure font-weight is always in third position and font-style is in the fourth.
	if (rules[i].indexOf("font-family:", 0) != -1) {
	    position = 0;
	}
	else if (rules[i].indexOf("color:", 0) != -1) {
	    position = 1;
	}
	else if (rules[i].indexOf("font-size:", 0) != -1) {
	    position = 2;
	}
	else if (rules[i].indexOf("font-weight:", 0) != -1) {
	    position = 3;
	}
	else if (rules[i].indexOf("font-style:", 0) != -1) {
	    position = 4;
	}
	
	if (position == -1) {
	    values.push(rules[i].substring(rules[i].indexOf(":", 0) + 1).trim());
	}
	else {
	    values[position] = rules[i].substring(rules[i].indexOf(":", 0) + 1).trim();
	}
	//Issue 1030 End
    }

    return values;
}