import type { GameEvents } from '../types';
import type { EventBus } from '../core/EventBus';

const COLORS = ['#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff44ff', '#44ffff', '#ff8800', '#ff0088'];

export class Fireworks {
  private container: HTMLElement;
  private unsubs: (() => void)[] = [];

  constructor(bus: EventBus<GameEvents>, container: HTMLElement) {
    this.container = container;

    this.unsubs.push(
      bus.on('stress:zero', () => this.launch()),
      bus.on('boss:killed', ({ pos, name }) => this.showBossKillSequence(pos.x, pos.y, name)),
      bus.on('game:ended', ({ reason }) => {
        if (reason === 'defeat') this.showDefeatText();
      }),
    );
  }

  private launch(): void {
    // Screen flash
    const flash = document.createElement('div');
    flash.className = 'bh-flash';
    this.container.appendChild(flash);
    setTimeout(() => flash.remove(), 300);

    // Launch multiple bursts
    for (let i = 0; i < 8; i++) {
      setTimeout(() => this.burst(
        100 + Math.random() * (window.innerWidth - 200),
        100 + Math.random() * (window.innerHeight * 0.6),
      ), i * 200);
    }

    // Confetti rain
    setTimeout(() => this.confetti(), 500);

    // Victory text
    setTimeout(() => this.showVictoryText(), 400);
  }

  private burst(cx: number, cy: number): void {
    const count = 30;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = 80 + Math.random() * 120;
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const size = 4 + Math.random() * 4;

      const particle = document.createElement('div');
      particle.style.cssText = `
        position: fixed; left: ${cx}px; top: ${cy}px;
        width: ${size}px; height: ${size}px;
        background: ${color};
        border-radius: 50%;
        pointer-events: none;
        z-index: 2147483647;
        box-shadow: 0 0 6px ${color};
      `;
      this.container.appendChild(particle);

      const endX = cx + Math.cos(angle) * speed;
      const endY = cy + Math.sin(angle) * speed + 50;

      particle.animate([
        { transform: 'scale(1)', opacity: 1 },
        { transform: 'scale(0.5)', opacity: 0.8, offset: 0.6 },
        { transform: 'scale(0)', opacity: 0 },
      ], {
        duration: 800 + Math.random() * 400,
        easing: 'cubic-bezier(0, 0.5, 0.5, 1)',
      }).onfinish = () => particle.remove();

      particle.animate([
        { left: `${cx}px`, top: `${cy}px` },
        { left: `${endX}px`, top: `${endY}px` },
      ], {
        duration: 800 + Math.random() * 400,
        easing: 'ease-out',
      });
    }
  }

  private confetti(): void {
    for (let i = 0; i < 60; i++) {
      const el = document.createElement('div');
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const x = Math.random() * window.innerWidth;
      const w = 6 + Math.random() * 6;
      const h = 10 + Math.random() * 10;

      el.style.cssText = `
        position: fixed; left: ${x}px; top: -20px;
        width: ${w}px; height: ${h}px;
        background: ${color};
        pointer-events: none;
        z-index: 2147483647;
      `;
      this.container.appendChild(el);

      el.animate([
        { top: '-20px', transform: 'rotate(0deg)', opacity: 1 },
        { top: `${window.innerHeight + 20}px`, transform: `rotate(${720 + Math.random() * 720}deg)`, opacity: 0.3 },
      ], {
        duration: 2000 + Math.random() * 2000,
        delay: Math.random() * 1000,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      }).onfinish = () => el.remove();
    }
  }

  private showVictoryText(): void {
    const text = document.createElement('div');
    text.className = 'bh-victory-text';
    text.textContent = 'DE-STRESSED!';
    text.style.cssText = `
      position: fixed;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%) scale(0);
      font-family: 'Orbitron', monospace, sans-serif;
      font-size: 64px; font-weight: 900;
      color: #00ff88;
      text-shadow: 0 0 20px #00ff88, 0 0 40px #00ff88, 0 0 80px #00aa44;
      pointer-events: none;
      z-index: 2147483647;
      letter-spacing: 4px;
    `;
    this.container.appendChild(text);

    text.animate([
      { transform: 'translate(-50%, -50%) scale(0)', opacity: 0 },
      { transform: 'translate(-50%, -50%) scale(1.2)', opacity: 1, offset: 0.3 },
      { transform: 'translate(-50%, -50%) scale(1)', opacity: 1, offset: 0.5 },
      { transform: 'translate(-50%, -50%) scale(1)', opacity: 1, offset: 0.8 },
      { transform: 'translate(-50%, -50%) scale(1.5)', opacity: 0 },
    ], {
      duration: 3000,
      easing: 'ease-out',
    }).onfinish = () => {
      text.remove();
      this.showSharePrompt();
    };
  }

  private showSharePrompt(): void {
    const host = window.location.hostname || 'this site';
    const shareText = `Just debugged ${host} 🪳 — Bug Hunter`;

    const wrapper = document.createElement('div');
    wrapper.style.cssText = [
      'position:fixed',
      'left:50%',
      'bottom:40px',
      'transform:translateX(-50%)',
      'z-index:2147483647',
      'display:flex',
      'flex-direction:column',
      'gap:8px',
      'padding:12px',
      'min-width:320px',
      'max-width:80vw',
      'background:rgba(15,18,28,0.95)',
      'border:1px solid rgba(255,255,255,0.18)',
      'border-radius:10px',
      'box-shadow:0 8px 28px rgba(0,0,0,0.35)',
      'color:#fff',
      'font:14px system-ui, -apple-system, Segoe UI, sans-serif',
      'pointer-events:auto',
    ].join(';');

    const line = document.createElement('div');
    line.textContent = shareText;
    line.style.cssText = 'word-break:break-word;line-height:1.4';
    wrapper.appendChild(line);

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px;align-items:center';

    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Copy Share Text';
    button.style.cssText = 'padding:8px 10px;border-radius:8px;border:1px solid #28d17c;background:#19a35f;color:#fff;cursor:pointer';

    const status = document.createElement('span');
    status.style.cssText = 'font-size:12px;opacity:.85';

    row.appendChild(button);
    row.appendChild(status);
    wrapper.appendChild(row);

    const fallback = document.createElement('textarea');
    fallback.value = shareText;
    fallback.readOnly = true;
    fallback.style.cssText = 'display:none;width:100%;min-height:64px;border-radius:6px;padding:8px';
    wrapper.appendChild(fallback);

    button.addEventListener('click', async () => {
      try {
        if (!navigator.clipboard?.writeText) throw new Error('clipboard-unavailable');
        await navigator.clipboard.writeText(shareText);
        status.textContent = 'Copied!';
      } catch {
        fallback.style.display = 'block';
        fallback.focus();
        fallback.select();
        status.textContent = 'Select text manually and copy';
      }
    });

    this.container.appendChild(wrapper);

    setTimeout(() => {
      wrapper.remove();
    }, 9000);
  }

  private showDefeatText(): void {
    const text = document.createElement('div');
    text.textContent = 'INFESTED!';
    text.style.cssText = `
      position: fixed;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      font-family: 'Orbitron', monospace, sans-serif;
      font-size: 60px; font-weight: 900;
      color: #ff4040;
      text-shadow: 0 0 20px rgba(255, 64, 64, 0.9), 0 0 40px rgba(255, 64, 64, 0.6);
      pointer-events: none;
      z-index: 2147483647;
      letter-spacing: 4px;
    `;
    this.container.appendChild(text);
    setTimeout(() => text.remove(), 2400);
  }

  private showBossKillSequence(x: number, y: number, name: string): void {
    this.burst(x, y);
    this.burst(Math.max(80, x - 120), Math.max(80, y - 90));
    this.burst(Math.min(window.innerWidth - 80, x + 120), Math.max(80, y - 90));

    const text = document.createElement('div');
    text.textContent = `${name.toUpperCase()} PURGED`;
    text.style.cssText = `
      position: fixed;
      top: 28%;
      left: 50%;
      transform: translateX(-50%);
      font-family: 'Orbitron', monospace, sans-serif;
      font-size: 42px;
      font-weight: 900;
      color: #ffb347;
      text-shadow: 0 0 16px rgba(255, 179, 71, 0.8), 0 0 36px rgba(255, 107, 53, 0.55);
      letter-spacing: 2px;
      pointer-events: none;
      z-index: 2147483647;
    `;
    this.container.appendChild(text);

    text.animate([
      { opacity: 0, transform: 'translateX(-50%) scale(0.8)' },
      { opacity: 1, transform: 'translateX(-50%) scale(1.05)', offset: 0.35 },
      { opacity: 1, transform: 'translateX(-50%) scale(1)', offset: 0.7 },
      { opacity: 0, transform: 'translateX(-50%) scale(1.08)' },
    ], {
      duration: 1700,
      easing: 'ease-out',
    }).onfinish = () => text.remove();
  }

  cleanup(): void {
    for (const unsub of this.unsubs) unsub();
  }
}
