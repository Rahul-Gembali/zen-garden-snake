/**
 * Zen Garden Snake - Web Audio API Synthesizer
 * Procedural Acoustic Piano Chimes & Zen Singing Bowls
 */

class ZenAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterGain = null;

    // Japanese Hirajoshi / Insen Meditative Pentatonic Scale (Hz)
    this.pianoScale = [
      261.63, // C4
      293.66, // D4
      311.13, // Eb4
      392.00, // G4
      415.30, // Ab4
      523.25, // C5
      587.33, // D5
      622.25, // Eb5
      783.99, // G5
      830.61, // Ab5
      1046.50,// C6
      1174.66,// D6
      1244.51,// Eb6
      1567.98,// G6
      2093.00 // C7
    ];

    this.scaleIndex = 0;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  /**
   * Physically-modeled acoustic piano note synthesis
   * Combines fundamental, stiff string partials, hammer attack impulse, and resonant body decay
   */
  playPianoNote(customFreq = null) {
    if (this.isMuted) return;
    this.init();

    const now = this.ctx.currentTime;
    let freq = customFreq;
    if (!freq) {
      freq = this.pianoScale[this.scaleIndex % this.pianoScale.length];
      this.scaleIndex++;
    }

    // Main note gain envelope
    const noteGain = this.ctx.createGain();
    noteGain.connect(this.masterGain);

    // Warm wooden soundboard filter
    const soundboardFilter = this.ctx.createBiquadFilter();
    soundboardFilter.type = 'lowpass';
    soundboardFilter.frequency.setValueAtTime(Math.min(freq * 4.5, 4500), now);
    soundboardFilter.Q.setValueAtTime(1.2, now);
    soundboardFilter.connect(noteGain);

    // Piano String Partials (Fundamental + Stiff string harmonics)
    const partials = [
      { ratio: 1.000, gain: 1.0, decay: 2.2 },
      { ratio: 2.003, gain: 0.55, decay: 1.8 },
      { ratio: 3.008, gain: 0.28, decay: 1.3 },
      { ratio: 4.015, gain: 0.14, decay: 0.9 },
      { ratio: 5.025, gain: 0.07, decay: 0.6 }
    ];

    partials.forEach((p) => {
      const osc = this.ctx.createOscillator();
      const pGain = this.ctx.createGain();

      // Sine with slight triangle warmth
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * p.ratio, now);

      // Acoustic envelope: immediate hammer strike, natural acoustic string decay
      pGain.gain.setValueAtTime(0.0001, now);
      pGain.gain.linearRampToValueAtTime(p.gain * 0.45, now + 0.008);
      pGain.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);

      osc.connect(pGain);
      pGain.connect(soundboardFilter);

      osc.start(now);
      osc.stop(now + p.decay + 0.05);
    });

    // Felt Hammer Strike Transient (subtle mechanical strike sound)
    const hammerBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.015, this.ctx.sampleRate);
    const data = hammerBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.2));
    }
    const hammerSource = this.ctx.createBufferSource();
    hammerSource.buffer = hammerBuffer;

    const hammerFilter = this.ctx.createBiquadFilter();
    hammerFilter.type = 'bandpass';
    hammerFilter.frequency.setValueAtTime(freq * 1.5, now);
    hammerFilter.Q.setValueAtTime(2.0, now);

    const hammerGain = this.ctx.createGain();
    hammerGain.gain.setValueAtTime(0.12, now);
    hammerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);

    hammerSource.connect(hammerFilter);
    hammerFilter.connect(hammerGain);
    hammerGain.connect(soundboardFilter);

    hammerSource.start(now);
  }

  /**
   * Gentle wooden temple block (Mokugyo) click for soft turn feedback
   */
  playWoodClick() {
    if (this.isMuted) return;
    this.init();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(480, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.035);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.045);
  }

  /**
   * Shimmering ascending piano arpeggio when consuming the Golden Ginkgo Leaf
   */
  playGoldenChime() {
    if (this.isMuted) return;
    this.init();

    const chords = [622.25, 783.99, 1046.50, 1244.51]; // Eb5, G5, C6, Eb6
    chords.forEach((freq, idx) => {
      setTimeout(() => {
        this.playPianoNote(freq);
      }, idx * 70);
    });
  }

  /**
   * Resonant Zen Singing Bowl / Rin gong for Game Over or Pause
   */
  playSingingBowl() {
    if (this.isMuted) return;
    this.init();

    const now = this.ctx.currentTime;
    const baseFreq = 220; // A3 deep meditative frequency
    const bowlPartials = [
      { mult: 1.0, gain: 0.4, decay: 3.5 },
      { mult: 2.76, gain: 0.22, decay: 2.8 },
      { mult: 5.4, gain: 0.12, decay: 2.0 }
    ];

    bowlPartials.forEach(bp => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq * bp.mult, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(bp.gain * 0.35, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + bp.decay);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + bp.decay + 0.1);
    });
  }

  resetScale() {
    this.scaleIndex = 0;
  }
}

window.zenAudio = new ZenAudioEngine();
