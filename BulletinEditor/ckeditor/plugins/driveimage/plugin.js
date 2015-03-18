/**
 * Allows selection of an image file from Google Drive.
 */
CKEDITOR.plugins.add("driveimage", {   
    init: function(editor) {
	editor.addCommand("showPicker", {
	    exec: function(editor) {
		var view = new google.picker.View(google.picker.ViewId.DOCS_IMAGES), 
		    //view.setMimeTypes("image/png,image/jpeg,image/jpg");
		    //Show Google picker to allow the user to select an image on Google Drive.
		    picker = new google.picker.PickerBuilder()
			.setAppId("726689182011")
			.addView(view)
			.addView(google.picker.ViewId.FOLDERS)
			.setCallback(function(data) {
			    var doc, id;
			    
			    if (data[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
				doc = data[google.picker.Response.DOCUMENTS][0];
				id = doc.id;
				
				var element = CKEDITOR.dom.element.createFromHtml("<img src='http://drive.google.com/uc?export=view&id=" + id + "' />");
				CKEDITOR.instances.editable.insertElement(element);
				//var img = new Image();
				//img.src = "http://drive.google.com/uc?export=view&id=" + id;
				//document.getElementById("editable").appendChild(img);
			    }
			})
			.build();
		    
		picker.setVisible(true);
	    }
	});

	editor.ui.addButton('DriveImage', {
	    label: 'Drive Image',
	    command: 'showPicker',
	    icon : this.path + 'images/monochrome16.png',
	    toolbar: 'insert'
	});
    }
});