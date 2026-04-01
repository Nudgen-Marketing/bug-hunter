import { describe, expect, it, vi } from 'vitest';
import { EventBus } from '../core/EventBus';
import { GameState } from '../core/GameState';
import { FreePlayMode } from './FreePlayMode';
import type { GameEvents } from '../types';
import { BALANCE } from '../config/balance';

function makeMode() {
  const bus = new EventBus<GameEvents>();
  const state = new GameState(bus);
  const bugManager = {
    aliveCount: 0,
    spawnBug: vi.fn(),
  };
  const mode = new FreePlayMode(bus, state, bugManager as any);
  return { bus, state, mode, bugManager };
}

describe('FreePlayMode', () => {
  it('emits defeat when stress reaches 100 while playing', () => {
    const { bus, state, mode } = makeMode();
    const ended = vi.fn();
    bus.on('game:ended', ended);

    mode.start();
    state.setStress(100);

    expect(state.get('phase')).toBe('defeat');
    expect(ended).toHaveBeenCalledWith({ reason: 'defeat', score: 0 });
  });

  it('applies escape stress with global cooldown', () => {
    const { bus, state, mode } = makeMode();
    const now = vi.spyOn(Date, 'now');

    mode.start();
    now.mockReturnValue(1000);
    bus.emit('bug:escaped', { bugId: 'b1' });
    expect(state.get('stress')).toBe(55);

    now.mockReturnValue(5000);
    bus.emit('bug:escaped', { bugId: 'b2' });
    expect(state.get('stress')).toBe(55);

    now.mockReturnValue(12_500);
    bus.emit('bug:escaped', { bugId: 'b3' });
    expect(state.get('stress')).toBe(60);

    now.mockRestore();
  });

  it('can spawn queen in high-score pool', () => {
    const { state, mode, bugManager } = makeMode();
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.99);

    mode.start();
    state.addScore(5000);
    (mode as any).spawnTimer = 0;
    mode.update(0.016);

    expect(bugManager.spawnBug).toHaveBeenCalledWith('queen');
    randomSpy.mockRestore();
  });

  it('resets spawn timer on cleanup', () => {
    const { mode } = makeMode();
    mode.start();
    (mode as any).spawnTimer = 0.01;

    mode.cleanup();

    expect((mode as any).spawnTimer).toBe(BALANCE.spawning.freePlay.initialDelayMs / 1000);
  });
});
