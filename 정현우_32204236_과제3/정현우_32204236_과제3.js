var gl;
var canvas;
var points = [];
var normals = [];
var texCoords = [];
var program;

// x, y, z 회전 시 사용하는 변수
var theta = [0, 0, 0];
var thetaLoc;
// 이동 시 사용하는 변수
var d = [0, 0, 0];
var dLoc;
// scailing 시 사용하는 변수
var u = [1, 1, 1];
var uLoc;
// 모델-뷰 행렬, 투영 행렬
var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;
// lookAt() 관련 변수
var eye;
var radius = 4.0;
var theta2 = 0.0;
var phi = 0.0;
// perspective() 관련 변수
var fovy = 45;
var aspect = 1.0;
var near = 0.01;
var far = 5;
// 그림자 그릴 경우 1, 피라미드 그리면 0
var q;
// lighting, shading 관련 변수
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );
var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );
var materialShininess = 20.0;
var ambientLoc, diffuseLoc, specularLoc, shininessLoc, lightLoc;
var normalMatrix, normalMatrixLoc;
var ambientProduct, diffuseProduct, specularProduct;
var light = vec4(0.0, 2.0, 0.0, 0.0);
var m = mat4();
m[3][3] = 0;
m[3][1] = -1/light[1];
// 텍스처 관련 변수
var texSize = 64;
var numChecks = 32;
var image1, image2;
// 텍스처 선택
var choice = 0;
var choiceLoc;

// 삼각형을 그리는 방식으로 피라미드 그리는 함수
function pyramid() { 
    triangle(1, 2, 0);
    triangle(2, 1, 3);
    triangle(3, 1, 4);
    triangle(2, 3, 4);
    triangle(0, 2, 4);
    triangle(1, 0, 4);
}

// 삼각형 그리는 함수
function triangle(a, b, c) { 
    var vertices = [                    // 정점 배열
        vec4( 0.5,  -0.3, 0.5, 1.0 ),   // 0
        vec4( 0.5, -0.3, -0.5, 1.0 ),   // 1
        vec4( -0.5, -0.3,  0.5, 1.0 ),  // 2
        vec4( -0.5, -0.3, -0.5, 1.0 ),  // 3
        vec4( 0, 0.4, 0, 1.0)           // 4
    ]; 

    var texCoord = [
        vec2(0, 0),
        vec2(0, 1),
        vec2(Math.sqrt(0.74), 0.5)
    ];
    var texCoord2 = [
        vec2(0, 0),
        vec2(0, 1),
        vec2(0.5, 0.5)
    ];

    points.push(vertices[a]);     
    points.push(vertices[b]);
    points.push(vertices[c]);

    normals.push(vertices[a][0], vertices[a][1], vertices[a][2], 0.0);
    normals.push(vertices[b][0], vertices[b][1], vertices[b][2], 0.0);
    normals.push(vertices[c][0], vertices[c][1], vertices[c][2], 0.0);

    if( a != 4 && b != 4 && c != 4) {
        texCoords.push(texCoord2[0]);
        texCoords.push(texCoord2[1]);
        texCoords.push(texCoord2[2]);
    }
    else{
        texCoords.push(texCoord[0]);
        texCoords.push(texCoord[1]);
        texCoords.push(texCoord[2]);
    }
}

function configureTexture() {
    var texture = gl.createTexture();
    gl.activeTexture( gl.TEXTURE0 );
    gl.bindTexture( gl.TEXTURE_2D, texture );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, image2);
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
    gl.uniform1i(gl.getUniformLocation( program, "texture"), 0);

    if ( choice != 0 ) {
        var texture2 = gl.createTexture();
        gl.activeTexture( gl.TEXTURE1 );
        gl.bindTexture( gl.TEXTURE_2D, texture2 );
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, image1);
        gl.generateMipmap( gl.TEXTURE_2D );
        gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR );
        gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.uniform1i(gl.getUniformLocation( program, "texture2"), 1);
    }
}



window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    pyramid();

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1, 1, 1, 1 );

    gl.enable(gl.DEPTH_TEST)
    
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    

    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW );

    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal );
    

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    var tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW );

    var vTexCoord = gl.getAttribLocation( program, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);


    thetaLoc = gl.getUniformLocation(program, "theta");
    dLoc = gl.getUniformLocation(program, "d");
    uLoc = gl.getUniformLocation(program, "u");
    q = gl.getUniformLocation(program, "q");
    ambientLoc = gl.getUniformLocation(program, "ambientProduct");
    diffuseLoc = gl.getUniformLocation(program, "diffuseProduct");
    specularLoc = gl.getUniformLocation(program, "specularProduct");
    shininessLoc = gl.getUniformLocation(program, "shininess");
    normalMatrixLoc = gl.getUniformLocation(program, "normalMatrix");
    lightLoc = gl.getUniformLocation(program, "lightPosition");
    choiceLoc = gl.getUniformLocation(program, "choice");



    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );
    
    // x, y, z 회전
    document.getElementById("xthetaSlider").onchange = function(event) {
        theta[0] = event.target.value;
    };
    document.getElementById("ythetaSlider").onchange = function(event) {
        theta[1] = event.target.value;
    };
    document.getElementById("zthetaSlider").onchange = function(event) {
        theta[2] = event.target.value;
    };

    // 이동
    document.getElementById("xtranslation").onchange = function(event) {
        d[0] = event.target.value;
    };
    document.getElementById("ytranslation").onchange = function(event) {
        d[1] = event.target.value;
    };
    document.getElementById("ztranslation").onchange = function(event) {
        d[2] = event.target.value;
    };

    // scailing
    document.getElementById("xScaling").onchange = function(event) {
        u[0] = event.target.value;
    };
    document.getElementById("yScaling").onchange = function(event) {
        u[1] = event.target.value;
    };
    document.getElementById("zScaling").onchange = function(event) {
        u[2] = event.target.value; 
    };

    // lookAt()의 eye 설정용
    document.getElementById("theta2").onchange = function(event) {
        theta2 = event.target.value * Math.PI / 180.0;
    };
    document.getElementById("phi").onchange = function(event) {
        phi = event.target.value * Math.PI / 180.0;
    };
    document.getElementById("radius").onchange = function(event) {
        radius = event.target.value; 
    };

    //perspective() 설정용
    document.getElementById("fovy").onchange = function(event) {
        fovy = event.target.value;
    };
    document.getElementById("aspect").onchange = function(event) {
        aspect = event.target.value; 
    };
    document.getElementById("near").onchange = function(event) {
        near = event.target.value; 
    };
    document.getElementById("far").onchange = function(event) {
        far = event.target.value; 
    };
    // light
    document.getElementById("lightX").onchange = function(event) {
        light[0] = event.target.value; 
    };
    document.getElementById("lightY").onchange = function(event) {
        light[1] = event.target.value; 
    };
    document.getElementById("lightZ").onchange = function(event) {
        light[2] = event.target.value; 
    };
    document.getElementById("lightAR").onchange = function(event) {
        lightAmbient[0] = event.target.value; 
    };
    document.getElementById("lightAG").onchange = function(event) {
        lightAmbient[1] = event.target.value; 
    };
    document.getElementById("lightAB").onchange = function(event) {
        lightAmbient[2] = event.target.value; 
    };
    document.getElementById("lightDR").onchange = function(event) {
        lightDiffuse[0] = event.target.value; 
    };
    document.getElementById("lightDG").onchange = function(event) {
        lightDiffuse[1] = event.target.value; 
    };
    document.getElementById("lightDB").onchange = function(event) {
        lightDiffuse[2] = event.target.value; 
    };
    document.getElementById("lightSR").onchange = function(event) {
        lightSpecular[0] = event.target.value; 
    };
    document.getElementById("lightSG").onchange = function(event) {
        lightSpecular[1] = event.target.value; 
    };
    document.getElementById("lightSB").onchange = function(event) {
        lightSpecular[2] = event.target.value; 
    };
    document.getElementById("materialAR").onchange = function(event) {
        materialAmbient[0] = event.target.value; 
    };
    document.getElementById("materialAG").onchange = function(event) {
        materialAmbient[1] = event.target.value; 
    };
    document.getElementById("materialAB").onchange = function(event) {
        materialAmbient[2] = event.target.value; 
    };
    document.getElementById("materialDR").onchange = function(event) {
        materialDiffuse[0] = event.target.value; 
    };
    document.getElementById("materialDG").onchange = function(event) {
        materialDiffuse[1] = event.target.value; 
    };
    document.getElementById("materialDB").onchange = function(event) {
        materialDiffuse[2] = event.target.value; 
    };
    document.getElementById("materialSR").onchange = function(event) {
        materialSpecular[0] = event.target.value; 
    };
    document.getElementById("materialSG").onchange = function(event) {
        materialSpecular[1] = event.target.value; 
    };
    document.getElementById("materialSB").onchange = function(event) {
        materialSpecular[2] = event.target.value; 
    };

    document.getElementById("shininess").onchange = function(event) {
        materialShininess = event.target.value; 
    };
    // texture
    document.getElementById("texInc").onclick = function(event) {
        if ( choice === 0 ) {
            if (texSize < 512) texSize *= 2;
        }
        else {
            if (numChecks < 512) numChecks *= 2;
        }
    };
    document.getElementById("texDec").onclick = function(event) {
        if ( choice === 0 ) {
            if (texSize > 4) texSize /= 2;
        }
        else {
            if (numChecks > 4) numChecks /= 2;
        }
    };
    document.getElementById("tex1").onclick = function(event) {
        choice = 0;
    };
    document.getElementById("tex2").onclick = function(event) {
        choice = 1;
    };
    document.getElementById("tex3").onclick = function(event) {
        choice = 2;
    };


    render();
};



function render() {
    m[3][1] = -1/light[1];

    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    if ( choice === 0 ) {
        image1 = new Array()
        for (var i =0; i<texSize; i++)  image1[i] = new Array();
        for (var i =0; i<texSize; i++)
            for ( var j = 0; j < texSize; j++)
               image1[i][j] = new Float32Array(4);
        for (var i =0; i<texSize; i++) for (var j=0; j<texSize; j++) {
            var c = (((i & 0x8) == 0) ^ ((j & 0x8)  == 0));
            image1[i][j] = [c, c, c, 1];
        }

        image2 = new Uint8Array(4*texSize*texSize);
        for ( var i = 0; i < texSize; i++ )
            for ( var j = 0; j < texSize; j++ )
               for(var k =0; k<4; k++)
                    image2[4*texSize*i+4*j+k] = 255*image1[i][j][k];
    }
    else if ( choice === 1 ) {
        image1 = new Uint8Array(4*texSize*texSize);

        for ( var i = 0; i < texSize; i++ ) {
            for ( var j = 0; j <texSize; j++ ) {
                var patchx = Math.floor(i/(texSize/numChecks));
                if(patchx%2) c = 255;
                else c = 0;
                image1[4*i*texSize+4*j] = c;
                image1[4*i*texSize+4*j+1] = c;
                image1[4*i*texSize+4*j+2] = c;
                image1[4*i*texSize+4*j+3] = 255;
            }
        }

        image2 = new Uint8Array(4*texSize*texSize);

        for ( var i = 0; i < texSize; i++ ) {
            for ( var j = 0; j <texSize; j++ ) {
                var patchy = Math.floor(j/(texSize/numChecks));
                if(patchy%2) c = 255;
                else c = 0;
                image2[4*i*texSize+4*j] = c;
                image2[4*i*texSize+4*j+1] = c;
                image2[4*i*texSize+4*j+2] = c;
                image2[4*i*texSize+4*j+3] = 255;
            }
        }
    }
    else {
        image1 = new Uint8Array(4*texSize*texSize);

        for ( var i = 0; i < texSize; i++ ) {
            for ( var j = 0; j <texSize; j++ ) {
                var patchx = Math.floor(i/(texSize/numChecks));
                var patchy = Math.floor(j/(texSize/numChecks));
                if(patchx%2 ^ patchy%2) c = 255;
                else c = 0;
                //c = 255*(((i & 0x8) == 0) ^ ((j & 0x8)  == 0))
                image1[4*i*texSize+4*j] = c;
                image1[4*i*texSize+4*j+1] = c;
                image1[4*i*texSize+4*j+2] = c;
                image1[4*i*texSize+4*j+3] = 255;
            }
        }

        image2 = new Uint8Array(4*texSize*texSize);

        for ( var i = 0; i < texSize; i++ ) {
            for ( var j = 0; j <texSize; j++ ) {
                image2[4*i*texSize+4*j] = 127+127*Math.sin(0.1*i*j);
                image2[4*i*texSize+4*j+1] = 127+127*Math.sin(0.1*i*j);
                image2[4*i*texSize+4*j+2] = 127+127*Math.sin(0.1*i*j);
                image2[4*i*texSize+4*j+3] = 255;
               }
        }
    }

    configureTexture();

    gl.uniform1i(q, 0);
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    eye = vec3(radius*Math.sin(theta2)*Math.cos(phi), radius*Math.sin(theta2)*Math.sin(phi), radius*Math.cos(theta2));

    modelViewMatrix = lookAt(eye, vec3(0, 0, 0) , vec3(0, 1, 0));
    projectionMatrix = perspective(fovy, aspect, near, far);

    normalMatrix = [
        vec3(modelViewMatrix[0][0], modelViewMatrix[0][1], modelViewMatrix[0][2]),
        vec3(modelViewMatrix[1][0], modelViewMatrix[1][1], modelViewMatrix[1][2]),
        vec3(modelViewMatrix[2][0], modelViewMatrix[2][1], modelViewMatrix[2][2])
    ];

    gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );

    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatrix) );

    gl.uniform1i(choiceLoc, choice);

    gl.uniform3fv(thetaLoc, theta);
    gl.uniform3fv(dLoc, d);
    gl.uniform3fv(uLoc, u);

    gl.uniform1f(shininessLoc, materialShininess);

    gl.uniform4fv(ambientLoc, flatten(ambientProduct));
    gl.uniform4fv(diffuseLoc, flatten(diffuseProduct));
    gl.uniform4fv(specularLoc, flatten(specularProduct));
    gl.uniform4fv(lightLoc, flatten(light));


    gl.drawArrays( gl.TRIANGLES, 0, points.length );


    gl.uniform1i(q, 1);
    modelViewMatrix = mult(modelViewMatrix, translate(light[0], light[1], light[2]));
    modelViewMatrix = mult(modelViewMatrix, translate(0, -1.0, 0));
    modelViewMatrix = mult(modelViewMatrix, m);
    modelViewMatrix = mult(modelViewMatrix, translate(0, 1.0, 0));
    modelViewMatrix = mult(modelViewMatrix, translate(-light[0], -light[1], -light[2]));

    // send color and matrix for shadow

    gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.drawArrays( gl.TRIANGLES, 0, points.length );


    requestAnimFrame(render);
}


