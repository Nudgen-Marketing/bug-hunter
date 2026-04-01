import type { Tickable } from '../types';

const MAX_DT = 0.1; // 100ms cap prevents spiral of death

export class GameLoop {
  private rafId: number | null = null;
  private lastTimestamp = 0;
  private systems: Tickable[] = [];
  private running = false;

  register(system: Tickable): void {
    this.systems.push(system);
  }

  unregister(system: Tickable): void {
    const idx = this.systems.indexOf(system);
    if (idx !== -1) this.systems.splice(idx, 1);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTimestamp = performance.now();
    this.rafId = requestAnimationFrame((ts) => this.tick(ts));
  }

  stop(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  get isRunning(): boolean {
    return this.running;
  }

  private tick(timestamp: number): void {
    if (!this.running) return;

    const rawDt = (timestamp - this.lastTimestamp) / 1000;
    const dt = Math.min(rawDt, MAX_DT);
    this.lastTimestamp = timestamp;

    for (const system of this.systems) {
      system.update(dt);
    }

    this.rafId = requestAnimationFrame((ts) => this.tick(ts));
  }
}
