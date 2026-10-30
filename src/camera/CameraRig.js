import * as THREE from 'three';

export const VIEW_MODES = {
  BIRDS_EYE: 'BIRDS_EYE',
  OVER_SHOULDER: 'OVER_SHOULDER',
  FIRST_PERSON: 'FIRST_PERSON'
};

export class CameraRig {
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
