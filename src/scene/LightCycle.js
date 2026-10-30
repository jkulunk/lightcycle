import * as THREE from 'three';

export class LightCycle {
  constructor(scene, config) {
    this.scene = scene;
    this.name = config.name || 'PLAYER';
    this.color = config.color || 0x00f3ff;
    this.secondaryColor = config.secondaryColor || (config.isPlayer ? 0x99ffff : 0xffcc66);
    this.isPlayer = !!config.isPlayer;

    this.startX = config.startX !== undefined ? config.startX : -40;
    this.startZ = config.startZ !== undefined ? config.startZ : 0;
    this.startDir = config.startDir ? config.startDir.clone() : new THREE.Vector2(1, 0);

    this.baseSpeed = 42;
    this.boostSpeed = 68;
    this.brakeSpeed = 24;
    this.isBraking = false;
    this.phaseShiftTimer = 0;
    this.inVictory = false;
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

    // Dynamic PointLight on Every Cycle
    this.cycleLight = new THREE.PointLight(this.color, 1.6, 26);
    this.cycleLight.position.set(0, 1.6, 0);
    this.root.add(this.cycleLight);

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

    // 5. UNDER-GLOW MIRROR REFLECTION ON THE GLOSSY GRID FLOOR
    this.floorReflectionGroup = new THREE.Group();
    this.floorReflectionGroup.position.y = -0.55;
    this.floorReflectionGroup.scale.y = -0.65;

    this.reflectionMat = new THREE.MeshBasicMaterial({
      color: this.color,
      transparent: true,
      opacity: 0.22,
      depthWrite: false
    });
    this.reflectionSecondaryMat = new THREE.MeshBasicMaterial({
      color: this.secondaryColor,
      transparent: true,
      opacity: 0.22,
      depthWrite: false
    });

    const reflFrontShroud = new THREE.Mesh(frontShroudGeo, this.reflectionMat);
    reflFrontShroud.position.set(0, 0.78, 1.48);
    this.floorReflectionGroup.add(reflFrontShroud);

    const reflRearShroud = new THREE.Mesh(rearShroudGeo, this.reflectionMat);
    reflRearShroud.position.set(0, 0.84, -1.48);
    this.floorReflectionGroup.add(reflRearShroud);

    const reflDome = new THREE.Mesh(domeGeo, this.reflectionMat);
    reflDome.position.set(0, 0.90, -0.05);
    this.floorReflectionGroup.add(reflDome);

    [-0.49, 0.49].forEach((xSide) => {
      const reflStripe = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.08, 3.35),
        this.reflectionSecondaryMat
      );
      reflStripe.position.set(xSide, 0.78, 0.05);
      this.floorReflectionGroup.add(reflStripe);
    });

    this.bikeGroup.add(this.floorReflectionGroup);

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

  clearTrails() {
    while (this.trailGroup.children.length > 0) {
      const child = this.trailGroup.children.pop();
      if (child.geometry) child.geometry.dispose();
      if (child.children) {
        child.children.forEach((c) => {
          if (c.geometry) c.geometry.dispose();
          if (c.material) c.material.dispose();
        });
      }
    }
    this.segments = [];
    if (this.pos) {
      if (this.currentSegmentStart) {
        this.currentSegmentStart.copy(this.pos);
      } else {
        this.currentSegmentStart = this.pos.clone();
      }
    }
    this.activeWallMesh = this.createWallMesh();
    this.activeWallMesh.visible = !this.inIntro;
    this.trailGroup.add(this.activeWallMesh);
  }

  reset() {
    this.pos = new THREE.Vector2(this.startX, this.startZ);
    this.dir = this.startDir.clone();
    this.turnQueue = [];
    this.alive = true;
    this.isBoosting = false;
    this.isBraking = false;
    this.phaseShiftTimer = 0;
    this.inVictory = false;
    this.boostEnergy = 100;
    this.inSlipstream = false;
    this.leanAngle = 0;
    this.currentSpeed = this.baseSpeed;

    this.inIntro = true;
    this.clearTrails();
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
    this.inVictory = false;
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
    this.inVictory = false;
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

  /**
   * LEGO Minifigure Victory Celebration Pose:
   * Pops the canopy open, stands the LEGO Minifigure upright on the saddle,
   * and pumps both LEGO C-grip arms & the glowing Control Rod up and down overhead in celebration!
   */
  setVictoryPose(time = 0) {
    this.inVictory = true;
    this.inIntro = false;
    this.root.visible = true;
    this.bikeGroup.visible = true;
    this.riderGroup.visible = true;

    this.canopyGroup.visible = true;
    this.canopyGroup.position.y = 0.55;
    this.canopyGroup.rotation.x = -0.45;

    this.riderPoseGroup.position.set(0, 0.35, 0);
    this.pelvisGroup.position.set(0, 0.62, 0);
    this.riderTorso.rotation.x = 0;
    this.leftLeg.hipJoint.rotation.x = 0;
    this.rightLeg.hipJoint.rotation.x = 0;

    const pump = Math.sin(time * 9.0);
    const pump01 = (pump + 1) * 0.5;

    this.helmetGroup.rotation.x = -0.15 - pump01 * 0.1;
    this.helmetGroup.rotation.y = Math.sin(time * 3.5) * 0.22;

    const armPitch = -2.65 - pump * 0.38;
    this.leftArm.shoulderJoint.rotation.set(armPitch, 0.12, -0.15);
    this.rightArm.shoulderJoint.rotation.set(armPitch, -0.12, 0.15);
    this.leftArm.elbowJoint.rotation.set(-0.2, 0, 0);
    this.rightArm.elbowJoint.rotation.set(-0.2, 0, 0);

    this.leftBatonHalf.position.x = -0.16;
    this.rightBatonHalf.position.x = 0.16;
    this.batonPlasmaBridge.scale.x = 0.32;
    this.batonGroup.position.set(0, 0.88 + pump * 0.15, 0.14);

    this.batonHalo.material.opacity = 0.45 + pump01 * 0.45;
    const haloScale = 1.2 + pump01 * 0.9;
    this.batonHalo.scale.set(haloScale, haloScale, 1);
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
    } else if (this.isBraking) {
      this.currentSpeed = this.brakeSpeed;
      const regenRate = this.inSlipstream ? 28 : 8;
      this.boostEnergy = Math.min(100, this.boostEnergy + dt * regenRate);
    } else {
      this.currentSpeed = this.baseSpeed;
      const regenRate = this.inSlipstream ? 28 : 8;
      this.boostEnergy = Math.min(100, this.boostEnergy + dt * regenRate);
    }

    // Phase-Shift Invulnerability State
    if (this.phaseShiftTimer > 0) {
      this.phaseShiftTimer = Math.max(0, this.phaseShiftTimer - dt);
      this.hullMat.opacity = 0.35 + 0.25 * Math.sin(performance.now() * 0.025);
      this.wireframeShell.visible = true;
      this.wireframeMat.opacity = 0.85;
    } else if (!this.inIntro && !this.inVictory) {
      this.hullMat.opacity = 1.0;
      this.wireframeShell.visible = false;
      this.wireframeMat.opacity = 0;
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
