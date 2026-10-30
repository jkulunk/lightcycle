import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.brickGeos = [
      new THREE.BoxGeometry(0.38, 0.24, 0.38), // 1x1 LEGO brick
      new THREE.BoxGeometry(0.68, 0.24, 0.36), // 1x2 LEGO brick
      new THREE.CylinderGeometry(0.18, 0.18, 0.16, 14) // Round LEGO 1x1 stud/plate
    ];
    this.studGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.06, 10);
    this.shardGeos = [
      new THREE.BoxGeometry(0.85, 0.18, 0.42), // Structural wall panel shard
      new THREE.ConeGeometry(0.32, 0.95, 4), // Jagged crystal/energy wall shard
      new THREE.OctahedronGeometry(0.26, 0) // Energy node fragment
    ];
  }

  clear() {
    while (this.group.children.length > 0) {
      const mesh = this.group.children.pop();
      if (mesh.material) mesh.material.dispose();
    }
    this.particles = [];
  }

  spawnDerezzExplosion(x, z, color) {
    for (let i = 0; i < 68; i++) {
      const isYellowPiece = i % 9 === 0;
      const isWhiteCore = i % 6 === 0;
      const pieceColor = isYellowPiece ? 0xf6c616 : (isWhiteCore ? 0xffffff : color);

      const mat = new THREE.MeshPhongMaterial({
        color: pieceColor,
        emissive: pieceColor,
        emissiveIntensity: 0.45,
        shininess: 90,
        transparent: true,
        opacity: 1.0
      });

      const baseGeo = this.brickGeos[i % this.brickGeos.length];
      const mesh = new THREE.Mesh(baseGeo, mat);

      // Add a tiny LEGO stud on top of brick pieces
      if (i % 3 !== 2) {
        const stud = new THREE.Mesh(this.studGeo, mat);
        stud.position.y = 0.15;
        mesh.add(stud);
      }

      mesh.position.set(x, 0.8 + Math.random() * 1.2, z);
      const scale = 0.65 + Math.random() * 1.1;
      mesh.scale.setScalar(scale);

      const angle = Math.random() * Math.PI * 2;
      const speed = 6 + Math.random() * 24;
      const vy = 6 + Math.random() * 16;

      this.group.add(mesh);
      this.particles.push({
        mesh,
        vx: Math.cos(angle) * speed,
        vy,
        vz: Math.sin(angle) * speed,
        rx: (Math.random() - 0.5) * 12,
        ry: (Math.random() - 0.5) * 12,
        life: 1.8 + Math.random() * 0.8,
        maxLife: 2.4
      });
    }
  }

  spawnWallBreachExplosion(x, z) {
    // Determine outward breach direction from arena center toward perimeter wall
    const len = Math.hypot(x, z) || 1;
    const outX = x / len;
    const outZ = z / len;

    for (let i = 0; i < 90; i++) {
      const isWhite = i % 3 === 0;
      const isElectricBlue = i % 5 === 0;
      const pieceColor = isWhite ? 0xffffff : (isElectricBlue ? 0x38bdf8 : 0x00f3ff);

      const mat = new THREE.MeshPhongMaterial({
        color: pieceColor,
        emissive: pieceColor,
        emissiveIntensity: 0.75,
        shininess: 100,
        transparent: true,
        opacity: 1.0
      });

      // Mix structural wall shards and LEGO bricks/studs
      const useShard = i % 2 === 0;
      const baseGeo = useShard
        ? this.shardGeos[i % this.shardGeos.length]
        : this.brickGeos[i % this.brickGeos.length];
      const mesh = new THREE.Mesh(baseGeo, mat);

      if (!useShard && i % 3 !== 2) {
        const stud = new THREE.Mesh(this.studGeo, mat);
        stud.position.y = 0.15;
        mesh.add(stud);
      }

      mesh.position.set(
        x + (Math.random() - 0.5) * 3.5,
        0.5 + Math.random() * 3.8,
        z + (Math.random() - 0.5) * 3.5
      );
      const scale = 0.75 + Math.random() * 1.45;
      mesh.scale.setScalar(scale);

      const spreadAngle = (Math.random() - 0.5) * Math.PI * 0.85;
      const baseAngle = Math.atan2(outZ, outX) + spreadAngle;
      const speed = 14 + Math.random() * 34;
      const vy = 4 + Math.random() * 20;

      this.group.add(mesh);
      this.particles.push({
        mesh,
        vx: Math.cos(baseAngle) * speed,
        vy,
        vz: Math.sin(baseAngle) * speed,
        rx: (Math.random() - 0.5) * 16,
        ry: (Math.random() - 0.5) * 16,
        life: 2.0 + Math.random() * 1.0,
        maxLife: 3.0
      });
    }
  }

  spawnPowerUpBurst(x, z, color = 0x00ff88) {
    const count = 36;
    for (let i = 0; i < count; i++) {
      const isCoreWhite = i % 4 === 0;
      const pieceColor = isCoreWhite ? 0xffffff : color;

      const mat = new THREE.MeshBasicMaterial({
        color: pieceColor,
        transparent: true,
        opacity: 1.0
      });

      const geo = i % 2 === 0 ? this.shardGeos[2] : this.brickGeos[2];
      const mesh = new THREE.Mesh(geo, mat);

      const t = i / count;
      const spiralAngle = t * Math.PI * 6;
      const radius = 0.5 + t * 1.8;

      mesh.position.set(
        x + Math.cos(spiralAngle) * radius,
        0.5 + t * 2.2,
        z + Math.sin(spiralAngle) * radius
      );
      mesh.scale.setScalar(0.65 + (1 - t) * 0.65);

      const tangentX = -Math.sin(spiralAngle);
      const tangentZ = Math.cos(spiralAngle);
      const outSpeed = 4 + Math.random() * 7;
      const swirlSpeed = 6 + Math.random() * 6;

      this.group.add(mesh);
      this.particles.push({
        mesh,
        vx: Math.cos(spiralAngle) * outSpeed + tangentX * swirlSpeed,
        vy: 8 + Math.random() * 10,
        vz: Math.sin(spiralAngle) * outSpeed + tangentZ * swirlSpeed,
        rx: (Math.random() - 0.5) * 10,
        ry: (Math.random() - 0.5) * 10,
        gravity: 9,
        bounce: false,
        life: 0.75 + Math.random() * 0.45,
        maxLife: 1.2
      });
    }
  }

  spawnBoostSpark(x, z, dirX, dirZ, color) {
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.9
    });
    const mesh = new THREE.Mesh(this.brickGeos[2], mat);
    mesh.scale.setScalar(0.55);
    mesh.position.set(
      x - dirX * 1.5 + (Math.random() - 0.5) * 0.6,
      0.35 + Math.random() * 0.4,
      z - dirZ * 1.5 + (Math.random() - 0.5) * 0.6
    );
    this.group.add(mesh);
    this.particles.push({
      mesh,
      vx: -dirX * (8 + Math.random() * 8) + (Math.random() - 0.5) * 4,
      vy: 2 + Math.random() * 4,
      vz: -dirZ * (8 + Math.random() * 8) + (Math.random() - 0.5) * 4,
      rx: 6,
      ry: 6,
      life: 0.35,
      maxLife: 0.35
    });
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.group.remove(p.mesh);
        p.mesh.material.dispose();
        this.particles.splice(i, 1);
        continue;
      }

      const gravity = p.gravity !== undefined ? p.gravity : 28;
      p.vy -= gravity * dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;

      if (p.bounce !== false && p.mesh.position.y < 0.16) {
        p.mesh.position.y = 0.16;
        p.vy *= -0.58;
        p.vx *= 0.82;
        p.vz *= 0.82;
      }

      p.mesh.rotation.x += p.rx * dt;
      p.mesh.rotation.y += p.ry * dt;
      p.mesh.material.opacity = Math.max(0, p.life / p.maxLife);
    }
  }
}
