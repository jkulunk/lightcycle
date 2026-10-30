import * as THREE from 'three';

export class GridArena {
  constructor(scene, size = 200) {
    this.scene = scene;
    this.size = size;
    this.halfSize = size / 2;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.buildFloor();
    this.buildPerimeterWalls();
    this.buildHorizonSkyline();
  }

  buildFloor() {
    // Glossy dark floor plane
    const floorGeo = new THREE.PlaneGeometry(this.size, this.size);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x02060f,
      roughness: 0.25,
      metalness: 0.8
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.02;
    this.group.add(floor);

    // Fine Grid Lines (every 4 units)
    const fineGrid = new THREE.GridHelper(this.size, 50, 0x00a8cc, 0x092442);
    fineGrid.position.y = 0.01;
    fineGrid.material.transparent = true;
    fineGrid.material.opacity = 0.65;
    this.group.add(fineGrid);

    // Major Sector Grid Lines (every 20 units)
    const majorGrid = new THREE.GridHelper(this.size, 10, 0x00f3ff, 0x005b88);
    majorGrid.position.y = 0.025;
    majorGrid.material.transparent = true;
    majorGrid.material.opacity = 0.85;
    this.group.add(majorGrid);
  }

  buildPerimeterWalls() {
    const wallHeight = 4.5;
    const h = this.halfSize;

    const wallMat = new THREE.MeshBasicMaterial({
      color: 0x00c8ff,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide
    });

    const railMat = new THREE.MeshBasicMaterial({
      color: 0x00f3ff
    });

    const sides = [
      { pos: [0, wallHeight / 2, -h], rotY: 0 },
      { pos: [0, wallHeight / 2, h], rotY: 0 },
      { pos: [-h, wallHeight / 2, 0], rotY: Math.PI / 2 },
      { pos: [h, wallHeight / 2, 0], rotY: Math.PI / 2 }
    ];

    sides.forEach(({ pos, rotY }) => {
      const planeGeo = new THREE.PlaneGeometry(this.size, wallHeight);
      const wall = new THREE.Mesh(planeGeo, wallMat);
      wall.position.set(...pos);
      wall.rotation.y = rotY;
      this.group.add(wall);

      // Glowing top and bottom energy rails
      const topRailGeo = new THREE.BoxGeometry(this.size, 0.18, 0.18);
      const topRail = new THREE.Mesh(topRailGeo, railMat);
      topRail.position.set(pos[0], wallHeight, pos[2]);
      topRail.rotation.y = rotY;
      this.group.add(topRail);

      const botRail = new THREE.Mesh(topRailGeo, railMat);
      botRail.position.set(pos[0], 0.1, pos[2]);
      botRail.rotation.y = rotY;
      this.group.add(botRail);
    });
  }

  buildHorizonSkyline() {
    // Distant cyber monoliths outside the arena to give strong depth cues in 3rd & 1st person
    const pillarMat = new THREE.MeshBasicMaterial({
      color: 0x061b33,
      wireframe: true
    });

    for (let i = 0; i < 36; i++) {
      const angle = (i / 36) * Math.PI * 2;
      const dist = this.halfSize + 35 + (i % 3) * 22;
      const height = 18 + (i % 5) * 14;
      const width = 6 + (i % 3) * 4;
      const geo = new THREE.BoxGeometry(width, height, width);
      const mesh = new THREE.Mesh(geo, pillarMat);
      mesh.position.set(Math.cos(angle) * dist, height / 2, Math.sin(angle) * dist);
      this.group.add(mesh);
    }
  }
}
