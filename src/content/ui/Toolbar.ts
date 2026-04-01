import type { GameEvents, WeaponId } from '../types';
import type { EventBus } from '../core/EventBus';
import type { GameState } from '../core/GameState';
import { WEAPONS } from '../legacy/weapons';

export class Toolbar {
  private container: HTMLElement;
  private bus: EventBus<GameEvents>;
  private state: GameState;
  private unsubs: (() => void)[] = [];

  constructor(
    bus: EventBus<GameEvents>,
    state: GameState,
    parent: HTMLElement,
  ) {
    this.bus = bus;
    this.state = state;
    this.container = document.createElement('div');
    this.container.className = 'bh-toolbar';
    this.container.id = 'bh-toolbar';

    this.buildWeaponButtons();
    this.addSeparator();
    this.buildControlButtons();

    parent.appendChild(this.container);

    // Listen for selections
    this.unsubs.push(
      bus.on('weapon:selected', ({ weaponId }) => this.updateWeaponActive(weaponId)),
    );
  }

  private buildWeaponButtons(): void {
    const label = document.createElement('div');
    label.className = 'bh-toolbar-section-label';
    label.textContent = 'TOOLS';
    this.container.appendChild(label);

    for (const [id, def] of Object.entries(WEAPONS)) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'bh-weapon-btn' + (id === this.state.get('activeWeapon') ? ' bh-active' : '');
      btn.dataset.weaponId = id;
      btn.textContent = def.icon;
      btn.title = def.name;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.state.setActiveWeapon(id);
      });
      this.container.appendChild(btn);
    }
  }

  private buildControlButtons(): void {
    // Mute button
    const muteBtn = document.createElement('button');
    muteBtn.type = 'button';
    muteBtn.className = 'bh-control-btn';
    muteBtn.textContent = this.state.get('muted') ? '🔇' : '🔊';
    muteBtn.title = 'Toggle Sound (M)';
    muteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const newMuted = !this.state.get('muted');
      this.state.setMuted(newMuted);
      muteBtn.textContent = newMuted ? '🔇' : '🔊';
    });
    this.container.appendChild(muteBtn);

    // Reset button
    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'bh-control-btn bh-reset-btn';
    resetBtn.textContent = '↺';
    resetBtn.title = 'Reset Destroyed Elements';
    resetBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.bus.emit('game:reset', {});
    });
    this.container.appendChild(resetBtn);

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'bh-control-btn bh-close-btn';
    closeBtn.textContent = '✕';
    closeBtn.title = 'Exit (ESC)';
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.bus.emit('game:ended', { reason: 'quit', score: this.state.get('score') });
    });
    this.container.appendChild(closeBtn);
  }

  private addSeparator(): void {
    const sep = document.createElement('div');
    sep.className = 'bh-toolbar-separator';
    this.container.appendChild(sep);
  }

  private updateWeaponActive(weaponId: WeaponId): void {
    this.container.querySelectorAll('.bh-weapon-btn').forEach(btn => {
      btn.classList.toggle('bh-active', (btn as HTMLElement).dataset.weaponId === weaponId);
    });
  }

  cleanup(): void {
    for (const unsub of this.unsubs) unsub();
    this.container.remove();
  }
}
