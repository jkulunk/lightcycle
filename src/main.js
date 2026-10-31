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
    this.scene.fog = new THREE.FogExp2(0x03060e, 0.0025);

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
        0.75,
        0.45,
        0.22
      );
      this.composer.addPass(this.bloomPass);
    }

    // Create Player (Cyan) & Pool of up to 3 CPU Opponents (Orange, Yellow, Red-Magenta)
    this.player = new LightCycle(this.scene, {
      name: 'PLAYER',
      color: 0x00f3ff,
      secondaryColor: 0x99ffff,
      isPlayer: true,
      startX: -52,
      startZ: 0,
      startDir: new THREE.Vector2(1, 0)
    });

    this.aiPool = [
      new LightCycle(this.scene, {
        name: 'SARK (ORANGE)',
        color: 0xff6600,
        secondaryColor: 0xffcc66,
        isPlayer: false,
        startX: 52,
        startZ: 0,
        startDir: new THREE.Vector2(-1, 0)
      }),
      new LightCycle(this.scene, {
        name: 'CLU (YELLOW)',
        color: 0xffe600,
        secondaryColor: 0xffff99,
        isPlayer: false,
        startX: 0,
        startZ: -52,
        startDir: new THREE.Vector2(0, 1)
      }),
      new LightCycle(this.scene, {
        name: 'GUARD (CRIMSON)',
        color: 0xff1a66,
        secondaryColor: 0xff99bb,
        isPlayer: false,
        startX: 0,
        startZ: 52,
        startDir: new THREE.Vector2(0, -1)
      })
    ];

    // Game Mode: 'DUEL' (1v1) | 'BATTLE' (4-Bike Free-For-All) | 'GAUNTLET' (Endless Survival Waves)
    this.gameMode = 'DUEL';
    this.activeAICycles = [this.aiPool[0]];
    this.gauntletWave = 1;
    this.powerUpSpawnTimer = 0;

    this.introSequence = new IntroSequence(
      this.player,
      this.activeAICycles,
      this.cameraRig,
      this.audio,
      {
        onStageChange: (stageText, countText) => this.updateIntroBanners(stageText, countText),
        onComplete: () => this.beginActiveRace()
      }
    );

    // State: 'MENU' | 'INTRO' | 'PLAYING' | 'PAUSED' | 'VICTORY' | 'DEREZZ'
    this.state = 'MENU';
    this.playerScore = 0;
    this.aiScore = 0;
    this.crashPoint = new THREE.Vector3();
    this.winnerCycle = null;
    this.pauseOrbitDir = 0;

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
        this.updateModeLabel();
      });
    });

    // Single-Player Arena Mode Selection Cards (1v1 Duel, 4-Bike Battle, Gauntlet Waves)
    const modeCards = document.querySelectorAll('[data-mode-select]');
    modeCards.forEach((card) => {
      card.addEventListener('click', () => {
        modeCards.forEach((c) => c.classList.remove('selected'));
        card.classList.add('selected');
        this.gameMode = card.getAttribute('data-mode-select');
        this.updateModeLabel();
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

    // Pause Button in Top HUD
    const hudPauseBtn = document.getElementById('hud-pause-btn');
    if (hudPauseBtn) {
      hudPauseBtn.addEventListener('click', () => {
        this.togglePause();
        hudPauseBtn.blur();
      });
    }

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
      this.audio.stopMusic();
      this.syncCockpitHUDVisibility();
    });
  }

  updateModeLabel() {
    const diff = this.aiController.difficulty;
    const modeTag =
      this.gameMode === 'BATTLE'
        ? '4-BIKE GRID'
        : this.gameMode === 'GAUNTLET'
        ? `WAVE ${this.gauntletWave}`
        : '1v1 DUEL';
    document.getElementById('cpu-label').textContent = `${modeTag} (${diff})`;
  }

  syncCockpitHUDVisibility() {
    const isPlayingOrPaused = this.state === 'PLAYING' || this.state === 'PAUSED';
    document.getElementById('hud-top').classList.toggle('hud-hidden', !isPlayingOrPaused);
    document.getElementById('hud-bottom').classList.toggle('hud-hidden', !isPlayingOrPaused);

    const cockpit = document.getElementById('cockpit-overlay');
    cockpit.classList.toggle(
      'active',
      this.state === 'PLAYING' && this.cameraRig.mode === VIEW_MODES.FIRST_PERSON
    );
  }

  setSoundEnabled(enabled) {
    this.audio.setMuted(!enabled);
    if (enabled && this.state === 'PLAYING') {
      this.audio.startEngine();
      this.audio.startMusic();
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

  togglePause() {
    const countBanner = document.getElementById('countdown-banner');
    const stageBanner = document.getElementById('intro-stage-banner');
    const pauseBtn = document.getElementById('hud-pause-btn');

    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.audio.stopEngine();
      this.audio.stopMusic();
      countBanner.style.display = 'block';
      countBanner.textContent = 'PAUSED';
      stageBanner.style.display = 'block';
      stageBanner.textContent = 'FREE ORBIT INSPECTION // [A/D] ROTATE CAMERA • [P / ESC] RESUME';
      if (pauseBtn) pauseBtn.textContent = 'RESUME [P]';
      this.syncCockpitHUDVisibility();
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      countBanner.style.display = 'none';
      stageBanner.style.display = 'none';
      if (pauseBtn) pauseBtn.textContent = 'PAUSE [P]';
      if (!this.audio.muted) {
        this.audio.startEngine();
        this.audio.startMusic();
      }
      this.syncCockpitHUDVisibility();
    }
  }

  setCameraView(mode) {
    this.cameraRig.setMode(mode, this.player, (activeMode) => {
      document.querySelectorAll('[data-hud-cam]').forEach((btn) => {
        btn.classList.toggle('active', btn.getAttribute('data-hud-cam') === activeMode);
      });
      document.querySelectorAll('[data-cam-select]').forEach((card) => {
        card.classList.toggle('selected', card.getAttribute('data-cam-select') === activeMode);
      });
      this.syncCockpitHUDVisibility();

      const hint = document.getElementById('controls-hint-text');
      if (activeMode === VIEW_MODES.BIRDS_EYE) {
        hint.innerHTML =
          '<strong>BIRD\'S-EYE:</strong> [W/A/S/D or ARROWS] Steer &bull; [SHIFT/SPACE] Boost &bull; [P] Pause &bull; [M] Sound &bull; [1/2/3/C] View';
      } else {
        hint.innerHTML =
          '<strong>3D STEERING:</strong> [A/&larr;] Left &bull; [D/&rarr;] Right &bull; [W/&uarr;/SHIFT] Boost &bull; [S/&darr;] Brake &bull; [P] Pause &bull; [1/2/3/C] View';
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

        // Camera Switching & Sound & Pause
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
        } else if (code === 'KeyP' || key === 'p' || code === 'Escape' || key === 'escape') {
          if (this.state === 'PLAYING' || this.state === 'PAUSED') {
            e.preventDefault();
            this.togglePause();
            return;
          }
        }

        if (this.state === 'PAUSED') {
          if (isLeft) this.pauseOrbitDir = -1.4;
          if (isRight) this.pauseOrbitDir = 1.4;
          return;
        }

        if (this.state === 'MENU' && (isSpace || isEnter)) {
          e.preventDefault();
          this.startNewRound();
          return;
        }

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

        if ((this.state === 'DEREZZ' || this.state === 'VICTORY') && (isSpace || isEnter)) {
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
            if (Math.abs(effDir.x) > 0.5) {
              this.player.queueCardinalDirection(new THREE.Vector2(0, -1));
            } else if (effDir.y < -0.5) {
              this.player.isBoosting = true;
            } else {
              this.player.isBraking = true;
            }
          } else if (isDown) {
            e.preventDefault();
            if (Math.abs(effDir.x) > 0.5) {
              this.player.queueCardinalDirection(new THREE.Vector2(0, 1));
            } else if (effDir.y > 0.5) {
              this.player.isBoosting = true;
            } else {
              this.player.isBraking = true;
            }
          } else if (isLeft) {
            e.preventDefault();
            if (Math.abs(effDir.y) > 0.5) {
              this.player.queueCardinalDirection(new THREE.Vector2(-1, 0));
            } else {
              this.player.queueTurn('LEFT');
            }
          } else if (isRight) {
            e.preventDefault();
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
          // 3D Views: A/D = Turn Left/Right, W/Up/Shift/Space = Boost, S/Down = Speed Brake!
          if (isLeft) {
            e.preventDefault();
            this.player.queueTurn('LEFT');
          } else if (isRight) {
            e.preventDefault();
            this.player.queueTurn('RIGHT');
          } else if (isUp || isShift || isSpace) {
            e.preventDefault();
            this.player.isBoosting = true;
            this.player.isBraking = false;
          } else if (isDown) {
            e.preventDefault();
            if (!this.player.isBraking) {
              this.audio.playBrake();
            }
            this.player.isBraking = true;
            this.player.isBoosting = false;
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
      if (code === 'KeyS' || code === 'ArrowDown' || key === 's' || key === 'arrowdown') {
        this.player.isBraking = false;
      }
      if (
        code === 'KeyA' ||
        code === 'ArrowLeft' ||
        code === 'KeyD' ||
        code === 'ArrowRight' ||
        key === 'a' ||
        key === 'd'
      ) {
        this.pauseOrbitDir = 0;
      }
    });
  }

  startNewRound() {
    document.getElementById('start-modal').classList.add('hidden');
    document.getElementById('gameover-modal').classList.add('hidden');
    document.getElementById('proximity-warning').style.display = 'none';

    this.particles.clear();
    this.arena.clearWallBreaches();
    this.arena.clearPowerUps();
    this.arena.spawnArenaObstacles(4);
    this.spawnInitialPowerUps();

    this.player.reset();
    this.gauntletWave = 1;
    this.updateModeLabel();

    // Configure active AI Opponents based on chosen Game Mode
    const aiCount = this.gameMode === 'BATTLE' ? 3 : 1;
    this.activeAICycles = [];
    this.aiPool.forEach((ai, idx) => {
      if (idx < aiCount) {
        ai.reset();
        this.activeAICycles.push(ai);
      } else {
        ai.alive = false;
        ai.root.visible = false;
        ai.clearTrails();
      }
    });

    this.introSequence.setAICycles(this.activeAICycles);

    const playIntro = document.getElementById('intro-checkbox').checked;
    if (playIntro) {
      this.state = 'INTRO';
      this.syncCockpitHUDVisibility();
      this.introSequence.start();
    } else {
      this.beginActiveRace();
    }
  }

  spawnInitialPowerUps() {
    const types = ['OVERCHARGE', 'PHASE_SHIFT', 'TRAIL_ERASER'];
    const spots = [
      { x: 0, z: 0 },
      { x: -32, z: -32 },
      { x: 32, z: 32 }
    ];
    spots.forEach((pt, idx) => {
      this.arena.spawnPowerUp(types[idx % types.length], pt.x, pt.z);
    });
    this.powerUpSpawnTimer = 7.0;
  }

  spawnGauntletWave() {
    this.gauntletWave++;
    this.updateModeLabel();
    this.audio.playVictoryFanfare();
    this.audio.setMusicIntensity(Math.min(1.8, 1.0 + this.gauntletWave * 0.15));

    // Show Wave Banner
    const stageBanner = document.getElementById('intro-stage-banner');
    stageBanner.style.display = 'block';
    stageBanner.textContent = `GAUNTLET WAVE ${this.gauntletWave} // NEW CPU CHALLENGERS REZZING ON GRID!`;
    setTimeout(() => {
      if (this.state === 'PLAYING') stageBanner.style.display = 'none';
    }, 2200);

    // Spawn 1 or 2 fresh AI cycles at safe spawn positions
    const count = Math.min(3, 1 + Math.floor(this.gauntletWave / 2));
    this.activeAICycles = [];
    const safeSpawns = [
      { x: 60, z: 0, dir: new THREE.Vector2(-1, 0) },
      { x: 0, z: -60, dir: new THREE.Vector2(0, 1) },
      { x: 0, z: 60, dir: new THREE.Vector2(0, -1) }
    ];

    for (let i = 0; i < count; i++) {
      const ai = this.aiPool[i];
      const sp = safeSpawns[i];
      // Pick spawn farthest from player
      ai.startX = this.player.pos.x > 0 ? -60 : sp.x;
      ai.startZ = sp.z;
      ai.startDir.copy(sp.dir);
      ai.reset();
      ai.setCompletedIntroState();
      this.activeAICycles.push(ai);
    }
  }

  checkPowerUpPickups(allCycles, prevPositions = null) {
    for (let i = this.arena.powerUps.length - 1; i >= 0; i--) {
      const pu = this.arena.powerUps[i];
      for (const cycle of allCycles) {
        if (!cycle || !cycle.alive) continue;
        if (
          this.collision.checkPowerUpCollision(
            prevPositions ? prevPositions.get(cycle) : null,
            cycle.pos,
            pu
          )
        ) {
          this.applyPowerUp(cycle, pu);
          this.arena.removePowerUp(pu);
          break;
        }
      }
    }
  }

  applyPowerUp(cycle, pu) {
    this.particles.spawnPowerUpBurst(pu.x, pu.z, pu.color);
    if (cycle.isPlayer) {
      this.audio.playPowerUp(pu.type);
    }

    const stageBanner = document.getElementById('intro-stage-banner');
    if (pu.type === 'OVERCHARGE') {
      cycle.boostEnergy = 100;
      cycle.overchargeTimer = 3.5;
      if (cycle.isPlayer) {
        stageBanner.style.display = 'block';
        stageBanner.textContent = 'POWER-UP // TURBINE OVERCHARGE (100% BOOST)';
      }
    } else if (pu.type === 'PHASE_SHIFT') {
      cycle.phaseShiftTimer = 3.5;
      if (cycle.isPlayer) {
        stageBanner.style.display = 'block';
        stageBanner.textContent = 'POWER-UP // PHASE-SHIFT ACTIVE (3.5s TRAIL IMMUNITY!)';
      }
    } else if (pu.type === 'TRAIL_ERASER') {
      if (cycle.isPlayer) {
        this.activeAICycles.forEach((ai) => ai.clearTrails());
        stageBanner.style.display = 'block';
        stageBanner.textContent = 'POWER-UP // ENEMY LIGHT TRAILS DEREZZED!';
      } else {
        this.player.clearTrails();
      }
    }

    if (cycle.isPlayer) {
      if (this.powerUpBannerTimeout) clearTimeout(this.powerUpBannerTimeout);
      this.powerUpBannerTimeout = setTimeout(() => {
        if (this.state === 'PLAYING') stageBanner.style.display = 'none';
      }, 1800);
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
    this.activeAICycles.forEach((ai) => ai.setCompletedIntroState());
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
    this.audio.startMusic();
  }

  triggerMatchEnd(outcome, breachCycle = null) {
    this.audio.stopEngine();
    this.audio.stopMusic();
    document.getElementById('proximity-warning').style.display = 'none';

    let title = '';
    let subtitle = '';

    if (outcome === 'BREACH') {
      this.state = 'VICTORY';
      this.playerScore++;
      this.winnerCycle = breachCycle || this.player;
      this.audio.playWallBreach();
      this.audio.playVictoryFanfare();
      title = 'GRID WALL BREACHED — ESCAPED!';
      subtitle = '1982 FLYNN ESCAPE ACHIEVED // OFF THE GRID!';
    } else if (outcome === 'PLAYER_WIN') {
      this.state = 'VICTORY';
      this.playerScore++;
      this.winnerCycle = this.player;
      this.audio.playVictoryFanfare();
      title = 'ALL CPUS DEREZZED — VICTORY!';
      subtitle = 'LEGO USER CLAIMS THE GAME GRID';
    } else if (outcome === 'DRAW') {
      this.state = 'DEREZZ';
      this.audio.playDerezz();
      title = 'SIMULTANEOUS DEREZZ';
      subtitle = 'MUTUAL GRID COLLISION // DRAW ROUND';
    } else {
      this.state = 'DEREZZ';
      this.aiScore++;
      this.audio.playDerezz();
      title = 'USER DEREZZED';
      subtitle =
        this.gameMode === 'GAUNTLET'
          ? `SURVIVED TO GAUNTLET WAVE ${this.gauntletWave}`
          : 'CPU CLAIMS THE GRID SECTOR';
    }

    this.syncCockpitHUDVisibility();
    document.getElementById('score-player').textContent = `P1: ${this.playerScore}`;
    document.getElementById('score-ai').textContent = `CPU: ${this.aiScore}`;

    const titleEl = document.getElementById('gameover-title');
    titleEl.textContent = title;
    titleEl.style.color = outcome === 'CPU_WIN' ? '#ff6600' : '#00f3ff';
    document.getElementById('gameover-sub').textContent = subtitle;

    setTimeout(() => {
      if (this.state === 'DEREZZ' || this.state === 'VICTORY') {
        document.getElementById('gameover-modal').classList.remove('hidden');
      }
    }, 1500);
  }

  updateHUD(allSegments) {
    const boostFill = document.getElementById('boost-fill');
    boostFill.style.width = `${Math.round(this.player.boostEnergy)}%`;

    const kmh = Math.round(this.player.currentSpeed * 3.4);
    let statusTag = '';
    if (this.player.phaseShiftTimer > 0) {
      statusTag = ` [PHASE ${this.player.phaseShiftTimer.toFixed(1)}s]`;
    } else if (this.player.overchargeTimer > 0) {
      statusTag = ` [OVERCHARGE ${this.player.overchargeTimer.toFixed(1)}s]`;
    } else if (this.player.inSlipstream) {
      statusTag = ' [SLIPSTREAM +]';
    } else if (this.player.isBraking) {
      statusTag = ' [BRAKE]';
    }
    document.getElementById('speed-readout').textContent = `${kmh} KM/H${statusTag}`;

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
      200,
      this.arena.obstacles
    );
    const leftClearance = this.collision.raycastDistance(
      this.player.pos.x,
      this.player.pos.y,
      lx,
      lz,
      allSegments,
      200,
      this.arena.obstacles
    );
    const rightClearance = this.collision.raycastDistance(
      this.player.pos.x,
      this.player.pos.y,
      rx,
      rz,
      allSegments,
      200,
      this.arena.obstacles
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
      this.updateFirstPersonHUD(fwdClearance, leftClearance, rightClearance, kmh, statusTag);
    }

    this.renderRadar();
  }

  updateFirstPersonHUD(fwdDist, leftDist, rightDist, kmh, statusTag) {
    const dx = this.player.dir.x;
    const dz = this.player.dir.y;
    let headingText = 'EAST (090°)';
    if (dx > 0.5) headingText = 'EAST (090°)';
    else if (dx < -0.5) headingText = 'WEST (270°)';
    else if (dz < -0.5) headingText = 'NORTH (000°)';
    else if (dz > 0.5) headingText = 'SOUTH (180°)';
    document.getElementById('fp-heading-val').textContent = headingText;

    // Nearest living AI Cycle bearing
    let nearestAI = this.activeAICycles.find((a) => a.alive) || this.activeAICycles[0];
    let bestDist = Infinity;
    this.activeAICycles.forEach((a) => {
      if (!a.alive) return;
      const d = Math.hypot(a.pos.x - this.player.pos.x, a.pos.y - this.player.pos.y);
      if (d < bestDist) {
        bestDist = d;
        nearestAI = a;
      }
    });

    if (nearestAI) {
      const toAiX = nearestAI.pos.x - this.player.pos.x;
      const toAiZ = nearestAI.pos.y - this.player.pos.y;
      const aiDist = Math.round(Math.hypot(toAiX, toAiZ));
      const fwdDot = toAiX * dx + toAiZ * dz;
      const rightDot = toAiX * -dz + toAiZ * dx;

      const verticalRel = Math.abs(fwdDot) < 10 ? '' : fwdDot > 0 ? 'AHEAD ' : 'BEHIND ';
      const sideRel = Math.abs(rightDot) < 10 ? 'CENTER' : rightDot > 0 ? 'RIGHT' : 'LEFT';
      document.getElementById('fp-enemy-bearing').textContent = `CPU: ${verticalRel}${sideRel} (${aiDist}m)`;
    }

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

    const fwdEl = document.getElementById('fp-fwd-range');
    const advisorEl = document.getElementById('fp-turn-advisor');
    const fRound = Math.round(fwdDist);
    fwdEl.textContent = `FWD RANGE: ${fRound}m`;
    fwdEl.style.color = fwdDist < 28 ? '#ff2a55' : fwdDist < 50 ? '#ffcc00' : '#00f3ff';

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

    document.getElementById('fp-dash-speed').textContent = `${kmh} KM/H${statusTag}`;
    document.getElementById('fp-dash-boost').style.width = `${Math.round(this.player.boostEnergy)}%`;
  }

  renderRadar() {
    const ctx = this.radarCtx;
    const w = this.radarCanvas.width;
    const h = this.radarCanvas.height;
    ctx.clearRect(0, 0, w, h);

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

    // Draw Arena Obstacles on Radar
    ctx.fillStyle = 'rgba(0, 200, 255, 0.45)';
    this.arena.obstacles.forEach((obs) => {
      const op = toRadar(obs.x, obs.z);
      ctx.fillRect(op.x - 2, op.y - 2, 4, 4);
    });

    // Draw Power-Ups on Radar
    this.arena.powerUps.forEach((pu) => {
      const pp = toRadar(pu.x, pu.z);
      ctx.fillStyle = '#' + pu.color.toString(16).padStart(6, '0');
      ctx.beginPath();
      ctx.arc(pp.x, pp.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
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

    // Draw All Active AI Trails
    const aiHexColors = ['#ff6600', '#ffe600', '#ff1a66'];
    this.activeAICycles.forEach((ai, idx) => {
      ctx.strokeStyle = aiHexColors[idx % aiHexColors.length];
      ctx.lineWidth = 2;
      ctx.beginPath();
      ai.getAllCollisionSegments(true).forEach((s) => {
        const p1 = toRadar(s.x1, s.z1);
        const p2 = toRadar(s.x2, s.z2);
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
      });
      ctx.stroke();

      if (ai.alive) {
        const ap = toRadar(ai.pos.x, ai.pos.y);
        ctx.fillStyle = aiHexColors[idx % aiHexColors.length];
        ctx.beginPath();
        ctx.arc(ap.x, ap.y, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    if (this.player.alive) {
      const pp = toRadar(this.player.pos.x, this.player.pos.y);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(pp.x, pp.y, 3.4, 0, Math.PI * 2);
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

    this.arena.update(dt);

    if (this.state === 'MENU') {
      this.cameraRig.updateDerezzOrbitCamera(new THREE.Vector3(0, 0, 0), dt * 0.45);
    } else if (this.state === 'INTRO') {
      this.introSequence.update(dt);
    } else if (this.state === 'PAUSED') {
      const focus = new THREE.Vector3(this.player.pos.x * 0.4, 0, this.player.pos.y * 0.4);
      this.cameraRig.updatePauseCamera(focus, dt, this.pauseOrbitDir);
    } else if (this.state === 'PLAYING') {
      // Periodically spawn Power-Up Octahedrons
      this.powerUpSpawnTimer -= dt;
      if (this.powerUpSpawnTimer <= 0 && this.arena.powerUps.length < 4) {
        const types = ['OVERCHARGE', 'PHASE_SHIFT', 'TRAIL_ERASER'];
        const randType = types[Math.floor(Math.random() * types.length)];
        const rx = (Math.random() - 0.5) * 130;
        const rz = (Math.random() - 0.5) * 130;
        this.arena.spawnPowerUp(randType, rx, rz);
        this.powerUpSpawnTimer = 8.5;
      }

      const allCycles = [this.player, ...this.activeAICycles];
      const prevPositions = new Map();
      allCycles.forEach((c) => {
        if (c.alive) prevPositions.set(c, c.pos.clone());
      });

      const allActiveSegments = [];
      allCycles.forEach((c) => {
        allActiveSegments.push(...c.getAllCollisionSegments(true));
      });

      // AI Decision Step for all living CPU cycles
      this.activeAICycles.forEach((ai) => {
        if (!ai.alive) return;
        const opponents = allCycles.filter((c) => c !== ai && c.alive);
        this.aiController.update(
          dt,
          ai,
          opponents,
          allActiveSegments,
          this.arena.obstacles,
          this.arena.powerUps
        );
      });

      // Slipstream check
      this.player.inSlipstream = this.collision.checkSlipstream(
        this.player,
        allActiveSegments,
        this.arena.obstacles
      );

      // Advance all living cycles
      allCycles.forEach((c) => {
        if (!c.alive) return;
        c.update(dt, this.audio);
        if (c.isBoosting || c.inSlipstream || c.overchargeTimer > 0) {
          this.particles.spawnBoostSpark(c.pos.x, c.pos.y, c.dir.x, c.dir.y, c.color);
        }
      });

      // Check Power-Up Pickups
      this.checkPowerUpPickups(allCycles, prevPositions);

      // Check Collisions for Player & AI Cycles
      let playerHit = false;
      let playerBreachedWall = false;

      // 1. Player Collision Check
      const playerBoundary = this.collision.checkBoundaryHit(this.player.pos);
      if (playerBoundary) {
        // 1982 "Off the Grid" Escape Breach if player hits outer perimeter wall while Boosting at high speed!
        if (this.player.isBoosting && this.player.currentSpeed > 55) {
          playerBreachedWall = true;
          this.arena.createWallBreach(this.player.pos.x, this.player.pos.y);
          this.particles.spawnWallBreachExplosion(this.player.pos.x, this.player.pos.y);
        } else {
          playerHit = true;
        }
      } else if (this.collision.checkObstacleCollision(this.player.pos, this.arena.obstacles)) {
        playerHit = true;
      } else if (this.player.phaseShiftTimer <= 0) {
        const segsAgainstPlayer = [
          ...this.player.getAllCollisionSegments(false),
          ...this.activeAICycles.flatMap((ai) => ai.getAllCollisionSegments(true))
        ];
        playerHit = this.collision.checkCycleCollision(
          prevPositions.get(this.player),
          this.player.pos,
          segsAgainstPlayer
        );
      }

      // 2. AI Cycles Collision Check
      this.activeAICycles.forEach((ai) => {
        if (!ai.alive) return;
        const prevAi = prevPositions.get(ai);
        let aiHit =
          this.collision.checkBoundaryHit(ai.pos) ||
          this.collision.checkObstacleCollision(ai.pos, this.arena.obstacles);

        if (!aiHit && ai.phaseShiftTimer <= 0) {
          const segsAgainstAi = [
            ...this.player.getAllCollisionSegments(true),
            ...ai.getAllCollisionSegments(false),
            ...this.activeAICycles
              .filter((other) => other !== ai)
              .flatMap((other) => other.getAllCollisionSegments(true))
          ];
          aiHit = this.collision.checkCycleCollision(prevAi, ai.pos, segsAgainstAi);
        }

        // Head-on with player
        if (this.player.pos.distanceTo(ai.pos) < 1.35) {
          if (this.player.phaseShiftTimer <= 0) playerHit = true;
          if (ai.phaseShiftTimer <= 0) aiHit = true;
        }

        if (aiHit) {
          ai.alive = false;
          ai.root.visible = false;
          this.audio.playDerezz();
          this.particles.spawnDerezzExplosion(ai.pos.x, ai.pos.y, ai.color);
          this.crashPoint.set(ai.pos.x, 0, ai.pos.y);
        }
      });

      const anyAiAlive = this.activeAICycles.some((ai) => ai.alive);

      if (playerBreachedWall) {
        this.triggerMatchEnd('BREACH', this.player);
      } else if (playerHit) {
        this.player.alive = false;
        this.player.root.visible = false;
        this.particles.spawnDerezzExplosion(this.player.pos.x, this.player.pos.y, 0x00f3ff);
        this.crashPoint.set(this.player.pos.x, 0, this.player.pos.y);
        this.triggerMatchEnd(anyAiAlive ? 'CPU_WIN' : 'DRAW');
      } else if (!anyAiAlive) {
        if (this.gameMode === 'GAUNTLET') {
          this.playerScore++;
          document.getElementById('score-player').textContent = `P1: ${this.playerScore}`;
          this.spawnGauntletWave();
        } else {
          this.triggerMatchEnd('PLAYER_WIN');
        }
      } else {
        this.cameraRig.updateGameplayCamera(this.player, dt);
        this.audio.updateEngine(
          this.player.currentSpeed / this.player.baseSpeed,
          this.player.isBoosting,
          this.player.inSlipstream
        );
      }

      this.updateHUD(allActiveSegments);
    } else if (this.state === 'VICTORY') {
      if (this.winnerCycle) {
        this.winnerCycle.setVictoryPose(now * 0.001);
        this.cameraRig.updateVictoryCamera(this.winnerCycle, dt);
      }
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
