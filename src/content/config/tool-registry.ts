import type { ToolDefinition } from '../types';

export const TOOL_REGISTRY: Record<string, ToolDefinition> = {
  'destroy-tools': {
    id: 'destroy-tools',
    name: 'Spray',
    emoji: '\u{1F9EF}',
    description: 'Spray bottle burst that tags multiple bugs at once.',
    hitbox: { type: 'rect', width: 120, height: 90 },
    cooldownMs: 700,
    damagePerHit: 1,
    effectId: 'spray-bottle',
    soundId: 'swatter-hit',
  },
};

export function getToolDefinition(id: string): ToolDefinition | undefined {
  return TOOL_REGISTRY[id];
}
