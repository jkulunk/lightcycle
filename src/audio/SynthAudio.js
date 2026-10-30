export class SynthAudio {
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
