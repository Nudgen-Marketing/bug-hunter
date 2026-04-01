// ---- Identifiers ----
export type BugId = string;
export type ToolId = string;
export type WeaponId = string;
export type ModeId = 'free-play' | 'challenge';

// ---- Geometry ----
export interface Vec2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface EdgeNode {
  id: number;
  pos: Vec2;
  elementIndex: number;
}

export interface EdgeGraphEdge {
  from: number;
  to: number;
  cost: number;
}

export interface EdgeGraph {
  nodes: EdgeNode[];
  edges: EdgeGraphEdge[];
  adjacency: Map<number, EdgeGraphEdge[]>;
}

// ---- Bug System ----
export type BugTier = 1 | 2 | 3;
export type BugState = 'idle' | 'walking' | 'scattering' | 'hiding' | 'dying' | 'dead';

export interface BugDefinition {
  id: string;
  name: string;
  tier: BugTier;
  emoji: string;
  baseHP: number;
  baseSpeed: number;
  hitRadius: number;
  scoreValue: number;
  stressReduction: number;
  scatterRadius: number;
  unlockScore?: number;
}

export interface BugTickContext {
  cursorPos: Vec2;
  edgeGraph: EdgeGraph | null;
  viewportRect: Rect;
  dt: number;
}

export interface BugAIResult {
  newPos: Vec2;
  newState: BugState;
  facingAngle: number;
}

// ---- Tool System ----
export type HitboxShape =
  | { type: 'circle'; radius: number }
  | { type: 'rect'; width: number; height: number }
  | { type: 'cone'; radius: number; angle: number };

export interface ToolDefinition {
  id: ToolId;
  name: string;
  emoji: string;
  description: string;
  hitbox: HitboxShape;
  cooldownMs: number;
  damagePerHit: number;
  effectId: string;
  soundId: string;
  unlockScore?: number;
}

// ---- Weapon System (legacy) ----
export interface WeaponDefinition {
  icon: string;
  name: string;
  animationClass: string;
  duration: number;
  particles: string;
}

// ---- Game State ----
export interface GameStateData {
  mode: ModeId;
  phase: 'menu' | 'playing' | 'paused' | 'victory' | 'defeat';
  stress: number;
  score: number;
  activeTool: ToolId;
  activeWeapon: WeaponId;
  muted: boolean;
  cursorPos: Vec2;
  killedCount: number;
  escapedCount: number;
  startedAt: number;
  elapsed: number;
}

// ---- Event Map ----
export interface GameEvents {
  'player:click': { x: number; y: number; target: EventTarget | null };
  'player:keydown': { key: string; code: string };
  'player:mousemove': { x: number; y: number };
  'bug:spawned': { bugId: BugId; pos: Vec2 };
  'bug:hit': { bugId: BugId; toolId: ToolId; pos: Vec2 };
  'bug:killed': { bugId: BugId; tier: BugTier; pos: Vec2; scoreValue: number; stressReduction: number };
  'bug:escaped': { bugId: BugId };
  'tool:selected': { toolId: ToolId };
  'tool:used': { toolId: ToolId; pos: Vec2; hitCount: number };
  'weapon:selected': { weaponId: WeaponId };
  'weapon:fired': { weaponId: WeaponId; pos: Vec2; element: HTMLElement };
  'game:reset': {};
  'game:started': { mode: ModeId };
  'game:ended': { reason: 'victory' | 'defeat' | 'quit'; score: number };
  'stress:changed': { value: number; delta: number };
  'stress:zero': {};
  'score:changed': { value: number; delta: number };
  'challenge:wave': { wave: number; totalWaves: number; timeLeftMs: number };
  'challenge:timer': { timeLeftMs: number };
  'boss:spawned': { bugId: BugId; name: string; maxHp: number };
  'boss:hp': { bugId: BugId; hp: number; maxHp: number };
  'boss:ability': { bugId: BugId; ability: string; cooldownMs: number };
  'boss:killed': { bugId: BugId; name: string; pos: Vec2; scoreValue: number };
}

// ---- Balance Config ----
export interface BalanceConfig {
  stress: {
    initial: number;
    challengeInitial?: number;
    killReduction: Record<BugTier, number>;
    escapeIncrease: number;
    victoryThreshold: number;
  };
  scoring: {
    basePerTier: Record<BugTier, number>;
  };
  spawning: {
    freePlay: {
      initialDelayMs: number;
      minIntervalMs: number;
      maxIntervalMs: number;
      maxAliveBugs: number;
    };
    challenge: {
      waveDurationsMs: number[];
      minIntervalMsByWave: number[];
      maxIntervalMsByWave: number[];
      maxAliveBugsByWave: number[];
    };
  };
  bugs: {
    scatterSpeedMultiplier: number;
    scatterDurationMs: number;
    cursorProximityPx: number;
    edgeSnapDistancePx: number;
    nestTimeoutMs: number;
  };
  tools: {
    swatter: {
      cooldownMs: number;
      hitRadius: number;
    };
  };
}

// ---- Tickable interface ----
export interface Tickable {
  update(dt: number): void;
}
