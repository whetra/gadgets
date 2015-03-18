var RiseVision = RiseVision || {};
RiseVision.Bulletin = RiseVision.Bulletin || {};

RiseVision.Bulletin = function(params) {
    this.folderID = params.folderID;
    this.fileID = params.fileID;
    this.widthChanged = false;
    this.heightChanged = false;
    this.defaultWidth = 800;
    this.defaultHeight = 600;
}
RiseVision.Bulletin.prototype.setFolderID = function(folderID) {
    this.folderID = folderID;
}
RiseVision.Bulletin.prototype.setFileID = function(fileID) {
    this.fileID = fileID;
}
RiseVision.Bulletin.prototype.setName = function(name) {
    this.name = name;
}
RiseVision.Bulletin.prototype.setWidth = function(width) {
    this.width = width;
    this.widthChanged = true;
}
RiseVision.Bulletin.prototype.setHeight = function(height) {
    this.height = height;
    this.heightChanged = true;
}
RiseVision.Bulletin.prototype.getFolderID = function(callback) {
    var self = this,
        request = gapi.client.request({
	    "path": "drive/v2/files",
	    "method": "GET",
	    "params": {
		"q":"mimeType = 'application/vnd.google-apps.folder' and title = 'Bulletins' and trashed = false"
	    }
        });
    
    request.execute(function(resp) {
        if (resp.error) {
            console.log(resp.error.message);
        }
        else {
            //This will use the ID of the first Bulletins folder, if there is more than one.
	    if (resp.items.length > 0) {
		self.folderID = resp.items[0].id;
		
		if (typeof(Storage) !== "undefined") {
		    localStorage.folderID = resp.items[0].id;
		}
	    }
        }
        
        if (callback) {
            callback();
        }
    });
}
RiseVision.Bulletin.prototype.save = function(data, callback) {
    var self = this;
    
    this.saveCallback = callback;
    
    window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
    
    //Request persistent file storage.
    window.webkitStorageInfo.requestQuota(PERSISTENT, 1024*1024, function(grantedBytes) {
    	//Request access to the file system.
    	window.requestFileSystem(PERSISTENT, grantedBytes, 
    	    function(fs) { 
    		self.onInitFs(data, fs);
    	    }, 
    	    function(e) { 
    		self.errorHandler(e); 
    	    });
        }, 
        function(e) {
    	    console.log("Error", e);
        }
    );
}
RiseVision.Bulletin.prototype.onInitFs = function(data, fs) {
    var self = this;	
    
    //Read the file to determine whether or not it exists.
    fs.root.getFile("bulletin.html", {}, function(fileEntry) {
    	fileEntry.file(function(file) {
    	    var reader = new FileReader();
    	    
    	    reader.onloadend = function() {
		//File exists. Delete it first and then create it.
		fileEntry.remove(function() {
		    self.createFile(data, fs);
		}, 
		function(e) {	//remove
		    self.errorHandler(e);
		});
    	    };
    	    
    	    reader.readAsText(file);
    	}, 
    	function(e) {	//fileEntry.file
    	    self.errorHandler(e);
    	});
    }, 
    function(e) {	//getFile
    	//File does not exist. Create it.
    	if (e.code == e.NOT_FOUND_ERR) {
    	    self.createFile(data, fs);
    	}
    	else {
    	    self.errorHandler(e);
    	}
    });
}
RiseVision.Bulletin.prototype.createFile = function(data, fs) {
    //Create bulletin.html on the file system if it doesn't already exist.
    var self = this,
	bulletin ='<!DOCTYPE html>\n<html>\n<head>\n<meta charset="utf-8" />\n<title></title>\n' +
	    '<style type="text/css">\nbody {\n-webkit-user-select: none;\n-moz-user-select: none;\n-ms-user-select: none;\n-o-user-select: none;\nuser-select: none;\n}\n</style>\n' +
	    '<script>\nwindow.oncontextmenu = function() {\nreturn false;\n};\n</script>\n' +
	    '</head>\n<body>\n' + data + '</body>\n</html>';
    
    fs.root.getFile("bulletin.html", {create: true}, function(fileEntry) {
	//Create a FileWriter object for our FileEntry.
	fileEntry.createWriter(function(fileWriter) {
	    fileWriter.onwriteend = function(e) {
		//After the file has been written to the file system, read it.
		self.readFile(fileEntry);
	    };
    
	    fileWriter.onerror = function(e) {
		console.log("Write failed: " + e.toString());
	    };
    
	    //Create a new Blob and write it to bulletin.html.
	    var blob = new Blob([bulletin], {type: "text/html"});
	    
	    //fileWriter.truncate(0);	This line is supposed to overwrite the file, but it errors out on the next line.
	    fileWriter.write(blob);
	}, 
	function(e) {
	    self.errorHandler(e);
	});
    }, 
    function(e) {
	self.errorHandler(e);   
    });
}
RiseVision.Bulletin.prototype.readFile = function(fileEntry) {
    var self = this;
    
    //Get a File object representing the file, then use FileReader to read its contents.
    fileEntry.file(function(file) {
	var reader = new FileReader();

	reader.onloadend = function(e) {
	    self.saveCallback(this.result);
	};

	reader.readAsBinaryString(file);
    }, 
    function(e) {
	self.errorHandler(e);
    });
}
RiseVision.Bulletin.prototype.upload = function(result, overwrite, callback) {
    var self = this;
    
    this.uploadCallback = callback;
    
    //Create a public Bulletins folder if one does not already exist.
    if (this.folderID == null) {
        this.createFolder(function(resp) {
            if (!resp.error) {                                
		self.folderID = resp.id;
                
                if (typeof(Storage) !== "undefined") {
                    localStorage.folderID = resp.id;
		}
                
                self.insertFile(result);
            }
            else {
                self.driveErrorHandler(resp);
            }
        });
    }
    else {
        if (overwrite) {
            this.updateFile(result);
        }
        else {
            this.insertFile(result);
        }
    }
}
/* https://developers.google.com/drive/publish-site */
RiseVision.Bulletin.prototype.createFolder = function(callback) {
    var request,
	self = this,
        body = {
            "title": "Bulletins",
            "mimeType": "application/vnd.google-apps.folder"
        };
    
    gapi.client.load("drive", "v2", function() {
    	//Create the folder.
	request = gapi.client.drive.files.insert({
	    "resource": body
	});
    
	request.execute(function(resp) {
            if (!resp.error) {
		var permissionBody = {
		    "value": "",
		    "type": "anyone",
		    "role": "reader"
		};
	
		//Make the folder public.
		var permissionRequest = gapi.client.drive.permissions.insert({
		    "fileId": resp.id,
		    "resource": permissionBody
		});
	
		permissionRequest.execute(function(result) {
		    callback(resp);
		});
            }
            else {
                self.driveErrorHandler(resp);
            }
	});
    });
}
RiseVision.Bulletin.prototype.insertFile = function(result) {
    const boundary = "-------314159265358979323846";
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";
       
    var self = this,
    	contentType = "application/octet-stream",
    	metadata = {
    	    "title": this.name,
    	    "mimeType": "text/html",
    	    "parents": [{
		"kind": "drive#fileLink",
		"id": this.folderID
    	    }]
    	},
    	base64Data = btoa(result),
        callback = function(file) {    	
            if (file.error == null) {                                
		self.fileID = file.id;
                
                if (typeof(Storage) !== "undefined") {
                    localStorage.fileID = file.id;
                }
		
		self.insertResolution();
            }
            else {
		$(window).trigger("save", false);
		self.driveErrorHandler(file);
            }
    	},
        multipartRequestBody,
        request;
    
    multipartRequestBody =
        delimiter +
	"Content-Type: application/json\r\n\r\n" +
	JSON.stringify(metadata) +
	delimiter +
	"Content-Type: " + contentType + "\r\n" +
	"Content-Transfer-Encoding: base64\r\n" +
	"\r\n" +
	base64Data +
	close_delim,
	request = gapi.client.request({
	    "path": "/upload/drive/v2/files",
	    "method": "POST",
	    "params": {"uploadType": "multipart"},
	    "headers": {
		"Content-Type": "multipart/mixed; boundary='" + boundary + "'"
	    },
	    "body": multipartRequestBody
	});    
       
    request.execute(callback);
}
RiseVision.Bulletin.prototype.updateFile = function(result) {
    const boundary = "-------314159265358979323846";
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    var self = this,
	contentType = "application/octet-stream",
	//Updating the metadata is optional and you can instead use the value from drive.files.get.
	metadata = {
	    "title": this.name,
	    "mimeType": "text/html",
	    "parents": [{
		"kind": "drive#fileLink",
		"id": this.folderID
	    }]
	},
	base64Data = btoa(result),
	callback = function(file) {
	    if (file.error == null) {
		if (self.widthChanged || self.heightChanged) {
		    if (self.widthChanged) {
			self.updateWidth();
		    }
		    
		    if (self.heightChanged) {
			self.updateHeight();
		    }
		}
		else {
		    $(window).trigger("save", true);
		}
	    }
	    else {
		$(window).trigger("save", false);
		self.driveErrorHandler(file);
	    }            
	},
	multipartRequestBody,
	request;
    
    multipartRequestBody =
    	delimiter +
	"Content-Type: application/json\r\n\r\n" +
	JSON.stringify(metadata) +
	delimiter +
	"Content-Type: " + contentType + "\r\n" +
	"Content-Transfer-Encoding: base64\r\n" +
	"\r\n" +
	base64Data +
	close_delim,
    request = gapi.client.request({
	"path": "/upload/drive/v2/files/" + this.fileID,
	"method": "PUT",
	"params": {"uploadType": "multipart", "alt": "json"},
	"headers": {
	    "Content-Type": "multipart/mixed; boundary='" + boundary + "'"
	},
	"body": multipartRequestBody
    });
    
    request.execute(callback);
}
/**
 * Get the resolution of the Bulletin or use the default resolution if an error occurs.
 */
RiseVision.Bulletin.prototype.getResolution = function(callback) {
    var self = this;
    
    this.getProperty("width", function(resp) {
	if (!resp.error) {
	    if (resp.value == null) {
		self.width = self.defaultWidth;
	    }
	    else {
		self.width = parseInt(resp.value);
	    }
	}
	else {
	    self.width = self.defaultWidth;
            self.driveErrorHandler(resp);
        }
	
	self.getProperty("height", function(heightResp) {
	    if (!heightResp.error) {
		if (heightResp.value == null) {
		    self.height = self.defaultHeight;
		}
		else {
		    self.height = parseInt(heightResp.value);
		}
	    }
	    else {
		self.height = self.defaultHeight;
		self.driveErrorHandler(heightResp);
	    }
	    
	    callback(self.width, self.height);
	});
    });
}
RiseVision.Bulletin.prototype.insertResolution = function() {
    var self = this,
	width, height;
	
    if (this.width == null) {
	width = this.defaultWidth;
    }
    else {
	width = this.width;
    }
    
    if (this.height == null) {
	height = this.defaultHeight;
    }
    else {
	height = this.height;
    }
    
    this.insertProperty("width", width, function(resp) {
	if (!resp.error) {
	    self.widthChanged = false;
	    
	    self.insertProperty("height", height, function(heightResp) {
		if (!heightResp.error) {
		    self.heightChanged = false;
		    $(window).trigger("save", true);
		}
		else {
		    self.driveErrorHandler(heightResp);
		    $(window).trigger("save", false);
		}
		
		if (self.uploadCallback != null) {
		    self.uploadCallback({
			"folderID": self.folderID,
			"fileID": self.fileID,
			"width": width,
			"height": height
		    });
		}
	    });
	}
	else {
            self.driveErrorHandler(resp);
	    $(window).trigger("save", false);
	    
	    if (self.uploadCallback != null) {
		self.uploadCallback({
		    "folderID": self.folderID,
		    "fileID": self.fileID,
		    "width": width,
		    "height": height
		});
	    }
        }
    });
}
RiseVision.Bulletin.prototype.updateWidth = function() {
    var self = this;
    
    this.updateProperty("width", this.width, function(resp) {
	if (!resp.error) {
	    self.widthChanged = false;
	    
	    if (!self.heightChanged) {
		$(window).trigger("save", true);
	    }
	}
	else {
            self.driveErrorHandler(resp);
	    
	    if (!self.heightChanged) {
		$(window).trigger("save", false);
	    }
        }
    });
}
RiseVision.Bulletin.prototype.updateHeight = function() {
    var self = this;
    
    this.updateProperty("height", this.height, function(heightResp) {
	if (!heightResp.error) {
	    self.heightChanged = false;
	    $(window).trigger("save", true);
	}
	else {
	    self.driveErrorHandler(heightResp);
	    $(window).trigger("save", false);
	}
    });
}
//Get a custom file property.
RiseVision.Bulletin.prototype.getProperty = function(key, callback) {
    var self = this;
    
    gapi.client.load("drive", "v2", function() {
	var request = gapi.client.drive.properties.get({
		"fileId": self.fileID,
		"propertyKey": key,
		"visibility": "PUBLIC"
	    });
	
	request.execute(function(resp) {
	    callback(resp);
	});
    });
}
//Insert a new custom file property.
RiseVision.Bulletin.prototype.insertProperty = function(key, value, callback) {
    var self = this;
    
    gapi.client.load("drive", "v2", function() {
	var body = {
		"key": key,
		"value": value,
		"visibility": "PUBLIC"
	    },
	    request = gapi.client.drive.properties.insert({
		"fileId": self.fileID,
		"resource": body
	    });
	
	request.execute(function(resp) {
	    callback(resp);
	});
    });
}
//Patch a custom property's value.
RiseVision.Bulletin.prototype.updateProperty = function(key, newValue, callback) {
    var self = this;
    
    gapi.client.load("drive", "v2", function() {
	var body = {"value": newValue},
	    request = gapi.client.drive.properties.patch({
		"fileId": self.fileID,
		"propertyKey": key,
		"visibility": "PUBLIC",
		"resource": body
	    });
	    
	request.execute(function(resp) {
	    callback(resp);
	});
    });
}
RiseVision.Bulletin.prototype.driveErrorHandler = function(resp) {
    console.log('Error code: ' + resp.error.code);
    console.log('Error message: ' + resp.error.message);
}
RiseVision.Bulletin.prototype.errorHandler = function(e) {
    var msg = "";
	 
    switch (e.code) {
    	case FileError.QUOTA_EXCEEDED_ERR:
    	    msg = "QUOTA_EXCEEDED_ERR";
    	    break;
    	case FileError.NOT_FOUND_ERR:
    	    msg = "NOT_FOUND_ERR";
    	    break;
    	case FileError.SECURITY_ERR:
    	    msg = "SECURITY_ERR";
    	    break;
    	case FileError.INVALID_MODIFICATION_ERR:
    	    msg = "INVALID_MODIFICATION_ERR";
    	    break;
    	case FileError.INVALID_STATE_ERR:
    	    msg = "INVALID_STATE_ERR";
    	    break;
    	default:
    	    msg = "Unknown Error";
    	    break;
    };
       
    console.log("Error: " + msg);
}