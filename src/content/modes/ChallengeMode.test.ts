import { describe, expect, it, vi } from 'vitest';
import { EventBus } from '../core/EventBus';
import { GameState } from '../core/GameState';
import { ChallengeMode } from './ChallengeMode';
import type { GameEvents } from '../types';

function makeMode() {
  const bus = new EventBus<GameEvents>();
  const state = new GameState(bus, { mode: 'challenge' });
  const bugManager = {
    aliveCount: 0,
    spawnBug: vi.fn(),
  };
  const mode = new ChallengeMode(bus, state, bugManager as any);
  return { bus, state, mode, bugManager };
}

describe('ChallengeMode', () => {
  it('emits wave and timer updates', () => {
    const { bus, mode } = makeMode();
    const waveSpy = vi.fn();
    const timerSpy = vi.fn();
    bus.on('challenge:wave', waveSpy);
    bus.on('challenge:timer', timerSpy);

    mode.start();
    mode.update(0.016);

    expect(waveSpy).toHaveBeenCalled();
    expect(timerSpy).toHaveBeenCalled();
  });

  it('ends in victory after full challenge duration', () => {
    const { bus, state, mode } = makeMode();
    const ended = vi.fn();
    bus.on('game:ended', ended);

    mode.start();
    mode.update(151);

    expect(state.get('phase')).toBe('victory');
    expect(ended).toHaveBeenCalledWith({ reason: 'victory', score: 0 });
  });

  it('does not auto-win when stress reaches zero before timer ends', () => {
    const { bus, state, mode } = makeMode();
    const ended = vi.fn();
    bus.on('game:ended', ended);

    mode.start();
    state.setStress(0);

    expect(state.get('phase')).toBe('playing');
    expect(ended).not.toHaveBeenCalled();
  });

  it('can spawn queen in final wave roll', () => {
    const { mode, bugManager } = makeMode();
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.99);

    mode.start();
    (mode as any).elapsedMs = 121000;
    (mode as any).spawnTimer = 0;
    mode.update(0.016);

    expect(bugManager.spawnBug).toHaveBeenCalledWith('queen');
    randomSpy.mockRestore();
  });
});
