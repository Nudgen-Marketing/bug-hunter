import type { ModeId } from '../content/types';
import { TOOL_REGISTRY } from '../content/config/tool-registry';

export type AchievementId =
  | 'first-blood'
  | 'exterminator-25'
  | 'clean-run'
  | 'challenge-winner'
  | 'score-5000';

export interface ProgressionData {
  version: 1;
  unlockedTools: string[];
  achievements: AchievementId[];
  bestScores: Record<ModeId, number>;
  stats: {
    gamesPlayed: number;
    totalKills: number;
    totalEscapes: number;
    highestScore: number;
  };
  updatedAt: number;
}

export interface GameResultInput {
  mode: ModeId;
  reason: 'victory' | 'defeat' | 'quit';
  score: number;
  kills: number;
  escapes: number;
}

export interface ProgressionUpdateResult {
  progression: ProgressionData;
  newUnlocks: string[];
  newAchievements: AchievementId[];
}

const DEFAULT_PROGRESSION: ProgressionData = {
  version: 1,
  unlockedTools: ['destroy-tools'],
  achievements: [],
  bestScores: {
    'free-play': 0,
    challenge: 0,
  },
  stats: {
    gamesPlayed: 0,
    totalKills: 0,
    totalEscapes: 0,
    highestScore: 0,
  },
  updatedAt: 0,
};

function dedupe<T extends string>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

export function normalizeProgression(value: Partial<ProgressionData> | null | undefined): ProgressionData {
  if (!value) return { ...DEFAULT_PROGRESSION };

  const bestScores = {
    'free-play': Math.max(0, value.bestScores?.['free-play'] ?? 0),
    challenge: Math.max(0, value.bestScores?.challenge ?? 0),
  };

  // Migrate legacy tool ids to the single merged tool.
  const normalizedTools = (value.unlockedTools ?? []).map((id) =>
    id === 'swatter' || id === 'console-log' || id === 'git-blame' || id === 'stack-overflow' || id === 'debugger'
      ? 'destroy-tools'
      : id,
  );

  return {
    version: 1,
    unlockedTools: dedupe(['destroy-tools', ...normalizedTools]),
    achievements: dedupe((value.achievements ?? []) as AchievementId[]),
    bestScores,
    stats: {
      gamesPlayed: Math.max(0, value.stats?.gamesPlayed ?? 0),
      totalKills: Math.max(0, value.stats?.totalKills ?? 0),
      totalEscapes: Math.max(0, value.stats?.totalEscapes ?? 0),
      highestScore: Math.max(
        0,
        value.stats?.highestScore ?? Math.max(bestScores['free-play'], bestScores.challenge),
      ),
    },
    updatedAt: value.updatedAt ?? 0,
  };
}

function computeUnlocks(data: ProgressionData): string[] {
  const unlocked = new Set<string>(data.unlockedTools);
  for (const tool of Object.values(TOOL_REGISTRY)) {
    const threshold = tool.unlockScore ?? 0;
    if (data.stats.highestScore >= threshold) {
      unlocked.add(tool.id);
    }
  }
  return Array.from(unlocked);
}

function computeAchievements(next: ProgressionData, run: GameResultInput): AchievementId[] {
  const toGrant: AchievementId[] = [];

  if (run.kills > 0) toGrant.push('first-blood');
  if (next.stats.totalKills >= 25) toGrant.push('exterminator-25');
  if (run.reason === 'victory' && run.escapes === 0) toGrant.push('clean-run');
  if (run.mode === 'challenge' && run.reason === 'victory') toGrant.push('challenge-winner');
  if (next.stats.highestScore >= 5000) toGrant.push('score-5000');

  return toGrant.filter((id) => !next.achievements.includes(id));
}

export function applyGameResult(
  current: Partial<ProgressionData> | null | undefined,
  run: GameResultInput,
): ProgressionUpdateResult {
  const normalized = normalizeProgression(current);

  const progression: ProgressionData = {
    ...normalized,
    bestScores: {
      ...normalized.bestScores,
      [run.mode]: Math.max(normalized.bestScores[run.mode], run.score),
    },
    stats: {
      gamesPlayed: normalized.stats.gamesPlayed + 1,
      totalKills: normalized.stats.totalKills + Math.max(0, run.kills),
      totalEscapes: normalized.stats.totalEscapes + Math.max(0, run.escapes),
      highestScore: Math.max(normalized.stats.highestScore, run.score),
    },
    updatedAt: Date.now(),
  };

  const unlockedBefore = new Set(normalized.unlockedTools);
  progression.unlockedTools = computeUnlocks(progression);

  const newUnlocks = progression.unlockedTools.filter((toolId) => !unlockedBefore.has(toolId));
  const newAchievements = computeAchievements(progression, run);
  progression.achievements = dedupe([...progression.achievements, ...newAchievements]);

  return {
    progression,
    newUnlocks,
    newAchievements,
  };
}
