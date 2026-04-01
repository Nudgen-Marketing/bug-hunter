import { describe, expect, it } from 'vitest';
import { applyGameResult, normalizeProgression } from './progression';

describe('progression', () => {
  it('normalizes missing progression with default unlocked destroy-tools', () => {
    const progression = normalizeProgression(undefined);
    expect(progression.unlockedTools).toContain('destroy-tools');
    expect(progression.stats.gamesPlayed).toBe(0);
  });

  it('unlocks tools and grants achievements when thresholds are reached', () => {
    const { progression, newUnlocks, newAchievements } = applyGameResult(undefined, {
      mode: 'free-play',
      reason: 'victory',
      score: 5200,
      kills: 30,
      escapes: 0,
    });

    expect(progression.bestScores['free-play']).toBe(5200);
    expect(newUnlocks).toEqual([]);
    expect(newAchievements).toContain('first-blood');
    expect(newAchievements).toContain('exterminator-25');
    expect(newAchievements).toContain('clean-run');
    expect(newAchievements).toContain('score-5000');
  });
});
