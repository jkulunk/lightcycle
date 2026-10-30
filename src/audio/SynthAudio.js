export class SynthAudio {
  constructor() {
    this.ctx = null;
    this.engineOsc1 = null;
    this.engineOsc2 = null;
    this.engineGain = null;
    this.muted = false;

    // 1982 Wendy Carlos / Synthwave arpeggiator state
    this.musicTimer = null;
    this.musicStep = 0;
    this.musicIntensity = 1.0;
    this.musicPlaying = false;
    this.arpNotes = [146.83, 174.61, 220.0, 293.66, 261.63, 220.0, 174.61, 164.81];
    this.leadNotes = [587.33, 698.46, 880.0, 783.99, 698.46, 659.25, 587.33, 523.25];
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
      this.stopMusic();
    }
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  startMusic() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    this.stopMusic();
    this.musicPlaying = true;
    this.musicStep = 0;

    const scheduleStep = () => {
      if (!this.musicPlaying || this.muted || !this.ctx) return;

      const now = this.ctx.currentTime;
      const step = this.musicStep;
      const noteFreq = this.arpNotes[step % this.arpNotes.length];
      const bar = Math.floor(step / 16) % 4;
      const transpose = bar === 2 ? 1.1892 : bar === 3 ? 0.8909 : 1.0; // F -> Bb -> C -> D minor feel
      const freq = noteFreq * transpose;

      // Bass arpeggio voice (sawtooth + lowpass filter)
      const bassOsc = this.ctx.createOscillator();
      const bassFilter = this.ctx.createBiquadFilter();
      const bassGain = this.ctx.createGain();

      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(freq * 0.5, now);

      bassFilter.type = 'lowpass';
      const cutoff = 520 * this.musicIntensity + (step % 4 === 0 ? 320 : 0);
      bassFilter.frequency.setValueAtTime(cutoff, now);
      bassFilter.frequency.exponentialRampToValueAtTime(160, now + 0.12);
      bassFilter.Q.setValueAtTime(4.5, now);

      const bassVol = step % 4 === 0 ? 0.048 : 0.032;
      bassGain.gain.setValueAtTime(bassVol, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

      bassOsc.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(this.ctx.destination);

      bassOsc.start(now);
      bassOsc.stop(now + 0.135);

      // Wendy Carlos style shimmering upper harmonic pulse on even steps or higher intensity
      if (step % 2 === 0 || this.musicIntensity > 1.25) {
        const leadOsc = this.ctx.createOscillator();
        const leadGain = this.ctx.createGain();
        const leadFreq = this.leadNotes[(step >> 1) % this.leadNotes.length] * transpose;

        leadOsc.type = step % 4 === 0 ? 'triangle' : 'sine';
        leadOsc.frequency.setValueAtTime(leadFreq, now);

        leadGain.gain.setValueAtTime(0.018 * Math.min(1.4, this.musicIntensity), now);
        leadGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

        leadOsc.connect(leadGain);
        leadGain.connect(this.ctx.destination);

        leadOsc.start(now);
        leadOsc.stop(now + 0.17);
      }

      this.musicStep++;
      const stepMs = Math.max(75, Math.round(140 / this.musicIntensity));
      this.musicTimer = setTimeout(scheduleStep, stepMs);
    };

    scheduleStep();
  }

  setMusicIntensity(level = 1.0) {
    this.musicIntensity = Math.max(1.0, Math.min(1.8, Number(level) || 1.0));
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
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

  playPowerUp(type = 'OVERCHARGE') {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const chordMap = {
      OVERCHARGE: [523.25, 659.25, 783.99, 1046.5],
      PHASE_SHIFT: [440.0, 554.37, 659.25, 880.0, 1108.73],
      TRAIL_ERASER: [392.0, 523.25, 659.25, 783.99, 1174.66]
    };
    const notes = chordMap[type] || chordMap.OVERCHARGE;
    const waveType = type === 'PHASE_SHIFT' ? 'sine' : type === 'TRAIL_ERASER' ? 'sawtooth' : 'triangle';

    notes.forEach((freq, idx) => {
      const startTime = this.ctx.currentTime + idx * 0.055;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = waveType;
      osc.frequency.setValueAtTime(freq, startTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.03, startTime + 0.16);

      gain.gain.setValueAtTime(0.11, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.19);
    });
  }

  playBrake() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(68, now + 0.24);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1100, now);
    filter.frequency.exponentialRampToValueAtTime(180, now + 0.24);

    gain.gain.setValueAtTime(0.095, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.26);
  }

  playWallBreach() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Deep structural boom
    const boomOsc = this.ctx.createOscillator();
    const boomGain = this.ctx.createGain();
    boomOsc.type = 'sine';
    boomOsc.frequency.setValueAtTime(140, now);
    boomOsc.frequency.exponentialRampToValueAtTime(28, now + 0.75);
    boomGain.gain.setValueAtTime(0.36, now);
    boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    boomOsc.connect(boomGain);
    boomGain.connect(this.ctx.destination);
    boomOsc.start(now);
    boomOsc.stop(now + 0.82);

    // High-frequency glass/grid shatter noise burst
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.55);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.16));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const highpass = this.ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(1600, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.26, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.54);

    noise.connect(highpass);
    highpass.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(now);

    // Crystalline grid shards
    const shardFreqs = [1760, 2349.32, 1480, 2959.96, 1975.53];
    shardFreqs.forEach((freq, idx) => {
      const t = now + 0.03 + idx * 0.045;
      const shardOsc = this.ctx.createOscillator();
      const shardGain = this.ctx.createGain();
      shardOsc.type = 'square';
      shardOsc.frequency.setValueAtTime(freq, t);
      shardOsc.frequency.exponentialRampToValueAtTime(freq * 0.72, t + 0.12);
      shardGain.gain.setValueAtTime(0.06, t);
      shardGain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
      shardOsc.connect(shardGain);
      shardGain.connect(this.ctx.destination);
      shardOsc.start(t);
      shardOsc.stop(t + 0.14);
    });
  }

  playVictoryFanfare() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    // Triumphant 4-note 1982 arcade victory fanfare (D4 -> F4 -> A4 -> D5 sustained)
    const fanfare = [
      { freq: 293.66, delay: 0.0, dur: 0.14 },
      { freq: 349.23, delay: 0.15, dur: 0.14 },
      { freq: 440.0, delay: 0.30, dur: 0.14 },
      { freq: 587.33, delay: 0.45, dur: 0.55 }
    ];

    fanfare.forEach(({ freq, delay, dur }) => {
      const startTime = this.ctx.currentTime + delay;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(freq, startTime);
      osc2.frequency.setValueAtTime(freq * 2, startTime);

      gain.gain.setValueAtTime(0.11, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(startTime);
      osc2.start(startTime);
      osc1.stop(startTime + dur + 0.02);
      osc2.stop(startTime + dur + 0.02);
    });
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
