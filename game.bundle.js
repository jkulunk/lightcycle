// Auto-bundled from src/ for zero-CORS file:// execution
(function() {

// --- src/audio/SynthAudio.js ---
class SynthAudio {
  constructor() {
    this.ctx = null;
    this.engineOsc1 = null;
    this.engineOsc2 = null;
    this.engineGain = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(muted) {
    this.muted = !!muted;
    if (this.muted) {
      this.stopEngine();
    }
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  playRodIgnite() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc2.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(720, now + 0.55);

    osc2.frequency.setValueAtTime(360, now);
    osc2.frequency.exponentialRampToValueAtTime(1440, now + 0.55);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.16, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + 0.65);
    osc2.stop(now + 0.65);
  }

  playWireframeRez() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const notes = [330, 440, 554.37, 659.25, 880, 1108.73];
    notes.forEach((freq, idx) => {
      const now = this.ctx.currentTime + idx * 0.11;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.23);
    });
  }

  playTouchdown() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(36, now + 0.45);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  startEngine() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    this.stopEngine();

    const now = this.ctx.currentTime;
    this.engineOsc1 = this.ctx.createOscillator();
    this.engineOsc2 = this.ctx.createOscillator();
    this.engineGain = this.ctx.createGain();

    this.engineOsc1.type = 'sawtooth';
    this.engineOsc2.type = 'triangle';
    this.engineOsc1.frequency.setValueAtTime(85, now);
    this.engineOsc2.frequency.setValueAtTime(170, now);

    this.engineGain.gain.setValueAtTime(0.06, now);

    this.engineOsc1.connect(this.engineGain);
    this.engineOsc2.connect(this.engineGain);
    this.engineGain.connect(this.ctx.destination);

    this.engineOsc1.start(now);
    this.engineOsc2.start(now);
  }

  updateEngine(speedRatio = 1.0, isBoosting = false, slipstream = false) {
    if (!this.ctx || !this.engineOsc1 || !this.engineOsc2) return;
    const now = this.ctx.currentTime;
    const baseFreq = 82 * speedRatio + (isBoosting ? 42 : 0) + (slipstream ? 15 : 0);
    this.engineOsc1.frequency.setTargetAtTime(baseFreq, now, 0.05);
    this.engineOsc2.frequency.setTargetAtTime(baseFreq * 2.01, now, 0.05);
    this.engineGain.gain.setTargetAtTime(isBoosting ? 0.1 : 0.055, now, 0.06);
  }

  stopEngine() {
    if (this.engineOsc1) {
      try { this.engineOsc1.stop(); } catch (_) {}
      this.engineOsc1.disconnect();
      this.engineOsc1 = null;
    }
    if (this.engineOsc2) {
      try { this.engineOsc2.stop(); } catch (_) {}
      this.engineOsc2.disconnect();
      this.engineOsc2 = null;
    }
    if (this.engineGain) {
      this.engineGain.disconnect();
      this.engineGain = null;
    }
  }

  playTurn(isPlayer = true) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    const startFreq = isPlayer ? 520 : 390;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 1.45, now + 0.065);

    gain.gain.setValueAtTime(isPlayer ? 0.09 : 0.045, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  playDerezz() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    this.stopEngine();
    const now = this.ctx.currentTime;

    // White noise burst
    const bufferSize = this.ctx.sampleRate * 0.65;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.2));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.exponentialRampToValueAtTime(120, now + 0.6);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.32, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);

    // Descending derezz synth tone
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.6);
    oscGain.gain.setValueAtTime(0.18, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.62);
    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.64);
  }
}

// --- src/scene/GridArena.js ---

class GridArena {
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

// --- src/scene/LightCycle.js ---

class LightCycle {
  constructor(scene, config) {
    this.scene = scene;
    this.name = config.name || 'PLAYER';
    this.color = config.color || 0x00f3ff;
    this.secondaryColor = config.isPlayer ? 0x99ffff : 0xffcc66;
    this.isPlayer = !!config.isPlayer;

    this.startX = config.startX || -40;
    this.startZ = config.startZ || 0;
    this.startDir = config.startDir ? config.startDir.clone() : new THREE.Vector2(1, 0);

    this.baseSpeed = 42;
    this.boostSpeed = 68;
    this.wallHeight = 2.6;

    this.root = new THREE.Group();
    this.scene.add(this.root);

    // Sub-groups for Intro Animation & Riding
    this.bikeGroup = new THREE.Group();
    this.riderGroup = new THREE.Group();
    this.root.add(this.bikeGroup);
    this.root.add(this.riderGroup);

    this.trailGroup = new THREE.Group();
    this.scene.add(this.trailGroup);

    this.wheelSpinPhase = 0;

    this.buildLegoMinifigRider();
    this.buildClassic1982CycleMesh();
    this.reset();
  }

  /**
   * Generates a crisp canvas texture for the LEGO Minifigure face:
   * Classic LEGO yellow surface, expressive eyes with white pupil reflections,
   * determined eyebrows, and a confident grin.
   */
  createLegoFaceTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Classic LEGO Yellow ABS Plastic base
    ctx.fillStyle = '#f6c616';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle front-facing features centered at x = 256 (mapped to +Z on cylinder)
    const cx = 256;
    const cy = 122;

    // Determined LEGO Eyebrows
    ctx.strokeStyle = '#181818';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - 56, cy - 32);
    ctx.lineTo(cx - 20, cy - 22);
    ctx.moveTo(cx + 56, cy - 32);
    ctx.lineTo(cx + 20, cy - 22);
    ctx.stroke();

    // Classic LEGO Black Oval Eyes
    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.arc(cx - 36, cy, 14, 0, Math.PI * 2);
    ctx.arc(cx + 36, cy, 14, 0, Math.PI * 2);
    ctx.fill();

    // White Eye Sparkle Dots
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx - 40, cy - 5, 4.5, 0, Math.PI * 2);
    ctx.arc(cx + 32, cy - 5, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Confident LEGO Smirk / Grin
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(cx, cy + 16, 30, 0.18 * Math.PI, 0.82 * Math.PI);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }

  /**
   * Builds an authentic, glossy ABS-plastic LEGO Minifigure dressed in a 1982 TRON suit:
   * - Iconic trapezoidal LEGO torso with glowing 1982 TRON circuit print on front & back
   * - Cylindrical yellow LEGO head with top stud, canvas-printed LEGO eyes/grin, and translucent neon TRON helmet & flip visor
   * - Hinged LEGO hip & rectangular blocky legs (with bottom foot step & calf peg holes)
   * - Hinged LEGO arms with iconic yellow C-shaped claw hands that snap onto the Handheld Control Rod!
   */
  buildLegoMinifigRider() {
    const hexColor = this.isPlayer ? '#00f3ff' : '#ff6600';

    // Glossy LEGO ABS Plastic materials
    const legoSuitMat = new THREE.MeshPhongMaterial({
      color: 0x162234,
      emissive: 0x050b14,
      specular: 0x99bbdd,
      shininess: 85
    });

    const legoYellowMat = new THREE.MeshPhongMaterial({
      color: 0xf6c616,
      emissive: 0x241a00,
      specular: 0xffffff,
      shininess: 95
    });

    const neonMat = new THREE.MeshBasicMaterial({ color: this.color });
    const brightCoreMat = new THREE.MeshBasicMaterial({ color: this.secondaryColor });
    const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Root of the LEGO minifigure skeleton
    this.riderPoseGroup = new THREE.Group();
    this.riderGroup.add(this.riderPoseGroup);

    // =========================================================================
    // 1. LEGO PELVIS / HIPS & HINGED BLOCKY LEGO LEGS
    // =========================================================================
    this.pelvisGroup = new THREE.Group();
    this.pelvisGroup.position.set(0, 0.72, 0);
    this.riderPoseGroup.add(this.pelvisGroup);

    // LEGO Hip Pelvis Block + Center Leg Divider T-Piece
    const hipWaist = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.11, 0.24), legoSuitMat);
    hipWaist.position.y = 0.04;
    this.pelvisGroup.add(hipWaist);

    const hipBeltGlow = new THREE.Mesh(new THREE.BoxGeometry(0.47, 0.038, 0.25), neonMat);
    hipBeltGlow.position.y = 0.05;
    this.pelvisGroup.add(hipBeltGlow);

    const hipCenterDivider = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.23), legoSuitMat);
    hipCenterDivider.position.y = -0.06;
    this.pelvisGroup.add(hipCenterDivider);

    // LEGO Hip Axle Cylinder
    const hipAxle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.085, 0.085, 0.44, 16).rotateZ(Math.PI / 2),
      legoSuitMat
    );
    hipAxle.position.y = -0.06;
    this.pelvisGroup.add(hipAxle);

    const createLegoLeg = (side) => {
      const hipJoint = new THREE.Group();
      hipJoint.position.set(side * 0.13, -0.06, 0);

      // Upper rounded hinge drum of LEGO leg
      const legHinge = new THREE.Mesh(
        new THREE.CylinderGeometry(0.115, 0.115, 0.19, 16).rotateZ(Math.PI / 2),
        legoSuitMat
      );
      hipJoint.add(legHinge);

      // Main Rectangular LEGO Leg Block
      const legHeight = 0.48;
      const legBlock = new THREE.Mesh(new THREE.BoxGeometry(0.19, legHeight, 0.23), legoSuitMat);
      legBlock.position.set(0, -legHeight / 2 - 0.04, 0);
      hipJoint.add(legBlock);

      // LEGO Foot Toe Step Protrusion at the bottom front
      const footToe = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.12, 0.09), legoSuitMat);
      footToe.position.set(0, -legHeight - 0.04 + 0.06, 0.14);
      hipJoint.add(footToe);

      // Tron Neon Circuit Stripe on the front & side of the LEGO Leg
      const frontLegCircuit = new THREE.Mesh(new THREE.BoxGeometry(0.06, legHeight * 0.82, 0.238), neonMat);
      frontLegCircuit.position.set(0, -legHeight / 2 - 0.02, 0);
      hipJoint.add(frontLegCircuit);

      const footTrim = new THREE.Mesh(new THREE.BoxGeometry(0.196, 0.032, 0.325), brightCoreMat);
      footTrim.position.set(0, -legHeight - 0.01, 0.045);
      hipJoint.add(footTrim);

      // Dummy kneeJoint group so existing animation code remains compatible if needed
      const kneeJoint = new THREE.Group();
      hipJoint.add(kneeJoint);

      this.pelvisGroup.add(hipJoint);
      return { hipJoint, kneeJoint };
    };

    this.leftLeg = createLegoLeg(-1);
    this.rightLeg = createLegoLeg(1);

    // =========================================================================
    // 2. ICONIC TRAPEZOIDAL LEGO TORSO WITH 1982 TRON CIRCUITRY
    // =========================================================================
    this.riderTorso = new THREE.Group();
    this.riderTorso.position.set(0, 0.09, 0);
    this.pelvisGroup.add(this.riderTorso);

    // Build authentic tapered LEGO Torso geometry (wider at shoulders: 0.56, narrower at waist: 0.46, height: 0.56, depth: 0.25)
    const torsoShape = new THREE.Shape();
    torsoShape.moveTo(-0.23, 0);
    torsoShape.lineTo(0.23, 0);
    torsoShape.lineTo(0.28, 0.56);
    torsoShape.lineTo(-0.28, 0.56);
    torsoShape.closePath();

    const extrudeSettings = {
      depth: 0.24,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.018,
      bevelThickness: 0.018
    };
    const torsoGeo = new THREE.ExtrudeGeometry(torsoShape, extrudeSettings);
    torsoGeo.translate(0, 0, -0.12);
    const torsoMesh = new THREE.Mesh(torsoGeo, legoSuitMat);
    this.riderTorso.add(torsoMesh);

    // Classic 1982 TRON Circuitry Printed on Front & Back of LEGO Torso
    const centerStem = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.48, 0.282), neonMat);
    centerStem.position.set(0, 0.28, 0);
    this.riderTorso.add(centerStem);

    // Y-Collar & Horizontal Circuit Ribs
    [0.14, 0.28, 0.42].forEach((yPos, idx) => {
      const ribW = 0.28 + idx * 0.08;
      const rib = new THREE.Mesh(new THREE.BoxGeometry(ribW, 0.036, 0.282), neonMat);
      rib.position.set(0, yPos, 0);
      this.riderTorso.add(rib);
    });

    const coreDisk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.085, 0.085, 0.286, 16).rotateX(Math.PI / 2),
      brightCoreMat
    );
    coreDisk.position.set(0, 0.36, 0);
    this.riderTorso.add(coreDisk);

    // LEGO Neck Post
    const neckPost = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.10, 16), legoYellowMat);
    neckPost.position.set(0, 0.60, 0);
    this.riderTorso.add(neckPost);

    // =========================================================================
    // 3. CYLINDRICAL YELLOW LEGO HEAD, TOP STUD, & 1982 TRON HELMET
    // =========================================================================
    this.helmetGroup = new THREE.Group();
    this.helmetGroup.position.set(0, 0.63, 0);
    this.riderTorso.add(this.helmetGroup);

    // Classic Cylindrical LEGO Head with Face Texture on Side
    const faceTex = this.createLegoFaceTexture();
    const headSideMat = new THREE.MeshPhongMaterial({
      map: faceTex,
      specular: 0xffffff,
      shininess: 90
    });
    // CylinderGeometry materials: [side, top, bottom]
    const legoHeadGeo = new THREE.CylinderGeometry(0.195, 0.195, 0.32, 24);
    // Rotate so texture center (U=0.5) faces directly forward (+Z)
    legoHeadGeo.rotateY(-Math.PI / 2);
    const legoHead = new THREE.Mesh(legoHeadGeo, [headSideMat, legoYellowMat, legoYellowMat]);
    legoHead.position.set(0, 0.18, 0);
    this.helmetGroup.add(legoHead);

    // Iconic LEGO Head Lower Lip & Top Stud
    const headBottomRim = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.04, 20), legoYellowMat);
    headBottomRim.position.set(0, 0.01, 0);
    this.helmetGroup.add(headBottomRim);

    const topStud = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.065, 20), legoYellowMat);
    topStud.position.set(0, 0.365, 0);
    this.helmetGroup.add(topStud);

    // Snap-on 1982 LEGO TRON Helmet (Open-face helmet with glowing circuit crest & translucent neon visor)
    const helmetShell = new THREE.Mesh(
      new THREE.SphereGeometry(0.228, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.62),
      legoSuitMat
    );
    helmetShell.rotation.x = -0.22;
    helmetShell.position.set(0, 0.22, -0.01);
    this.helmetGroup.add(helmetShell);

    // Helmet Ear/Cheek Guards
    [-0.20, 0.20].forEach((xEar) => {
      const earGuard = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.22, 0.18), legoSuitMat);
      earGuard.position.set(xEar, 0.17, 0.0);
      this.helmetGroup.add(earGuard);

      const earGlow = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.16, 0.04), neonMat);
      earGlow.position.set(xEar, 0.17, 0.03);
      this.helmetGroup.add(earGlow);
    });

    // Translucent Glowing LEGO Visor (lets you see the yellow LEGO face & eyes right through it!)
    const visorMat = new THREE.MeshPhongMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.38,
      side: THREE.DoubleSide
    });
    const legoVisor = new THREE.Mesh(
      new THREE.CylinderGeometry(0.225, 0.225, 0.14, 20, 1, true, -Math.PI * 0.38, Math.PI * 0.76),
      visorMat
    );
    legoVisor.position.set(0, 0.20, 0.02);
    this.helmetGroup.add(legoVisor);

    // Classic 3-Stripe 1982 Helmet Circuit Crest
    [-0.075, 0, 0.075].forEach((xCrest) => {
      const crest = new THREE.Mesh(
        new THREE.TorusGeometry(0.23, 0.016, 8, 20, Math.PI * 0.95),
        brightCoreMat
      );
      crest.rotation.y = Math.PI / 2;
      crest.rotation.x = -0.18;
      crest.position.set(xCrest, 0.22, -0.01);
      this.helmetGroup.add(crest);
    });

    // =========================================================================
    // 4. LEGO ARMS & ICONIC YELLOW C-SHAPED CLAW HANDS
    // =========================================================================
    const createLegoArm = (side) => {
      const shoulderJoint = new THREE.Group();
      shoulderJoint.position.set(side * 0.31, 0.48, 0.0);

      // Rounded LEGO Shoulder Cap
      const shoulderBall = new THREE.Mesh(new THREE.SphereGeometry(0.082, 14, 12), legoSuitMat);
      shoulderJoint.add(shoulderBall);

      // Upper Angled LEGO Arm Cylinder
      const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.076, 0.068, 0.24, 14), legoSuitMat);
      upperArm.position.set(side * 0.02, -0.12, 0);
      upperArm.rotation.z = side * 0.12;
      shoulderJoint.add(upperArm);

      const armStripe = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.20, 0.085), neonMat);
      armStripe.position.set(side * 0.065, -0.12, 0);
      armStripe.rotation.z = side * 0.12;
      shoulderJoint.add(armStripe);

      // Elbow / Forearm Joint
      const elbowJoint = new THREE.Group();
      elbowJoint.position.set(side * 0.035, -0.24, 0);
      shoulderJoint.add(elbowJoint);

      const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.062, 0.18, 14), legoSuitMat);
      forearm.position.y = -0.09;
      elbowJoint.add(forearm);

      // Wrist Stem
      const wrist = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.06, 12), legoYellowMat);
      wrist.position.y = -0.19;
      elbowJoint.add(wrist);

      // Iconic Yellow LEGO C-Shaped Claw Hand (Torus arc ~270 degrees)
      const clawHand = new THREE.Mesh(
        new THREE.TorusGeometry(0.068, 0.028, 10, 20, Math.PI * 1.55),
        legoYellowMat
      );
      clawHand.rotation.y = Math.PI / 2;
      clawHand.rotation.z = Math.PI * 0.72;
      clawHand.position.set(0, -0.25, 0.01);
      elbowJoint.add(clawHand);

      this.riderTorso.add(shoulderJoint);
      return { shoulderJoint, elbowJoint, hand: clawHand };
    };

    this.leftArm = createLegoArm(-1);
    this.rightArm = createLegoArm(1);

    // =========================================================================
    // 5. SPLITTABLE LEGO CONTROL ROD (BATON -> LEFT/RIGHT HANDLEBARS)
    // =========================================================================
    this.batonGroup = new THREE.Group();
    this.batonGroup.position.set(0, 0.36, 0.44);
    this.riderTorso.add(this.batonGroup);

    const halfRodGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.28, 12);
    halfRodGeo.rotateZ(Math.PI / 2);

    this.leftBatonHalf = new THREE.Group();
    this.leftBatonHalf.add(new THREE.Mesh(halfRodGeo, whiteMat));
    // LEGO Stud end-cap on the rod
    const leftStud = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, 0.04, 14).rotateZ(Math.PI / 2),
      neonMat
    );
    leftStud.position.x = -0.15;
    this.leftBatonHalf.add(leftStud);
    this.leftBatonHalf.position.x = -0.14;
    this.batonGroup.add(this.leftBatonHalf);

    this.rightBatonHalf = new THREE.Group();
    this.rightBatonHalf.add(new THREE.Mesh(halfRodGeo, whiteMat));
    const rightStud = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, 0.04, 14).rotateZ(Math.PI / 2),
      neonMat
    );
    rightStud.position.x = 0.15;
    this.rightBatonHalf.add(rightStud);
    this.rightBatonHalf.position.x = 0.14;
    this.batonGroup.add(this.rightBatonHalf);

    // Plasma Arc Bridge between the two LEGO rod halves
    const bridgeGeo = new THREE.CylinderGeometry(0.024, 0.024, 1.0, 10);
    bridgeGeo.rotateZ(Math.PI / 2);
    this.batonPlasmaBridge = new THREE.Mesh(
      bridgeGeo,
      new THREE.MeshBasicMaterial({ color: this.color, transparent: true, opacity: 0.95 })
    );
    this.batonPlasmaBridge.scale.x = 0.28;
    this.batonGroup.add(this.batonPlasmaBridge);

    // Expanding Ignition Halo Ring around the Baton
    const haloGeo = new THREE.RingGeometry(0.16, 0.28, 24);
    this.batonHalo = new THREE.Mesh(
      haloGeo,
      new THREE.MeshBasicMaterial({
        color: this.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.0
      })
    );
    this.batonGroup.add(this.batonHalo);

    // Vector laser beams projecting from the Rod to materialize the cycle
    const beamMat = new THREE.MeshBasicMaterial({
      color: this.secondaryColor,
      transparent: true,
      opacity: 0.0
    });
    this.frontBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.5, 8), beamMat);
    this.frontBeam.rotation.x = Math.PI / 2;
    this.frontBeam.position.z = 0.75;
    this.batonGroup.add(this.frontBeam);

    this.rearBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.2, 8), beamMat);
    this.rearBeam.rotation.x = Math.PI / 2;
    this.rearBeam.position.z = -1.1;
    this.batonGroup.add(this.rearBeam);

    // Vertical Digital Scan-Plane Ring
    const scanRingGeo = new THREE.RingGeometry(0.65, 0.98, 24);
    this.rezScanPlane = new THREE.Mesh(
      scanRingGeo,
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.0
      })
    );
    this.root.add(this.rezScanPlane);
  }

  /**
   * Builds the classic 1982 Syd Mead / MAGI Synthavision Light Cycle
   * sized with an open cockpit bay for the LEGO Minifigure rider.
   */
  buildClassic1982CycleMesh() {
    this.hullMat = new THREE.MeshPhongMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 0.18,
      specular: 0xffffff,
      shininess: 95,
      transparent: true,
      opacity: 1.0
    });

    this.darkCoreMat = new THREE.MeshPhongMaterial({
      color: 0x050b16,
      emissive: 0x02050a,
      shininess: 60,
      transparent: true,
      opacity: 1.0
    });

    this.canopyGlassMat = new THREE.MeshPhongMaterial({
      color: 0x040a18,
      emissive: this.color,
      emissiveIntensity: 0.06,
      specular: 0xffffff,
      shininess: 120,
      transparent: true,
      opacity: 0.48
    });

    this.neonMat = new THREE.MeshBasicMaterial({
      color: this.secondaryColor,
      transparent: true,
      opacity: 1.0
    });

    this.pureColorMat = new THREE.MeshBasicMaterial({
      color: this.color,
      transparent: true,
      opacity: 1.0
    });

    this.wireframeMat = new THREE.MeshBasicMaterial({
      color: this.secondaryColor,
      wireframe: true,
      transparent: true,
      opacity: 0.0
    });

    // 1. MASSIVE 1982 ENCLOSED FRONT & REAR WHEELS
    this.frontWheelGroup = this.createClassic1982WheelAssembly(0.78, 0.56);
    this.frontWheelGroup.position.set(0, 0.78, 1.48);
    this.bikeGroup.add(this.frontWheelGroup);

    this.rearWheelGroup = this.createClassic1982WheelAssembly(0.84, 0.68);
    this.rearWheelGroup.position.set(0, 0.84, -1.48);
    this.bikeGroup.add(this.rearWheelGroup);

    // 2. SCULPTED SYD MEAD STREAMLINER CHASSIS & WHEEL FENDERS
    this.chassisGroup = new THREE.Group();

    const frontShroudGeo = new THREE.SphereGeometry(0.84, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.62);
    frontShroudGeo.scale(0.52, 1.0, 1.18);
    this.frontShroud = new THREE.Mesh(frontShroudGeo, this.hullMat);
    this.frontShroud.position.set(0, 0.78, 1.48);
    this.chassisGroup.add(this.frontShroud);

    const rearShroudGeo = new THREE.SphereGeometry(0.90, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.65);
    rearShroudGeo.scale(0.58, 1.02, 1.22);
    this.rearShroud = new THREE.Mesh(rearShroudGeo, this.hullMat);
    this.rearShroud.position.set(0, 0.84, -1.48);
    this.chassisGroup.add(this.rearShroud);

    // Lower Side Body Flanks (Left & Right sculpted pods leaving an open center cockpit bay for the LEGO rider)
    this.flankGroup = new THREE.Group();
    [-0.38, 0.38].forEach((xPod) => {
      const podGeo = new THREE.CylinderGeometry(0.22, 0.26, 2.35, 14);
      podGeo.rotateX(Math.PI / 2);
      podGeo.scale(0.85, 1.15, 1.0);
      const podMesh = new THREE.Mesh(podGeo, this.hullMat);
      podMesh.position.set(xPod, 0.56, 0.0);
      this.flankGroup.add(podMesh);
    });

    // Low cockpit saddle / belly pan with 2 LEGO studs that lock the minifigure in place
    const saddlePan = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.16, 1.85), this.darkCoreMat);
    saddlePan.position.set(0, 0.34, -0.05);
    this.flankGroup.add(saddlePan);

    [-0.49, 0.49].forEach((xSide) => {
      const upperStripe = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.07, 3.35), this.neonMat);
      upperStripe.position.set(xSide, 0.78, 0.05);
      this.flankGroup.add(upperStripe);

      const lowerStripe = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 2.95), this.pureColorMat);
      lowerStripe.position.set(xSide, 0.46, 0.0);
      this.flankGroup.add(lowerStripe);
    });
    this.chassisGroup.add(this.flankGroup);

    // 3. SWOOPING 1982 SMOKED-GLASS BUBBLE CANOPY
    this.canopyGroup = new THREE.Group();

    const domeGeo = new THREE.SphereGeometry(0.68, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.55);
    domeGeo.scale(0.78, 1.15, 2.25);
    this.canopyDome = new THREE.Mesh(domeGeo, this.canopyGlassMat);
    this.canopyDome.position.set(0, 0.90, -0.05);
    this.canopyGroup.add(this.canopyDome);

    const centerSpineArch = new THREE.Mesh(
      new THREE.TorusGeometry(0.68, 0.028, 8, 28, Math.PI),
      this.neonMat
    );
    centerSpineArch.rotation.y = Math.PI / 2;
    centerSpineArch.scale.set(2.26, 1.16, 0.78);
    centerSpineArch.position.set(0, 0.90, -0.05);
    this.canopyGroup.add(centerSpineArch);

    [-0.30, 0.30].forEach((xOff) => {
      const pillarArch = new THREE.Mesh(
        new THREE.TorusGeometry(0.64, 0.022, 8, 24, Math.PI),
        this.pureColorMat
      );
      pillarArch.rotation.y = Math.PI / 2;
      pillarArch.scale.set(2.12, 1.04, 0.78);
      pillarArch.position.set(xOff, 0.88, -0.05);
      this.canopyGroup.add(pillarArch);
    });

    const browBar = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.04, 0.05), this.neonMat);
    browBar.position.set(0, 1.45, 0.82);
    this.canopyGroup.add(browBar);

    const rearCanopyBar = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.04, 0.05), this.neonMat);
    rearCanopyBar.position.set(0, 1.38, -0.82);
    this.canopyGroup.add(rearCanopyBar);

    this.chassisGroup.add(this.canopyGroup);

    // 4. 1982 VECTOR WIREFRAME SHELL
    this.wireframeShell = new THREE.Group();
    const wfDome = new THREE.Mesh(
      new THREE.SphereGeometry(0.71, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.6),
      this.wireframeMat
    );
    wfDome.scale.set(0.76, 1.05, 2.55);
    wfDome.position.set(0, 0.88, 0);
    this.wireframeShell.add(wfDome);
    this.chassisGroup.add(this.wireframeShell);

    this.bikeGroup.add(this.chassisGroup);

    // Touchdown Shockwave Ring on the Floor
    const shockGeo = new THREE.RingGeometry(0.4, 0.75, 32);
    shockGeo.rotateX(-Math.PI / 2);
    this.shockwaveRing = new THREE.Mesh(
      shockGeo,
      new THREE.MeshBasicMaterial({
        color: this.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.0
      })
    );
    this.shockwaveRing.position.y = 0.05;
    this.root.add(this.shockwaveRing);
  }

  createClassic1982WheelAssembly(radius, width) {
    const wheelGroup = new THREE.Group();

    const drumGeo = new THREE.CylinderGeometry(radius * 0.94, radius * 0.94, width, 24);
    drumGeo.rotateZ(Math.PI / 2);
    const drum = new THREE.Mesh(drumGeo, this.darkCoreMat);
    wheelGroup.add(drum);

    const rimTorusGeo = new THREE.TorusGeometry(radius * 0.82, 0.055, 10, 28);
    rimTorusGeo.rotateY(Math.PI / 2);

    const leftRim = new THREE.Mesh(rimTorusGeo, this.neonMat);
    leftRim.position.x = -width / 2 - 0.01;
    wheelGroup.add(leftRim);

    const rightRim = new THREE.Mesh(rimTorusGeo, this.neonMat);
    rightRim.position.x = width / 2 + 0.01;
    wheelGroup.add(rightRim);

    const hubGeo = new THREE.CylinderGeometry(radius * 0.28, radius * 0.28, width + 0.06, 16);
    hubGeo.rotateZ(Math.PI / 2);
    const hub = new THREE.Mesh(hubGeo, this.pureColorMat);
    wheelGroup.add(hub);

    for (let i = 0; i < 4; i++) {
      const spoke = new THREE.Mesh(
        new THREE.BoxGeometry(width + 0.05, radius * 1.58, 0.065),
        this.neonMat
      );
      spoke.rotation.x = (i * Math.PI) / 4;
      wheelGroup.add(spoke);
    }

    return wheelGroup;
  }

  reset() {
    this.pos = new THREE.Vector2(this.startX, this.startZ);
    this.dir = this.startDir.clone();
    this.turnQueue = [];
    this.alive = true;
    this.isBoosting = false;
    this.boostEnergy = 100;
    this.inSlipstream = false;
    this.leanAngle = 0;
    this.currentSpeed = this.baseSpeed;

    while (this.trailGroup.children.length > 0) {
      const child = this.trailGroup.children.pop();
      if (child.geometry) child.geometry.dispose();
    }

    this.segments = [];
    this.currentSegmentStart = this.pos.clone();
    this.activeWallMesh = this.createWallMesh();
    this.trailGroup.add(this.activeWallMesh);

    this.inIntro = true;
    this.setIntroAnimationState(0);
    this.syncTransform();
    this.updateActiveWallMesh();
  }

  /**
   * LEGO Minifigure 4-Stage 1982 Movie Choreography:
   * - Phase 1 (0.00 -> 0.25): LEGO Minifigure stands alone on the Grid, raises its yellow C-grip hands, and ignites the Handheld Control Rod.
   * - Phase 2 (0.25 -> 0.55): LEGO Minifigure takes snappy brick-film waddle-sprint steps forward, leaps into the air, splits the Rod into Left/Right Handlebars, and locks into the crouched riding posture suspended in mid-air.
   * - Phase 3 (0.55 -> 0.86): ONLY AFTER the LEGO Minifigure is locked in riding position, the Light Cycle wheels, side pods, and smoked canopy materialize around them.
   * - Phase 4 (0.86 -> 1.00): Touchdown onto the Grid with shockwave ring.
   */
  setIntroAnimationState(progress) {
    this.inIntro = true;
    this.root.visible = true;
    this.activeWallMesh.visible = false;
    this.riderGroup.visible = true;

    if (progress < 0.25) {
      // =====================================================================
      // PHASE 1: LEGO MINIFIGURE STANDS ALONE & IGNITES CONTROL ROD (0.00 -> 0.25)
      // =====================================================================
      const t = progress / 0.25;
      const smoothT = t * t * (3 - 2 * t);

      this.bikeGroup.visible = false;
      this.frontWheelGroup.visible = false;
      this.rearWheelGroup.visible = false;
      this.frontShroud.visible = false;
      this.rearShroud.visible = false;
      this.flankGroup.visible = false;
      this.canopyGroup.visible = false;
      this.wireframeShell.visible = false;

      this.riderPoseGroup.position.set(0, 0, -1.5);
      this.pelvisGroup.position.set(0, 0.62, 0);
      this.riderTorso.rotation.x = 0.08 * smoothT;
      // Cute LEGO head look-around before locking eyes forward
      this.helmetGroup.rotation.y = Math.sin(t * Math.PI * 2) * 0.22 * (1 - smoothT);
      this.helmetGroup.rotation.x = -0.05 * smoothT;

      this.leftLeg.hipJoint.rotation.x = -0.18 * smoothT;
      this.rightLeg.hipJoint.rotation.x = 0.18 * smoothT;

      // LEGO arms swing up to hold the Control Rod in front of the chest
      const shPitch = -0.55 - smoothT * 0.72;
      this.leftArm.shoulderJoint.rotation.set(shPitch, 0.22 * (1 - smoothT * 0.5), 0);
      this.rightArm.shoulderJoint.rotation.set(shPitch, -0.22 * (1 - smoothT * 0.5), 0);
      this.leftArm.elbowJoint.rotation.set(-0.45, 0, 0);
      this.rightArm.elbowJoint.rotation.set(-0.45, 0, 0);

      this.batonGroup.position.set(0, 0.34 + smoothT * 0.12, 0.36 + smoothT * 0.10);
      this.leftBatonHalf.position.x = -0.14;
      this.rightBatonHalf.position.x = 0.14;
      this.batonPlasmaBridge.scale.x = 0.28;

      this.batonHalo.material.opacity = Math.sin(t * Math.PI) * 0.95;
      const haloScale = 0.5 + smoothT * 2.8;
      this.batonHalo.scale.set(haloScale, haloScale, 1);

      this.frontBeam.material.opacity = 0;
      this.rearBeam.material.opacity = 0;
      this.rezScanPlane.material.opacity = 0;
      this.shockwaveRing.material.opacity = 0;
    } else if (progress < 0.55) {
      // =====================================================================
      // PHASE 2: LEGO SPRINT, AIRBORNE LEAP & LOCK INTO RIDING POSTURE (0.25 -> 0.55)
      // =====================================================================
      const t = (progress - 0.25) / 0.30;
      this.bikeGroup.visible = false;
      this.frontWheelGroup.visible = false;
      this.rearWheelGroup.visible = false;
      this.frontShroud.visible = false;
      this.rearShroud.visible = false;
      this.flankGroup.visible = false;
      this.canopyGroup.visible = false;
      this.wireframeShell.visible = false;
      this.rezScanPlane.material.opacity = 0;
      this.shockwaveRing.material.opacity = 0;
      this.helmetGroup.rotation.y = 0;

      if (t < 0.52) {
        // Sub-phase 2A: Energetic LEGO Minifigure running steps (hinged blocky legs swinging wide!)
        const runT = t / 0.52;
        const stridePhase = runT * Math.PI * 2.5;
        const zAdvance = -1.5 + runT * 1.15;
        const bobY = Math.abs(Math.sin(stridePhase)) * 0.15;

        this.riderPoseGroup.position.set(0, bobY, zAdvance);
        this.pelvisGroup.position.set(0, 0.62, 0);
        this.riderTorso.rotation.x = 0.28 + runT * 0.25;
        this.helmetGroup.rotation.x = -0.20 - runT * 0.18;

        // Classic stiff-knee LEGO leg swing
        const swing = Math.sin(stridePhase) * 0.85;
        this.leftLeg.hipJoint.rotation.x = -swing;
        this.rightLeg.hipJoint.rotation.x = swing;

        this.leftArm.shoulderJoint.rotation.set(-1.30 - runT * 0.30, 0.14, 0);
        this.rightArm.shoulderJoint.rotation.set(-1.30 - runT * 0.30, -0.14, 0);
        this.leftArm.elbowJoint.rotation.set(-0.45, 0, 0);
        this.rightArm.elbowJoint.rotation.set(-0.45, 0, 0);

        this.batonGroup.position.set(0, 0.46, 0.46);
        this.frontBeam.material.opacity = 0;
        this.rearBeam.material.opacity = 0;
      } else {
        // Sub-phase 2B: LEGO Minifigure leaps airborne, splits the Rod into handlebars, and locks into riding posture!
        const leapT = (t - 0.52) / 0.48;
        const ease = 1 - Math.pow(1 - leapT, 3);

        const hoverY = 0.18;
        const arcBoost = Math.sin(leapT * Math.PI) * 0.28;

        this.riderPoseGroup.position.set(
          0,
          (1 - ease) * 0.05 + ease * (-0.12 + hoverY) + arcBoost,
          (1 - ease) * -0.35 + ease * 0.02
        );
        this.pelvisGroup.position.set(0, 0.62, -ease * 0.22);

        this.riderTorso.rotation.x = 0.53 + ease * (1.28 - 0.53);
        this.helmetGroup.rotation.x = -0.38 + ease * (-0.98 + 0.38);

        // LEGO legs swing back into riding crouch
        this.leftLeg.hipJoint.rotation.x = 0.20 + ease * (1.15 - 0.20);
        this.rightLeg.hipJoint.rotation.x = 0.20 + ease * (1.15 - 0.20);

        const armReach = -1.60 + ease * (-2.08 + 1.60);
        this.leftArm.shoulderJoint.rotation.set(armReach, (1 - ease) * 0.14 - ease * 0.08, -ease * 0.12);
        this.rightArm.shoulderJoint.rotation.set(armReach, -(1 - ease) * 0.14 + ease * 0.08, ease * 0.12);
        this.leftArm.elbowJoint.rotation.set(-0.45 + ease * 0.20, 0, 0);
        this.rightArm.elbowJoint.rotation.set(-0.45 + ease * 0.20, 0, 0);

        const splitDist = 0.14 + ease * 0.15;
        this.leftBatonHalf.position.x = -splitDist;
        this.rightBatonHalf.position.x = splitDist;
        this.batonPlasmaBridge.scale.x = splitDist * 2;
        this.batonGroup.position.set(0, 0.46 + ease * 0.24, 0.46 - ease * 0.08);

        this.batonHalo.material.opacity = (1 - ease) * 0.6;
        const beamIgnite = Math.max(0, (leapT - 0.65) / 0.35);
        this.frontBeam.material.opacity = beamIgnite * 0.95;
        this.rearBeam.material.opacity = beamIgnite * 0.95;
      }
    } else if (progress < 0.86) {
      // =====================================================================
      // PHASE 3: SEQUENTIAL CYCLE MATERIALIZATION AROUND LOCKED LEGO RIDER (0.55 -> 0.86)
      // =====================================================================
      const t = (progress - 0.55) / 0.31;
      const hoverY = 0.18 * (1 - Math.pow(t, 2));

      this.setRiderInCanopyPosture(hoverY);

      this.frontBeam.material.opacity = Math.max(0, 1 - t * 1.4) * 0.95;
      this.rearBeam.material.opacity = Math.max(0, 1 - t * 1.4) * 0.95;

      this.rezScanPlane.position.set(0, 0.9 + hoverY, 2.3 - t * 4.6);
      this.rezScanPlane.material.opacity = Math.sin(t * Math.PI) * 0.95;

      this.bikeGroup.visible = true;
      this.frontWheelGroup.visible = true;
      this.rearWheelGroup.visible = true;
      this.wireframeShell.visible = true;
      this.bikeGroup.position.y = hoverY;
      this.chassisGroup.scale.set(1, 1, 1);

      const wheelProgress = Math.min(1, t / 0.40);
      const wheelEase = 1 - Math.pow(1 - wheelProgress, 3);
      this.frontWheelGroup.position.z = 1.48;
      this.rearWheelGroup.position.z = -1.48;
      this.frontWheelGroup.scale.setScalar(0.05 + 0.95 * wheelEase);
      this.rearWheelGroup.scale.setScalar(0.05 + 0.95 * wheelEase);
      this.frontWheelGroup.rotation.x += 0.35;
      this.rearWheelGroup.rotation.x += 0.35;

      const bodyProgress = Math.max(0, Math.min(1, (t - 0.20) / 0.55));
      const bodyEase = 1 - Math.pow(1 - bodyProgress, 3);
      this.frontShroud.visible = bodyProgress > 0.01;
      this.rearShroud.visible = bodyProgress > 0.01;
      this.flankGroup.visible = bodyProgress > 0.01;
      this.hullMat.opacity = bodyEase;
      this.darkCoreMat.opacity = Math.max(wheelEase * 0.5, bodyEase);
      this.neonMat.opacity = Math.min(1, t * 1.8);
      this.pureColorMat.opacity = Math.min(1, t * 1.8);
      this.wireframeMat.opacity = Math.sin(t * Math.PI) * 0.92;

      const canopyProgress = Math.max(0, Math.min(1, (t - 0.50) / 0.50));
      const canopyEase = 1 - Math.pow(1 - canopyProgress, 3);
      this.canopyGroup.visible = canopyProgress > 0.02;
      this.canopyGroup.position.y = (1 - canopyEase) * 0.72;
      this.canopyGroup.rotation.x = -(1 - canopyEase) * 0.32;
      this.canopyGlassMat.opacity = canopyEase * 0.48;
    } else {
      // =====================================================================
      // PHASE 4: TOUCHDOWN SUSPENSION COMPRESSION & SHOCKWAVE (0.86 -> 1.00)
      // =====================================================================
      const t = (progress - 0.86) / 0.14;
      const bounce = Math.sin(t * Math.PI) * -0.07;

      this.bikeGroup.visible = true;
      this.frontWheelGroup.visible = true;
      this.rearWheelGroup.visible = true;
      this.frontShroud.visible = true;
      this.rearShroud.visible = true;
      this.flankGroup.visible = true;
      this.canopyGroup.visible = true;
      this.wireframeShell.visible = true;

      const offsetY = Math.max(0, bounce);
      this.bikeGroup.position.y = offsetY;
      this.canopyGroup.position.y = 0;
      this.canopyGroup.rotation.x = 0;
      this.frontWheelGroup.scale.setScalar(1);
      this.rearWheelGroup.scale.setScalar(1);
      this.frontWheelGroup.position.z = 1.48;
      this.rearWheelGroup.position.z = -1.48;
      this.frontWheelGroup.rotation.x += 0.45;
      this.rearWheelGroup.rotation.x += 0.45;
      this.chassisGroup.scale.set(1, 1, 1);

      this.setRiderInCanopyPosture(offsetY);

      this.rezScanPlane.material.opacity = 0;
      this.wireframeMat.opacity = Math.max(0, (1 - t * 2.2) * 0.45);
      this.hullMat.opacity = 1.0;
      this.darkCoreMat.opacity = 1.0;
      this.canopyGlassMat.opacity = 0.48;
      this.neonMat.opacity = 1.0;
      this.pureColorMat.opacity = 1.0;
      this.frontBeam.material.opacity = 0;
      this.rearBeam.material.opacity = 0;
      this.batonHalo.material.opacity = 0;

      const ringScale = 1 + t * 8.0;
      this.shockwaveRing.scale.set(ringScale, ringScale, 1);
      this.shockwaveRing.material.opacity = (1 - t) * 0.95;
    }
  }

  /**
   * Positions the LEGO Minifigure rider crouched inside the open cockpit bay
   * gripping the split Control Rod handlebars with its yellow C-hands.
   */
  setRiderInCanopyPosture(extraY = 0) {
    this.riderGroup.visible = true;
    this.riderPoseGroup.position.set(0, -0.12 + extraY, 0.02);
    this.pelvisGroup.position.set(0, 0.62, -0.22);

    this.riderTorso.rotation.x = 1.28;
    this.helmetGroup.rotation.x = -0.98;
    this.helmetGroup.rotation.y = 0;

    this.leftLeg.hipJoint.rotation.x = 1.15;
    this.rightLeg.hipJoint.rotation.x = 1.15;

    this.leftArm.shoulderJoint.rotation.set(-2.08, -0.08, -0.12);
    this.rightArm.shoulderJoint.rotation.set(-2.08, 0.08, 0.12);
    this.leftArm.elbowJoint.rotation.set(-0.25, 0, 0);
    this.rightArm.elbowJoint.rotation.set(-0.25, 0, 0);

    this.leftBatonHalf.position.x = -0.29;
    this.rightBatonHalf.position.x = 0.29;
    this.batonPlasmaBridge.scale.x = 0.58;
    this.batonGroup.position.set(0, 0.70, 0.38);

    this.batonHalo.material.opacity = 0;
    this.frontBeam.material.opacity = 0;
    this.rearBeam.material.opacity = 0;
    this.rezScanPlane.material.opacity = 0;
  }

  setCompletedIntroState() {
    this.inIntro = false;
    this.root.visible = true;
    this.bikeGroup.visible = true;
    this.frontWheelGroup.visible = true;
    this.rearWheelGroup.visible = true;
    this.frontShroud.visible = true;
    this.rearShroud.visible = true;
    this.flankGroup.visible = true;
    this.canopyGroup.visible = true;
    this.wireframeShell.visible = false;
    this.bikeGroup.position.y = 0;
    this.canopyGroup.position.y = 0;
    this.canopyGroup.rotation.x = 0;
    this.setRiderInCanopyPosture(0);

    this.wireframeMat.opacity = 0;
    this.hullMat.opacity = 1.0;
    this.darkCoreMat.opacity = 1.0;
    this.canopyGlassMat.opacity = 0.48;
    this.neonMat.opacity = 1.0;
    this.pureColorMat.opacity = 1.0;

    this.frontWheelGroup.scale.setScalar(1);
    this.rearWheelGroup.scale.setScalar(1);
    this.frontWheelGroup.position.z = 1.48;
    this.rearWheelGroup.position.z = -1.48;
    this.chassisGroup.scale.set(1, 1, 1);
    this.shockwaveRing.material.opacity = 0;
    if (this.activeWallMesh) {
      this.activeWallMesh.visible = true;
    }
  }

  setFirstPersonVisibility(isFirstPerson) {
    if (!this.isPlayer) return;
    if (this.inIntro) return;
    this.bikeGroup.visible = !isFirstPerson;
    this.riderGroup.visible = !isFirstPerson;
  }

  queueTurn(turnType) {
    if (this.turnQueue.length < 2) {
      this.turnQueue.push(turnType);
    }
  }

  queueCardinalDirection(targetDir) {
    const effDir = this.getEffectivePlannedDirection();
    if (effDir.x === targetDir.x && effDir.y === targetDir.y) return;
    if (effDir.x === -targetDir.x && effDir.y === -targetDir.y) return;

    const leftDir = new THREE.Vector2(effDir.y, -effDir.x);
    if (leftDir.x === targetDir.x && leftDir.y === targetDir.y) {
      this.queueTurn('LEFT');
    } else {
      this.queueTurn('RIGHT');
    }
  }

  getEffectivePlannedDirection() {
    let d = this.dir.clone();
    for (const t of this.turnQueue) {
      if (t === 'LEFT') {
        d = new THREE.Vector2(d.y, -d.x);
      } else {
        d = new THREE.Vector2(-d.y, d.x);
      }
    }
    return d;
  }

  executeImmediateTurn(turnType) {
    const segLen = this.pos.distanceTo(this.currentSegmentStart);
    if (segLen > 0.1) {
      this.segments.push({
        x1: this.currentSegmentStart.x,
        z1: this.currentSegmentStart.y,
        x2: this.pos.x,
        z2: this.pos.y
      });
      this.updateWallMeshGeometry(
        this.activeWallMesh,
        this.currentSegmentStart.x,
        this.currentSegmentStart.y,
        this.pos.x,
        this.pos.y
      );
      this.activeWallMesh = this.createWallMesh();
      this.trailGroup.add(this.activeWallMesh);
      this.currentSegmentStart.copy(this.pos);
    }

    if (turnType === 'LEFT') {
      this.dir.set(this.dir.y, -this.dir.x);
      this.leanAngle = 0.48;
    } else if (turnType === 'RIGHT') {
      this.dir.set(-this.dir.y, this.dir.x);
      this.leanAngle = -0.48;
    }
  }

  update(dt, audio) {
    if (!this.alive) return false;

    let turnedThisFrame = false;
    if (this.turnQueue.length > 0) {
      const nextTurn = this.turnQueue.shift();
      this.executeImmediateTurn(nextTurn);
      turnedThisFrame = true;
      if (audio) audio.playTurn(this.isPlayer);
    }

    if (this.isBoosting && this.boostEnergy > 0) {
      this.currentSpeed = this.boostSpeed;
      this.boostEnergy = Math.max(0, this.boostEnergy - dt * 36);
    } else {
      this.currentSpeed = this.baseSpeed;
      const regenRate = this.inSlipstream ? 28 : 8;
      this.boostEnergy = Math.min(100, this.boostEnergy + dt * regenRate);
    }

    const step = this.currentSpeed * dt;
    this.pos.x += this.dir.x * step;
    this.pos.y += this.dir.y * step;

    this.wheelSpinPhase += step * 1.25;
    this.frontWheelGroup.rotation.x = this.wheelSpinPhase;
    this.rearWheelGroup.rotation.x = this.wheelSpinPhase;

    this.leanAngle *= Math.pow(0.0015, dt);

    this.syncTransform();
    this.updateActiveWallMesh();

    return turnedThisFrame;
  }

  syncTransform() {
    this.root.position.set(this.pos.x, 0, this.pos.y);
    const yaw = Math.atan2(this.dir.x, this.dir.y);
    this.root.rotation.set(0, yaw, 0);
    this.bikeGroup.rotation.z = this.leanAngle;
    this.riderGroup.rotation.z = this.leanAngle;
  }

  createWallMesh() {
    const group = new THREE.Group();

    const bodyGeo = new THREE.BoxGeometry(0.18, this.wallHeight, 1);
    const bodyMat = new THREE.MeshBasicMaterial({
      color: this.color,
      transparent: true,
      opacity: 0.58
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = this.wallHeight / 2;
    group.add(body);

    const capGeo = new THREE.BoxGeometry(0.26, 0.16, 1);
    const capMat = new THREE.MeshBasicMaterial({
      color: 0xffffff
    });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = this.wallHeight;
    group.add(cap);

    return group;
  }

  updateWallMeshGeometry(wallGroup, x1, z1, x2, z2) {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const len = Math.hypot(dx, dz);
    if (len < 0.01) {
      wallGroup.visible = false;
      return;
    }
    wallGroup.visible = true;
    wallGroup.position.set((x1 + x2) / 2, 0, (z1 + z2) / 2);
    wallGroup.rotation.y = Math.atan2(dx, dz);
    wallGroup.scale.set(1, 1, len);
  }

  updateActiveWallMesh() {
    if (!this.activeWallMesh) return;
    const rearX = this.pos.x - this.dir.x * 1.45;
    const rearZ = this.pos.y - this.dir.y * 1.45;
    const segDx = rearX - this.currentSegmentStart.x;
    const segDz = rearZ - this.currentSegmentStart.y;
    if (segDx * this.dir.x + segDz * this.dir.y <= 0.05) {
      this.activeWallMesh.visible = false;
      return;
    }
    this.updateWallMeshGeometry(
      this.activeWallMesh,
      this.currentSegmentStart.x,
      this.currentSegmentStart.y,
      rearX,
      rearZ
    );
  }

  getAllCollisionSegments(includeActive = true) {
    const list = includeActive
      ? [...this.segments]
      : this.segments.slice(0, Math.max(0, this.segments.length - 1));

    if (includeActive) {
      const rearX = this.pos.x - this.dir.x * 1.3;
      const rearZ = this.pos.y - this.dir.y * 1.3;
      const segDx = rearX - this.currentSegmentStart.x;
      const segDz = rearZ - this.currentSegmentStart.y;
      if (segDx * this.dir.x + segDz * this.dir.y > 0.2) {
        list.push({
          x1: this.currentSegmentStart.x,
          z1: this.currentSegmentStart.y,
          x2: rearX,
          z2: rearZ
        });
      }
    }
    return list;
  }
}

// --- src/scene/IntroSequence.js ---
class IntroSequence {
  constructor(playerCycle, aiCycle, cameraRig, audio, uiCallbacks) {
    this.player = playerCycle;
    this.ai = aiCycle;
    this.cameraRig = cameraRig;
    this.audio = audio;
    this.ui = uiCallbacks || {};

    this.duration = 3.8; // 3.8s cinematic 4-phase choreography
    this.elapsed = 0;
    this.active = false;
    this.stage = 0;
  }

  start() {
    this.elapsed = 0;
    this.active = true;
    this.stage = 1;

    this.player.setIntroAnimationState(0);
    this.ai.setIntroAnimationState(0);

    if (this.audio) {
      this.audio.playRodIgnite();
    }
    if (this.ui.onStageChange) {
      this.ui.onStageChange('STAGE 01 // PROGRAM RIDER IGNITES CONTROL ROD', 'READY');
    }
  }

  skip() {
    if (!this.active) return;
    this.active = false;
    this.player.setCompletedIntroState();
    this.ai.setCompletedIntroState();
    if (this.ui.onComplete) {
      this.ui.onComplete();
    }
  }

  update(dt) {
    if (!this.active) return false;

    this.elapsed += dt;
    const progress = Math.min(1.0, this.elapsed / this.duration);

    this.player.setIntroAnimationState(progress);
    this.ai.setIntroAnimationState(progress);

    // Stage transitions & sound effects
    if (progress >= 0.25 && this.stage === 1) {
      this.stage = 2;
      if (this.ui.onStageChange) {
        this.ui.onStageChange('STAGE 02 // RIDER LEAPS & LOCKS INTO RIDING POSITION', '3');
      }
    } else if (progress >= 0.55 && this.stage === 2) {
      this.stage = 3;
      if (this.audio) this.audio.playWireframeRez();
      if (this.ui.onStageChange) {
        this.ui.onStageChange('STAGE 03 // CYCLE MATERIALIZES AROUND RIDER', '2');
      }
    } else if (progress >= 0.86 && this.stage === 3) {
      this.stage = 4;
      if (this.audio) this.audio.playTouchdown();
      if (this.ui.onStageChange) {
        this.ui.onStageChange('STAGE 04 // GRID TOUCHDOWN — TURBINES ONLINE', '1');
      }
    }

    // Update cinematic intro camera
    this.cameraRig.updateIntroCamera(this.player, progress);

    if (progress >= 1.0) {
      this.active = false;
      this.player.setCompletedIntroState();
      this.ai.setCompletedIntroState();
      if (this.ui.onComplete) {
        this.ui.onComplete();
      }
      return false;
    }

    return true;
  }
}

// --- src/scene/Particles.js ---

class ParticleSystem {
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

      p.vy -= 28 * dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;

      if (p.mesh.position.y < 0.16) {
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

// --- src/camera/CameraRig.js ---

const VIEW_MODES = {
  BIRDS_EYE: 'BIRDS_EYE',
  OVER_SHOULDER: 'OVER_SHOULDER',
  FIRST_PERSON: 'FIRST_PERSON'
};

class CameraRig {
  constructor(aspect) {
    this.camera = new THREE.PerspectiveCamera(56, aspect, 0.1, 600);
    this.mode = VIEW_MODES.BIRDS_EYE;

    this.smoothedDir = new THREE.Vector2(1, 0);
    this.currentPos = new THREE.Vector3(0, 50, 50);
    this.currentLookAt = new THREE.Vector3(0, 0, 0);
    this.orbitAngle = 0;
  }

  resize(aspect) {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  setMode(mode, playerCycle, onModeChanged) {
    this.mode = mode;
    if (mode === VIEW_MODES.BIRDS_EYE) {
      this.camera.fov = 56;
    } else if (mode === VIEW_MODES.OVER_SHOULDER) {
      this.camera.fov = 68;
    } else if (mode === VIEW_MODES.FIRST_PERSON) {
      this.camera.fov = 86;
    }
    this.camera.updateProjectionMatrix();

    if (playerCycle) {
      playerCycle.setFirstPersonVisibility(mode === VIEW_MODES.FIRST_PERSON);
    }
    if (onModeChanged) {
      onModeChanged(mode);
    }
  }

  cycleMode(playerCycle, onModeChanged) {
    const order = [
      VIEW_MODES.BIRDS_EYE,
      VIEW_MODES.OVER_SHOULDER,
      VIEW_MODES.FIRST_PERSON
    ];
    const nextIdx = (order.indexOf(this.mode) + 1) % order.length;
    this.setMode(order[nextIdx], playerCycle, onModeChanged);
  }

  /**
   * Cinematic 1982 movie camera choreography around the player rider during the Handheld Rod Intro:
   * - Phase 1 (0.0 -> 0.28): Close front-3/4 portrait shot showing the human rider's face, helmet, and hands raising/igniting the Control Rod.
   * - Phase 2 (0.28 -> 0.56): Dynamic low side-tracking shot as the rider takes 2 running strides and leaps airborne while splitting the rod into handlebars.
   * - Phase 3 (0.56 -> 0.84): Sweeping profile-to-rear arc watching the digital scan-plane and hinged canopy materialize the Light Cycle around the rider.
   * - Phase 4 (0.84 -> 1.00): Smoothly locks into the player's selected gameplay camera view.
   */
  updateIntroCamera(playerCycle, progress) {
    const px = playerCycle.pos.x;
    const pz = playerCycle.pos.y;
    const dx = playerCycle.dir.x;
    const dz = playerCycle.dir.y;

    //Right vector relative to rider facing direction
    const rx = -dz;
    const rz = dx;

    if (progress < 0.86) {
      const t = progress / 0.86;
      const smoothT = t * t * (3 - 2 * t);

      // Orbit from front-right (2.35 rad) through clear side-profile (1.57 rad when cycle materializes around rider) to rear-right (0.45 rad)
      const angle = (1 - smoothT) * 2.35 + smoothT * 0.45;
      const radius = 3.6 + smoothT * 2.4;
      const zOffset = progress < 0.25 ? -1.4 : (progress < 0.55 ? -0.35 : 0.05);

      const focusX = px + dx * zOffset;
      const focusZ = pz + dz * zOffset;

      const camX = focusX - dx * Math.cos(angle) * radius + rx * Math.sin(angle) * radius;
      const camZ = focusZ - dz * Math.cos(angle) * radius + rz * Math.sin(angle) * radius;
      const camY = 1.42 + Math.sin(smoothT * Math.PI) * 0.48;

      this.camera.position.set(camX, camY, camZ);
      this.camera.lookAt(focusX, 1.05, focusZ);
      this.currentPos.copy(this.camera.position);
      this.currentLookAt.set(focusX, 1.05, focusZ);
      this.smoothedDir.copy(playerCycle.dir);
    } else {
      // Smoothly blend from the intro camera into the active gameplay view
      const blend = (progress - 0.86) / 0.14;
      const easeBlend = blend * blend * (3 - 2 * blend);
      const target = this.computeGameplayCameraTarget(playerCycle, 0.016, true);
      this.camera.position.lerpVectors(this.currentPos, target.pos, easeBlend);
      const look = new THREE.Vector3().lerpVectors(this.currentLookAt, target.lookAt, easeBlend);
      this.camera.lookAt(look);
    }
  }

  computeGameplayCameraTarget(playerCycle, dt, instant = false) {
    const px = playerCycle.pos.x;
    const pz = playerCycle.pos.y;

    const lerpSpeed = this.mode === VIEW_MODES.FIRST_PERSON ? 22 : 11;
    if (instant) {
      this.smoothedDir.copy(playerCycle.dir);
    } else {
      const alpha = 1 - Math.exp(-lerpSpeed * dt);
      this.smoothedDir.lerp(playerCycle.dir, alpha).normalize();
    }

    const dx = this.smoothedDir.x;
    const dz = this.smoothedDir.y;

    if (this.mode === VIEW_MODES.BIRDS_EYE) {
      return {
        pos: new THREE.Vector3(0, 205, 18),
        lookAt: new THREE.Vector3(0, 0, 0),
        roll: 0
      };
    } else if (this.mode === VIEW_MODES.OVER_SHOULDER) {
      const distBack = playerCycle.isBoosting ? 10.8 : 9.2;
      const height = 4.1;
      return {
        pos: new THREE.Vector3(px - dx * distBack, height, pz - dz * distBack),
        lookAt: new THREE.Vector3(px + dx * 16, 1.2, pz + dz * 16),
        roll: playerCycle.leanAngle * 0.18
      };
    } else {
      // FIRST_PERSON (Clean Unobstructed Bumper / Visor View):
      // Mounted slightly higher (Y = 1.95) and forward of the cycle nose (+1.8u)
      // looking slightly downward toward the horizon so upcoming walls and the Grid floor are 100% clear.
      return {
        pos: new THREE.Vector3(px + dx * 1.8, 1.95, pz + dz * 1.8),
        lookAt: new THREE.Vector3(px + dx * 38, 1.35, pz + dz * 38),
        roll: playerCycle.leanAngle * 0.25
      };
    }
  }

  updateGameplayCamera(playerCycle, dt) {
    playerCycle.setFirstPersonVisibility(this.mode === VIEW_MODES.FIRST_PERSON);
    const target = this.computeGameplayCameraTarget(playerCycle, dt, false);

    if (this.mode === VIEW_MODES.FIRST_PERSON) {
      this.camera.position.copy(target.pos);
    } else {
      const posAlpha = 1 - Math.exp(-14 * dt);
      this.camera.position.lerp(target.pos, posAlpha);
    }

    this.camera.lookAt(target.lookAt);
    if (target.roll) {
      this.camera.rotation.z += target.roll * 0.35;
    }
  }

  updateDerezzOrbitCamera(focusPoint, dt) {
    this.orbitAngle += dt * 0.9;
    const radius = 18;
    const camX = focusPoint.x + Math.cos(this.orbitAngle) * radius;
    const camZ = focusPoint.z + Math.sin(this.orbitAngle) * radius;
    this.camera.position.lerp(new THREE.Vector3(camX, 11, camZ), 1 - Math.exp(-4 * dt));
    this.camera.lookAt(focusPoint.x, 1.2, focusPoint.z);
  }
}

// --- src/logic/Collision.js ---
class CollisionSystem {
  constructor(arenaSize = 200) {
    this.halfSize = arenaSize / 2;
  }

  /**
   * Checks if moving from prevPos to currPos collides with arena bounds or any trail segment
   */
  checkCycleCollision(prevPos, currPos, allSegments) {
    const margin = 0.7;
    if (
      currPos.x <= -this.halfSize + margin ||
      currPos.x >= this.halfSize - margin ||
      currPos.y <= -this.halfSize + margin ||
      currPos.y >= this.halfSize - margin
    ) {
      return true;
    }

    for (let i = 0; i < allSegments.length; i++) {
      const seg = allSegments[i];
      if (this.sweptSegmentHit(prevPos.x, prevPos.y, currPos.x, currPos.y, seg, 0.58)) {
        return true;
      }
    }
    return false;
  }

  sweptSegmentHit(px1, pz1, px2, pz2, seg, radius = 0.58) {
    // Axis-aligned or general segment distance check
    const minX = Math.min(seg.x1, seg.x2) - radius;
    const maxX = Math.max(seg.x1, seg.x2) + radius;
    const minZ = Math.min(seg.z1, seg.z2) - radius;
    const maxZ = Math.max(seg.z1, seg.z2) + radius;

    const moveMinX = Math.min(px1, px2);
    const moveMaxX = Math.max(px1, px2);
    const moveMinZ = Math.min(pz1, pz2);
    const moveMaxZ = Math.max(pz1, pz2);

    // Quick AABB reject
    if (moveMaxX < minX || moveMinX > maxX || moveMaxZ < minZ || moveMinZ > maxZ) {
      return false;
    }

    // Check endpoint distance or segment intersection
    const distEnd = this.pointToSegmentDistance(px2, pz2, seg.x1, seg.z1, seg.x2, seg.z2);
    if (distEnd <= radius) return true;

    return this.segmentsIntersect(px1, pz1, px2, pz2, seg.x1, seg.z1, seg.x2, seg.z2);
  }

  pointToSegmentDistance(px, pz, x1, z1, x2, z2) {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const lenSq = dx * dx + dz * dz;
    if (lenSq < 0.0001) return Math.hypot(px - x1, pz - z1);
    let t = ((px - x1) * dx + (pz - z1) * dz) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const projX = x1 + t * dx;
    const projZ = z1 + t * dz;
    return Math.hypot(px - projX, pz - projZ);
  }

  segmentsIntersect(ax, az, bx, bz, cx, cz, dx, dz) {
    const ccw = (p1x, p1z, p2x, p2z, p3x, p3z) =>
      (p3z - p1z) * (p2x - p1x) > (p2z - p1z) * (p3x - p1x);
    return (
      ccw(ax, az, cx, cz, dx, dz) !== ccw(bx, bz, cx, cz, dx, dz) &&
      ccw(ax, az, bx, bz, cx, cz) !== ccw(ax, az, bx, bz, dx, dz)
    );
  }

  /**
   * Casts an orthogonal ray from (ox, oz) along (dx, dz) and returns distance to nearest wall/trail
   */
  raycastDistance(ox, oz, dx, dz, allSegments, maxDist = 200) {
    let minDist = maxDist;

    // Distance to arena boundary
    if (dx > 0.5) minDist = Math.min(minDist, this.halfSize - ox);
    else if (dx < -0.5) minDist = Math.min(minDist, ox + this.halfSize);
    else if (dz > 0.5) minDist = Math.min(minDist, this.halfSize - oz);
    else if (dz < -0.5) minDist = Math.min(minDist, oz + this.halfSize);

    for (let i = 0; i < allSegments.length; i++) {
      const s = allSegments[i];
      const segMinX = Math.min(s.x1, s.x2) - 0.5;
      const segMaxX = Math.max(s.x1, s.x2) + 0.5;
      const segMinZ = Math.min(s.z1, s.z2) - 0.5;
      const segMaxZ = Math.max(s.z1, s.z2) + 0.5;

      if (Math.abs(dx) > 0.5) {
        // Horizontal ray along X
        if (oz >= segMinZ && oz <= segMaxZ) {
          const targetX = dx > 0 ? segMinX : segMaxX;
          const dist = (targetX - ox) * dx;
          if (dist > 0.2 && dist < minDist) {
            minDist = dist;
          }
        }
      } else {
        // Vertical ray along Z
        if (ox >= segMinX && ox <= segMaxX) {
          const targetZ = dz > 0 ? segMinZ : segMaxZ;
          const dist = (targetZ - oz) * dz;
          if (dist > 0.2 && dist < minDist) {
            minDist = dist;
          }
        }
      }
    }

    return Math.max(0, minDist);
  }

  /**
   * Checks if cycle is within slipstream distance of any wall on its left or right flank
   */
  checkSlipstream(cycle, allSegments) {
    const leftDir = { x: cycle.dir.y, z: -cycle.dir.x };
    const rightDir = { x: -cycle.dir.y, z: cycle.dir.x };
    const dLeft = this.raycastDistance(cycle.pos.x, cycle.pos.y, leftDir.x, leftDir.z, allSegments, 5);
    const dRight = this.raycastDistance(cycle.pos.x, cycle.pos.y, rightDir.x, rightDir.z, allSegments, 5);
    return dLeft < 3.6 || dRight < 3.6;
  }
}

// --- src/logic/AIController.js ---
class AIController {
  constructor(collisionSystem, difficulty = 'WARRIOR') {
    this.collision = collisionSystem;
    this.difficulty = difficulty;
    this.decisionCooldown = 0;
  }

  setDifficulty(level) {
    this.difficulty = level;
  }

  update(dt, aiCycle, playerCycle, allSegments) {
    if (!aiCycle.alive) return;

    this.decisionCooldown -= dt;
    if (this.decisionCooldown > 0) return;

    const px = aiCycle.pos.x;
    const pz = aiCycle.pos.y;
    const fx = aiCycle.dir.x;
    const fz = aiCycle.dir.y;

    // Left and Right orthogonal vectors
    const lx = fz;
    const lz = -fx;
    const rx = -fz;
    const rz = fx;

    const fwdDist = this.collision.raycastDistance(px, pz, fx, fz, allSegments, 200);
    const leftDist = this.collision.raycastDistance(px, pz, lx, lz, allSegments, 200);
    const rightDist = this.collision.raycastDistance(px, pz, rx, rz, allSegments, 200);

    // Threshold distance at which AI must turn to avoid immediate wall impact
    const dangerThreshold = this.difficulty === 'NOVICE' ? 8.5 : 13.5;

    // Secondary branch lookahead (estimates open reachable space down each candidate turn)
    const leftOpenScore = this.evaluateBranchSpace(px, pz, lx, lz, leftDist, allSegments);
    const rightOpenScore = this.evaluateBranchSpace(px, pz, rx, rz, rightDist, allSegments);
    const fwdOpenScore = this.evaluateBranchSpace(px, pz, fx, fz, fwdDist, allSegments);

    // Aggressive cutoff bonus when AI is near player and can cross in front of player's nose
    let leftCutoffBonus = 0;
    let rightCutoffBonus = 0;
    if (playerCycle.alive && this.difficulty !== 'NOVICE') {
      const toPlayerX = playerCycle.pos.x - px;
      const toPlayerZ = playerCycle.pos.y - pz;
      const distToPlayer = Math.hypot(toPlayerX, toPlayerZ);

      if (distToPlayer < 65) {
        const playerFutureX = playerCycle.pos.x + playerCycle.dir.x * 18;
        const playerFutureZ = playerCycle.pos.y + playerCycle.dir.y * 18;
        const vecFutureX = playerFutureX - px;
        const vecFutureZ = playerFutureZ - pz;

        const dotLeft = vecFutureX * lx + vecFutureZ * lz;
        const dotRight = vecFutureX * rx + vecFutureZ * rz;

        const cutoffWeight = this.difficulty === 'MCP' ? 28 : 14;
        if (dotLeft > 8 && leftDist > 28) leftCutoffBonus = cutoffWeight;
        if (dotRight > 8 && rightDist > 28) rightCutoffBonus = cutoffWeight;
      }
    }

    // Decide whether to turn now
    const mustTurn = fwdDist < dangerThreshold;
    const opportunisticTurn =
      !mustTurn &&
      fwdDist < 55 &&
      Math.random() < (this.difficulty === 'MCP' ? 0.08 : 0.045) &&
      Math.max(leftOpenScore + leftCutoffBonus, rightOpenScore + rightCutoffBonus) >
        fwdOpenScore * 1.25;

    if (mustTurn || opportunisticTurn) {
      const totalLeft = leftOpenScore + leftCutoffBonus + (Math.random() * 4 - 2);
      const totalRight = rightOpenScore + rightCutoffBonus + (Math.random() * 4 - 2);

      if (totalLeft > totalRight && leftDist > 4.5) {
        aiCycle.queueTurn('LEFT');
        this.decisionCooldown = 0.14;
      } else if (rightDist > 4.5) {
        aiCycle.queueTurn('RIGHT');
        this.decisionCooldown = 0.14;
      } else if (leftDist > rightDist) {
        aiCycle.queueTurn('LEFT');
        this.decisionCooldown = 0.12;
      }
    }

    // AI Boost usage
    if (this.difficulty === 'MCP') {
      aiCycle.isBoosting = fwdDist > 38 && aiCycle.boostEnergy > 25;
    } else if (this.difficulty === 'WARRIOR') {
      aiCycle.isBoosting = fwdDist > 55 && aiCycle.boostEnergy > 50;
    } else {
      aiCycle.isBoosting = false;
    }
  }

  evaluateBranchSpace(ox, oz, dx, dz, primaryDist, allSegments) {
    if (primaryDist < 4) return primaryDist;
    if (this.difficulty === 'NOVICE') return primaryDist;

    // Sample midpoint along the candidate ray and measure perpendicular escape routes
    const sampleDist = Math.min(primaryDist * 0.65, 36);
    const sx = ox + dx * sampleDist;
    const sz = oz + dz * sampleDist;

    const perp1x = dz;
    const perp1z = -dx;
    const perp2x = -dz;
    const perp2z = dx;

    const escape1 = this.collision.raycastDistance(sx, sz, perp1x, perp1z, allSegments, 120);
    const escape2 = this.collision.raycastDistance(sx, sz, perp2x, perp2z, allSegments, 120);

    return primaryDist + (escape1 + escape2) * 0.45;
  }
}

// --- src/main.js ---

class TronGame {
  constructor() {
    this.canvas = document.getElementById('three-canvas');
    this.radarCanvas = document.getElementById('radar-canvas');
    this.radarCtx = this.radarCanvas.getContext('2d');

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x03060e);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x03060e, 0.0028);

    // Lighting
    const ambient = new THREE.AmbientLight(0x284b7a, 1.3);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xaad8ff, 1.4);
    dirLight.position.set(40, 120, 60);
    this.scene.add(dirLight);

    // Subsystems
    this.arenaSize = 200;
    this.audio = new SynthAudio();
    this.arena = new GridArena(this.scene, this.arenaSize);
    this.particles = new ParticleSystem(this.scene);
    this.collision = new CollisionSystem(this.arenaSize);
    this.aiController = new AIController(this.collision, 'NOVICE');
    this.cameraRig = new CameraRig(window.innerWidth / window.innerHeight);

    // Upgraded Three.js Post-Processing Pipeline (EffectComposer + UnrealBloomPass)
    this.composer = null;
    this.bloomPass = null;
    if (THREE.EffectComposer && THREE.RenderPass && THREE.UnrealBloomPass) {
      this.composer = new THREE.EffectComposer(this.renderer);
      const renderPass = new THREE.RenderPass(this.scene, this.cameraRig.camera);
      this.composer.addPass(renderPass);

      this.bloomPass = new THREE.UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.75, // strength
        0.45, // radius
        0.22  // threshold
      );
      this.composer.addPass(this.bloomPass);
    }

    // Create Player (Cyan) & CPU (Orange) Light Cycles facing each other
    this.player = new LightCycle(this.scene, {
      name: 'PLAYER',
      color: 0x00f3ff,
      isPlayer: true,
      startX: -48,
      startZ: 0,
      startDir: new THREE.Vector2(1, 0)
    });

    this.ai = new LightCycle(this.scene, {
      name: 'CPU',
      color: 0xff6600,
      isPlayer: false,
      startX: 48,
      startZ: 0,
      startDir: new THREE.Vector2(-1, 0)
    });

    this.introSequence = new IntroSequence(
      this.player,
      this.ai,
      this.cameraRig,
      this.audio,
      {
        onStageChange: (stageText, countText) => this.updateIntroBanners(stageText, countText),
        onComplete: () => this.beginActiveRace()
      }
    );

    // State: 'MENU' | 'INTRO' | 'PLAYING' | 'DEREZZ'
    this.state = 'MENU';
    this.playerScore = 0;
    this.aiScore = 0;
    this.crashPoint = new THREE.Vector3();

    this.bindUI();
    this.bindInput();
    this.syncCockpitHUDVisibility();

    window.addEventListener('resize', () => this.onResize());
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  bindUI() {
    // Camera Selection Cards in Start Modal
    const camCards = document.querySelectorAll('[data-cam-select]');
    camCards.forEach((card) => {
      card.addEventListener('click', () => {
        camCards.forEach((c) => c.classList.remove('selected'));
        card.classList.add('selected');
        const mode = card.getAttribute('data-cam-select');
        this.setCameraView(mode);
      });
    });

    // Difficulty Selection Cards in Start Modal
    const diffCards = document.querySelectorAll('[data-diff-select]');
    diffCards.forEach((card) => {
      card.addEventListener('click', () => {
        diffCards.forEach((c) => c.classList.remove('selected'));
        card.classList.add('selected');
        const diff = card.getAttribute('data-diff-select');
        this.aiController.setDifficulty(diff);
        document.getElementById('cpu-label').textContent = `CPU (${diff})`;
      });
    });

    // Top HUD Live Camera Switch Buttons
    const hudCamBtns = document.querySelectorAll('[data-hud-cam]');
    hudCamBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-hud-cam');
        this.setCameraView(mode);
        btn.blur();
      });
    });

    // Sound ON/OFF Toggle in Start Modal & Top HUD
    const soundCheckbox = document.getElementById('sound-checkbox');
    const hudSoundBtn = document.getElementById('hud-sound-btn');

    soundCheckbox.addEventListener('change', () => {
      this.setSoundEnabled(soundCheckbox.checked);
      soundCheckbox.blur();
    });

    hudSoundBtn.addEventListener('click', () => {
      this.setSoundEnabled(this.audio.muted);
      hudSoundBtn.blur();
    });

    // Launch Match Button
    document.getElementById('launch-btn').addEventListener('click', (e) => {
      e.currentTarget.blur();
      this.startNewRound();
    });

    // Next Match Button in Game Over Modal
    document.getElementById('rematch-btn').addEventListener('click', (e) => {
      e.currentTarget.blur();
      this.startNewRound();
    });

    // Open Menu from Game Over Modal
    document.getElementById('menu-btn').addEventListener('click', (e) => {
      e.currentTarget.blur();
      document.getElementById('gameover-modal').classList.add('hidden');
      document.getElementById('start-modal').classList.remove('hidden');
      this.state = 'MENU';
      this.syncCockpitHUDVisibility();
    });
  }

  syncCockpitHUDVisibility() {
    const isPlaying = this.state === 'PLAYING';
    // Top & Bottom HUD bars only appear during active gameplay (after the intro animation)
    document.getElementById('hud-top').classList.toggle('hud-hidden', !isPlaying);
    document.getElementById('hud-bottom').classList.toggle('hud-hidden', !isPlaying);

    // First-Person Cockpit HUD only appears during active gameplay in First-Person mode
    const cockpit = document.getElementById('cockpit-overlay');
    cockpit.classList.toggle(
      'active',
      isPlaying && this.cameraRig.mode === VIEW_MODES.FIRST_PERSON
    );
  }

  setSoundEnabled(enabled) {
    this.audio.setMuted(!enabled);
    if (enabled && this.state === 'PLAYING') {
      this.audio.startEngine();
    }
    const soundCheckbox = document.getElementById('sound-checkbox');
    if (soundCheckbox) {
      soundCheckbox.checked = enabled;
    }
    const hudSoundBtn = document.getElementById('hud-sound-btn');
    if (hudSoundBtn) {
      hudSoundBtn.textContent = enabled ? 'SOUND: ON [M]' : 'SOUND: OFF [M]';
      hudSoundBtn.classList.toggle('active', enabled);
    }
  }

  setCameraView(mode) {
    this.cameraRig.setMode(mode, this.player, (activeMode) => {
      // Update HUD buttons
      document.querySelectorAll('[data-hud-cam]').forEach((btn) => {
        btn.classList.toggle('active', btn.getAttribute('data-hud-cam') === activeMode);
      });
      // Update Start Modal cards
      document.querySelectorAll('[data-cam-select]').forEach((card) => {
        card.classList.toggle('selected', card.getAttribute('data-cam-select') === activeMode);
      });
      this.syncCockpitHUDVisibility();

      // Update bottom control hint text
      const hint = document.getElementById('controls-hint-text');
      if (activeMode === VIEW_MODES.BIRDS_EYE) {
        hint.innerHTML =
          '<strong>BIRD\'S-EYE CONTROLS:</strong> [W/A/S/D] or [ARROWS] Cardinal Direction &bull; [SHIFT/SPACE] Boost &bull; [1/2/3 or C] Switch View';
      } else {
        hint.innerHTML =
          '<strong>3D STEERING:</strong> [A / &larr;] Turn 90&deg; Left &bull; [D / &rarr;] Turn 90&deg; Right &bull; [W / &uarr; / SHIFT] Boost &bull; [1/2/3 or C] Switch View';
      }
    });
  }

  bindInput() {
    window.addEventListener(
      'keydown',
      (e) => {
        const key = (e.key || '').toLowerCase();
        const code = e.code || '';

        const isLeft = code === 'KeyA' || code === 'ArrowLeft' || key === 'a' || key === 'arrowleft';
        const isRight = code === 'KeyD' || code === 'ArrowRight' || key === 'd' || key === 'arrowright';
        const isUp = code === 'KeyW' || code === 'ArrowUp' || key === 'w' || key === 'arrowup';
        const isDown = code === 'KeyS' || code === 'ArrowDown' || key === 's' || key === 'arrowdown';
        const isSpace = code === 'Space' || key === ' ';
        const isEnter = code === 'Enter' || key === 'enter';
        const isShift = code === 'ShiftLeft' || code === 'ShiftRight' || key === 'shift';

        if (e.repeat && (isLeft || isRight || isUp || isDown)) {
          return;
        }

        // Live Camera Switching anytime via 1 / 2 / 3 or C, and Sound Mute via M
        if (code === 'Digit1' || key === '1') {
          this.setCameraView(VIEW_MODES.BIRDS_EYE);
          return;
        } else if (code === 'Digit2' || key === '2') {
          this.setCameraView(VIEW_MODES.OVER_SHOULDER);
          return;
        } else if (code === 'Digit3' || key === '3') {
          this.setCameraView(VIEW_MODES.FIRST_PERSON);
          return;
        } else if (code === 'KeyC' || key === 'c') {
          this.cameraRig.cycleMode(this.player, (m) => this.setCameraView(m));
          return;
        } else if (code === 'KeyM' || key === 'm') {
          this.setSoundEnabled(this.audio.muted);
          return;
        }

        // Start from Menu with Space or Enter
        if (this.state === 'MENU' && (isSpace || isEnter)) {
          e.preventDefault();
          this.startNewRound();
          return;
        }

        // Skip Intro or Queue Initial Turn during Intro
        if (this.state === 'INTRO') {
          if (isSpace || isEnter) {
            e.preventDefault();
            this.introSequence.skip();
          } else if (isLeft) {
            e.preventDefault();
            this.player.queueTurn('LEFT');
          } else if (isRight) {
            e.preventDefault();
            this.player.queueTurn('RIGHT');
          }
          return;
        }

        // Rematch on Space or Enter after Derezz
        if (this.state === 'DEREZZ' && (isSpace || isEnter)) {
          e.preventDefault();
          this.startNewRound();
          return;
        }

        if (this.state !== 'PLAYING') return;

        // Steering in Bird's-Eye View vs 3D Views
        if (this.cameraRig.mode === VIEW_MODES.BIRDS_EYE) {
          const effDir = this.player.getEffectivePlannedDirection();
          if (isUp) {
            e.preventDefault();
            // If moving horizontally, turn North (-Z); if already vertical, engage boost
            if (Math.abs(effDir.x) > 0.5) {
              this.player.queueCardinalDirection(new THREE.Vector2(0, -1));
            } else {
              this.player.isBoosting = true;
            }
          } else if (isDown) {
            e.preventDefault();
            // If moving horizontally, turn South (+Z)
            if (Math.abs(effDir.x) > 0.5) {
              this.player.queueCardinalDirection(new THREE.Vector2(0, 1));
            }
          } else if (isLeft) {
            e.preventDefault();
            // If moving vertically, turn West (-X); if moving horizontally, relative turn Left
            if (Math.abs(effDir.y) > 0.5) {
              this.player.queueCardinalDirection(new THREE.Vector2(-1, 0));
            } else {
              this.player.queueTurn('LEFT');
            }
          } else if (isRight) {
            e.preventDefault();
            // If moving vertically, turn East (+X); if moving horizontally, relative turn Right
            if (Math.abs(effDir.y) > 0.5) {
              this.player.queueCardinalDirection(new THREE.Vector2(1, 0));
            } else {
              this.player.queueTurn('RIGHT');
            }
          } else if (isShift || isSpace) {
            e.preventDefault();
            this.player.isBoosting = true;
          }
        } else {
          // Relative 90° steering for Over-the-Shoulder and First-Person views
          if (isLeft) {
            e.preventDefault();
            this.player.queueTurn('LEFT');
          } else if (isRight) {
            e.preventDefault();
            this.player.queueTurn('RIGHT');
          } else if (isUp || isShift || isSpace) {
            e.preventDefault();
            this.player.isBoosting = true;
          }
        }
      },
      { passive: false }
    );

    window.addEventListener('keyup', (e) => {
      const key = (e.key || '').toLowerCase();
      const code = e.code || '';
      if (
        code === 'KeyW' ||
        code === 'ArrowUp' ||
        code === 'ShiftLeft' ||
        code === 'ShiftRight' ||
        code === 'Space' ||
        key === 'w' ||
        key === 'arrowup' ||
        key === 'shift' ||
        key === ' '
      ) {
        this.player.isBoosting = false;
      }
    });
  }

  startNewRound() {
    document.getElementById('start-modal').classList.add('hidden');
    document.getElementById('gameover-modal').classList.add('hidden');
    document.getElementById('proximity-warning').style.display = 'none';

    this.particles.clear();
    this.player.reset();
    this.ai.reset();

    const playIntro = document.getElementById('intro-checkbox').checked;
    if (playIntro) {
      this.state = 'INTRO';
      this.syncCockpitHUDVisibility();
      this.introSequence.start();
    } else {
      this.beginActiveRace();
    }
  }

  updateIntroBanners(stageText, countText) {
    const stageBanner = document.getElementById('intro-stage-banner');
    const countBanner = document.getElementById('countdown-banner');
    stageBanner.style.display = 'block';
    stageBanner.textContent = `${stageText} // [SPACE] SKIP`;
    countBanner.style.display = 'block';
    countBanner.textContent = countText;
  }

  beginActiveRace() {
    this.state = 'PLAYING';
    this.player.setCompletedIntroState();
    this.ai.setCompletedIntroState();
    this.syncCockpitHUDVisibility();
    const stageBanner = document.getElementById('intro-stage-banner');
    const countBanner = document.getElementById('countdown-banner');
    stageBanner.style.display = 'none';
    countBanner.style.display = 'block';
    countBanner.textContent = 'GO!';
    setTimeout(() => {
      if (this.state === 'PLAYING') {
        countBanner.style.display = 'none';
      }
    }, 650);

    this.player.setFirstPersonVisibility(this.cameraRig.mode === VIEW_MODES.FIRST_PERSON);
    this.audio.startEngine();
  }

  triggerDerezz(playerHit, aiHit) {
    this.state = 'DEREZZ';
    this.syncCockpitHUDVisibility();
    this.audio.playDerezz();
    document.getElementById('proximity-warning').style.display = 'none';

    let title = '';
    let subtitle = '';

    if (playerHit && aiHit) {
      title = 'SIMULTANEOUS DEREZZ';
      subtitle = 'MUTUAL GRID COLLISION // DRAW ROUND';
      this.player.root.visible = false;
      this.ai.root.visible = false;
      this.particles.spawnDerezzExplosion(this.player.pos.x, this.player.pos.y, 0x00f3ff);
      this.particles.spawnDerezzExplosion(this.ai.pos.x, this.ai.pos.y, 0xff6600);
      this.crashPoint.set(this.player.pos.x, 0, this.player.pos.y);
    } else if (playerHit) {
      this.aiScore++;
      title = 'USER DEREZZED';
      subtitle = 'CPU CLAIMS THE GRID SECTOR';
      this.player.alive = false;
      this.player.root.visible = false;
      this.particles.spawnDerezzExplosion(this.player.pos.x, this.player.pos.y, 0x00f3ff);
      this.crashPoint.set(this.player.pos.x, 0, this.player.pos.y);
    } else {
      this.playerScore++;
      title = 'CPU DEREZZED — VICTORY!';
      subtitle = 'USER DOMINATES THE GRID';
      this.ai.alive = false;
      this.ai.root.visible = false;
      this.particles.spawnDerezzExplosion(this.ai.pos.x, this.ai.pos.y, 0xff6600);
      this.crashPoint.set(this.ai.pos.x, 0, this.ai.pos.y);
    }

    document.getElementById('score-player').textContent = `P1: ${this.playerScore}`;
    document.getElementById('score-ai').textContent = `CPU: ${this.aiScore}`;

    const titleEl = document.getElementById('gameover-title');
    titleEl.textContent = title;
    titleEl.style.color = playerHit && !aiHit ? '#ff6600' : '#00f3ff';
    document.getElementById('gameover-sub').textContent = subtitle;

    setTimeout(() => {
      if (this.state === 'DEREZZ') {
        document.getElementById('gameover-modal').classList.remove('hidden');
      }
    }, 1150);
  }

  updateHUD(allSegments) {
    // Boost Meter & Speed Readout
    const boostFill = document.getElementById('boost-fill');
    boostFill.style.width = `${Math.round(this.player.boostEnergy)}%`;

    const kmh = Math.round(this.player.currentSpeed * 3.4);
    const slipTag = this.player.inSlipstream ? ' [SLIPSTREAM +]' : '';
    document.getElementById('speed-readout').textContent = `${kmh} KM/H${slipTag}`;

    // Forward Wall Proximity Warning & First-Person Tactical HUD
    const warnEl = document.getElementById('proximity-warning');
    const fx = this.player.dir.x;
    const fz = this.player.dir.y;
    const lx = fz;
    const lz = -fx;
    const rx = -fz;
    const rz = fx;

    const fwdClearance = this.collision.raycastDistance(
      this.player.pos.x,
      this.player.pos.y,
      fx,
      fz,
      allSegments,
      200
    );
    const leftClearance = this.collision.raycastDistance(
      this.player.pos.x,
      this.player.pos.y,
      lx,
      lz,
      allSegments,
      200
    );
    const rightClearance = this.collision.raycastDistance(
      this.player.pos.x,
      this.player.pos.y,
      rx,
      rz,
      allSegments,
      200
    );

    if (this.state === 'PLAYING' && this.cameraRig.mode !== VIEW_MODES.BIRDS_EYE) {
      if (fwdClearance < 24) {
        warnEl.style.display = 'block';
        warnEl.textContent = `! WALL PROXIMITY ${Math.max(1, Math.round(fwdClearance))}m !`;
      } else {
        warnEl.style.display = 'none';
      }
    } else {
      warnEl.style.display = 'none';
    }

    if (this.cameraRig.mode === VIEW_MODES.FIRST_PERSON) {
      this.updateFirstPersonHUD(fwdClearance, leftClearance, rightClearance, kmh, slipTag);
    }

    // Render 2D Radar Minimap
    this.renderRadar();
  }

  updateFirstPersonHUD(fwdDist, leftDist, rightDist, kmh, slipTag) {
    // 1. Cardinal Compass Heading
    const dx = this.player.dir.x;
    const dz = this.player.dir.y;
    let headingText = 'EAST (090°)';
    if (dx > 0.5) headingText = 'EAST (090°)';
    else if (dx < -0.5) headingText = 'WEST (270°)';
    else if (dz < -0.5) headingText = 'NORTH (000°)';
    else if (dz > 0.5) headingText = 'SOUTH (180°)';
    document.getElementById('fp-heading-val').textContent = headingText;

    // 2. Relative Bearing to CPU Opponent
    const toAiX = this.ai.pos.x - this.player.pos.x;
    const toAiZ = this.ai.pos.y - this.player.pos.y;
    const aiDist = Math.round(Math.hypot(toAiX, toAiZ));
    const fwdDot = toAiX * dx + toAiZ * dz;
    const rightDot = toAiX * -dz + toAiZ * dx;

    let verticalRel = Math.abs(fwdDot) < 10 ? '' : (fwdDot > 0 ? 'AHEAD ' : 'BEHIND ');
    let sideRel = Math.abs(rightDot) < 10 ? 'CENTER' : (rightDot > 0 ? 'RIGHT' : 'LEFT');
    document.getElementById('fp-enemy-bearing').textContent = `CPU: ${verticalRel}${sideRel} (${aiDist}m)`;

    // 3. Left & Right Blind-Spot Turn Clearance Sensors
    const updateSideSensor = (sidePrefix, dist) => {
      const box = document.getElementById(`fp-${sidePrefix}-sensor`);
      const distEl = document.getElementById(`fp-${sidePrefix}-dist`);
      const barEl = document.getElementById(`fp-${sidePrefix}-bar`);
      const statusEl = document.getElementById(`fp-${sidePrefix}-status`);

      const dRound = Math.round(dist);
      distEl.textContent = `${dRound}m`;
      const pct = Math.min(100, Math.round((dist / 80) * 100));
      barEl.style.width = `${pct}%`;

      if (dist < 14) {
        box.classList.add('danger');
        barEl.style.backgroundColor = '#ff2a55';
        statusEl.textContent = 'BLOCKED / DANGER';
        statusEl.style.color = '#ff2a55';
      } else if (dist < 32) {
        box.classList.remove('danger');
        barEl.style.backgroundColor = '#ffcc00';
        statusEl.textContent = 'TIGHT CLEARANCE';
        statusEl.style.color = '#ffcc00';
      } else {
        box.classList.remove('danger');
        barEl.style.backgroundColor = '#00f3ff';
        statusEl.textContent = 'OPEN LANE';
        statusEl.style.color = '#00ff9d';
      }
    };

    updateSideSensor('left', leftDist);
    updateSideSensor('right', rightDist);

    // 4. Forward Rangefinder & Turn Advisor when approaching a wall
    const fwdEl = document.getElementById('fp-fwd-range');
    const advisorEl = document.getElementById('fp-turn-advisor');
    const fRound = Math.round(fwdDist);
    fwdEl.textContent = `FWD RANGE: ${fRound}m`;
    fwdEl.style.color = fwdDist < 28 ? '#ff2a55' : (fwdDist < 50 ? '#ffcc00' : '#00f3ff');

    if (fwdDist < 42) {
      advisorEl.style.display = 'block';
      if (leftDist >= rightDist && leftDist > 10) {
        advisorEl.textContent = `<< EVADE LEFT [A] (${Math.round(leftDist)}m OPEN)`;
      } else if (rightDist > 10) {
        advisorEl.textContent = `EVADE RIGHT [D] (${Math.round(rightDist)}m OPEN) >>`;
      } else {
        advisorEl.textContent = `! CRITICAL BOX TRAP !`;
      }
    } else {
      advisorEl.style.display = 'none';
    }

    // 5. Bottom Cockpit Dash Speed & Boost
    document.getElementById('fp-dash-speed').textContent = `${kmh} KM/H${slipTag}`;
    document.getElementById('fp-dash-boost').style.width = `${Math.round(this.player.boostEnergy)}%`;
  }

  renderRadar() {
    const ctx = this.radarCtx;
    const w = this.radarCanvas.width;
    const h = this.radarCanvas.height;
    ctx.clearRect(0, 0, w, h);

    // Subtle radar grid
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.14)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const p = (w / 4) * i;
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, h);
      ctx.moveTo(0, p);
      ctx.lineTo(w, p);
      ctx.stroke();
    }

    const toRadar = (wx, wz) => ({
      x: ((wx + this.arenaSize / 2) / this.arenaSize) * w,
      y: ((wz + this.arenaSize / 2) / this.arenaSize) * h
    });

    // Draw Player Trails
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    this.player.getAllCollisionSegments(true).forEach((s) => {
      const p1 = toRadar(s.x1, s.z1);
      const p2 = toRadar(s.x2, s.z2);
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
    });
    ctx.stroke();

    // Draw AI Trails
    ctx.strokeStyle = '#ff6600';
    ctx.lineWidth = 2;
    ctx.beginPath();
    this.ai.getAllCollisionSegments(true).forEach((s) => {
      const p1 = toRadar(s.x1, s.z1);
      const p2 = toRadar(s.x2, s.z2);
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
    });
    ctx.stroke();

    // Draw Cycle Dots
    if (this.player.alive) {
      const pp = toRadar(this.player.pos.x, this.player.pos.y);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(pp.x, pp.y, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
    if (this.ai.alive) {
      const ap = toRadar(this.ai.pos.x, this.ai.pos.y);
      ctx.fillStyle = '#ff9900';
      ctx.beginPath();
      ctx.arc(ap.x, ap.y, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  onResize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.cameraRig.resize(window.innerWidth / window.innerHeight);
    if (this.composer) {
      this.composer.setSize(window.innerWidth, window.innerHeight);
    }
  }

  loop(now) {
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;

    if (this.state === 'MENU') {
      // Gentle showcase orbit while on menu
      this.cameraRig.updateDerezzOrbitCamera(new THREE.Vector3(0, 0, 0), dt * 0.45);
    } else if (this.state === 'INTRO') {
      this.introSequence.update(dt);
    } else if (this.state === 'PLAYING') {
      const prevPlayerPos = this.player.pos.clone();
      const prevAiPos = this.ai.pos.clone();

      // Gather segments before step for AI & slipstream
      const preSegments = [
        ...this.player.getAllCollisionSegments(true),
        ...this.ai.getAllCollisionSegments(true)
      ];

      // AI Decision Step
      this.aiController.update(dt, this.ai, this.player, preSegments);

      // Slipstream check
      this.player.inSlipstream = this.collision.checkSlipstream(this.player, preSegments);

      // Advance both cycles
      this.player.update(dt, this.audio);
      this.ai.update(dt, this.audio);

      // Spawn boost or slipstream sparks
      if (this.player.isBoosting || this.player.inSlipstream) {
        this.particles.spawnBoostSpark(
          this.player.pos.x,
          this.player.pos.y,
          this.player.dir.x,
          this.player.dir.y,
          0x00f3ff
        );
      }
      if (this.ai.isBoosting) {
        this.particles.spawnBoostSpark(
          this.ai.pos.x,
          this.ai.pos.y,
          this.ai.dir.x,
          this.ai.dir.y,
          0xff6600
        );
      }

      // Check collisions against all walls & trails
      const playerCollisionSegments = [
        ...this.player.getAllCollisionSegments(false),
        ...this.ai.getAllCollisionSegments(true)
      ];
      const aiCollisionSegments = [
        ...this.player.getAllCollisionSegments(true),
        ...this.ai.getAllCollisionSegments(false)
      ];

      let playerHit = this.collision.checkCycleCollision(
        prevPlayerPos,
        this.player.pos,
        playerCollisionSegments
      );
      let aiHit = this.collision.checkCycleCollision(
        prevAiPos,
        this.ai.pos,
        aiCollisionSegments
      );

      // Head-on cycle-to-cycle collision
      if (this.player.pos.distanceTo(this.ai.pos) < 1.35) {
        playerHit = true;
        aiHit = true;
      }

      if (playerHit || aiHit) {
        this.triggerDerezz(playerHit, aiHit);
      } else {
        this.cameraRig.updateGameplayCamera(this.player, dt);
        this.audio.updateEngine(
          this.player.currentSpeed / this.player.baseSpeed,
          this.player.isBoosting,
          this.player.inSlipstream
        );
      }

      this.updateHUD(preSegments);
    } else if (this.state === 'DEREZZ') {
      this.cameraRig.updateDerezzOrbitCamera(this.crashPoint, dt);
    }

    this.particles.update(dt);
    if (this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.cameraRig.camera);
    }

    requestAnimationFrame((t) => this.loop(t));
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.tronGame = new TronGame();
});

})();
