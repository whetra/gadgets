var RiseVision = RiseVision || {};
RiseVision.BulletinEditor = {};

RiseVision.BulletinEditor = function() {
    var self = this,
	name = null,
	parent = null,
	folderID = null,
	fileID = null,
	settings = null;
	
    $("#editable").focus();  
    
    this.isNameReadOnly = true;
    this.isWidthReadOnly = true;
    this.isHeightReadOnly = true;
    this.bulletin = new RiseVision.Bulletin({});
    this.setName($("#name").text());
    
    //Attach event handlers.
    CKEDITOR.instances.editable.on("new", function() {
        $("#name").text("Untitled Bulletin");
        $("#readOnlyWidth").text("800");
        $("#readOnlyHeight").text("600");
        self.resizeEditor(800, 600);
	self.setFileID(null);
	self.setName($("#name").text());
    });
    
    CKEDITOR.instances.editable.on("open", function() {
	$("#name").html(self.name);
	
	//Get the resolution of the Bulletin.
	self.bulletin.getResolution(function(width, height) {
	    $("#readOnlyWidth").text(width);
	    $("#readOnlyHeight").text(height);
	    
	    self.resizeEditor(width, height);
	    CKEDITOR.instances.editable.resetDirty();
	    $("#cke_editable").spinner("remove");
	}); 
    });
    
    $(window).on("save", function(evt, success) {
	if (success) {
	    setTimeout(function() {
		$("#saved").fadeOut("slow");
	    }, 10000);
	    
	    $("#error").hide();
	    $("#saved").show();  
	    $("#name").html(self.name);
	    
	    CKEDITOR.instances.editable.resetDirty();
	}
	else {
	    $("#error").text("Unable to save Bulletin to Google Drive. Please try again.").show();
	}
    });
    
    $("#title").on("click", function() {
        var $newName = $("<input type='text' id='newName' />");
        
        if (self.isNameReadOnly) {
            self.isNameReadOnly = false;       
            $newName.val($("#name").text());
                
            $newName.on("blur", function() {    
                self.onNameChanged();
            });
            
            $newName.on("keypress", function(event) {
                if (event.which == 13) {    //Enter
                    self.onNameChanged();
                }
            });
            
            $("#name").after($newName).hide(); 
            $newName.select();
        }
    });
    
    $("#resolution").on("click", function() {
        var $width = $("<input type='text' id='width' />"),
            $height = $("<input type='text' id='height' />");                   
            
        if (self.isWidthReadOnly) {
            self.isWidthReadOnly = false;            
            
            $width.val($("#readOnlyWidth").text());
	    
            $width.on("blur", function() {
                self.onWidthChanged();                
            });
	    
            $width.on("keypress", function(event) {
                if (event.which == 13) {    //Enter
                    self.onWidthChanged();
                    self.onHeightChanged();
                }
            });
            
            $("#readOnlyWidth").after($width).hide(); 
        }
        
        if (self.isHeightReadOnly) {
            self.isHeightReadOnly = false;
            
            $height.val($("#readOnlyHeight").text());
            
            $height.on("blur", function() {
                self.onHeightChanged();                
            });
            
            $height.on("keypress", function(event) {
                if (event.which == 13) {    //Enter
                    self.onHeightChanged();
                    self.onWidthChanged();
                }
            });
            
            $("#readOnlyHeight").after($height).hide();
            $("#width").select();
        }
    });
        
    name = RiseVision.Common.Utility.getQueryParam("name");
    
    //Create a new Bulletin.
    if (name != null) {
	parent = window.opener;
	
	if (parent != null) {	//Could occur if page is refreshed.
	    settings = window.opener.settings;
	
	    if (settings != null) {
		this.setName(name);
		this.bulletin.save("", function(result) {
		    self.bulletin.getFolderID(function() {
			self.bulletin.upload(result, false, function(params) {
			    self.setFolderID(params.folderID);
			    self.setFileID(params.fileID);
			    settings.onBulletinCreated(params);
			});
		    });
		});
	    }
	}
    }
    else {
	//Check if folderID and fileID were passed in as part of the query string (i.e. when opening app from RVA).
	folderID = RiseVision.Common.Utility.getQueryParam("folderID");
	fileID = RiseVision.Common.Utility.getQueryParam("fileID");
    
	if (folderID != null) {
	    this.setFolderID(folderID);
	}
	
	if (fileID != null) {
	    this.setFileID(fileID);
	    this.getBulletin();
	}    
	else if (typeof(Storage) !== "undefined") {
	    //Get last Bulletin that was worked on.
	    this.setFolderID(localStorage.folderID);
	    this.setFileID(localStorage.fileID);
	    
	    if (this.fileID != null) {
		this.getBulletin();
	    }
	}
    }
}
RiseVision.BulletinEditor.prototype.setFolderID = function(folderID) {
    this.folderID = folderID;
    this.bulletin.setFolderID(folderID);
}
RiseVision.BulletinEditor.prototype.setFileID = function(fileID) {
    this.fileID = fileID;
    this.bulletin.setFileID(fileID);
}
RiseVision.BulletinEditor.prototype.setName = function(name) {
    this.name = name;
    this.bulletin.setName(name);
}
//Get Bulletin from Google Drive and show in editor.
RiseVision.BulletinEditor.prototype.getBulletin = function() {
    var self = this,
        request, role;
	
    //Put up a spinner while data loads.
    $("#cke_editable").spinner({
	img: "../Common-Production/spinner/images/spinner.gif",
	width: 100,
	height: 100,
	position: "center"
    });
    
    gapi.client.load("drive", "v2", function() {
        //Get the file from Google Drive.
    	request = gapi.client.drive.files.get({
    	    "fileId": self.fileID
    	});
    	
    	request.execute(function(response) {
	    self.setName(response.title);
    	    self.downloadFile(response, function(body) {
		if (body != null) {
		    role = response.userPermission.role;
		    
		    //Check to see if the user can edit this file.
		    if ((role == "owner") || (role == "writer")) {
			CKEDITOR.instances.editable.setReadOnly(false);
			$("#readOnly").hide();
		    }
		    else {
			CKEDITOR.instances.editable.setReadOnly(true);
			$("#readOnly").show();
		    }
        		    
                    CKEDITOR.instances.editable.setData($(body).html());
        	}
                
		CKEDITOR.instances.editable.fire("open");
    	    });
    	});
    });
}
/**
* Download a file's content.
* https://developers.google.com/drive/v2/reference/files/get
*
* @param {File} file Drive File instance.
* @param {Function} callback Function to call when the request is complete.
*/
RiseVision.BulletinEditor.prototype.downloadFile = function(file, callback) {
    var accessToken, xhr;
   
    if (file.downloadUrl) {
        accessToken = gapi.auth.getToken().access_token;
	xhr = new XMLHttpRequest();
	xhr.open("GET", file.downloadUrl);
	xhr.responseType = "document";
	xhr.setRequestHeader("Authorization", "Bearer " + accessToken);
	
	xhr.onload = function() {
	    callback(this.responseXML.body);
	};
	
	xhr.onerror = function() {
	    callback(null);
	};
	
	xhr.send();
    }
    else {
	callback(null);
    }
}
RiseVision.BulletinEditor.prototype.onNameChanged = function() {
    var newName = $("#newName").val(); 
    
    //Bulletin name cannot be blank.
    if ($.trim(newName) == "") {
	newName = "Untitled Bulletin";
    }
    
    $("#name").text(newName).show();
    $("#newName").remove();

    this.setName(newName);
    this.isNameReadOnly = true; 
}
RiseVision.BulletinEditor.prototype.onWidthChanged = function() {
    var $width = $("#width");
    
    if ($width.val() != $("#readOnlyWidth").text()) {
	this.resizeEditor(parseInt($width.val()), parseInt($("#readOnlyHeight").text()));
	this.bulletin.setWidth($width.val());
    }
    
    $("#readOnlyWidth").text($width.val()).show();
    $width.remove();
    
    this.isWidthReadOnly = true;
}
RiseVision.BulletinEditor.prototype.onHeightChanged = function() {
    var $height = $("#height");
    
    if ($height.val() != $("#readOnlyHeight").text()) {
	this.resizeEditor(parseInt($("#readOnlyWidth").text()), parseInt($height.val()));
	this.bulletin.setHeight($height.val());
    }
    
    $("#readOnlyHeight").text($height.val()).show();
    $height.remove();
    
    this.isHeightReadOnly = true;
}
RiseVision.BulletinEditor.prototype.resizeEditor = function(width, height) {
    CKEDITOR.instances.editable.resize(width, height, true);
}