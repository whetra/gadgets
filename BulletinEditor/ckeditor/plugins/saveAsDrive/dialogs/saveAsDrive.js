CKEDITOR.dialog.add("saveAsDialog", function (editor) {
    return {
        title: "Save",
        minWidth: 400,
        minHeight: 200,
	resizable: CKEDITOR.DIALOG_RESIZE_NONE,
	contents: [
            {
                id: "saveAsTab",
                label: "Save As",
                elements: [
                    {
			type: "text",
			id: "name",
			label: "Save As:",
			validate: CKEDITOR.dialog.validate.notEmpty("Save As field cannot be empty.")	//Disable Save button if it is?
		    }
                ]
            }
        ],
	onOk: function() {	    
	    bulletinEditor.setName(this.getValueOf("saveAsTab", "name"));
	    
	    bulletinEditor.bulletin.save(CKEDITOR.instances.editable.getData(), function(result) {
		bulletinEditor.bulletin.getFolderID(function() {
		    bulletinEditor.bulletin.upload(result, false);
		});
            });
	    
//	    bulletinEditor.save(false, function(result) {
//		bulletinEditor.getFolderIDs(function() {
//		    bulletinEditor.upload(result, true, false);
//		});
//            });
	}
    };
});