import { EventBus } from './EventBus';
import type { GameEvents, GameStateData, Vec2, ToolId, WeaponId, ModeId } from '../types';

const DEFAULT_STATE: GameStateData = {
  mode: 'free-play',
  phase: 'menu',
  stress: 50,
  score: 0,
  activeTool: 'destroy-tools',
  activeWeapon: 'slipper',
  muted: false,
  cursorPos: { x: 0, y: 0 },
  killedCount: 0,
  escapedCount: 0,
  startedAt: 0,
  elapsed: 0,
};

export class GameState {
  private data: GameStateData;
  private bus: EventBus<GameEvents>;

  constructor(bus: EventBus<GameEvents>, initial?: Partial<GameStateData>) {
    this.bus = bus;
    this.data = { ...DEFAULT_STATE, ...initial };
  }

  get<K extends keyof GameStateData>(key: K): GameStateData[K] {
    return this.data[key];
  }

  setStress(value: number): void {
    const clamped = Math.max(0, Math.min(100, value));
    const delta = clamped - this.data.stress;
    this.data.stress = clamped;
    this.bus.emit('stress:changed', { value: clamped, delta });
    if (clamped <= 0) {
      this.bus.emit('stress:zero', {});
    }
  }

  addStress(delta: number): void {
    this.setStress(this.data.stress + delta);
  }

  addScore(delta: number): void {
    this.data.score += delta;
    this.bus.emit('score:changed', { value: this.data.score, delta });
  }

  setPhase(phase: GameStateData['phase']): void {
    this.data.phase = phase;
  }

  setActiveTool(toolId: ToolId): void {
    this.data.activeTool = toolId;
    this.bus.emit('tool:selected', { toolId });
  }

  setActiveWeapon(weaponId: WeaponId): void {
    this.data.activeWeapon = weaponId;
    this.bus.emit('weapon:selected', { weaponId });
  }

  setCursorPos(pos: Vec2): void {
    this.data.cursorPos = pos;
  }

  setMuted(muted: boolean): void {
    this.data.muted = muted;
  }

  incrementKills(): void {
    this.data.killedCount++;
  }

  incrementEscapes(): void {
    this.data.escapedCount++;
  }

  snapshot(): Readonly<GameStateData> {
    return { ...this.data };
  }

  reset(mode: ModeId = 'free-play'): void {
    Object.assign(this.data, DEFAULT_STATE, { mode });
  }
}
