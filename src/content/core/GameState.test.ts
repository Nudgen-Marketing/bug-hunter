import { describe, expect, it } from 'vitest';
import { EventBus } from './EventBus';
import { GameState } from './GameState';
import type { GameEvents } from '../types';

describe('GameState', () => {
  it('clamps stress to [0, 100] and emits stress:zero at lower bound', () => {
    const bus = new EventBus<GameEvents>();
    const state = new GameState(bus);
    let zeroEvents = 0;
    bus.on('stress:zero', () => {
      zeroEvents += 1;
    });

    state.setStress(120);
    expect(state.get('stress')).toBe(100);

    state.setStress(-1);
    expect(state.get('stress')).toBe(0);
    expect(zeroEvents).toBe(1);
  });

  it('emits score deltas when score changes', () => {
    const bus = new EventBus<GameEvents>();
    const state = new GameState(bus);
    let lastPayload: { value: number; delta: number } | null = null;
    bus.on('score:changed', (payload) => {
      lastPayload = payload;
    });

    state.addScore(200);
    expect(state.get('score')).toBe(200);
    expect(lastPayload).toEqual({ value: 200, delta: 200 });
  });
});
