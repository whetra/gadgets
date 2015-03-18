CKEDITOR.plugins.add("saveDrive", {
    init: function(editor) {
	var self = this;
	
	editor.addCommand("save", {
	    exec: function(editor) {		
		if (bulletinEditor.fileID == null) {
		    if (bulletinEditor.name == "Untitled Bulletin") {
			//Trigger Save As toolbar functionality if user has not renamed Bulletin from default name.
			CKEDITOR.instances.editable.getCommand("saveAsDialog").exec();
		    }
		    else {
			bulletinEditor.bulletin.save(CKEDITOR.instances.editable.getData(), function(result) {
			    bulletinEditor.bulletin.getFolderID(function() {
				bulletinEditor.bulletin.upload(result, false);
			    });
			});
		    }
		}
		else {
		    bulletinEditor.bulletin.save(CKEDITOR.instances.editable.getData(), function(result) {
			bulletinEditor.bulletin.upload(result, true);
		    });
		    //bulletinEditor.save(true, function(result) {
		    //    bulletinEditor.upload(result, true, true);
		    //});
		}		
	    }
	});
	
	editor.ui.addButton("Save", {
	    label: "Save",
	    command: "save",
	    icon : this.path + "images/save.png",
	    toolbar: "document"
	});
	
	//editor.on("open", function() {
	//    CKEDITOR.instances.editable.getCommand("save").refresh(this, self.path);
	//});
	//
	//editor.on("save", function() {
	//    CKEDITOR.instances.editable.getCommand("save").refresh(this, self.path);
	//});
    }
});