if (!window['rd']) { window['rd'] = {}; }
if (!window['rd']['ip']) { window['rd']['ip'] = {}; }

//var _dataUrl_ = './sample_data/test_data.txt';
//var _dataUrl_ = 'https://spreadsheets.google.com/pub?key=0Arv6WxO1Qx5KdDljbFVpVTIwLU5tdThDNGxQVUlqbXc&output=html';
var _dataUrl_ = 'https://docs.google.com/a/risevision.com/spreadsheet/pub?hl=en_US&hl=en_US&key=0Ajdv7xpveuRldHNqTl9yeVhvQjJldWp5U0VFMm0wUFE&single=true&gid=0&output=html';


rd.ip.globals = {};

//FEATURED PROFILES
rd.ip.globals.FEATURED_PROFILES_ENABLED = true;
rd.ip.globals.FEATURED_PROFILES_DURATION = 5; //duration (in seconds) each profile card is shown

rd.ip.globals.ELEMENT_FEATURED_PROFILE_CARD = "featured-profile-card";
rd.ip.globals.ELEMENT_FEATURED_PROFILE_NAME = "featured-profile-name";
rd.ip.globals.ELEMENT_FEATURED_PROFILE_LEVEL = "featured-profile-level";
rd.ip.globals.ELEMENT_FEATURED_PROFILE_IMAGE = "featured-profile-image";

// FLOATING PROFILE
rd.ip.globals.FLOATING_PROFILE_BG_IMAGE_SRC = "./images/bg-profile-floating.gif";

// PROFILE DETAILS
rd.ip.globals.ELEMENT_PROFILE_DETAILS = "profile-details-card";
rd.ip.globals.ELEMENT_PROFILE_DETAILS_PAGE1 = "profile-details-page1";
rd.ip.globals.ELEMENT_PROFILE_DETAILS_PAGE2 = "profile-details-page2";

rd.ip.globals.ELEMENT_PROFILE_DETAILS_NAME = "profile-details-name";
rd.ip.globals.ELEMENT_PROFILE_DETAILS_LEVEL = "profile-details-level";
rd.ip.globals.ELEMENT_PROFILE_DETAILS_IMAGE = "profile-details-image";
rd.ip.globals.ELEMENT_PROFILE_DETAILS_BIOGRAPHY = "profile-details-biography";
rd.ip.globals.ELEMENT_PROFILE_DETAILS_FACTS = "profile-details-facts";

// VIRTUAL KEYBOARD
rd.ip.globals.ELEMENT_KEYBOARD = "keyboard";
rd.ip.globals.ELEMENT_KEYBOARD_TEXTBOX = "keyboard-textbox";

// FILTERS
rd.ip.globals.ELEMENT_FILTER_BOX_1 = "filter-box-1";
rd.ip.globals.ELEMENT_FILTER_LIST_1 = "filter-list-1";
rd.ip.globals.ELEMENT_FILTER_BOX_2 = "filter-box-2";
rd.ip.globals.ELEMENT_FILTER_LIST_2 = "filter-list-2";

// SPREADSHEET DATA
rd.ip.globals.NUMBER_OF_COLUMNS = 9;  //expected  number of columns in spreadsheet

//IMAGE PROXY
rd.ip.globals.USE_IMAGE_PROXY = false;
rd.ip.globals.IMAGE_PROXY_PATH = "http://localhost:9494/?url=";