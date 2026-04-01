import type { GameEvents } from '../types';
import type { EventBus } from '../core/EventBus';
import type { GameState } from '../core/GameState';

export class AudioManager {
  private ctx: AudioContext | null = null;
  private state: GameState;
  private unsubs: (() => void)[] = [];

  constructor(bus: EventBus<GameEvents>, state: GameState) {
    this.state = state;

    this.unsubs.push(
      bus.on('bug:killed', () => this.play('swatter-hit')),
      bus.on('weapon:fired', ({ weaponId }) => this.playWeapon(weaponId)),
      bus.on('stress:zero', () => this.play('victory')),
    );
  }

  play(soundId: string): void {
    if (this.state.get('muted')) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const t = ctx.currentTime;

    switch (soundId) {
      case 'swatter-hit':
        this.synthOsc(ctx, t, 200, 0.3, 0.1, 'sine', 80);
        this.synthNoise(ctx, t, 0.08, 0.4, 'highpass', 2000);
        break;
      case 'victory':
        this.synthOsc(ctx, t, 523, 0.2, 0.3, 'sine');
        this.synthOsc(ctx, t + 0.15, 659, 0.2, 0.3, 'sine');
        this.synthOsc(ctx, t + 0.3, 784, 0.2, 0.5, 'sine');
        this.synthOsc(ctx, t + 0.5, 1047, 0.3, 0.8, 'sine');
        break;
    }
  }

  playWeapon(weaponId: string): void {
    if (this.state.get('muted')) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime;

    // Matched to original Page Destroyer weapon sound envelopes.
    switch (weaponId) {
      case 'flamer':
        this.synthNoise(ctx, t, 0.4, 0.3, 'lowpass', 800);
        this.synthOsc(ctx, t, 150, 0.3, 0.15, 'sawtooth');
        break;
      case 'laser':
        this.synthOsc(ctx, t, 1200, 0.1, 0.15, 'sine', 400);
        this.synthOsc(ctx, t + 0.05, 800, 0.1, 0.08, 'square');
        break;
      case 'machinegun':
        for (let i = 0; i < 4; i++) {
          this.synthNoise(ctx, t + i * 0.08, 0.08, 0.2, 'highpass', 1000);
        }
        break;
      case 'hammer':
        this.synthOsc(ctx, t, 80, 0.4, 0.15, 'sine');
        this.synthNoise(ctx, t, 0.1, 0.3, 'lowpass', 400);
        break;
      case 'slipper':
        this.synthOsc(ctx, t, 220, 0.15, 0.08, 'triangle', 130);
        this.synthNoise(ctx, t + 0.06, 0.12, 0.26, 'highpass', 2400);
        this.synthNoise(ctx, t + 0.11, 0.18, 0.2, 'bandpass', 1800);
        break;
      case 'meteor':
        this.synthNoise(ctx, t, 0.3, 0.2, 'bandpass', 600);
        this.synthOsc(ctx, t + 0.45, 60, 0.5, 0.2, 'sine');
        this.synthNoise(ctx, t + 0.45, 0.3, 0.4, 'lowpass', 300);
        break;
      case 'blackhole':
        this.synthOsc(ctx, t, 100, 0.3, 0.5, 'sine', 20);
        this.synthOsc(ctx, t, 50, 0.2, 0.8, 'triangle');
        break;
      case 'explosion':
        this.synthNoise(ctx, t, 0.5, 0.5, 'lowpass', 500);
        this.synthOsc(ctx, t, 60, 0.3, 0.4, 'sine', 30);
        this.synthOsc(ctx, t + 0.1, 40, 0.3, 0.4, 'triangle');
        break;
      case 'spray':
        this.synthNoise(ctx, t, 0.28, 0.17, 'highpass', 2600);
        this.synthOsc(ctx, t, 420, 0.07, 0.12, 'triangle', 240);
        this.synthNoise(ctx, t + 0.04, 0.14, 0.1, 'bandpass', 1700);
        break;
      case 'acid':
        this.synthNoise(ctx, t, 0.5, 0.2, 'highpass', 3000);
        this.synthOsc(ctx, t, 300, 0.1, 0.3, 'sawtooth', 100);
        break;
      case 'freeze':
        this.synthOsc(ctx, t, 2000, 0.15, 0.1, 'sine', 3000);
        this.synthOsc(ctx, t + 0.1, 1500, 0.1, 0.15, 'sine', 2500);
        this.synthNoise(ctx, t + 0.2, 0.4, 0.15, 'highpass', 4000);
        this.synthOsc(ctx, t + 0.3, 800, 0.08, 0.2, 'triangle');
        break;
      case 'lightning':
        this.synthNoise(ctx, t, 0.1, 0.4, 'highpass', 2000);
        this.synthOsc(ctx, t, 200, 0.3, 0.05, 'sawtooth', 2000);
        this.synthNoise(ctx, t + 0.1, 0.15, 0.3, 'bandpass', 3000);
        this.synthOsc(ctx, t + 0.15, 100, 0.2, 0.1, 'square', 50);
        break;
      case 'tornado':
        this.synthNoise(ctx, t, 0.8, 0.25, 'bandpass', 400);
        this.synthOsc(ctx, t, 200, 0.1, 0.6, 'sine', 100);
        this.synthNoise(ctx, t + 0.3, 0.5, 0.2, 'lowpass', 600);
        break;
      case 'pixelate':
        for (let i = 0; i < 6; i++) {
          const freq = 100 + Math.random() * 1000;
          this.synthOsc(ctx, t + i * 0.1, freq, 0.15, 0.05, 'square');
        }
        this.synthNoise(ctx, t, 0.3, 0.2, 'highpass', 5000);
        break;
      case 'gravity':
        this.synthOsc(ctx, t, 40, 0.4, 0.5, 'sine', 20);
        this.synthOsc(ctx, t, 80, 0.25, 0.4, 'triangle', 30);
        this.synthNoise(ctx, t + 0.2, 0.3, 0.3, 'lowpass', 200);
        break;
    }
  }

  cleanup(): void {
    for (const unsub of this.unsubs) unsub();
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }

  private ensureContext(): AudioContext | null {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    }
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AC();
      return this.ctx;
    } catch {
      return null;
    }
  }

  private synthOsc(
    ctx: AudioContext, time: number, freq: number,
    gain: number, dur: number, type: OscillatorType, endFreq?: number,
  ): void {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 1), time + dur);
    gainNode.gain.setValueAtTime(gain, time);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + dur);
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + dur);
  }

  private synthNoise(
    ctx: AudioContext, time: number, dur: number,
    gain: number, filterType: BiquadFilterType, filterFreq: number,
  ): void {
    const bufferSize = ctx.sampleRate * dur;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = filterFreq;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(gain, time);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + dur);

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    source.start(time);
    source.stop(time + dur);
  }
}
