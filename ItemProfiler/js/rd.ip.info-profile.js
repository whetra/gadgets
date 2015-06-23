//use http://closure-compiler.appspot.com for deployment
if (!window['rd']) { window['rd'] = {}; }
if (!window['rd']['ip']) { window['rd']['ip'] = {}; }

rd.ip.infoProfile = {};

rd.ip.infoProfile.init = function() {

    var data = [];

    //firstName
    data[0] = "Rise";
    //lastName
    data[1] = "Display";
    //level 
    data[2] = "";
    //imageUrl
    data[3] = "http://www.risedisplay.com/wp-content/themes/risedisplay/images/logo.png";
    //biography 
    data[4] = "We have been providing digital signage to universities, financial institutions, and businesses across North America for over 15 years.";
    //facts
    data[5] = "Our Complete Display Solutions enable companies to deliver their messages via LED tickers, Digital Signs and Video Walls using our web service, Display Wire. Our approach to providing a Complete Display Solution ensures the displays are installed correctly and have unique attention getting content designed to attract attention.";

    this.profile = new rd.ip.Profile(data);

};

rd.ip.infoProfile.show = function() {
    if (!this.profile) {
        this.init();
    }
    if (this.profile) {
        rd.ip.core.profileDetails.show(this.profile);
    }
};
