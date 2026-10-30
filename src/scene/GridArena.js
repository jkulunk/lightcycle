import * as THREE from 'three';

export const POWERUP_TYPES = {
  OVERCHARGE: {
    type: 'OVERCHARGE',
    name: 'OVERCHARGE',
    color: 0x00ff88,
    description: 'Refills 100% Boost & increases wall height/glow'
  },
  PHASE_SHIFT: {
    type: 'PHASE_SHIFT',
    name: 'PHASE SHIFT',
    color: 0xff00ff,
    description: 'Grants 3.0s of Phase-Shift invulnerability to pass through trails!'
  },
  TRAIL_ERASER: {
    type: 'TRAIL_ERASER',
    name: 'TRAIL ERASER',
    color: 0xffee00,
    description: 'Dissolves enemy trails on the Grid!'
  }
};

export class GridArena {
  constructor(scene, size = 200) {
    this.scene = scene;
    this.size = size;
    this.halfSize = size / 2;
    this.time = 0;

    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.obstacles = [];
    this.powerUps = [];
    this.wallBreaches = [];

    this.obstaclesGroup = new THREE.Group();
    this.powerUpsGroup = new THREE.Group();
    this.breachesGroup = new THREE.Group();

    this.group.add(this.obstaclesGroup);
    this.group.add(this.powerUpsGroup);
    this.group.add(this.breachesGroup);

    this.buildFloor();
    this.buildPerimeterWalls();
    this.buildHorizonSkyline();
    this.spawnArenaObstacles(4);
  }

  buildFloor() {
    // Deep abyssal sub-floor base to anchor the under-grid depth
    const subBaseGeo = new THREE.PlaneGeometry(this.size * 1.4, this.size * 1.4);
    const subBaseMat = new THREE.MeshBasicMaterial({
      color: 0x010308
    });
    const subBase = new THREE.Mesh(subBaseGeo, subBaseMat);
    subBase.rotation.x = -Math.PI / 2;
    subBase.position.y = -0.42;
    this.group.add(subBase);

    // Under-grid glowing lattice plane at y = -0.35 so light & reflections feel deep and 3D
    const latticeGeo = new THREE.PlaneGeometry(this.size, this.size, 40, 40);
    const latticeMat = new THREE.MeshBasicMaterial({
      color: 0x00d8ff,
      wireframe: true,
      transparent: true,
      opacity: 0.34
    });
    this.underGridLattice = new THREE.Mesh(latticeGeo, latticeMat);
    this.underGridLattice.rotation.x = -Math.PI / 2;
    this.underGridLattice.position.y = -0.35;
    this.group.add(this.underGridLattice);

    // Secondary glowing circuit helper at y = -0.35 for crisp 1982 parallax grid glow
    const deepGrid = new THREE.GridHelper(this.size, 25, 0x00f3ff, 0x0a3566);
    deepGrid.position.y = -0.35;
    deepGrid.material.transparent = true;
    deepGrid.material.opacity = 0.48;
    this.group.add(deepGrid);

    // Mirror-Reflective Grid Floor plane with rich glossy dark reflective sheen
    const floorGeo = new THREE.PlaneGeometry(this.size, this.size);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x02060f,
      metalness: 0.92,
      roughness: 0.12,
      transparent: true,
      opacity: 0.88
    });
    this.floorMesh = new THREE.Mesh(floorGeo, floorMat);
    this.floorMesh.rotation.x = -Math.PI / 2;
    this.floorMesh.position.y = -0.02;
    this.group.add(this.floorMesh);

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

  clearArenaObstacles() {
    while (this.obstaclesGroup.children.length > 0) {
      const child = this.obstaclesGroup.children.pop();
      child.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
    }
    this.obstacles = [];
  }

  spawnArenaObstacles(count = 4) {
    this.clearArenaObstacles();

    const presetCoords = [
      [-45, -45],
      [45, -45],
      [-45, 45],
      [45, 45],
      [-62, 0],
      [62, 0],
      [0, -62],
      [0, 62]
    ];

    const num = Math.min(count, presetCoords.length);
    for (let i = 0; i < num; i++) {
      const [x, z] = presetCoords[i];
      const radius = 3.2;
      const obstacleMesh = new THREE.Group();
      obstacleMesh.position.set(x, 0, z);

      // 1982 Cyan/Indigo Octagonal Data Obelisk / Pyramid
      const obeliskHeight = 10.5;
      const obeliskGeo = new THREE.CylinderGeometry(0.55, 2.75, obeliskHeight, 8, 1);
      const obeliskMat = new THREE.MeshStandardMaterial({
        color: 0x0c1638,
        emissive: 0x1e2a78,
        emissiveIntensity: 0.75,
        metalness: 0.85,
        roughness: 0.18,
        transparent: true,
        opacity: 0.92
      });
      const obelisk = new THREE.Mesh(obeliskGeo, obeliskMat);
      obelisk.position.y = obeliskHeight / 2;
      obstacleMesh.add(obelisk);

      // Glowing 1982 vector wireframe cage around the obelisk
      const edgesGeo = new THREE.EdgesGeometry(obeliskGeo);
      const edgesMat = new THREE.LineBasicMaterial({
        color: 0x00f3ff,
        transparent: true,
        opacity: 0.95
      });
      const wireframe = new THREE.LineSegments(edgesGeo, edgesMat);
      wireframe.position.y = obeliskHeight / 2;
      obstacleMesh.add(wireframe);

      // Glowing pyramid cap on top of the obelisk
      const capGeo = new THREE.ConeGeometry(1.15, 2.4, 8);
      const capMat = new THREE.MeshBasicMaterial({
        color: 0x00f3ff,
        wireframe: true
      });
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.y = obeliskHeight + 1.4;
      obstacleMesh.add(cap);

      // Base octagonal energy plinth & perimeter warning ring at radius 3.2
      const baseRingGeo = new THREE.RingGeometry(radius - 0.35, radius + 0.1, 8);
      const baseRingMat = new THREE.MeshBasicMaterial({
        color: 0x00f3ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85
      });
      const baseRing = new THREE.Mesh(baseRingGeo, baseRingMat);
      baseRing.rotation.x = -Math.PI / 2;
      baseRing.position.y = 0.05;
      obstacleMesh.add(baseRing);

      // Inner indigo data pulse ring
      const innerHaloGeo = new THREE.RingGeometry(1.6, 2.7, 8);
      const innerHaloMat = new THREE.MeshBasicMaterial({
        color: 0x4f46e5,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.45
      });
      const innerHalo = new THREE.Mesh(innerHaloGeo, innerHaloMat);
      innerHalo.rotation.x = -Math.PI / 2;
      innerHalo.position.y = 0.04;
      obstacleMesh.add(innerHalo);

      this.obstaclesGroup.add(obstacleMesh);
      this.obstacles.push({
        x,
        z,
        radius,
        mesh: obstacleMesh,
        obeliskMat,
        cap,
        baseRingMat,
        phase: i * (Math.PI / 2)
      });
    }

    return this.obstacles;
  }

  clearPowerUps() {
    while (this.powerUpsGroup.children.length > 0) {
      const child = this.powerUpsGroup.children.pop();
      child.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
    }
    this.powerUps = [];
  }

  spawnPowerUp(type = 'OVERCHARGE', x = 0, z = 0) {
    const typeKeys = Object.keys(POWERUP_TYPES);
    const resolvedType = POWERUP_TYPES[type]
      ? type
      : typeKeys[Math.floor(Math.random() * typeKeys.length)];
    const config = POWERUP_TYPES[resolvedType];
    const color = config.color;

    const holder = new THREE.Group();
    holder.position.set(x, 1.3, z);

    // Core spinning 3D glowing OctahedronGeometry(1.1, 0)
    const coreGeo = new THREE.OctahedronGeometry(1.1, 0);
    const coreMat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.85,
      metalness: 0.4,
      roughness: 0.15,
      transparent: true,
      opacity: 0.92
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    holder.add(core);

    // Crisp bright wireframe overlay on the octahedron
    const coreWireGeo = new THREE.OctahedronGeometry(1.16, 0);
    const coreWireMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.75
    });
    const coreWire = new THREE.Mesh(coreWireGeo, coreWireMat);
    core.add(coreWire);

    // Outer wireframe ring orbiting the octahedron
    const outerRingGeo = new THREE.OctahedronGeometry(1.55, 1);
    const outerRingMat = new THREE.MeshBasicMaterial({
      color,
      wireframe: true,
      transparent: true,
      opacity: 0.55
    });
    const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    holder.add(outerRing);

    // Floor halo directly beneath the power-up (relative to holder at y = 1.3 -> y = -1.25)
    const haloGeo = new THREE.RingGeometry(1.15, 1.75, 24);
    const haloMat = new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = -1.25;
    holder.add(halo);

    this.powerUpsGroup.add(holder);

    const powerUp = {
      type: resolvedType,
      name: config.name,
      description: config.description,
      color,
      x,
      z,
      radius: 2.2,
      active: true,
      mesh: holder,
      core,
      outerRing,
      halo,
      haloMat,
      baseY: 1.3,
      phase: Math.random() * Math.PI * 2
    };

    this.powerUps.push(powerUp);
    return powerUp;
  }

  removePowerUp(powerUp) {
    const idx = this.powerUps.indexOf(powerUp);
    if (idx !== -1) {
      this.powerUps.splice(idx, 1);
    }
    if (powerUp && powerUp.mesh) {
      this.powerUpsGroup.remove(powerUp.mesh);
      powerUp.mesh.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
    }
  }

  clearWallBreaches() {
    while (this.breachesGroup.children.length > 0) {
      const child = this.breachesGroup.children.pop();
      child.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
    }
    this.wallBreaches = [];
  }

  createWallBreach(x, z) {
    const h = this.halfSize;
    const isEastWest = Math.abs(x) >= Math.abs(z);
    const wallX = isEastWest ? Math.sign(x || 1) * h : THREE.MathUtils.clamp(x, -h + 8, h - 8);
    const wallZ = isEastWest ? THREE.MathUtils.clamp(z, -h + 8, h - 8) : Math.sign(z || 1) * h;
    const rotY = isEastWest ? Math.PI / 2 : 0;
    const outwardSign = isEastWest ? Math.sign(wallX || 1) : Math.sign(wallZ || 1);

    const breachGroup = new THREE.Group();
    breachGroup.position.set(wallX, 0, wallZ);
    breachGroup.rotation.y = rotY;

    const breachWidth = 11.0;
    const breachHeight = 4.6;

    // Shattered dark energy gap portal plane on the perimeter wall
    const gapGeo = new THREE.PlaneGeometry(breachWidth, breachHeight);
    const gapMat = new THREE.MeshBasicMaterial({
      color: 0x01040a,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.94
    });
    const gapMesh = new THREE.Mesh(gapGeo, gapMat);
    gapMesh.position.y = breachHeight / 2;
    breachGroup.add(gapMesh);

    // Glowing cyan/white breach portal energy field
    const fieldGeo = new THREE.RingGeometry(2.2, 5.2, 6);
    const fieldMat = new THREE.MeshBasicMaterial({
      color: 0x00f3ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.72
    });
    const fieldMesh = new THREE.Mesh(fieldGeo, fieldMat);
    fieldMesh.position.set(0, breachHeight / 2, 0.08);
    breachGroup.add(fieldMesh);

    // Jagged glowing structural frame pillars & shards around the breach
    const shardMat = new THREE.MeshBasicMaterial({
      color: 0xffffff
    });
    const cyanShardMat = new THREE.MeshBasicMaterial({
      color: 0x00f3ff,
      wireframe: true
    });

    for (let i = 0; i < 10; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const t = Math.floor(i / 2) / 4;
      const sy = 0.5 + t * (breachHeight - 0.6);
      const sx = side * (breachWidth * 0.46 + (Math.random() - 0.5) * 0.9);
      const shardGeo = new THREE.ConeGeometry(0.45 + Math.random() * 0.35, 1.8 + Math.random() * 1.2, 4);
      const shard = new THREE.Mesh(shardGeo, i % 3 === 0 ? shardMat : cyanShardMat);
      shard.position.set(sx, sy, (Math.random() - 0.5) * 0.4);
      shard.rotation.z = side * (0.4 + Math.random() * 0.7);
      shard.rotation.x = (Math.random() - 0.5) * 0.5;
      breachGroup.add(shard);
    }

    // Escape highway light runway extending outward "Off the Grid"
    const runwayLength = 42;
    const runwayGeo = new THREE.PlaneGeometry(breachWidth * 0.85, runwayLength, 4, 12);
    const runwayMat = new THREE.MeshBasicMaterial({
      color: 0x00f3ff,
      wireframe: true,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65
    });
    const runway = new THREE.Mesh(runwayGeo, runwayMat);
    runway.rotation.x = -Math.PI / 2;
    const outwardLocalZ = isEastWest ? outwardSign : outwardSign;
    runway.position.set(0, 0.04, outwardLocalZ * (runwayLength / 2));
    breachGroup.add(runway);

    this.breachesGroup.add(breachGroup);

    const breach = {
      x: wallX,
      z: wallZ,
      radius: breachWidth * 0.5,
      mesh: breachGroup,
      fieldMesh,
      fieldMat
    };
    this.wallBreaches.push(breach);
    return breach;
  }

  update(dt) {
    this.time += dt;

    // Subtle under-grid lattice shimmer
    if (this.underGridLattice && this.underGridLattice.material) {
      this.underGridLattice.material.opacity = 0.28 + Math.sin(this.time * 2.2) * 0.08;
    }

    // Pulse 1982 Arena Obstacles
    for (let i = 0; i < this.obstacles.length; i++) {
      const obs = this.obstacles[i];
      const pulse = 0.5 + 0.5 * Math.sin(this.time * 3.2 + obs.phase);
      if (obs.obeliskMat) {
        obs.obeliskMat.emissiveIntensity = 0.55 + pulse * 0.55;
      }
      if (obs.cap) {
        obs.cap.rotation.y += dt * 1.4;
        obs.cap.position.y = 11.8 + Math.sin(this.time * 2.6 + obs.phase) * 0.3;
      }
      if (obs.baseRingMat) {
        obs.baseRingMat.opacity = 0.6 + pulse * 0.35;
      }
    }

    // Rotate and bob active Power-Up Data Octahedrons
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const p = this.powerUps[i];
      if (!p.active) {
        this.removePowerUp(p);
        continue;
      }

      const bob = Math.sin(this.time * 3.4 + p.phase) * 0.28;
      p.mesh.position.y = p.baseY + bob;

      if (p.core) {
        p.core.rotation.y += dt * 2.4;
        p.core.rotation.x += dt * 1.1;
      }
      if (p.outerRing) {
        p.outerRing.rotation.y -= dt * 1.6;
        p.outerRing.rotation.z += dt * 1.2;
      }
      if (p.halo) {
        // Keep floor halo anchored right above the grid floor
        p.halo.position.y = -(p.baseY + bob) + 0.05;
        p.halo.rotation.z -= dt * 1.5;
        const scale = 0.92 + 0.14 * Math.sin(this.time * 4.5 + p.phase);
        p.halo.scale.set(scale, scale, 1);
      }
    }

    // Pulse any active wall breaches
    for (let i = 0; i < this.wallBreaches.length; i++) {
      const b = this.wallBreaches[i];
      if (b.fieldMesh) {
        b.fieldMesh.rotation.z += dt * 1.8;
      }
      if (b.fieldMat) {
        b.fieldMat.opacity = 0.5 + 0.35 * Math.sin(this.time * 6.0 + i);
      }
    }
  }
}
