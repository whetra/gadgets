if (!window['rd']) { window['rd'] = {}; }
if (!window['rd']['ip']) { window['rd']['ip'] = {}; }

rd.ip.Profile = function(data) {

    this.data = data;

    if (data) {
        if (data.length == 1) { //if only image URL is supplied
            this.imageUrl = data[0];
        } else {
            rd.ip.globals.createProfile(this, data);
        }

        if (rd.ip.core.useProxy) {
            this.imageUrl = rd.ip.globals.IMAGE_PROXY_PATH + escape(this.imageUrl);
        }

        this.image = null;
        this.imageState = ""; //"" or "loaded" or "error"
        this.loadImage();
    }
};

rd.ip.Profile.prototype.loadImage = function() {
    this.image = new Image();

    var _this = this;
    this.image.onload = function() {
        _this.handleImageLoaded();
    }
    this.image.onerror = function() {
        _this.handleImageError();
    }
    this.image.onabort = function() {
        _this.handleImageError();
    }
    this.image.crossOrigin = 'anonymous'; // no credentials flag
    this.image.src = this.imageUrl;
};

rd.ip.Profile.prototype.handleImageLoaded = function() {
    this.imageState = "loaded";
}

rd.ip.Profile.prototype.handleImageError = function() {
    this.imageState = "error";
}
