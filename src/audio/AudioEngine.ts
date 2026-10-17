// 8-bit Audio Engine using Web Audio API
class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxVolume = 0.3;
  private musicVolume = 0.15;
  private musicOsc: OscillatorNode | null = null;
  private musicGain: GainNode | null = null;
  private isMuted = false;
  private initialized = false;

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.sfxVolume;
      this.masterGain.connect(this.ctx.destination);
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio API not available');
    }
  }

  resume() {
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : this.sfxVolume;
    }
    if (this.musicGain) {
      this.musicGain.gain.value = muted ? 0 : this.musicVolume;
    }
  }

  toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  // Play a note with 8-bit sound
  private playNote(freq: number, duration: number, type: OscillatorType = 'square', volume: number = 0.3, delay: number = 0) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, this.ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + duration);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(this.ctx.currentTime + delay);
    osc.stop(this.ctx.currentTime + delay + duration);
  }

  // Sound effects
  playCardPlay() {
    this.playNote(440, 0.1, 'square', 0.2);
    this.playNote(660, 0.1, 'square', 0.2, 0.05);
    this.playNote(880, 0.15, 'square', 0.15, 0.1);
  }

  playCardPlaySpell() {
    this.playNote(880, 0.08, 'sawtooth', 0.2);
    this.playNote(1100, 0.08, 'sawtooth', 0.15, 0.05);
    this.playNote(660, 0.2, 'sawtooth', 0.1, 0.1);
  }

  playAttack() {
    this.playNote(150, 0.1, 'sawtooth', 0.3);
    this.playNote(100, 0.15, 'square', 0.2, 0.05);
  }

  playDamage() {
    this.playNote(200, 0.05, 'square', 0.3);
    this.playNote(100, 0.1, 'sawtooth', 0.2, 0.03);
  }

  playDeath() {
    this.playNote(400, 0.1, 'square', 0.2);
    this.playNote(300, 0.1, 'square', 0.15, 0.1);
    this.playNote(200, 0.15, 'square', 0.1, 0.2);
    this.playNote(100, 0.2, 'square', 0.08, 0.3);
  }

  playDraw() {
    this.playNote(600, 0.05, 'sine', 0.15);
    this.playNote(800, 0.08, 'sine', 0.1, 0.05);
  }

  playTurnStart() {
    this.playNote(523, 0.12, 'square', 0.2);
    this.playNote(659, 0.12, 'square', 0.2, 0.12);
    this.playNote(784, 0.2, 'square', 0.2, 0.24);
  }

  playVictory() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((n, i) => {
      this.playNote(n, 0.2, 'square', 0.2, i * 0.15);
    });
  }

  playDefeat() {
    const notes = [400, 350, 300, 200];
    notes.forEach((n, i) => {
      this.playNote(n, 0.3, 'sawtooth', 0.15, i * 0.2);
    });
  }

  playClick() {
    this.playNote(1000, 0.03, 'square', 0.1);
  }

  playEmotion() {
    this.playNote(800, 0.05, 'sine', 0.15);
    this.playNote(1200, 0.08, 'sine', 0.1, 0.05);
  }

  playBuff() {
    this.playNote(500, 0.08, 'sine', 0.15);
    this.playNote(700, 0.08, 'sine', 0.15, 0.08);
    this.playNote(900, 0.12, 'sine', 0.15, 0.16);
  }

  playHeal() {
    this.playNote(600, 0.1, 'sine', 0.15);
    this.playNote(900, 0.15, 'sine', 0.12, 0.1);
  }

  // Background music (simple loop)
  startMenuMusic() {
    if (!this.ctx || this.musicOsc) return;
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = this.isMuted ? 0 : this.musicVolume;
    this.musicGain.connect(this.ctx.destination);

    const playMelody = () => {
      if (!this.ctx || !this.musicGain) return;
      const melody = [262, 330, 392, 330, 262, 330, 392, 523];
      const noteLength = 0.3;
      melody.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const noteGain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        noteGain.gain.setValueAtTime(0.08, this.ctx!.currentTime + i * noteLength);
        noteGain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + (i + 0.8) * noteLength);
        osc.connect(noteGain);
        noteGain.connect(this.musicGain!);
        osc.start(this.ctx!.currentTime + i * noteLength);
        osc.stop(this.ctx!.currentTime + (i + 1) * noteLength);
      });
      setTimeout(playMelody, melody.length * noteLength * 1000);
    };
    playMelody();
  }

  stopMusic() {
    if (this.musicOsc) {
      this.musicOsc.stop();
      this.musicOsc = null;
    }
    this.musicGain = null;
  }
}

export const audio = new AudioEngine();
