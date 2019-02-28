const size = .2;

export default class Voxel {
  static fromJson(point) {
    return new Voxel({ point });
  }

  constructor(intersect) {
    this.cubeGeo = new THREE.BoxBufferGeometry(size, size, size);
    this.cubeMaterial = new THREE.MeshLambertMaterial({ color: 0xbada55 });

    this.mesh = new THREE.Mesh(this.cubeGeo, this.cubeMaterial);
    this.mesh.position.copy(intersect.point);

    if (intersect.face) {
      this.mesh.position.add(intersect.face.normal.multiplyScalar(.1));
    }  

    this.mesh.position
      .divideScalar(size)
      .floor()
      .multiplyScalar(size)
      .addScalar(size / 2);
  }

  toJson() {
    return this.mesh.position;
  }
}