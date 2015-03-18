CKEDITOR.plugins.add("saveAsDrive", {
    icons: "saveAs",
    init: function(editor) {
        editor.addCommand("saveAsDialog", new CKEDITOR.dialogCommand("saveAsDialog"));
	editor.ui.addButton("SaveAs", {
	    label: "Save As",
	    command: "saveAsDialog",
	    toolbar: "document"
	});
	
	CKEDITOR.dialog.add("saveAsDialog", this.path + "dialogs/saveAsDrive.js");
    }
});