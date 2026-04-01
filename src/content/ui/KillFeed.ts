import type { GameEvents } from '../types';
import type { EventBus } from '../core/EventBus';

export class KillFeed {
  private container: HTMLElement;
  private unsubs: (() => void)[] = [];

  constructor(bus: EventBus<GameEvents>, parent: HTMLElement) {
    this.container = parent;

    this.unsubs.push(
      bus.on('bug:killed', ({ pos, scoreValue }) => {
        this.showFloatingText(`+${scoreValue}`, pos.x, pos.y);
      }),
      bus.on('bug:escaped', () => {
        // Could show "-ESCAPED" text at edge
      }),
    );
  }

  private showFloatingText(text: string, x: number, y: number): void {
    const el = document.createElement('div');
    el.className = 'bh-kill-text';
    el.textContent = text;
    el.style.position = 'fixed';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.zIndex = '2147483647';
    el.style.pointerEvents = 'none';
    this.container.appendChild(el);

    // Animate up and fade
    el.animate([
      { transform: 'translateY(0)', opacity: 1 },
      { transform: 'translateY(-60px)', opacity: 0 },
    ], {
      duration: 800,
      easing: 'ease-out',
    }).onfinish = () => el.remove();
  }

  cleanup(): void {
    for (const unsub of this.unsubs) unsub();
  }
}
