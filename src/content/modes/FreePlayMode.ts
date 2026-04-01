import type { Tickable, GameEvents } from '../types';
import type { EventBus } from '../core/EventBus';
import type { GameState } from '../core/GameState';
import type { BugManager } from '../bugs/BugManager';
import { BALANCE } from '../config/balance';

export class FreePlayMode implements Tickable {
  private bus: EventBus<GameEvents>;
  private state: GameState;
  private bugManager: BugManager;
  private spawnTimer: number;
  private lastEscapeStressAt = 0;
  private elapsedSec = 0;
  private passiveStressAcc = 0;
  private surgeCooldownSec = 35;
  private surgeRemainingSec = 0;
  private started = false;
  private unsubs: (() => void)[] = [];

  constructor(bus: EventBus<GameEvents>, state: GameState, bugManager: BugManager) {
    this.bus = bus;
    this.state = state;
    this.bugManager = bugManager;
    this.spawnTimer = BALANCE.spawning.freePlay.initialDelayMs / 1000;
  }

  start(): void {
    this.started = true;
    this.state.setStress(BALANCE.stress.initial);
    this.state.setPhase('playing');
    this.bus.emit('game:started', { mode: 'free-play' });
    this.elapsedSec = 0;
    this.passiveStressAcc = 0;
    this.surgeCooldownSec = 35 + Math.random() * 12;
    this.surgeRemainingSec = 0;

    this.unsubs.push(
      this.bus.on('stress:zero', () => {
        if (this.state.get('phase') !== 'playing') return;
        this.state.setPhase('victory');
        this.bus.emit('game:ended', { reason: 'victory', score: this.state.get('score') });
      }),
      this.bus.on('stress:changed', ({ value }) => {
        if (this.state.get('phase') !== 'playing') return;
        if (value >= 100) {
          this.state.setPhase('defeat');
          this.bus.emit('game:ended', { reason: 'defeat', score: this.state.get('score') });
        }
      }),
      this.bus.on('bug:escaped', () => {
        const now = Date.now();
        if (this.lastEscapeStressAt !== 0 && now - this.lastEscapeStressAt < 10_000) return;
        this.lastEscapeStressAt = now;
        this.state.addStress(BALANCE.stress.escapeIncrease);
      }),
    );
  }

  update(dt: number): void {
    if (!this.started || this.state.get('phase') !== 'playing') return;

    this.elapsedSec += dt;
    this.tickPassiveStress(dt);
    this.tickSurge(dt);
    this.spawnTimer -= dt;

    const dynamicMaxAlive = this.dynamicMaxAlive();
    if (this.spawnTimer <= 0 && this.bugManager.aliveCount < dynamicMaxAlive) {
      const slots = Math.max(0, dynamicMaxAlive - this.bugManager.aliveCount);
      const burstCount = this.dynamicBurstCount(slots);
      for (let i = 0; i < burstCount; i++) {
        this.bugManager.spawnBug(this.pickBugForScore(this.state.get('score')));
      }
      this.spawnTimer = this.nextSpawnIntervalSec();
    }
  }

  private pickBugForScore(score: number): string {
    if (score < 800) {
      return this.weightedPick([
        ['cockroach', 70],
        ['fly', 30],
      ]);
    }
    if (score < 2200) {
      return this.weightedPick([
        ['cockroach', 58],
        ['fly', 42],
      ]);
    }
    if (score < 4500) {
      return this.weightedPick([
        ['cockroach', 37],
        ['fly', 30],
        ['spider', 33],
      ]);
    }
    return this.weightedPick([
      ['cockroach', 22],
      ['fly', 24],
      ['spider', 24],
      ['moth', 15],
      ['queen', 15],
    ]);
  }

  private weightedPick(options: Array<[string, number]>): string {
    const total = options.reduce((sum, [, weight]) => sum + weight, 0);
    let roll = Math.random() * total;
    for (const [id, weight] of options) {
      roll -= weight;
      if (roll <= 0) return id;
    }
    return options[options.length - 1][0];
  }

  cleanup(): void {
    for (const unsub of this.unsubs) unsub();
    this.unsubs = [];
    this.started = false;
    this.spawnTimer = BALANCE.spawning.freePlay.initialDelayMs / 1000;
    this.lastEscapeStressAt = 0;
    this.elapsedSec = 0;
    this.passiveStressAcc = 0;
    this.surgeCooldownSec = 35;
    this.surgeRemainingSec = 0;
  }

  private tickPassiveStress(dt: number): void {
    const timeRamp = Math.min(1, this.elapsedSec / 240); // ramps over 4 mins
    const lowStressRamp = Math.max(0, (70 - this.state.get('stress')) / 70); // lower stress => harsher pressure
    let perSec = 0.05 + (0.12 * timeRamp) + (0.14 * lowStressRamp);
    if (this.surgeRemainingSec > 0) perSec += 0.18;

    this.passiveStressAcc += perSec * dt;
    while (this.passiveStressAcc >= 1) {
      this.passiveStressAcc -= 1;
      this.state.addStress(1);
      if (this.state.get('phase') !== 'playing') break;
    }
  }

  private tickSurge(dt: number): void {
    if (this.surgeRemainingSec > 0) {
      this.surgeRemainingSec -= dt;
      return;
    }
    this.surgeCooldownSec -= dt;
    if (this.surgeCooldownSec <= 0) {
      // Short intensity spikes keep long sessions less predictable.
      this.surgeRemainingSec = 8 + Math.random() * 4;
      this.surgeCooldownSec = 36 + Math.random() * 20;
    }
  }

  private nextSpawnIntervalSec(): number {
    const { minIntervalMs, maxIntervalMs } = BALANCE.spawning.freePlay;
    const base = (minIntervalMs + Math.random() * (maxIntervalMs - minIntervalMs)) / 1000;
    const stress = this.state.get('stress');
    const lowStressRamp = Math.max(0, (70 - stress) / 70);
    const timeRamp = Math.min(1, this.elapsedSec / 240);
    let mul = 1 - (0.5 * lowStressRamp) - (0.22 * timeRamp);
    if (this.surgeRemainingSec > 0) mul *= 0.68;
    return Math.max(0.28, base * mul);
  }

  private dynamicMaxAlive(): number {
    const stress = this.state.get('stress');
    const lowStressRamp = Math.max(0, (70 - stress) / 70);
    const timeRamp = Math.min(1, this.elapsedSec / 240);
    let maxAlive = BALANCE.spawning.freePlay.maxAliveBugs;
    maxAlive += Math.floor(lowStressRamp * 10);
    maxAlive += Math.floor(timeRamp * 8);
    if (this.surgeRemainingSec > 0) maxAlive += 4;
    return Math.min(36, maxAlive);
  }

  private dynamicBurstCount(slots: number): number {
    const stress = this.state.get('stress');
    let count = 1;
    if (stress <= 45) count += 1;
    if (this.surgeRemainingSec > 0) count += 1;
    return Math.max(1, Math.min(3, Math.min(count, slots)));
  }
}
