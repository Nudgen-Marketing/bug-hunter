import type { Tickable } from '../types';
import type { GameState } from '../core/GameState';
import type { BugManager } from '../bugs/BugManager';

interface CorruptedRecord {
  element: HTMLElement;
  originalText: string | null;
  originalFilter: string;
  timeoutId: ReturnType<typeof setTimeout>;
}

export class DomCorruption implements Tickable {
  private accumulator = 0;
  private active = new Map<HTMLElement, CorruptedRecord>();

  constructor(
    private state: GameState,
    private bugManager: BugManager,
  ) {}

  update(dt: number): void {
    if (this.state.get('phase') !== 'playing') return;

    this.accumulator += dt;
    if (this.accumulator < 0.8) return;
    this.accumulator = 0;

    const pressure = this.computePressure();
    if (pressure < 0.15) return;

    const count = 1 + Math.floor(pressure * 3);
    for (let i = 0; i < count; i++) {
      this.applyRandomCorruption(pressure);
    }
  }

  cleanup(): void {
    for (const record of this.active.values()) {
      clearTimeout(record.timeoutId);
      this.restore(record);
    }
    this.active.clear();
  }

  private computePressure(): number {
    const alive = this.bugManager.getAliveBugs();
    const stress = this.state.get('stress') / 100;
    const tierWeight = alive.reduce((sum, bug) => sum + bug.definition.tier, 0);
    const tierPressure = Math.min(1, tierWeight / 45);
    const countPressure = Math.min(1, alive.length / 16);
    return Math.min(1, (countPressure * 0.4) + (tierPressure * 0.35) + (stress * 0.25));
  }

  private applyRandomCorruption(pressure: number): void {
    const all = this.collectCandidates();
    if (all.length === 0) return;
    const target = all[Math.floor(Math.random() * all.length)];
    if (this.active.has(target)) return;

    const canTextCorrupt = this.shouldMutateText(target);
    const mutateText = canTextCorrupt && Math.random() < 0.65;

    const originalText = mutateText ? target.textContent : null;
    const originalFilter = target.style.filter;
    target.classList.add('bh-corrupt-jitter');
    target.style.filter = this.composeFilter(originalFilter, pressure);
    if (mutateText && originalText) {
      target.textContent = this.scrambleText(originalText, pressure);
    }

    const timeoutId = setTimeout(() => {
      const record = this.active.get(target);
      if (!record) return;
      this.restore(record);
      this.active.delete(target);
    }, 1000 + Math.floor(pressure * 1800));

    this.active.set(target, { element: target, originalText, originalFilter, timeoutId });
  }

  private restore(record: CorruptedRecord): void {
    const { element, originalText, originalFilter } = record;
    element.classList.remove('bh-corrupt-jitter');
    element.style.filter = originalFilter;
    if (originalText !== null) {
      element.textContent = originalText;
    }
  }

  private collectCandidates(): HTMLElement[] {
    const selector = 'p,span,a,button,label,li,h1,h2,h3,h4,h5,h6,img,code,pre,strong,em';
    const nodes = Array.from(document.querySelectorAll(selector)) as HTMLElement[];
    return nodes.filter((el) => {
      if (el.closest('.bh-container') || el.closest('.bh-particles')) return false;
      const rect = el.getBoundingClientRect();
      if (rect.width < 8 || rect.height < 8) return false;
      if (rect.top > window.innerHeight || rect.left > window.innerWidth) return false;
      return true;
    });
  }

  private shouldMutateText(el: HTMLElement): boolean {
    const tag = el.tagName.toLowerCase();
    if (tag === 'img') return false;
    const text = (el.textContent || '').trim();
    return text.length >= 4;
  }

  private scrambleText(text: string, pressure: number): string {
    const glyphs = ['#', '?', '!', '@', '%', '&', '*'];
    const chars = Array.from(text);
    const mutateChance = Math.min(0.55, 0.12 + pressure * 0.35);
    return chars.map((ch) => {
      if (ch.trim() === '') return ch;
      if (Math.random() > mutateChance) return ch;
      return glyphs[Math.floor(Math.random() * glyphs.length)];
    }).join('');
  }

  private composeFilter(base: string, pressure: number): string {
    const effects = `hue-rotate(${Math.floor(pressure * 75)}deg) saturate(${1.1 + pressure * 0.7})`;
    return base ? `${base} ${effects}` : effects;
  }
}
