/* jQuery plugin for styling text */
/* http://www.virgentech.com/blog/2009/10/building-object-oriented-jquery-plugin.html */
(function($) {
	var FontPicker = function(element, options) {
		var $element = $(element), settings = $.extend(true, {}, {
			"i18n-prefix" : "picker",
			"defaults" : {
				"font" : "Arial",
				"font-url" : "",
				"font-size" : "20",
				"is-bold" : false,
				"is-italic" : false,
				"color" : "rgba(0, 0, 0, 1)"
			},
			"visibility" : {
				"font" : true,
				"font-size" : true,
				"variants" : true,
				"color" : true,
				"text" : true
			}
		}, options), currentFont = "", util = RiseVision.Common.Utility;

		/* Private methods */
		var initFonts = function() {
			var $fontURL = $element.find(".font-url"), $text = $element.find(".font-text"), found = false;

			currentFont = $element.find(".font-family").val();

			if (currentFont != null) {
				if (currentFont == "Use Custom Font") {
					util.loadCustomFont(settings["i18n-prefix"], $fontURL.val());
						//Use something else besides i18n-prefix for font-family name?
						$text.css("font-family", settings["i18n-prefix"]);
						$element.find(".font-picker-custom-font").show();
					}
					else {
						//Check if this font exists in the dropdown.
						$element.find(".font-picker-font .bfh-selectbox .bfh-selectbox-options a").each(function(index) {
							if ($(this).text() == currentFont) {
								found = true;
								return false;
							}
						});

						/* Standard font */
						if (found) {
							$text.css("font-family", $element.find(".font-picker-font .bfh-selectbox a[data-option='" + $element.find(".font-family").val() + "']").css("font-family"));
						}
						/* Google font */
						else {
							util.loadGoogleFont(currentFont);
							addGoogleFont(currentFont);
							$text.css("font-family", currentFont);
						}
					}
				}

				$text.css("font-size", $element.find(".font-size").val() + "px");
				$text.css("color", $element.find(".color-picker").val());
			};

			var addGoogleFont = function(fontFamily) {
				var $options = $element.find(".font-picker-font .bfh-selectbox [role=option]");

				//Remove previous Google font, if applicable, and add new one.
				$options.find("li.google-font").remove();
				$options.prepend("<li class='google-font'><a tabindex='-1' href='#' style='font-family: Google' data-option='" + fontFamily + "'>" + fontFamily + "</a></li>");

				//Set Google font as default and sort.
				$element.find(".font-picker-font .bfh-selectbox .bfh-selectbox-option").data("option", fontFamily).html(fontFamily);
				$element.find(".font-picker-font .bfh-selectbox .font-family").val(fontFamily);
				sortFonts();
			};

			var sortFonts = function() {
				/* Don't sort "Use Custom Font" or "More Fonts...". */
				var length = $element.find(".font-picker-font .bfh-selectbox [role=option]" + " li").length, customFont = $element.find(".font-picker-font .bfh-selectbox [role=option]" + " li:nth-last-child(2)"), moreFonts = $element.find(".font-picker-font .bfh-selectbox [role=option]" + " li:last"), sortedFonts = $element.find(".font-picker-font .bfh-selectbox [role=option]" + " li").slice(0, length - 2).sort(function(a, b) {
					var first = $(a).find("a").text(), second = $(b).find("a").text();

					return first == second ? 0 : first < second ? -1 : 1;
				});

				$element.find(".font-picker-font .bfh-selectbox [role=option]").html(sortedFonts).append(customFont).append(moreFonts);
			};

			var init = function() {
				//Generate the markup.
				var $modal = $('<div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">'), 
				$bold = $('<div class="checkbox">'), 
				$italic = $('<div class="checkbox">'), 
				$text = $('<span class="font-text" data-i18n="' + settings["i18n-prefix"] + '.text" />'), 
				bold = settings.defaults["is-bold"] ? 'checked="checked"' : "", 
				italic = settings.defaults["is-italic"] ? 'checked="checked"' : "";

				/* Font Family */
				if (settings.visibility["font"]) {
					$element.find(".font-picker-font").append(
						'<label data-i18n="' + settings["i18n-prefix"] +'.font"></label>' + 
						'<div class="bfh-selectbox">' + 
						'<input class="font-family" type="hidden" value="">' + 
						'<a class="bfh-selectbox-toggle" role="button" data-toggle="bfh-selectbox" href="#">' + 
						'<span class="bfh-selectbox-option bfh-selectbox-large" data-option=""></span>' + 
						'<b class="caret"></b>' + 
						'</a>' + 
						'<div class="bfh-selectbox-options">' + 
						//'<input type="text" class="form-control bfh-selectbox-filter">' + 
						'<div role="listbox">' + 
						'<ul role="option"></ul>' + 
						'</div>' + 
						'</div>' + 
						'</div>' + 
						'</div>');

					/* Google Fonts */
					$modal.append(
						'<div class="modal-dialog">' + 
						'<div class="modal-content">' + 
						'<div class="modal-header no-border">' + 
						'<button type="button" class="close" data-dismiss="modal" aria-hidden="true"><img src="http://s3.amazonaws.com/Common-Production/widget/img/close.png" alt="Close"></button>' +
						'<h2 class="modal-title" data-i18n="' + settings["i18n-prefix"] + '.modal-title"></h2>' + 
						'</div>' +
						'<div class="modal-body">' +
						'<div class="list-group bfh-googlefontlist"></div>' +
						'</div>'+ 
						'<div class="modal-footer no-border">' +
						'<button class="btn btn-primary" type="button" data-dismiss="modal">' +
						'<span class="button-spacer" data-i18n="cancel"></span>' +
						'<i class="fa fa-times-circle size_20"></i>' + 
						'</button>' + 
						'</div>' + 
						'</div>' + 
						'</div>');

					$element.find(".font-picker-font").append($modal);

					/* Custom Font */
					$element.find(".font-picker-custom-font").append(
						'<label data-i18n="' + settings["i18n-prefix"] + '.font-url"></label>' + 
						'<input class="font-url form-control" type="url" data-i18n="[placeholder]' + settings["i18n-prefix"] + '.font-url;" value="' + settings.defaults["font-url"] + '">' + 
						'</div>');
				}

				/* Font Sizes */
				if (settings.visibility["font-size"]) {
					$element.find(".font-picker-size").append('<label data-i18n="'+
						settings["i18n-prefix"] + '.font-size"></label>' +
						'<div class="bfh-selectbox">' +
						'<input class="font-size" type="hidden" value="">' +
						'<a class="bfh-selectbox-toggle" role="button" data-toggle="bfh-selectbox" href="#">' +
						'<span class="bfh-selectbox-option bfh-selectbox-large" data-option=""></span>' +
						'<b class="caret"></b></a>' +
						'<div class="bfh-selectbox-options">' +
						//'<input type="text" class="form-control bfh-selectbox-filter">' +
						'<div role="listbox"><ul role="option"></ul>' +
						'</div></div></div></div>');
				}

				/* Variants */
				if (settings.visibility["variants"]) {
					$bold.append('<label data-i18n="' + settings["i18n-prefix"] + '.bold"></label>' + '<input class="font-bold" type="checkbox"' + bold + '>' + '</div>');
					$italic.append('<label data-i18n="' + settings["i18n-prefix"] + '.italic"></label>' + '<input class="font-italic" type="checkbox"' + italic + '>' + '</div>');

					$element.find(".font-picker-variants").append('<label data-i18n="' + settings["i18n-prefix"] + '.font-variants"></label>').append($('<div>').append($bold).append($italic)).append('</div>');
				}

				/* Color Picker */
				if (settings.visibility["color"]) {
					$element.find(".font-picker-color").append('<label data-i18n="' + settings["i18n-prefix"] + '.color"></label>' + '<input type="text" class="medium color-picker form-control" value="' + settings.defaults.color + '" data-color-format="rgba">' + '</div>');
					$element.find(".color-picker").colorpicker().on("blur changeColor", function(e) {
						var color;

						if (e.type == "blur") {
							color = $(this).val();
						}
						else {
							color = e.color.toHex();
						}

						$element.find(".font-text").css("color", color);
					});
				}

				/* Sample Text */
				if (settings.visibility["text"]) {
					$element.find(".font-picker-text").append($text);
				}

				//Initialize the Bootstrap Form Helpers.
				$element.find(".font-picker-font .bfh-selectbox").bfhfonts({
					"family" : settings.defaults["font"],
					"showCustom" : true,
					"showMore" : true
				});

				$element.find(".font-picker-font .bfh-googlefontlist").bfhgooglefontlist();

				$element.find(".font-picker-size .bfh-selectbox").bfhfontsizes({
					"size" : settings.defaults["font-size"]
				});

				initFonts();

				/* Add event handlers. */
				/* Font Families */
				$element.find(".font-picker-font .bfh-selectbox").bind("change.bfhselectbox", function(e) {
					if (e.target.value == "More Fonts...") {
						$element.find(".font-picker-custom-font").hide();
						$element.find(".modal").modal({
							backdrop : false
						});
					}
					else if (e.target.value == "Use Custom Font") {
						currentFont = $element.find(".font-family").val();

						$element.find(".font-picker-custom-font").show();
						$element.find(".font-url").focus();
						$element.find(".font-picker-font .bfh-selectbox").trigger("customFontSelected");
					}
					else {
						$element.find(".font-text").css("font-family", $element.find(".font-picker-font .bfh-selectbox a[data-option='" + $element.find(".font-family").val() + "']").css("font-family"));
						$element.find(".font-picker-custom-font").hide();
						currentFont = $element.find(".font-family").val();
						$element.find(".font-picker-font .bfh-selectbox").trigger("fontSelected");
					}
				});

				/* Google Fonts */
				$element.find(".bfh-googlefontlist").bind("select", function(e, fontFamily) {
					util.loadGoogleFont(fontFamily);
					addGoogleFont(fontFamily);
					$element.find(".font-text").css("font-family", fontFamily);
					$element.find(".modal").modal("hide");

					currentFont = $element.find(".font-family").val();
				});

				$element.find(".font-picker-font .modal .close").bind("click", function() {
					//No Google font was selected, so revert back to previous selection.
					$element.find(".font-picker-font .bfh-selectbox .bfh-selectbox-option").data("option", currentFont).html(currentFont);
					$element.find(".font-picker-font .bfh-selectbox .font-family").val(currentFont);

					if (currentFont == "Use Custom Font") {
						$element.find(".font-picker-custom-font").show();
					}
				});

				$element.find(".font-url").bind("change", function() {
					//var fontFamily = $(this).attr("id");
					var fontFamily = settings["i18n-prefix"];

					if ($(this).val() != "") {
						util.loadCustomFont(fontFamily, $(this).val());
						$element.find(".font-text").css("font-family", fontFamily);
					}
				});

				/* Font Sizes */
				$element.find(".font-picker-size .bfh-selectbox").bind("change.bfhselectbox", function(e) {
					$element.find(".font-text").css("font-size", $element.find(".font-size").val() + "px");
				});

				/* Bold */
				$element.find(".font-bold").bind("change", function() {
					if ($(this).is(":checked")) {
						$element.find(".font-text").css("font-weight", "bold");
					}
					else {
						$element.find(".font-text").css("font-weight", "normal");
					}
				});

				/* Italic */
				$element.find(".font-italic").bind("change", function() {
					if ($(this).is(":checked")) {
						$element.find(".font-text").css("font-style", "italic");
					}
					else {
						$element.find(".font-text").css("font-style", "normal");
					}
				});

				$element.find(".font-bold").trigger("change");
				$element.find(".font-italic").trigger("change");
			};

			/* Public methods */
			/* Getters */
			this.getFont = function() {
				return $element.find(".font-family").val();
			};

			this.getFontStyle = function() {
				return $element.find("a[data-option='" + $element.find(".font-family").val() + "']").css("font-family");
			};

			this.getFontURL = function() {
				return $element.find(".font-url").val();
			};

			this.getFontSize = function() {
				return $element.find(".font-size").val();
			};

			this.getBold = function() {
				return $element.find(".font-bold").is(":checked");
			};

			this.getItalic = function() {
				return $element.find(".font-italic").is(":checked");
			};

			this.getColor = function() {
				return $element.find(".color-picker").val();
			};

			init();
		};

		$.fn.fontPicker = function(options) {
			return this.each(function() {
				var element = $(this);

				// Return early if this element already has a plugin instance
				if (element.data("font-picker")) {
					return;
				}

				var picker = new FontPicker(this, options);

				// Store plugin object in this element's data
				element.data("font-picker", picker);
			});
		};
	}(jQuery));
