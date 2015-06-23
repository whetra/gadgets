if (!window['rd']) { window['rd'] = {}; }
if (!window['rd']['ip']) { window['rd']['ip'] = {}; }

var effectiveFPMS = 60 / 1000;


// ******************************************
//  static object rd.ip.floatingProfileCard
// ******************************************

rd.ip.floatingProfileCard = {};
rd.ip.floatingProfileCard.currentProfileIndex = 0;
rd.ip.floatingProfileCard.texturePool = []; //pool of active textures
rd.ip.floatingProfileCard.canvas = null; //reuse the same canvas for rendering profiles
rd.ip.floatingProfileCard.context = null; //reuse the same context for rendering profiles

rd.ip.floatingProfileCard.renderTexture = function(profile, texture) {
    if (profile === null || texture === null) {
        return;
    }

    var w = 512; // have to be the power of two
    var h = 256; // have to be the power of two


    if (!this.canvas) {
        this.canvas = document.createElement('canvas');
        this.canvas.width = w;
        this.canvas.height = h;
        this.context = this.canvas.getContext('2d');
    }

    this.context.fillStyle = "rgba(255,0,0, 0)";
    this.context.fillRect(0, 0, w, h); //clear it
    this.context.drawImage(rd.ip.core.floatingProfileBgImg, 0, 0, w, 170);

    var imageHeight = 150;
    var imageWidth = 120;

    //draw first name last name
    var textCenterPos = (w - imageWidth - 10) / 2;
    this.context.fillStyle = rd.ip.globals.FLOATING_PROFILE_NAME_STYLE_COLOR ? rd.ip.globals.FLOATING_PROFILE_NAME_STYLE_COLOR : "#13487E";
    this.context.font = rd.ip.globals.FLOATING_PROFILE_NAME_STYLE_FONT ? rd.ip.globals.FLOATING_PROFILE_NAME_STYLE_FONT : "24px arial";
    this.context.textAlign = "center";
    this.context.fillText(profile.firstName + " " + profile.lastName, textCenterPos, 40, textCenterPos * 2 - 20);

    //profile level
    this.context.fillStyle = rd.ip.globals.FLOATING_PROFILE_LEVEL_STYLE_COLOR ? rd.ip.globals.FLOATING_PROFILE_LEVEL_STYLE_COLOR : "#13487E";
    this.context.font = rd.ip.globals.FLOATING_PROFILE_LEVEL_STYLE_FONT ? rd.ip.globals.FLOATING_PROFILE_LEVEL_STYLE_FONT : "16px arial";
    var lineHeight = rd.ip.globals.FLOATING_PROFILE_LEVEL_LINE_HEIGHT ? rd.ip.globals.FLOATING_PROFILE_LEVEL_LINE_HEIGHT : 16;
    var textLines = rd.ip.core.splitMultilineText(profile.level);
    for (var row = 0; row < textLines.length; row++) {
        this.context.fillText(textLines[row], textCenterPos, 70 + row * lineHeight, textCenterPos * 2 - 20);
    }

    //draw image
    var profileImage = null;
    if (profile.imageState == "loaded") {
        profileImage = profile.image;
    } else if (rd.ip.core.noImageProfile && rd.ip.core.noImageProfile.imageState == "loaded") {
        profileImage = rd.ip.core.noImageProfile.image;
    }
    if (profileImage) {
        this.context.drawImage(profileImage, w - imageWidth - 20, 10, imageWidth, imageHeight);
    }

    //copy canvas to texture
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.canvas); //very expensive call (transfer ~1MB of data to video buffer)
    gl.bindTexture(gl.TEXTURE_2D, null);
};

rd.ip.floatingProfileCard.getNextProfile = function(card, direction) {
    var res = null;

    this.currentProfileIndex += direction;
    if (this.currentProfileIndex < 0) {
        this.currentProfileIndex = rd.ip.core.filteredProfiles.length - 1;
    } else if (this.currentProfileIndex >= rd.ip.core.filteredProfiles.length) {
        this.currentProfileIndex = 0;
    }
    if (rd.ip.core.filteredProfiles.length > 0) {
        res = rd.ip.core.filteredProfiles[this.currentProfileIndex];
    }

    if (res !== null) {
        this.renderTexture(res, card.texture);
    }

    return res;
}

rd.ip.floatingProfileCard.initTexturePool = function() {
    if (this.texturePool.length === 0) {
        for (var i = 0; i < rd.ip.globals.MAX_ACTIVE_CARDS; i++) {
            this.texturePool.push(new rd.ip.TexturePoolItem());
        }
    }
}

rd.ip.floatingProfileCard.clearTexturePool = function() {
    for (var i in this.texturePool) {
        this.texturePool[i].isUsed = false;
    }
}

rd.ip.floatingProfileCard.releaseTexture = function(texture) {
    if (texture !== null) {
        for (var i in this.texturePool) {
            if (this.texturePool[i].texture === texture) {
                this.texturePool[i].isUsed = false;
                break;
            }
        }
    }
}

rd.ip.floatingProfileCard.acquireTexture = function() {
    for (var i in this.texturePool) {
        if (!this.texturePool[i].isUsed) {
            this.texturePool[i].isUsed = true;
            return this.texturePool[i].texture;
        }
    }

    return null; //this should never happen
}


// **********************************
//  class rd.ip.TexturePoolItem
// **********************************

rd.ip.TexturePoolItem = function() {
    this.isUsed = false;
    this.texture = gl.createTexture();

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);

    //gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    gl.bindTexture(gl.TEXTURE_2D, null);
};

// **********************************
//  class rd.ip.FloatingProfileCard
// **********************************

rd.ip.FloatingProfileCard = function() {
    this.x = Math.random() * rd.ip.globals.SCENE_WIDTH; //this is the center of the shape, not left position
    this.y = Math.random() * rd.ip.globals.SCENE_HEIGHT; //this is the center of the shape, not bottom position
    this.z = minZoom + Math.random() * (maxZoom - minZoom);
    this.imageid = Math.random();
    this.profile = null;
    this.texture = rd.ip.floatingProfileCard.acquireTexture();
};

rd.ip.FloatingProfileCard.prototype.draw = function() {
    mvPushMatrix();

    mat4.translate(mvMatrix, [this.x, this.y, this.z]);

    // Draw the card in its main color
    var alpha = 1.0;
    if ((maxZoom - this.z) < 2.0) {
        alpha = (maxZoom - this.z) / 2;
    } else if ((this.z - minZoom) < 2.0) {
        alpha = (this.z - minZoom) / 2;
    }
    gl.uniform1f(shaderProgram.colorUniform, alpha);
    //gl.uniform3f(shaderProgram.colorUniform, this.r, this.g, this.b);
    this.drawCard();

    mvPopMatrix();
};

rd.ip.FloatingProfileCard.prototype.drawCard = function() {
    if (this.profile) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        gl.uniform1i(shaderProgram.samplerUniform, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, cardVertexTextureCoordBuffer);
        gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, cardVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, cardVertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cardVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        setMatrixUniforms();
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, cardVertexPositionBuffer.numItems);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }
}

rd.ip.FloatingProfileCard.prototype.animate = function(index, elapsedTime) {
    //this.angle += this.rotationSpeed * effectiveFPMS * elapsedTime;

    this.z += 0.03 * zoomDirection;
    if (zoomDirection > 0) {
        if (this.z > maxZoom) {
            this.x = Math.random() * rd.ip.globals.SCENE_WIDTH;
            this.y = Math.random() * rd.ip.globals.SCENE_HEIGHT;
            this.z = minZoom;
            this.profile = rd.ip.floatingProfileCard.getNextProfile(this, 1);
            //move this element to beginnig of the array because rendering order is important
            rd.ip.core.activeCards.splice(index, 1); //remove from curent position
            //rd.ip.core.activeCards.splice(0, 0, this); //insert at 0 position
            rd.ip.core.activeCards.splice(0, 0, this); //insert at 0 position
        }
    } else {
        if (this.z < minZoom) {
            this.x = Math.random() * rd.ip.globals.SCENE_WIDTH;
            this.y = Math.random() * rd.ip.globals.SCENE_HEIGHT;
            this.z = maxZoom;
            this.profile = rd.ip.floatingProfileCard.getNextProfile(this, - 1);
            //move this element to beginnig of the array because rendering order is important
            rd.ip.core.activeCards.splice(index, 1); //remove from curent position
            rd.ip.core.activeCards.splice(rd.ip.core.activeCards.length, 0, this); //insert at last position
        }
    }
};

rd.ip.FloatingProfileCard.prototype.scroll = function() {
    if (this.x >= rd.ip.globals.SCENE_WIDTH)
        this.x -= rd.ip.globals.SCENE_WIDTH;
    else
        this.x += rd.ip.globals.SCENE_WIDTH;

    if (zoomDirection > 0) {
        this.profile = rd.ip.floatingProfileCard.getNextProfile(this, 1);
    } else {
        this.profile = rd.ip.floatingProfileCard.getNextProfile(this, -1);
    }
};
