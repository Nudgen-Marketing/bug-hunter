import type { BugDefinition, Vec2, BugState, BugTickContext } from '../types';
import type { BugAI } from './ai/CockroachAI';

let bugCounter = 0;

export class Bug {
  readonly id: string;
  readonly definition: BugDefinition;
  private ai: BugAI;
  private spriteEl: HTMLElement;
  private container: HTMLElement;
  private _pos: Vec2;
  private prevPos: Vec2;
  private _state: BugState = 'idle';
  private _facingAngle = 0;
  private hp: number;
  readonly spawnedAt: number;
  private _alive = true;

  constructor(
    definition: BugDefinition,
    spawnPos: Vec2,
    ai: BugAI,
    container: HTMLElement,
  ) {
    this.id = `bug_${bugCounter++}`;
    this.definition = definition;
    this.ai = ai;
    this.container = container;
    this._pos = { ...spawnPos };
    this.prevPos = { ...spawnPos };
    this.hp = definition.baseHP;
    this.spawnedAt = performance.now();
    this.spriteEl = this.createSprite();
    this.container.appendChild(this.spriteEl);
    this.updateSprite();
  }

  get pos(): Vec2 { return this._pos; }
  get state(): BugState { return this._state; }
  get isAlive(): boolean { return this._alive; }
  get facingAngle(): number { return this._facingAngle; }
  get currentHp(): number { return this.hp; }
  get maxHp(): number { return this.definition.baseHP; }

  tick(context: BugTickContext): void {
    if (!this._alive) return;
    this.prevPos = { ...this._pos };
    const result = this.ai.tick(context);
    this._pos = result.newPos;
    this._state = result.newState;
    this._facingAngle = result.facingAngle;
  }

  interpolateSprite(alpha: number): void {
    if (!this._alive) return;
    const x = this.prevPos.x + (this._pos.x - this.prevPos.x) * alpha;
    const y = this.prevPos.y + (this._pos.y - this.prevPos.y) * alpha;
    this.spriteEl.style.transform =
      `translate(${x - 12}px, ${y - 12}px) rotate(${this._facingAngle + Math.PI / 2}rad)`;
  }

  hit(damage: number): boolean {
    if (!this._alive) return false;
    this.hp -= damage;
    if (this.hp <= 0) {
      this._alive = false;
      this._state = 'dying';
      this.spriteEl.classList.add('bh-bug-dying');
      setTimeout(() => this.destroy(), 300);
      return true;
    }
    // Flash on hit
    this.spriteEl.classList.add('bh-bug-hit');
    setTimeout(() => this.spriteEl.classList.remove('bh-bug-hit'), 150);
    return false;
  }

  scatter(fromPos: Vec2): void {
    this.ai.onScatter(fromPos);
  }

  destroy(): void {
    this._alive = false;
    this._state = 'dead';
    if (this.spriteEl.parentNode) {
      this.spriteEl.parentNode.removeChild(this.spriteEl);
    }
  }

  private createSprite(): HTMLElement {
    const el = document.createElement('div');
    el.className = `bh-bug bh-bug-tier-${this.definition.tier}`;
    if (this.definition.id === 'queen') {
      el.classList.add('bh-bug-boss');
    }
    el.textContent = this.definition.emoji;
    el.style.position = 'fixed';
    el.style.zIndex = '2147483646';
    el.style.pointerEvents = 'none';
    el.style.fontSize = '24px';
    el.style.lineHeight = '1';
    el.style.willChange = 'transform';
    el.style.transition = 'none';
    el.style.userSelect = 'none';
    el.dataset.bugId = this.id;
    return el;
  }

  private updateSprite(): void {
    this.spriteEl.style.transform =
      `translate(${this._pos.x - 12}px, ${this._pos.y - 12}px) rotate(${this._facingAngle + Math.PI / 2}rad)`;
  }
}
