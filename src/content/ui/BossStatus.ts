import type { GameEvents } from '../types';
import type { EventBus } from '../core/EventBus';

export class BossStatus {
  private container: HTMLElement;
  private nameEl: HTMLElement;
  private hpFillEl: HTMLElement;
  private hpTextEl: HTMLElement;
  private abilityEl: HTMLElement;
  private unsubs: (() => void)[] = [];
  private activeBossId: string | null = null;

  constructor(bus: EventBus<GameEvents>, parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.style.cssText = [
      'position:fixed',
      'top:58px',
      'left:50%',
      'transform:translateX(-50%)',
      'z-index:2147483647',
      'min-width:320px',
      'padding:10px 12px',
      'border-radius:12px',
      'background:rgba(24,10,10,0.92)',
      'border:1px solid rgba(255,87,87,0.4)',
      'color:#ffe8e8',
      'font:12px system-ui, -apple-system, Segoe UI, sans-serif',
      'box-shadow:0 8px 24px rgba(0,0,0,0.35)',
      'display:none',
      'pointer-events:none',
    ].join(';');

    this.nameEl = document.createElement('div');
    this.nameEl.style.cssText = 'font-weight:700;letter-spacing:.5px;margin-bottom:8px';
    this.nameEl.textContent = 'Boss';

    const hpTrack = document.createElement('div');
    hpTrack.style.cssText = 'height:8px;border-radius:999px;background:rgba(255,255,255,0.14);overflow:hidden';
    this.hpFillEl = document.createElement('div');
    this.hpFillEl.style.cssText = 'height:100%;width:100%;background:linear-gradient(90deg,#ff3b3b,#ff7a3b)';
    hpTrack.appendChild(this.hpFillEl);

    this.hpTextEl = document.createElement('div');
    this.hpTextEl.style.cssText = 'margin-top:6px;font-size:11px;opacity:.9';
    this.hpTextEl.textContent = 'HP 0/0';

    this.abilityEl = document.createElement('div');
    this.abilityEl.style.cssText = 'margin-top:6px;font-size:11px;color:#ffb7b7';
    this.abilityEl.textContent = '';

    this.container.appendChild(this.nameEl);
    this.container.appendChild(hpTrack);
    this.container.appendChild(this.hpTextEl);
    this.container.appendChild(this.abilityEl);
    parent.appendChild(this.container);

    this.unsubs.push(
      bus.on('boss:spawned', ({ bugId, name, maxHp }) => {
        this.activeBossId = bugId;
        this.nameEl.textContent = `${name} engaged`;
        this.updateHp(maxHp, maxHp);
        this.abilityEl.textContent = '';
        this.container.style.display = 'block';
      }),
      bus.on('boss:hp', ({ bugId, hp, maxHp }) => {
        if (this.activeBossId !== bugId) return;
        this.updateHp(hp, maxHp);
      }),
      bus.on('boss:ability', ({ bugId, ability }) => {
        if (this.activeBossId !== bugId) return;
        this.abilityEl.textContent = `Ability: ${ability}`;
      }),
      bus.on('boss:killed', ({ bugId, name }) => {
        if (this.activeBossId !== bugId) return;
        this.nameEl.textContent = `${name} defeated`;
        this.updateHp(0, 1);
        this.abilityEl.textContent = 'System stabilized';
        setTimeout(() => {
          if (this.activeBossId === bugId) {
            this.activeBossId = null;
            this.container.style.display = 'none';
          }
        }, 1800);
      }),
    );
  }

  cleanup(): void {
    for (const unsub of this.unsubs) unsub();
    this.container.remove();
  }

  private updateHp(hp: number, maxHp: number): void {
    const safeMax = Math.max(1, maxHp);
    const ratio = Math.max(0, Math.min(1, hp / safeMax));
    this.hpFillEl.style.width = `${Math.round(ratio * 100)}%`;
    this.hpTextEl.textContent = `HP ${Math.max(0, hp)}/${safeMax}`;
  }
}
