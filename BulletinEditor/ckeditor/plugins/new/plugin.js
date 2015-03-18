/**
 * Create a new editor document.
 */
CKEDITOR.plugins.add("new", {
    init: function(editor) {
	editor.addCommand("createNew", {
	    exec: function(editor) {
		var self = this,
		    reply;
		
		if (editor.checkDirty()) {
		    reply = window.confirm("You have unsaved changes. Do you still want to create a new Bulletin?");
		
		    if (!reply) {
			return;
		    }
		}
		
		if (typeof(Storage) !== "undefined") {
		    localStorage.clear();
		}
		
		editor.setData("", function() {
		    editor.focus();
		});
		
		editor.fire("new");
	    }
	});

	editor.ui.addButton && editor.ui.addButton("New", {
	    label: "New",
	    command: "createNew",
	    icon : this.path + "images/new.png",
	    toolbar: "document"
	});
	
	editor.on("readOnly", function(evt) {
	    if (evt.editor.readOnly) {
		CKEDITOR.instances.editable.getCommand("createNew").enable();
	    }
	});
    }
});