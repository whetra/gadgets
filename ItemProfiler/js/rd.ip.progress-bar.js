if (!window['rd']) { window['rd'] = {}; }
if (!window['rd']['ip']) { window['rd']['ip'] = {}; }

rd.ip.ProgressBar = function(progressBarId) {
    this.percent = 0;
    //this.tick = 1;
    this.canvas = document.getElementById(progressBarId);
    if (this.canvas) {
        this.context = this.canvas.getContext('2d');


    }
};

rd.ip.ProgressBar.prototype.draw = function() {
    if (this.canvas && this.context) {
        var w = this.canvas.width;
        var h = this.canvas.height;
        //background
        this.drawBar(w, h, "Gray");
        //progress
        this.drawBar(w * this.percent / 100, h, "Blue");
        //text
        this.context.fillStyle = "White";
        this.context.font = "18px arial";
        this.context.fillText(Math.round(this.percent) + "%", w / 2, 30);

        if (Math.round(this.percent) >= 100) {
            this.hide();
        }

    }
};

rd.ip.ProgressBar.prototype.drawBar = function(w, h, fillStyle) {
    if (this.canvas && this.context) {
        var r = h/2;
        //draw rounded corners
        this.context.beginPath();
        this.context.moveTo(r, 0);
        this.context.lineTo(w - r, 0);
        this.context.arc(w - r, r, r, Math.PI * 1.5, 0, false);
        this.context.lineTo(w, h - r);
        this.context.arc(w - r, h - r, r, 0, Math.PI * 0.5, false);
        this.context.lineTo(r, h);
        this.context.arc(r, h - r, r, Math.PI * 0.5, Math.PI, false);
        this.context.lineTo(0, r);
        this.context.arc(r, r, r, Math.PI, Math.PI * 1.5, false);

        this.context.fillStyle = fillStyle;
        this.context.fill();
        //this.context.stroke();
    }
};

rd.ip.ProgressBar.prototype.draw2 = function() {
    if (this.canvas && this.context) {
        var w = this.canvas.width;
        var h = this.canvas.height;
        //background
        this.context.fillStyle = "Gray";
        this.context.fillRect(0, 0, w, h);
        //progress
        this.context.fillStyle = "Blue";
        this.context.fillRect(0, 0, w * this.percent / 100, h);
        //text
        this.context.fillStyle = "White";
        this.context.font = "14px arial";
        this.context.fillText(this.percent + "%", w / 2, 30);

    }
};

rd.ip.ProgressBar.prototype.hide = function() {
    if (this.canvas) {
        this.canvas.style.visibility = 'hidden';
    }
};

rd.ip.ProgressBar.prototype.show = function() {
    if (this.canvas) {
        this.canvas.style.visibility = 'visible';
    }
};
