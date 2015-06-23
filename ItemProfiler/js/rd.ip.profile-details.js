if (!window['rd']) { window['rd'] = {}; }
if (!window['rd']['ip']) { window['rd']['ip'] = {}; }

rd.ip.ProfileDetails = function() {
    
    this.main = document.getElementById(rd.ip.globals.ELEMENT_PROFILE_DETAILS);
    this.page1 = document.getElementById(rd.ip.globals.ELEMENT_PROFILE_DETAILS_PAGE1);
    this.page2 = document.getElementById(rd.ip.globals.ELEMENT_PROFILE_DETAILS_PAGE2);

    this.name = document.getElementById(rd.ip.globals.ELEMENT_PROFILE_DETAILS_NAME);
    this.level = document.getElementById(rd.ip.globals.ELEMENT_PROFILE_DETAILS_LEVEL);
    this.image = document.getElementById(rd.ip.globals.ELEMENT_PROFILE_DETAILS_IMAGE);
    this.biography = document.getElementById(rd.ip.globals.ELEMENT_PROFILE_DETAILS_BIOGRAPHY);
    this.facts = document.getElementById(rd.ip.globals.ELEMENT_PROFILE_DETAILS_FACTS);    
};

rd.ip.ProfileDetails.prototype.draw = function(profile) {
    if (profile) {
        if (this.name) {
            this.name.innerHTML = profile.firstName + " " + profile.lastName;
        }
        if (this.level) {
            this.level.innerHTML = profile.level;
        }
        if (this.biography) {
            this.biography.innerHTML = profile.biography;
        }
        if (this.facts) {
            this.facts.innerHTML = profile.facts;
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

rd.ip.ProfileDetails.prototype.setVisible = function(visible) {
    if (this.main) {
        this.main.style.display = visible ? "block" : "none";
    }
}

rd.ip.ProfileDetails.prototype.hide = function() {
    var event;
    
    if (this.main.style.display == "block") {
        this.setVisible(false);
        
        //Issue 916 Start - In order to prevent misfiring of mouse events on Linux when the card is closed,
        //remove the canvas mouse event handlers.
        document.getElementById("my-canvas").onmousedown = "";
        document.getElementById("my-canvas").onmouseup = "";
        document.getElementById("my-canvas").onmousemove = "";
        
        //Fire custom event to let the canvas know that the card has been closed.
        event = new CustomEvent("onCardClosed");
        document.getElementById("my-canvas").dispatchEvent(event);
        //Issue 916 End
    }
};

rd.ip.ProfileDetails.prototype.show = function(profile) {
    rd.ip.core.clearUI();
    if (profile) {
        this.draw(profile);
        this.setVisible(true);
        this.showPage(1);
    }
};

rd.ip.ProfileDetails.prototype.showPage = function(pageNum) {
    //use style.visibility instead of style.display to prevent Chrome from crashing
    if (this.page1 && this.page2) {
        // pageNum == -1 means next page
        if (pageNum == -1) {
            pageNum = (this.page1.style.visibility == "hidden") ? 1 : 2;
        }

        if (pageNum == 2) {
            this.page1.style.visibility = "hidden";
            this.page2.style.visibility = "visible";
        } else {
            this.page2.style.visibility = "hidden";
            this.page1.style.visibility = "visible";
        }
    }
};
