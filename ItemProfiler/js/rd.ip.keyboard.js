if (!window['rd']) { window['rd'] = {}; }
if (!window['rd']['ip']) { window['rd']['ip'] = {}; }

rd.ip.Keyboard = function() {
    this.main = document.getElementById(rd.ip.globals.ELEMENT_KEYBOARD);
    this.textbox = document.getElementById(rd.ip.globals.ELEMENT_KEYBOARD_TEXTBOX);
    this.virtualKeyboard = document.getElementById(rd.ip.globals.ELEMENT_VIRTUAL_KEYBOARD);
    if (this.main && this.virtualKeyboard && !rd.ip.globals.VIRTUAL_KEYBOARD_ENABLED) {
        this.virtualKeyboard.style.visibility = "hidden";
        this.main.setAttribute("class", "keyboard-small");
    }
    this.searchStr = "";
    this.onEnter = null;
};

rd.ip.Keyboard.prototype.setVisible = function(visible) {
    if (this.main) {
        this.main.style.display = visible ? "block" : "none";
    }
};

rd.ip.Keyboard.prototype.hide = function() {
    this.setVisible(false);
};

rd.ip.Keyboard.prototype.show = function() {
    this.setVisible(true);
    this.textbox.focus();
};

rd.ip.Keyboard.prototype.clear = function() {
    this.searchStr = "";
    this.textbox.value = "";
};

rd.ip.Keyboard.prototype.handleClick = function(e) {

    try {
        var evt = window.event || e;
        //IE event obj doesn't support e.target. Presume it does e.srcElement
        if (!evt.target) {
            evt.target = evt.srcElement; //extend obj with custom e.target prop
        }
        if (evt.target) {
            var key = evt.target.getAttribute("key");
            if (key) {
                if (key.length == 1) {
                    this.textbox.value += key;
                } else if (key == "BACKSPACE") {
                    if (this.textbox.value.length > 0) {
                        this.textbox.value = this.textbox.value.substr(0, this.textbox.value.length - 1);
                    }
                } else if (key == "ENTER") {
                    this.hide();
                    if (this.onEnter && this.textbox) {
                        this.searchStr = this.textbox.value;
                        this.onEnter();
                    }
                }
            }
        }

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

rd.ip.Keyboard.prototype.handleInputKeyPress = function(e) {

    try {
        var evt = window.event || e;
        //IE event obj doesn't support e.target. Presume it does e.srcElement
        if (!evt.target) {
            evt.target = evt.srcElement; //extend obj with custom e.target prop
        }
        if (evt.target) {
            if (evt.keyCode == 13) {
                this.hide();
                if (this.onEnter && this.textbox) {
                    this.searchStr = this.textbox.value;
                    this.onEnter();
                }
            }
        }
    }
    catch (err) {
        //nothing to do at this point
    }
};
