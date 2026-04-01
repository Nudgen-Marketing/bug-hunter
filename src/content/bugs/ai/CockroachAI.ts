import type { Vec2, BugState, BugTickContext, BugAIResult, EdgeGraph, EdgeGraphEdge, Rect } from '../../types';
import { findNearestNode } from './EdgeGraph';
import { BALANCE } from '../../config/balance';

export interface BugAI {
  tick(context: BugTickContext): BugAIResult;
  onScatter(fromPos: Vec2): void;
  reset(): void;
}

export class CockroachAI implements BugAI {
  private pos: Vec2;
  private state: BugState = 'idle';
  private speed: number;
  private bugType: string;
  private facingAngle = 0;
  private currentNodeId: number | null = null;
  private targetNodeId: number | null = null;
  private previousNodeId: number | null = null;
  private scatterTimer = 0;
  private scatterDir: Vec2 = { x: 0, y: 0 };
  private scatterBaseDir: Vec2 = { x: 0, y: 0 };
  private scatterPhase = 0;
  private movementPhase = Math.random() * Math.PI * 2;
  private randomWalkTimer = 0;
  private randomWalkDir: Vec2 = { x: 1, y: 0 };
  private spiderPauseTimer = 0;
  private spiderBurstTimer = 0;

  constructor(startPos: Vec2, speed: number, bugType = 'cockroach') {
    this.pos = { ...startPos };
    this.speed = speed;
    this.bugType = bugType;
  }

  tick(ctx: BugTickContext): BugAIResult {
    // Check cursor proximity for scatter
    if (this.state !== 'scattering' && this.state !== 'dying') {
      const cursorDist = dist(this.pos, ctx.cursorPos);
      if (cursorDist < BALANCE.bugs.cursorProximityPx) {
        this.onScatter(ctx.cursorPos);
      }
    }

    // State machine
    if (this.state === 'scattering') {
      this.tickScatter(ctx.dt);
    } else if (ctx.edgeGraph) {
      this.tickEdgeWalk(ctx.dt, ctx.edgeGraph);
    } else {
      this.tickRandomWalk(ctx.dt, ctx.viewportRect);
    }

    return {
      newPos: { ...this.pos },
      newState: this.state,
      facingAngle: this.facingAngle,
    };
  }

  onScatter(fromPos: Vec2): void {
    // Run away from the cursor
    const dx = this.pos.x - fromPos.x;
    const dy = this.pos.y - fromPos.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    this.scatterDir = { x: dx / len, y: dy / len };
    this.scatterBaseDir = { ...this.scatterDir };
    this.scatterPhase = Math.random() * Math.PI * 2;
    this.scatterTimer = BALANCE.bugs.scatterDurationMs / 1000;
    this.state = 'scattering';
    this.currentNodeId = null;
    this.targetNodeId = null;
  }

  reset(): void {
    this.state = 'idle';
    this.currentNodeId = null;
    this.targetNodeId = null;
    this.previousNodeId = null;
    this.scatterTimer = 0;
    this.spiderPauseTimer = 0;
    this.spiderBurstTimer = 0;
  }

  private tickScatter(dt: number): void {
    const flyStyle = this.bugType === 'fly';
    const mothStyle = this.bugType === 'moth';

    let scatterSpeed = this.speed * BALANCE.bugs.scatterSpeedMultiplier;
    if (flyStyle) scatterSpeed *= 1.28;
    if (mothStyle) scatterSpeed *= 1.08;

    if (flyStyle || mothStyle) {
      // Species-specific fleeing wiggle so escape paths feel less robotic.
      const phaseSpeed = flyStyle ? 34 : 16;
      const amp = flyStyle ? 0.8 : 0.35;
      this.scatterPhase += dt * phaseSpeed;
      const wiggle = Math.sin(this.scatterPhase) * amp;
      const perp = { x: -this.scatterBaseDir.y, y: this.scatterBaseDir.x };
      const desired = normalize({
        x: this.scatterBaseDir.x + perp.x * wiggle,
        y: this.scatterBaseDir.y + perp.y * wiggle - (mothStyle ? 0.08 : 0),
      });
      const blend = Math.min(1, dt * (flyStyle ? 24 : 14));
      this.scatterDir = normalize({
        x: this.scatterDir.x + (desired.x - this.scatterDir.x) * blend,
        y: this.scatterDir.y + (desired.y - this.scatterDir.y) * blend,
      });
    }

    this.pos.x += this.scatterDir.x * scatterSpeed * dt;
    this.pos.y += this.scatterDir.y * scatterSpeed * dt;
    this.facingAngle = Math.atan2(this.scatterDir.y, this.scatterDir.x);

    this.scatterTimer -= dt;
    if (this.scatterTimer <= 0) {
      this.state = 'walking';
    }
  }

  private tickEdgeWalk(dt: number, graph: EdgeGraph): void {
    // If no current node, snap to nearest
    if (this.currentNodeId === null) {
      const nearest = findNearestNode(this.pos, graph);
      if (!nearest) {
        this.state = 'idle';
        return;
      }
      this.currentNodeId = nearest.id;
      this.pos = { ...nearest.pos };
    }

    // If no target, pick a random adjacent node (greedy)
    if (this.targetNodeId === null) {
      const edges = graph.adjacency.get(this.currentNodeId);
      if (!edges || edges.length === 0) {
        this.state = 'idle';
        return;
      }
      const edge = this.pickEdge(edges, graph);
      this.targetNodeId = edge.to;
    }

    // Walk toward target node
    const targetNode = graph.nodes[this.targetNodeId];
    if (!targetNode) {
      this.targetNodeId = null;
      return;
    }

    const dx = targetNode.pos.x - this.pos.x;
    const dy = targetNode.pos.y - this.pos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 2) {
      // Arrived at target node
      this.pos = { ...targetNode.pos };
      this.previousNodeId = this.currentNodeId;
      this.currentNodeId = this.targetNodeId;
      this.targetNodeId = null;
      this.state = 'walking';
      return;
    }

    // Move toward target
    const moveSpeed = this.speed * this.profileSpeedMultiplier() * dt;
    const ratio = Math.min(moveSpeed / distance, 1);
    let nx = dx;
    let ny = dy;
    if (this.bugType === 'fly') {
      this.movementPhase += dt * 18;
      const wobble = Math.sin(this.movementPhase) * 12;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      nx += (-dy / len) * wobble;
      ny += (dx / len) * wobble;
    } else if (this.bugType === 'moth') {
      ny -= 4;
    }

    this.pos.x += nx * ratio;
    this.pos.y += ny * ratio;
    this.facingAngle = Math.atan2(ny, nx);
    this.state = 'walking';
  }

  private tickRandomWalk(dt: number, viewport: Rect): void {
    if (this.bugType === 'spider' && this.spiderPauseTimer > 0) {
      this.spiderPauseTimer -= dt;
      this.state = 'idle';
      return;
    }

    this.randomWalkTimer -= dt;

    if (this.randomWalkTimer <= 0) {
      // Pick new direction using species profile.
      let angle: number;
      if (this.bugType === 'fly') {
        angle = Math.random() * Math.PI * 2;
      } else {
        const baseAngle = Math.atan2(this.randomWalkDir.y, this.randomWalkDir.x);
        const jitter = this.directionJitter();
        angle = baseAngle + (Math.random() - 0.5) * jitter;
      }
      this.randomWalkDir = { x: Math.cos(angle), y: Math.sin(angle) };
      this.randomWalkTimer = this.nextDirectionInterval();

      if (this.bugType === 'spider') {
        if (Math.random() < 0.4) this.spiderPauseTimer = 0.1 + Math.random() * 0.22;
        this.spiderBurstTimer = Math.random() < 0.45 ? 0.22 + Math.random() * 0.18 : 0;
      }
    }

    if (this.spiderBurstTimer > 0) this.spiderBurstTimer -= dt;

    let speedMul = this.profileSpeedMultiplier();
    if (this.bugType === 'spider' && this.spiderBurstTimer > 0) speedMul *= 1.9;

    let dir = { ...this.randomWalkDir };
    if (this.bugType === 'moth') {
      dir = normalize({ x: dir.x, y: dir.y - 0.22 });
    }
    if (this.bugType === 'fly') {
      this.movementPhase += dt * 24;
      const sway = Math.sin(this.movementPhase) * 0.45;
      const perp = { x: -dir.y, y: dir.x };
      dir = normalize({ x: dir.x + perp.x * sway, y: dir.y + perp.y * sway });
    }

    this.pos.x += dir.x * this.speed * speedMul * dt;
    this.pos.y += dir.y * this.speed * speedMul * dt;
    this.randomWalkDir = dir;
    this.facingAngle = Math.atan2(this.randomWalkDir.y, this.randomWalkDir.x);

    // Bounce off viewport edges
    if (this.pos.x < 0 || this.pos.x > viewport.width) {
      this.randomWalkDir.x *= -1;
      this.pos.x = Math.max(0, Math.min(viewport.width, this.pos.x));
    }
    if (this.pos.y < 0 || this.pos.y > viewport.height) {
      this.randomWalkDir.y *= -1;
      this.pos.y = Math.max(0, Math.min(viewport.height, this.pos.y));
    }

    this.state = 'walking';
  }

  private pickEdge(edges: EdgeGraphEdge[], graph: EdgeGraph): EdgeGraphEdge {
    const candidates = edges.filter((e) => e.to !== this.previousNodeId);
    const pool = candidates.length > 0 ? candidates : edges;

    if (this.bugType === 'queen') {
      return pool.reduce((best, edge) => (edge.cost > best.cost ? edge : best), pool[0]);
    }
    if (this.bugType === 'spider') {
      return pool.reduce((best, edge) => (edge.cost < best.cost ? edge : best), pool[0]);
    }
    if (this.bugType === 'moth') {
      return pool.reduce((best, edge) => {
        const by = graph.nodes[best.to]?.pos.y ?? Infinity;
        const ey = graph.nodes[edge.to]?.pos.y ?? Infinity;
        return ey < by ? edge : best;
      }, pool[0]);
    }
    return pool[Math.floor(Math.random() * pool.length)];
  }

  private nextDirectionInterval(): number {
    switch (this.bugType) {
      case 'fly': return 0.18 + Math.random() * 0.45;
      case 'moth': return 0.3 + Math.random() * 0.75;
      case 'spider': return 0.5 + Math.random() * 1.05;
      case 'queen': return 1.1 + Math.random() * 1.6;
      default: return 0.45 + Math.random() * 1.2;
    }
  }

  private directionJitter(): number {
    switch (this.bugType) {
      case 'fly': return Math.PI * 2;
      case 'moth': return Math.PI * 0.9;
      case 'spider': return Math.PI * 0.65;
      case 'queen': return Math.PI * 0.3;
      default: return Math.PI * 0.8;
    }
  }

  private profileSpeedMultiplier(): number {
    switch (this.bugType) {
      case 'fly': return 1.2;
      case 'moth': return 1.12;
      case 'spider': return 0.94;
      case 'queen': return 0.8;
      default: return 1;
    }
  }
}

function dist(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function normalize(v: Vec2): Vec2 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y) || 1;
  return { x: v.x / len, y: v.y / len };
}
