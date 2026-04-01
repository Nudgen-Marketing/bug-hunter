import type { Tickable, GameEvents, ToolId } from '../types';
import type { EventBus } from '../core/EventBus';
import type { GameState } from '../core/GameState';
import type { BugManager } from '../bugs/BugManager';
import { TOOL_REGISTRY } from '../config/tool-registry';

export class ToolManager implements Tickable {
  private bus: EventBus<GameEvents>;
  private state: GameState;
  private bugManager: BugManager;
  private cooldowns = new Map<ToolId, number>();

  constructor(bus: EventBus<GameEvents>, state: GameState, bugManager: BugManager) {
    this.bus = bus;
    this.state = state;
    this.bugManager = bugManager;
  }

  update(dt: number): void {
    // Tick cooldowns
    for (const [toolId, remaining] of this.cooldowns) {
      const newVal = remaining - dt * 1000;
      if (newVal <= 0) {
        this.cooldowns.delete(toolId);
      } else {
        this.cooldowns.set(toolId, newVal);
      }
    }
  }

  handleClick(x: number, y: number): boolean {
    const toolId = this.state.get('activeTool');
    const def = TOOL_REGISTRY[toolId];
    if (!def) return false;

    // Check cooldown
    if (this.cooldowns.has(toolId)) return false;

    // Hit test against bugs
    const hits = this.bugManager.hitTest({ x, y }, def.hitbox);

    // Start cooldown
    this.cooldowns.set(toolId, def.cooldownMs);

    if (hits.length > 0) {
      for (const bug of hits) {
        this.bugManager.killBug(bug.id, { x, y }, def.damagePerHit);
      }
      this.bus.emit('tool:used', { toolId, pos: { x, y }, hitCount: hits.length });
      return true;
    }

    return false;
  }

  isOnCooldown(toolId: ToolId): boolean {
    return this.cooldowns.has(toolId);
  }

  getCooldownProgress(toolId: ToolId): number {
    const remaining = this.cooldowns.get(toolId);
    if (!remaining) return 1;
    const def = TOOL_REGISTRY[toolId];
    if (!def) return 1;
    return 1 - (remaining / def.cooldownMs);
  }
}
