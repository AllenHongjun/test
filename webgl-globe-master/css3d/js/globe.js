/**
 * dat.globe Javascript WebGL Globe Toolkit
 * https://github.com/dataarts/webgl-globe
 *
 * Copyright 2011 Data Arts Team, Google Creative Lab
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 */

var DAT = DAT || {};

DAT.Globe = function(container, opts) {
  opts = opts || {};
  
  var colorFn = opts.colorFn || function(x) {
    var c = new THREE.Color();
    c.setHSL( ( 50 - ( x * 0.5 ) ), 100, 99 );
    return c;
  };
  var imgDir = opts.imgDir || '/globe/';

  var Shaders = {
    'earth' : {
      uniforms: {
        'texture': { type: 't', value: null }
      },
      vertexShader: [
        'varying vec3 vNormal;',
        'varying vec2 vUv;',
        'void main() {',
          'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
          'vNormal = normalize( normalMatrix * normal );',
          'vUv = uv;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform sampler2D texture;',
        'varying vec3 vNormal;',
        'varying vec2 vUv;',
        'void main() {',
          'vec3 diffuse = texture2D( texture, vUv ).xyz;',
          'float intensity = 1.05 - dot( vNormal, vec3( 0.0, 0.0, 1.0 ) );',
          'vec3 atmosphere = vec3( 1.0, 1.0, 1.0 ) * pow( intensity, 3.0 );',
          'gl_FragColor = vec4( diffuse + atmosphere, 1.0 );',
        '}'
      ].join('\n')
    },
    'atmosphere' : {
      uniforms: {},
      vertexShader: [
        'varying vec3 vNormal;',
        'void main() {',
          'vNormal = normalize( normalMatrix * normal );',
          'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
        '}'
      ].join('\n'),
      fragmentShader: [
        'varying vec3 vNormal;',
        'void main() {',
          'float intensity = pow( 0.8 - dot( vNormal, vec3( 0, 0, 1.0 ) ), 12.0 );',
          'gl_FragColor = vec4( 1.0, 1.0, 1.0, 1.0 ) * intensity;',
        '}'
      ].join('\n')
    }
  };

  var camera, scene, renderer, w, h;
  var mesh, atmosphere, point;

  var overRenderer;

  var curZoomSpeed = 0;
  var zoomSpeed = 50;

  var mouse = { x: 0, y: 0 }, mouseOnDown = { x: 0, y: 0 };
  var rotation = { x: 0, y: 0 },
      target = { x: Math.PI*3/2, y: Math.PI / 6.0 },
      targetOnDown = { x: 0, y: 0 };

  var distance = 100000, distanceTarget = 100000;
  var padding = 40;
  var PI_HALF = Math.PI / 2;

  function init() {

    container.style.color = '#fff';
    container.style.font = '13px/20px Arial, sans-serif';

    var shader, uniforms, material;
    w = container.offsetWidth || window.innerWidth;
    h = container.offsetHeight || window.innerHeight;

    camera = new THREE.PerspectiveCamera(30, w / h, 1, 10000);
    camera.position.z = distance;

    scene = new THREE.Scene();

    // 创建一个球体的对象 r, widthSegments,heightSegments
    var geometry = new THREE.SphereGeometry(200, 40, 30);
    console.log(geometry);
    shader = Shaders['earth'];
    uniforms = THREE.UniformsUtils.clone(shader.uniforms);

    uniforms['texture'].value = THREE.ImageUtils.loadTexture(imgDir+'world.jpg');

    material = new THREE.ShaderMaterial({

          uniforms: uniforms,
          vertexShader: shader.vertexShader,
          fragmentShader: shader.fragmentShader

        });

    mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.y = Math.PI;
    scene.add(mesh);

    shader = Shaders['atmosphere'];
    uniforms = THREE.UniformsUtils.clone(shader.uniforms);

    material = new THREE.ShaderMaterial({

          uniforms: uniforms,
          vertexShader: shader.vertexShader,
          fragmentShader: shader.fragmentShader,
          side: THREE.BackSide,
          blending: THREE.AdditiveBlending,
          transparent: true

        });
    
    mesh = new THREE.Mesh(geometry, material);
    mesh.scale.set( 1.1, 1.1, 1.1 );
    mesh.position.set(0,0,0);
    scene.add(mesh);


    //添加一圈点
    var material_plane = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      side:THREE.DoubleSide
      // wireframe: true
    });
    console.log(table)
    var angle  = 0;
    var vector = new THREE.Vector3();
    
    console.log(opts);

    // 获取外面table当中数据 展示头像
    // 根据头像的数量来展示环绕圈的数量。
    for(var i = 0; i<12; i++){
      angle = 2*Math.PI / 12 *i;
      var x = Math.sin(angle) * 250;
      var z = Math.cos(angle) * 250;
      var plane = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), material_plane);
      plane.position.x = x ;
      plane.position.z = z;
      vector.x = x * 2;
      vector.y = 0;
      vector.z = z * 2;

      plane.lookAt(vector);
      scene.add(plane);
    }
    



    // initCircle();
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(w, h);
    renderer.domElement.style.position = 'absolute';
    container.appendChild(renderer.domElement);
    //去除 给地球上面绑定的事件
    window.addEventListener('resize', onWindowResize, false);
  }



  function initCircle(){
    var cubes = new THREE.Geometry();
    var cbmesh=null;
    // this._baseGeometry = new THREE.Geometry();
    // for(var i=0,l=opts.objects.length;i<l;i++){
    //   this._baseGeometry.morphTargets.push({'name': 'p'+i, vertices: subgeo.vertices});
    // }
    // this.points = new THREE.Mesh(this._baseGeometry, new THREE.MeshBasicMaterial({
    //           color: 0xffffff,
    //           vertexColors: THREE.FaceColors,
    //           morphTargets: true
    //         }));
    // scene.add(this.points);
    for(var i=0,l=opts.objects.length;i<l;i++){
      var geometry = new THREE.BoxGeometry(300, 300, 400);
      cubes.morphTargets.push({'name':'p'+i,vertices:geometry.vertices});
      cbmesh=new THREE.Mesh(cubes,new THREE.MeshBasicMaterial({
              color: 0xffffff,
              vertexColors: THREE.FaceColors,
              morphTargets: true
            }));
    }
    // for(var i=0,l=opts.objects.length;i<l;i++){
      
    //   var material = new THREE.MeshBasicMaterial( {color: 0xffffff} );
    //   var cube = new THREE.Mesh( geometry, material );
    // }
    scene.add( cbmesh );
  }

  // function createPoints() {
  //   if (this._baseGeometry !== undefined) {
  //     if (this.is_animated === false) {
  //       this.points = new THREE.Mesh(this._baseGeometry, new THREE.MeshBasicMaterial({
  //             color: 0xffffff,
  //             vertexColors: THREE.FaceColors,
  //             morphTargets: false
  //           }));
  //     } else {
  //       if (this._baseGeometry.morphTargets.length < 8) {
  //         console.log('t l',this._baseGeometry.morphTargets.length);
  //         var padding = 8-this._baseGeometry.morphTargets.length;
  //         console.log('padding', padding);
  //         for(var i=0; i<=padding; i++) {
  //           console.log('padding',i);
  //           this._baseGeometry.morphTargets.push({'name': 'morphPadding'+i, vertices: this._baseGeometry.vertices});
  //         }
  //       }
  //       this.points = new THREE.Mesh(this._baseGeometry, new THREE.MeshBasicMaterial({
  //             color: 0xffffff,
  //             vertexColors: THREE.FaceColors,
  //             morphTargets: true
  //           }));
  //     }
  //     scene.add(this.points);
  //   }
  // }


  //控制地球自动旋转
  // var rotateTimer  = setInterval(function(){
  //     var zoomDamp = distance/1000;
  //     target.x += 1* 0.005 * zoomDamp;
  // },24);

  setInterval(function(){
    mesh.rotation.y = (mesh.rotation.y + 0.01) % (Math.PI * 2);
      renderer.render(scene, camera);
  },24)

  function onWindowResize( event ) {
    camera.aspect = container.offsetWidth / container.offsetHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( container.offsetWidth, container.offsetHeight );
  }

  function zoom(delta) {
    distanceTarget -= delta;
    distanceTarget = distanceTarget > 1000 ? 1000 : distanceTarget;
    distanceTarget = distanceTarget < 350 ? 350 : distanceTarget;
  }

  function animate() {
    requestAnimationFrame(animate);
    render();
  }

  function render() {
    zoom(curZoomSpeed);

    rotation.x += (target.x - rotation.x) * 0.1;
    rotation.y += (target.y - rotation.y) * 0.1;
    distance += (distanceTarget - distance) * 0.3;

    camera.position.x = distance * Math.sin(rotation.x) * Math.cos(rotation.y);
    camera.position.y = distance * Math.sin(rotation.y);
    camera.position.z = distance * Math.cos(rotation.x) * Math.cos(rotation.y);

    camera.lookAt(mesh.position);

    renderer.render(scene, camera);
  }



  function onMouseDown(event) {
    event.preventDefault();

    container.addEventListener('mousemove', onMouseMove, false);
    container.addEventListener('mouseup', onMouseUp, false);
    container.addEventListener('mouseout', onMouseOut, false);

    mouseOnDown.x = - event.clientX;
    mouseOnDown.y = event.clientY;

    targetOnDown.x = target.x;
    targetOnDown.y = target.y;

    container.style.cursor = 'move';
  }

  function onMouseMove(event) {
    mouse.x = - event.clientX;
    mouse.y = event.clientY;

    var zoomDamp = distance/1000;

    target.x = targetOnDown.x + (mouse.x - mouseOnDown.x) * 0.005 * zoomDamp;
    target.y = targetOnDown.y + (mouse.y - mouseOnDown.y) * 0.005 * zoomDamp;

    target.y = target.y > PI_HALF ? PI_HALF : target.y;
    target.y = target.y < - PI_HALF ? - PI_HALF : target.y;
  }


  //控制地球自动旋转
  // var rotateTimer  = setInterval(function(){
  //     var zoomDamp = distance/1000;
  //     target.x += 1* 0.005 * zoomDamp;
  // },24);


  //去除 给地球上面绑定的事件
  container.addEventListener('mousedown', onMouseDown, false);

  // container.addEventListener('mousewheel', onMouseWheel, false);

  // document.addEventListener('keydown', onDocumentKeyDown, false);


  function onMouseDown(event) {
    event.preventDefault();

    container.addEventListener('mousemove', onMouseMove, false);
    container.addEventListener('mouseup', onMouseUp, false);
    container.addEventListener('mouseout', onMouseOut, false);

    mouseOnDown.x = - event.clientX;
    mouseOnDown.y = event.clientY;

    targetOnDown.x = target.x;
    targetOnDown.y = target.y;

    container.style.cursor = 'move';
  }

  function onMouseMove(event) {
    mouse.x = - event.clientX;
    mouse.y = event.clientY;

    var zoomDamp = distance/1000;

    target.x = targetOnDown.x + (mouse.x - mouseOnDown.x) * 0.005 * zoomDamp;
    target.y = targetOnDown.y + (mouse.y - mouseOnDown.y) * 0.005 * zoomDamp;

    target.y = target.y > PI_HALF ? PI_HALF : target.y;
    target.y = target.y < - PI_HALF ? - PI_HALF : target.y;
  }

  function onMouseUp(event) {
    container.removeEventListener('mousemove', onMouseMove, false);
    container.removeEventListener('mouseup', onMouseUp, false);
    container.removeEventListener('mouseout', onMouseOut, false);
    container.style.cursor = 'auto';
  }

  function onMouseOut(event) {
    container.removeEventListener('mousemove', onMouseMove, false);
    container.removeEventListener('mouseup', onMouseUp, false);
    container.removeEventListener('mouseout', onMouseOut, false);
  }

  function onMouseWheel(event) {
    event.preventDefault();
    if (overRenderer) {
      zoom(event.wheelDeltaY * 0.3);
    }
    return false;
  }



  init();
  this.animate = animate;
  this.__defineGetter__('time', function() {
    return this._time || 0;
  });

  this.__defineSetter__('time', function(t) {
    this._time = t;
  });

  this.renderer = renderer;
  this.initCircle=initCircle;
  this.scene = scene;
  return this;
};