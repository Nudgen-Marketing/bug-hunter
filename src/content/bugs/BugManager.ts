import type { Tickable, Vec2, BugTickContext, HitboxShape, GameEvents } from '../types';
import type { EventBus } from '../core/EventBus';
import type { GameState } from '../core/GameState';
import { Bug } from './Bug';
import { CockroachAI } from './ai/CockroachAI';
import { buildEdgeGraph } from './ai/EdgeGraph';
import type { EdgeGraph, Rect } from '../types';
import { BUG_REGISTRY } from '../config/bug-registry';
import { BALANCE } from '../config/balance';

const AI_TICK_INTERVAL = 0.05; // 20Hz
const EDGE_GRAPH_REBUILD_INTERVAL = 10000; // 10 seconds
const SCROLL_DEBOUNCE = 500;

export class BugManager implements Tickable {
  private bugs = new Map<string, Bug>();
  private escapeTimers = new Map<string, number>();
  private bossAbilityTimers = new Map<string, number>();
  private aiAccumulator = 0;
  private container: HTMLElement;
  private bus: EventBus<GameEvents>;
  private state: GameState;
  private edgeGraph: EdgeGraph | null = null;
  private graphDirty = true;
  private lastGraphBuild = 0;
  private scrollTimeout: ReturnType<typeof setTimeout> | null = null;
  private scrollHandler: () => void;

  constructor(
    bus: EventBus<GameEvents>,
    state: GameState,
    container: HTMLElement,
  ) {
    this.bus = bus;
    this.state = state;
    this.container = container;

    // Scroll invalidation
    this.scrollHandler = () => {
      this.graphDirty = true;
      if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
      this.scrollTimeout = setTimeout(() => {
        this.graphDirty = true;
      }, SCROLL_DEBOUNCE);
    };
    window.addEventListener('scroll', this.scrollHandler, { passive: true });
    window.addEventListener('resize', this.scrollHandler, { passive: true });
  }

  update(dt: number): void {
    // Rebuild edge graph if dirty
    const now = performance.now();
    if (this.graphDirty || now - this.lastGraphBuild > EDGE_GRAPH_REBUILD_INTERVAL) {
      this.rebuildGraph();
      this.graphDirty = false;
      this.lastGraphBuild = now;
    }

    // AI tick at 20Hz
    this.aiAccumulator += dt;
    while (this.aiAccumulator >= AI_TICK_INTERVAL) {
      this.tickAI(AI_TICK_INTERVAL);
      this.aiAccumulator -= AI_TICK_INTERVAL;
    }

    // Interpolate sprites for smooth rendering
    const alpha = this.aiAccumulator / AI_TICK_INTERVAL;
    for (const bug of this.bugs.values()) {
      if (bug.isAlive) {
        bug.interpolateSprite(alpha);
      }
    }

    // Check for escaped bugs (off-screen)
    this.checkEscapes();
  }

  spawnBug(definitionId: string, pos?: Vec2): Bug | null {
    const def = BUG_REGISTRY[definitionId];
    if (!def) return null;
    if (definitionId === 'queen') {
      const hasAliveQueen = Array.from(this.bugs.values()).some((bug) => bug.isAlive && bug.definition.id === 'queen');
      if (hasAliveQueen) return null;
    }

    const spawnPos = pos || this.getSpawnPosition();
    const ai = new CockroachAI(spawnPos, def.baseSpeed, def.id);
    const bug = new Bug(def, spawnPos, ai, this.container);
    this.bugs.set(bug.id, bug);
    this.escapeTimers.set(bug.id, 0);
    if (definitionId === 'queen') {
      this.bossAbilityTimers.set(bug.id, 4 + Math.random() * 2);
      this.bus.emit('boss:spawned', {
        bugId: bug.id,
        name: bug.definition.name,
        maxHp: bug.maxHp,
      });
      this.bus.emit('boss:hp', { bugId: bug.id, hp: bug.currentHp, maxHp: bug.maxHp });
    }

    this.bus.emit('bug:spawned', { bugId: bug.id, pos: spawnPos });
    return bug;
  }

  killBug(bugId: string, pos: Vec2, damage = 1): void {
    const bug = this.bugs.get(bugId);
    if (!bug || !bug.isAlive) return;

    this.escapeTimers.set(bugId, 0);
    const killed = bug.hit(damage);
    if (bug.definition.id === 'queen') {
      this.bus.emit('boss:hp', { bugId: bug.id, hp: Math.max(0, bug.currentHp), maxHp: bug.maxHp });
    }
    if (killed) {
      this.state.incrementKills();
      this.state.addStress(-bug.definition.stressReduction);
      this.state.addScore(bug.definition.scoreValue);

      this.bus.emit('bug:killed', {
        bugId: bug.id,
        tier: bug.definition.tier,
        pos,
        scoreValue: bug.definition.scoreValue,
        stressReduction: bug.definition.stressReduction,
      });
      if (bug.definition.id === 'queen') {
        this.bus.emit('boss:killed', {
          bugId: bug.id,
          name: bug.definition.name,
          pos,
          scoreValue: bug.definition.scoreValue,
        });
      }

      // Remove from map after death animation
      setTimeout(() => {
        this.bugs.delete(bugId);
        this.escapeTimers.delete(bugId);
        this.bossAbilityTimers.delete(bugId);
      }, 350);
    }
  }

  getAliveBugs(): Bug[] {
    return Array.from(this.bugs.values()).filter(b => b.isAlive);
  }

  hitTest(pos: Vec2, hitbox: HitboxShape): Bug[] {
    const hits: Bug[] = [];
    for (const bug of this.bugs.values()) {
      if (!bug.isAlive) continue;
      if (hitbox.type === 'circle') {
        const dx = pos.x - bug.pos.x;
        const dy = pos.y - bug.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= hitbox.radius + bug.definition.hitRadius) {
          hits.push(bug);
        }
      } else if (hitbox.type === 'rect') {
        const halfW = hitbox.width / 2;
        const halfH = hitbox.height / 2;
        const withinX = bug.pos.x >= pos.x - halfW - bug.definition.hitRadius
          && bug.pos.x <= pos.x + halfW + bug.definition.hitRadius;
        const withinY = bug.pos.y >= pos.y - halfH - bug.definition.hitRadius
          && bug.pos.y <= pos.y + halfH + bug.definition.hitRadius;
        if (withinX && withinY) {
          hits.push(bug);
        }
      }
    }
    return hits;
  }

  get aliveCount(): number {
    let count = 0;
    for (const bug of this.bugs.values()) {
      if (bug.isAlive) count++;
    }
    return count;
  }

  cleanup(): void {
    window.removeEventListener('scroll', this.scrollHandler);
    window.removeEventListener('resize', this.scrollHandler);
    if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
    for (const bug of this.bugs.values()) {
      bug.destroy();
    }
    this.bugs.clear();
    this.escapeTimers.clear();
    this.bossAbilityTimers.clear();
    this.edgeGraph = null;
  }

  private tickAI(dt: number): void {
    const ctx: BugTickContext = {
      cursorPos: this.state.get('cursorPos'),
      edgeGraph: this.edgeGraph,
      viewportRect: {
        x: 0, y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      },
      dt,
    };

    for (const bug of this.bugs.values()) {
      if (bug.isAlive) {
        const timer = this.escapeTimers.get(bug.id) ?? 0;
        const nextTimer = timer + dt;
        this.escapeTimers.set(bug.id, nextTimer);
        if (nextTimer >= BALANCE.bugs.nestTimeoutMs / 1000) {
          this.escapeBug(bug);
          continue;
        }
        this.tickBossAbility(bug, dt);
        bug.tick(ctx);
      }
    }
  }

  private checkEscapes(): void {
    const margin = 50;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    for (const bug of this.bugs.values()) {
      if (!bug.isAlive) continue;
      const p = bug.pos;
      if (p.x < -margin || p.x > vw + margin || p.y < -margin || p.y > vh + margin) {
        this.escapeBug(bug);
      }
    }
  }

  private escapeBug(bug: Bug): void {
    if (!this.bugs.has(bug.id)) return;
    this.state.incrementEscapes();
    this.bus.emit('bug:escaped', { bugId: bug.id });
    bug.destroy();
    this.bugs.delete(bug.id);
    this.escapeTimers.delete(bug.id);
    this.bossAbilityTimers.delete(bug.id);
  }

  private tickBossAbility(bug: Bug, dt: number): void {
    if (bug.definition.id !== 'queen') return;
    const timer = this.bossAbilityTimers.get(bug.id);
    if (timer === undefined) return;
    const next = timer - dt;
    if (next > 0) {
      this.bossAbilityTimers.set(bug.id, next);
      return;
    }
    this.triggerBossAbility(bug);
    const cooldown = 6;
    this.bossAbilityTimers.set(bug.id, cooldown);
    this.bus.emit('boss:ability', { bugId: bug.id, ability: 'panic-pulse', cooldownMs: cooldown * 1000 });
  }

  private triggerBossAbility(boss: Bug): void {
    this.state.addStress(2);
    for (const bug of this.bugs.values()) {
      if (!bug.isAlive || bug.id === boss.id) continue;
      bug.scatter(boss.pos);
    }

    if (this.aliveCount < BALANCE.spawning.freePlay.maxAliveBugs) {
      const spawnPos = {
        x: Math.max(0, Math.min(window.innerWidth, boss.pos.x + (Math.random() * 80 - 40))),
        y: Math.max(0, Math.min(window.innerHeight, boss.pos.y + (Math.random() * 80 - 40))),
      };
      this.spawnBug(Math.random() > 0.5 ? 'spider' : 'fly', spawnPos);
    }
  }

  private getSpawnPosition(): Vec2 {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const edge = Math.floor(Math.random() * 4);
    switch (edge) {
      case 0: return { x: Math.random() * vw, y: -20 }; // top
      case 1: return { x: vw + 20, y: Math.random() * vh }; // right
      case 2: return { x: Math.random() * vw, y: vh + 20 }; // bottom
      default: return { x: -20, y: Math.random() * vh }; // left
    }
  }

  private rebuildGraph(): void {
    const elements = this.scanElements();
    this.edgeGraph = buildEdgeGraph(elements);
  }

  private scanElements(): Rect[] {
    const selector = 'div,p,span,a,img,button,h1,h2,h3,h4,h5,h6,li,article,section,header,footer,nav,aside,main,table,ul,ol,figure,blockquote,pre,code,video';
    const els = document.querySelectorAll(selector);
    const rects: Rect[] = [];

    for (const el of els) {
      // Skip our own UI elements
      if ((el as HTMLElement).closest('.bh-container') ||
          (el as HTMLElement).closest('#pd-toolbar') ||
          (el as HTMLElement).closest('#pd-particles-container')) {
        continue;
      }

      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        rects.push({ x: r.left, y: r.top, width: r.width, height: r.height });
      }
    }

    return rects;
  }
}
