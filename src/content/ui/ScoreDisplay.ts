import type { GameEvents } from '../types';
import type { EventBus } from '../core/EventBus';

export class ScoreDisplay {
  private container: HTMLElement;
  private scoreEl: HTMLElement;
  private popTimeout: ReturnType<typeof setTimeout> | null = null;
  private unsubs: (() => void)[] = [];

  constructor(bus: EventBus<GameEvents>, parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.className = 'bh-score-display';
    const label = document.createElement('div');
    label.className = 'bh-score-label';
    label.textContent = 'SCORE';
    this.container.appendChild(label);

    this.scoreEl = document.createElement('div');
    this.scoreEl.className = 'bh-score-value';
    this.scoreEl.textContent = '0';
    this.container.appendChild(this.scoreEl);
    parent.appendChild(this.container);

    this.unsubs.push(
      bus.on('score:changed', ({ value, delta }) => {
        this.scoreEl.textContent = String(value);
        if (delta > 0) this.popAnimation();
      })
    );
  }

  private popAnimation(): void {
    this.scoreEl.classList.remove('bh-score-pop');
    // Force reflow
    void this.scoreEl.offsetWidth;
    this.scoreEl.classList.add('bh-score-pop');
    if (this.popTimeout) clearTimeout(this.popTimeout);
    this.popTimeout = setTimeout(() => {
      this.scoreEl.classList.remove('bh-score-pop');
    }, 300);
  }

  cleanup(): void {
    for (const unsub of this.unsubs) unsub();
    if (this.popTimeout) clearTimeout(this.popTimeout);
    this.container.remove();
  }
}
