import type { GameEvents } from '../types';
import type { EventBus } from '../core/EventBus';

export class StressMeter {
  private container: HTMLElement;
  private fillEl: HTMLElement;
  private valueEl: HTMLElement;
  private unsubs: (() => void)[] = [];

  constructor(bus: EventBus<GameEvents>, parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.className = 'bh-stress-meter';
    this.container.setAttribute('role', 'meter');
    this.container.setAttribute('aria-label', 'Office stress level');
    this.container.setAttribute('aria-valuemin', '0');
    this.container.setAttribute('aria-valuemax', '100');
    this.container.setAttribute('aria-valuenow', '50');

    const label = document.createElement('div');
    label.className = 'bh-stress-label';
    label.textContent = 'STRESS';
    this.container.appendChild(label);

    const bar = document.createElement('div');
    bar.className = 'bh-stress-bar';
    this.fillEl = document.createElement('div');
    this.fillEl.className = 'bh-stress-fill';
    bar.appendChild(this.fillEl);
    this.container.appendChild(bar);

    this.valueEl = document.createElement('div');
    this.valueEl.className = 'bh-stress-value';
    this.valueEl.textContent = '50%';
    this.container.appendChild(this.valueEl);
    parent.appendChild(this.container);

    this.unsubs.push(
      bus.on('stress:changed', ({ value }) => this.setValue(value))
    );
  }

  private setValue(value: number): void {
    this.fillEl.style.height = `${value}%`;
    this.valueEl.textContent = `${Math.round(value)}%`;
    this.container.setAttribute('aria-valuenow', String(Math.round(value)));

    // Color based on stress level
    if (value > 80) {
      this.fillEl.style.background = 'linear-gradient(to top, #ff4444, #ff0000)';
      this.container.classList.add('bh-stress-critical');
    } else if (value > 50) {
      this.fillEl.style.background = 'linear-gradient(to top, #ff8800, #ff4444)';
      this.container.classList.remove('bh-stress-critical');
    } else if (value > 25) {
      this.fillEl.style.background = 'linear-gradient(to top, #ffcc00, #ff8800)';
      this.container.classList.remove('bh-stress-critical');
    } else {
      this.fillEl.style.background = 'linear-gradient(to top, #00cc44, #44ff88)';
      this.container.classList.remove('bh-stress-critical');
    }
  }

  cleanup(): void {
    for (const unsub of this.unsubs) unsub();
    this.container.remove();
  }
}
