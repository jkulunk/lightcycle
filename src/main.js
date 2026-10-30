import * as THREE from 'three';
import { SynthAudio } from './audio/SynthAudio.js';
import { GridArena } from './scene/GridArena.js';
import { LightCycle } from './scene/LightCycle.js';
import { IntroSequence } from './scene/IntroSequence.js';
import { ParticleSystem } from './scene/Particles.js';
import { CameraRig, VIEW_MODES } from './camera/CameraRig.js';
import { CollisionSystem } from './logic/Collision.js';
import { AIController } from './logic/AIController.js';

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
