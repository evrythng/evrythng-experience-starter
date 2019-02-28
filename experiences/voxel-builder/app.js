import EventEmitter from 'events';
import Voxel from './voxel';

class VoxelBuilderApp extends EventEmitter {
  constructor() {
    console.log('')
    super();

    this.config = {
      scene: {
        lighting: {
          ambient: 0x222222,
          directional: 0x999999
        }
      },
      grid: {
        size: 2,
        cells: 10,
      }
    };

    this.config.cell = {
      size: this.config.grid.size / this.config.grid.cells
    };

    this.objects = [];
    this.voxels = [];

    this.product = null;
    this.ar = null;

    this.onActionClick = this.onActionClick.bind(this);
    this.onRender = this.onRender.bind(this);
    this.onResize = this.onResize.bind(this);
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });

    this.renderer.setClearColor(new THREE.Color('lightgrey'), 0);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.domElement.style.position = 'absolute'
    this.renderer.domElement.style.top = '0px'
    this.renderer.domElement.style.left = '0px'

    window.document.body.appendChild(this.renderer.domElement);
  }

  initScene() {
    const { cell, scene: { lighting } } = this.config;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 10000);
    this.scene.add(this.camera);

    this.ambientLight = new THREE.AmbientLight(lighting.ambient);
    this.scene.add(this.ambientLight);

    this.directionalLight = new THREE.DirectionalLight(lighting.directional);
    this.directionalLight.position.set(1, 0.75, 0.5).normalize();
    this.scene.add(this.directionalLight);

    this.rollOverGeo = new THREE.BoxBufferGeometry(cell.size, cell.size, cell.size);
    this.rollOverMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, opacity: 0.5, transparent: true });
    this.rollOverMesh = new THREE.Mesh(this.rollOverGeo, this.rollOverMaterial);
    this.scene.add(this.rollOverMesh);

    const planeGeometry = new THREE.PlaneBufferGeometry(1000, 1000);
    const plane = new THREE.Mesh(planeGeometry, new THREE.MeshBasicMaterial({ visible: false }));
    planeGeometry.rotateX(- Math.PI / 2);
    this.scene.add(plane);
    this.objects.push(plane);

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    const gridHelper = new THREE.GridHelper(2, 10);
    this.scene.add(gridHelper);
  }

  initArToolkit() {
    this.ar = {
      source: new THREEx.ArToolkitSource({ sourceType: 'webcam' }),
      context: new THREEx.ArToolkitContext({
        cameraParametersUrl: 'https://cdn.rawgit.com/jeromeetienne/AR.js/b0fec0c2/data/data/camera_para.dat',
        detectionMode: 'mono',
      }),
      markerControls: null
    };

    this.ar.markerControls = new THREEx.ArMarkerControls(this.ar.context, this.camera, {
      type: 'pattern',
      patternUrl: 'https://raw.githubusercontent.com/jeromeetienne/AR.js/master/data/data/patt.hiro',
      // patternUrl : THREEx.ArToolkitContext.baseURL + '../data/data/patt.kanji',
      // as we controls the camera, set changeMatrixMode: 'cameraTransformMatrix'
      changeMatrixMode: 'cameraTransformMatrix'
    });

    this.ar.source.init(() => this.onResize());
    this.ar.context.init(() => {
      this.camera.projectionMatrix.copy(this.ar.context.getProjectionMatrix());
    });

    const pointer = document.createElement('scene-pointer');
    const action = document.createElement('scene-action');

    document.body.appendChild(pointer);
    document.body.appendChild(action);

    action.addEventListener('click', this.onActionClick);
  }

  addListeners() {
    window.addEventListener('resize', this.onResize);
    this.on('render', this.onRender);
  }

  onRender() {
    if (this.ar.source.ready === false) return

    this.ar.context.update(this.ar.source.domElement);
    this.scene.visible = this.camera.visible;

    const [intersect] = this.detectIntersects(this.objects);

    if (intersect) {
      this.positionPlaceholder(intersect);
    }

    this.renderer.render(
      this.scene, 
      this.camera
    );
  }

  onResize() {
    this.ar.source.onResize();
    this.ar.source.copySizeTo(this.renderer.domElement);

    if (this.ar.context && this.ar.context.arController) {
      this.ar.source.copySizeTo(this.ar.context.arController.canvas)
    }
  }

  onActionClick(e) {
    e.preventDefault();

    this.mouse.set(0, 0);
    this.camera.updateMatrixWorld();
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const [intersect] = this.detectIntersects(this.objects);

    if (intersect) {
      this.addVoxel(intersect);
      this.emit('workbench-update', this.construct());
    }
  }

  addVoxel(intersect) {
    const { cell } = this.config;

    const voxel = new Voxel(intersect);

    this.scene.add(voxel.mesh);
    this.objects.push(voxel.mesh);
    this.voxels.push(voxel);
  }

  detectIntersects(objects) {
    this.mouse.set(0, 0);
    this.camera.updateMatrixWorld();
    this.raycaster.setFromCamera(this.mouse, this.camera);

    return this.raycaster.intersectObjects(objects) || [];
  }

  positionPlaceholder(target) {
    const { cell } = this.config;

    this.rollOverMesh.position
      .copy(target.point)
      .add(target.face.normal.multiplyScalar(.1));

    this.rollOverMesh.position
      .divideScalar(cell.size)
      .floor()
      .multiplyScalar(cell.size)
      .addScalar(cell.size / 2);
  }

  init(product) {
    this.product = product;

    this.initRenderer();
    this.initScene();
    this.initArToolkit();

    this.scene.visible = false;

    this.loop();
    this.addListeners();
    this.initVoxels();
  }

  initVoxels() {
    const workbench = this.product.properties.workbench || [];
    workbench.forEach(point => this.addVoxel({ point }));
  }

  reconstruct(workbench) {
    this.voxels.forEach(v => {
      this.scene.remove(v.mesh);
      this.objects.splice(this.objects.indexOf(v.mesh), 1);
    });

    this.voxels = [];
    this.product.properties.workbench = workbench;
    
    this.initVoxels();
  }

  construct() {
    return this.voxels.map(v => v.toJson());
  }

  loop() {
    const app = this;
    this.lastTimeMsec = null;

    window.requestAnimationFrame(function renderLoop(nowMsec) {
      window.requestAnimationFrame(renderLoop);
      app.lastTimeMsec = app.lastTimeMsec || nowMsec - 1000 / 60;
      const deltaMsec = Math.min(200, nowMsec - app.lastTimeMsec);
      app.lastTimeMsec = nowMsec;

      app.emit('render', deltaMsec / 1000);
    });
  }
}

export default new VoxelBuilderApp();