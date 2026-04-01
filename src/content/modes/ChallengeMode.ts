import type { Tickable, GameEvents } from '../types';
import type { EventBus } from '../core/EventBus';
import type { GameState } from '../core/GameState';
import type { BugManager } from '../bugs/BugManager';
import { BALANCE } from '../config/balance';

export class ChallengeMode implements Tickable {
  private bus: EventBus<GameEvents>;
  private state: GameState;
  private bugManager: BugManager;
  private started = false;
  private spawnTimer = 0;
  private elapsedMs = 0;
  private lastWave = -1;
  private lastEscapeStressAt = 0;
  private unsubs: (() => void)[] = [];

  constructor(bus: EventBus<GameEvents>, state: GameState, bugManager: BugManager) {
    this.bus = bus;
    this.state = state;
    this.bugManager = bugManager;
    this.spawnTimer = BALANCE.spawning.challenge.maxIntervalMsByWave[0] / 1000;
  }

  start(): void {
    this.started = true;
    this.state.setStress(BALANCE.stress.challengeInitial ?? BALANCE.stress.initial);
    this.state.setPhase('playing');
    this.bus.emit('game:started', { mode: 'challenge' });

    this.unsubs.push(
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

    this.elapsedMs += dt * 1000;
    const totalDuration = BALANCE.spawning.challenge.waveDurationsMs.reduce((acc, v) => acc + v, 0);
    const timeLeftMs = Math.max(0, totalDuration - this.elapsedMs);

    const waveIndex = this.currentWaveIndex(this.elapsedMs);
    if (waveIndex !== this.lastWave) {
      this.lastWave = waveIndex;
      this.bus.emit('challenge:wave', {
        wave: waveIndex + 1,
        totalWaves: BALANCE.spawning.challenge.waveDurationsMs.length,
        timeLeftMs,
      });
    }
    this.bus.emit('challenge:timer', { timeLeftMs });

    if (this.elapsedMs >= totalDuration) {
      this.state.setPhase('victory');
      this.bus.emit('game:ended', { reason: 'victory', score: this.state.get('score') });
      return;
    }

    this.spawnTimer -= dt;
    const wave = Math.min(waveIndex, BALANCE.spawning.challenge.maxAliveBugsByWave.length - 1);
    const maxAlive = BALANCE.spawning.challenge.maxAliveBugsByWave[wave];
    if (this.spawnTimer <= 0 && this.bugManager.aliveCount < maxAlive) {
      this.bugManager.spawnBug(this.pickBugForWave(wave));
      const minIntervalMs = BALANCE.spawning.challenge.minIntervalMsByWave[wave];
      const maxIntervalMs = BALANCE.spawning.challenge.maxIntervalMsByWave[wave];
      this.spawnTimer = (minIntervalMs + Math.random() * (maxIntervalMs - minIntervalMs)) / 1000;
    }
  }

  cleanup(): void {
    for (const unsub of this.unsubs) unsub();
    this.unsubs = [];
    this.started = false;
    this.spawnTimer = BALANCE.spawning.challenge.maxIntervalMsByWave[0] / 1000;
    this.elapsedMs = 0;
    this.lastWave = -1;
    this.lastEscapeStressAt = 0;
  }

  private currentWaveIndex(elapsedMs: number): number {
    const durations = BALANCE.spawning.challenge.waveDurationsMs;
    let acc = 0;
    for (let i = 0; i < durations.length; i++) {
      acc += durations[i];
      if (elapsedMs < acc) return i;
    }
    return durations.length - 1;
  }

  private pickBugForWave(wave: number): string {
    switch (wave) {
      case 0:
        return this.weightedPick([
          ['cockroach', 65],
          ['fly', 35],
        ]);
      case 1:
        return this.weightedPick([
          ['cockroach', 55],
          ['fly', 45],
        ]);
      case 2:
        return this.weightedPick([
          ['fly', 48],
          ['spider', 52],
        ]);
      case 3:
        return this.weightedPick([
          ['spider', 48],
          ['moth', 39],
          ['queen', 13],
        ]);
      default:
        return this.weightedPick([
          ['spider', 35],
          ['moth', 44],
          ['queen', 21],
        ]);
    }
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
}
