/**
 * Allows selection of a file from Google Drive.
 */

CKEDITOR.plugins.add("open", {
    showPicker : function(editor, view) {
        var picker = new google.picker.PickerBuilder().setAppId("726689182011").setOAuthToken(auth.oauthToken).addView(view).setCallback(function(data) {
            if (data[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
                var doc = data[google.picker.Response.DOCUMENTS][0];

                if ( typeof (Storage) !== "undefined") {
                    localStorage.folderID = doc.parentId;
                    localStorage.fileID = doc.id;
                }

                bulletinEditor.setFolderID(doc.parentId);
                bulletinEditor.setFileID(doc.id);
                bulletinEditor.getBulletin();
            }
        }).build();

        picker.setVisible(true);
    },
    init : function(editor) {
        var self = this;

        editor.addCommand("selectFile", {
            exec : function(editor) {
                var reply, request, view;

                if (editor.checkDirty()) {
                    reply = window.confirm("You have unsaved changes. Do you still want to open an existing Bulletin?");

                    if (!reply) {
                        return;
                    }
                }

                //Try to find the Bulletins folder on Google Drive.
                request = gapi.client.request({
                    "path" : "drive/v2/files",
                    "method" : "GET",
                    "params" : {
                        "q" : "mimeType = 'application/vnd.google-apps.folder' and title = 'Bulletins' and trashed = false"
                    }
                });

                request.execute(function(response) {
                    //This will show the files in the first Bulletins folder, if there is more than one.
                    if (response.items.length > 0) {
                        //    for (var i = 0; i < response.items.length; i++) {
                        //	if (response.items[i].title == "Draft Bulletins") {
                        //	    draftFolderID = response.items[i].id;
                        //	}
                        //	else if (response.items[i].title == "Published Bulletins") {
                        //	    publishedFolderID = response.items[i].id;
                        //	}
                        //    }

                        view = new google.picker.DocsView(google.picker.ViewId.FOLDERS).setParent(response.items[0].id);
                    }
                    else {
                        view = new google.picker.View(google.picker.ViewId.DOCS);
                    }

                    self.showPicker(editor, view.setMimeTypes("text/html"));
                });
            }
        });

        editor.ui.addButton("Open", {
            label : "Open",
            command : "selectFile",
            icon : this.path + "images/open.png",
            toolbar : "document"
        });

        editor.on("readOnly", function(evt) {
            if (evt.editor.readOnly) {
                CKEDITOR.instances.editable.getCommand("selectFile").enable();
            }
        });
    }
});

//var publishedFolderID = "",
//    draftFolderID = "";