if (!window['rd']) { window['rd'] = {}; }
if (!window['rd']['ip']) { window['rd']['ip'] = {}; }

rd.ip.FeaturedProfileCard = function() {
    this.card = document.getElementById(rd.ip.globals.ELEMENT_FEATURED_PROFILE_CARD);
    this.name = document.getElementById(rd.ip.globals.ELEMENT_FEATURED_PROFILE_NAME);
    this.level = document.getElementById(rd.ip.globals.ELEMENT_FEATURED_PROFILE_LEVEL);
    this.image = document.getElementById(rd.ip.globals.ELEMENT_FEATURED_PROFILE_IMAGE);
    this.timerId = 0;
    this.interval = isFinite(rd.ip.globals.FEATURED_PROFILES_DURATION) ? 1000 * rd.ip.globals.FEATURED_PROFILES_DURATION : 60000;
    this.currentItemIndex = -1;
    this.currentProfile = null;

    var _this = this;
    if (this.card) { this.card.onclick = function() { _this.handleClick(); }; }
};

rd.ip.FeaturedProfileCard.prototype.draw = function(profile) {
    if (profile) {
        if (this.name) {
            this.name.innerHTML = profile.firstName + " " + profile.lastName;
        }
        if (this.level) {
            this.level.innerHTML = profile.level;
        }
        if (this.image) {
            if (profile.imageState == "loaded") {
                this.image.src = profile.imageUrl;
            } else {
                this.image.src = rd.ip.globals.NO_IMAGE_URL;
            }
        }
    }
};

rd.ip.FeaturedProfileCard.prototype.showNext = function() {
    if (rd.ip.core.featuredProfiles && rd.ip.core.featuredProfiles.length > 0) {
        this.currentItemIndex++;
        if (this.currentItemIndex >= rd.ip.core.featuredProfiles.length) { this.currentItemIndex = 0; }
        this.currentProfile = rd.ip.core.featuredProfiles[this.currentItemIndex];
        this.draw(this.currentProfile);
        this.restartTimer();
    }
};

rd.ip.FeaturedProfileCard.prototype.restart = function() {
    if (rd.ip.globals.FEATURED_PROFILES_ENABLED) {
        this.prepareList();
        this.showNext();
    }
};

rd.ip.FeaturedProfileCard.prototype.restartTimer = function() {
    clearTimeout(this.timerId);
    this.timerId = setTimeout('rd.ip.core.featuredProfileCard.showNext()', this.interval);
};

rd.ip.FeaturedProfileCard.prototype.prepareList = function() {
    rd.ip.core.featuredProfiles = [];
    for (var i in rd.ip.core.profiles) {
        if (rd.ip.core.profiles[i].featured && rd.ip.core.profiles[i].featured.toLowerCase() == "yes") {
            rd.ip.core.featuredProfiles.push(rd.ip.core.profiles[i]);
        }
    }
};

rd.ip.FeaturedProfileCard.prototype.handleClick = function() {
    rd.ip.core.profileDetails.show(this.currentProfile);
};
