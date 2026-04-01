import type { GameEvents } from '../types';
import type { EventBus } from '../core/EventBus';

export class ChallengeStatus {
  private container: HTMLElement;
  private waveEl: HTMLElement;
  private timerEl: HTMLElement;
  private unsubs: (() => void)[] = [];
  private totalWaves = 5;
  private currentWave = 1;

  constructor(bus: EventBus<GameEvents>, parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.className = 'bh-challenge-status';
    this.container.style.cssText = [
      'position:fixed',
      'top:18px',
      'left:50%',
      'transform:translateX(-50%)',
      'z-index:2147483647',
      'display:flex',
      'gap:12px',
      'align-items:center',
      'padding:8px 12px',
      'border-radius:10px',
      'background:rgba(12,16,22,0.86)',
      'border:1px solid rgba(255,255,255,0.14)',
      'color:#fff',
      'font:12px system-ui, -apple-system, Segoe UI, sans-serif',
      'backdrop-filter:blur(3px)',
    ].join(';');

    this.waveEl = document.createElement('div');
    this.timerEl = document.createElement('div');
    this.waveEl.textContent = `Wave ${this.currentWave}/${this.totalWaves}`;
    this.timerEl.textContent = '02:30';
    this.container.appendChild(this.waveEl);
    this.container.appendChild(this.timerEl);
    parent.appendChild(this.container);

    this.unsubs.push(
      bus.on('challenge:wave', ({ wave, totalWaves }) => {
        this.currentWave = wave;
        this.totalWaves = totalWaves;
        this.waveEl.textContent = `Wave ${wave}/${totalWaves}`;
      }),
      bus.on('challenge:timer', ({ timeLeftMs }) => {
        this.timerEl.textContent = this.formatTime(timeLeftMs);
      }),
    );
  }

  cleanup(): void {
    for (const unsub of this.unsubs) unsub();
    this.container.remove();
  }

  private formatTime(ms: number): string {
    const totalSec = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const s = (totalSec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }
}
