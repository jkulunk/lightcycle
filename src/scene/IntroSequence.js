export class IntroSequence {
  constructor(playerCycle, aiCycles, cameraRig, audio, uiCallbacks) {
    this.player = playerCycle;
    this.aiCycles = Array.isArray(aiCycles) ? aiCycles : [aiCycles];
    this.cameraRig = cameraRig;
    this.audio = audio;
    this.ui = uiCallbacks || {};

    this.duration = 3.8;
    this.elapsed = 0;
    this.active = false;
    this.stage = 0;
  }

  setAICycles(aiCycles) {
    this.aiCycles = Array.isArray(aiCycles) ? aiCycles : [aiCycles];
  }

  start() {
    this.elapsed = 0;
    this.active = true;
    this.stage = 1;

    this.player.setIntroAnimationState(0);
    this.aiCycles.forEach((ai) => {
      if (ai.alive) ai.setIntroAnimationState(0);
    });

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
    this.aiCycles.forEach((ai) => {
      if (ai.alive) ai.setCompletedIntroState();
    });
    if (this.ui.onComplete) {
      this.ui.onComplete();
    }
  }

  update(dt) {
    if (!this.active) return false;

    this.elapsed += dt;
    const progress = Math.min(1.0, this.elapsed / this.duration);

    this.player.setIntroAnimationState(progress);
    this.aiCycles.forEach((ai) => {
      if (ai.alive) ai.setIntroAnimationState(progress);
    });

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

    this.cameraRig.updateIntroCamera(this.player, progress);

    if (progress >= 1.0) {
      this.active = false;
      this.player.setCompletedIntroState();
      this.aiCycles.forEach((ai) => {
        if (ai.alive) ai.setCompletedIntroState();
      });
      if (this.ui.onComplete) {
        this.ui.onComplete();
      }
      return false;
    }

    return true;
  }
}
