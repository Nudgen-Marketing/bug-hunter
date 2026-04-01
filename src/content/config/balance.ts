import type { BalanceConfig } from '../types';

export const BALANCE: BalanceConfig = Object.freeze({
  stress: {
    initial: 50,
    challengeInitial: 50,
    killReduction: { 1: 3, 2: 5, 3: 8 },
    escapeIncrease: 5,
    victoryThreshold: 0,
  },
  scoring: {
    basePerTier: { 1: 100, 2: 200, 3: 300 },
  },
  spawning: {
    freePlay: {
      initialDelayMs: 2000,
      minIntervalMs: 1500,
      maxIntervalMs: 4000,
      maxAliveBugs: 15,
    },
    challenge: {
      waveDurationsMs: [30000, 30000, 30000, 30000, 30000],
      minIntervalMsByWave: [1300, 1000, 850, 700, 550],
      maxIntervalMsByWave: [2800, 2200, 1700, 1400, 1100],
      maxAliveBugsByWave: [12, 15, 18, 22, 26],
    },
  },
  bugs: {
    scatterSpeedMultiplier: 2.5,
    scatterDurationMs: 600,
    cursorProximityPx: 80,
    edgeSnapDistancePx: 20,
    nestTimeoutMs: 30000,
  },
  tools: {
    swatter: {
      cooldownMs: 300,
      hitRadius: 40,
    },
  },
}) as BalanceConfig;
