import type { GameEvents, ModeId, ToolId, WeaponId } from '../types';
import { EventBus } from './EventBus';
import { GameState } from './GameState';
import { GameLoop } from './GameLoop';
import { BugManager } from '../bugs/BugManager';
import { ToolManager } from '../tools/ToolManager';
import { AudioManager } from '../audio/AudioManager';
import { StressMeter } from '../ui/StressMeter';
import { ScoreDisplay } from '../ui/ScoreDisplay';
import { Toolbar } from '../ui/Toolbar';
import { KillFeed } from '../ui/KillFeed';
import { Fireworks } from '../ui/Fireworks';
import { ChallengeStatus } from '../ui/ChallengeStatus';
import { BossStatus } from '../ui/BossStatus';
import { LegacyDestruction } from '../legacy/destruction';
import { FreePlayMode } from '../modes/FreePlayMode';
import { ChallengeMode } from '../modes/ChallengeMode';
import { WEAPON_KEYS } from '../legacy/weapons';
import { applyGameResult } from '../../shared/progression';
import { readProgression, writeProgression } from '../../shared/storage';
import { DomCorruption } from '../corruption/DomCorruption';

export class GameSession {
  readonly bus: EventBus<GameEvents>;
  readonly state: GameState;
  readonly loop: GameLoop;

  private container: HTMLElement | null = null;
  private particlesContainer: HTMLElement | null = null;
  private bugManager: BugManager | null = null;
  private toolManager: ToolManager | null = null;
  private audioManager: AudioManager | null = null;
  private stressMeter: StressMeter | null = null;
  private scoreDisplay: ScoreDisplay | null = null;
  private toolbar: Toolbar | null = null;
  private killFeed: KillFeed | null = null;
  private fireworks: Fireworks | null = null;
  private challengeStatus: ChallengeStatus | null = null;
  private bossStatus: BossStatus | null = null;
  private destruction: LegacyDestruction | null = null;
  private freePlayMode: FreePlayMode | null = null;
  private challengeMode: ChallengeMode | null = null;
  private domCorruption: DomCorruption | null = null;

  private clickHandler: ((e: MouseEvent) => void) | null = null;
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;
  private moveHandler: ((e: MouseEvent) => void) | null = null;
  private endScreenEl: HTMLElement | null = null;

  constructor(
    private config: {
      mode: ModeId;
      tool: ToolId;
      weapon: WeaponId;
      muted: boolean;
    }
  ) {
    this.bus = new EventBus<GameEvents>();
    this.state = new GameState(this.bus, {
      mode: config.mode,
      activeTool: config.tool,
      activeWeapon: config.weapon,
      muted: config.muted,
    });
    this.loop = new GameLoop();
  }

  async start(): Promise<void> {
    if (!this.hasEnoughContentToDebug()) {
      this.showUnavailableNotice();
      return;
    }

    const progression = await readProgression();
    const unlockedTools = new Set(progression.unlockedTools);
    if (!unlockedTools.has(this.config.tool)) {
      this.config.tool = 'destroy-tools';
      this.state.setActiveTool('destroy-tools');
    }

    // Create main container
    this.container = document.createElement('div');
    this.container.className = 'bh-container';
    this.container.id = 'bh-container';
    document.body.appendChild(this.container);

    // Create particles container
    this.particlesContainer = document.createElement('div');
    this.particlesContainer.className = 'bh-particles';
    this.particlesContainer.id = 'pd-particles-container';
    this.particlesContainer.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:2147483645;overflow:hidden;';
    document.body.appendChild(this.particlesContainer);

    // Initialize systems
    this.audioManager = new AudioManager(this.bus, this.state);
    this.bugManager = new BugManager(this.bus, this.state, this.particlesContainer);
    this.toolManager = new ToolManager(this.bus, this.state, this.bugManager);
    this.destruction = new LegacyDestruction(this.bus, this.state, this.particlesContainer);
    this.domCorruption = new DomCorruption(this.state, this.bugManager);

    // UI
    this.stressMeter = new StressMeter(this.bus, this.container);
    this.scoreDisplay = new ScoreDisplay(this.bus, this.container);
    this.toolbar = new Toolbar(this.bus, this.state, this.container);
    this.killFeed = new KillFeed(this.bus, this.particlesContainer);
    this.fireworks = new Fireworks(this.bus, this.particlesContainer);

    // Game modes
    this.freePlayMode = new FreePlayMode(this.bus, this.state, this.bugManager);
    this.challengeMode = new ChallengeMode(this.bus, this.state, this.bugManager);

    if (this.config.mode === 'challenge') {
      this.challengeStatus = new ChallengeStatus(this.bus, this.container);
    }
    this.bossStatus = new BossStatus(this.bus, this.container);

    // Register tickable systems with game loop
    this.loop.register(this.bugManager);
    this.loop.register(this.toolManager);
    this.loop.register(this.domCorruption);
    this.loop.register(this.config.mode === 'challenge' ? this.challengeMode! : this.freePlayMode!);

    // Setup input handlers
    this.setupInput();

    // Apply cursor
    this.updateCursor();
    this.bus.on('weapon:selected', () => this.updateCursor());

    // Mark targetable elements
    this.markTargetable();

    // Listen for game end
    this.bus.on('game:ended', ({ reason }) => {
      if (reason === 'quit') {
        this.stop();
        return;
      }
      void this.persistProgress(reason);
      if (reason === 'defeat') {
        this.showDefeatScreen();
      }
      this.loop.stop();
      this.detachInput();
    });

    // Reset destroyed DOM/effects without ending the run.
    this.bus.on('game:reset', () => {
      this.destruction?.restoreAll();
      if (this.particlesContainer) {
        this.particlesContainer.innerHTML = '';
      }
    });

    // Start the game
    this.state.setPhase('playing');
    if (this.config.mode === 'challenge') {
      this.challengeMode!.start();
    } else {
      this.freePlayMode!.start();
    }
    this.loop.start();
  }

  stop(): void {
    this.loop.stop();

    // Cleanup input
    this.detachInput();

    // Restore destroyed elements
    this.destruction?.restoreAll();

    // Cleanup systems
    this.bugManager?.cleanup();
    this.freePlayMode?.cleanup();
    this.challengeMode?.cleanup();
    this.audioManager?.cleanup();
    this.stressMeter?.cleanup();
    this.scoreDisplay?.cleanup();
    this.toolbar?.cleanup();
    this.killFeed?.cleanup();
    this.fireworks?.cleanup();
    this.challengeStatus?.cleanup();
    this.bossStatus?.cleanup();
    this.domCorruption?.cleanup();

    // Remove targetable classes
    document.querySelectorAll('.bh-targetable').forEach(el => {
      el.classList.remove('bh-targetable');
    });

    // Remove cursor classes
    for (const key of WEAPON_KEYS) {
      document.body.classList.remove(`pd-cursor-${key}`);
    }

    // Remove containers
    this.particlesContainer?.remove();
    this.container?.remove();
    this.endScreenEl?.remove();
    this.endScreenEl = null;

    // Clear event bus
    this.bus.clear();

    // Clear global reference
    (window as any).bugCatcherInstance = null;
  }

  selectTool(toolId: ToolId): void {
    this.state.setActiveTool(toolId);
  }

  selectWeapon(weaponId: WeaponId): void {
    this.state.setActiveWeapon(weaponId);
    this.updateCursor();
  }

  private setupInput(): void {
    this.clickHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.bh-container') || target.closest('.bh-particles')) return;

      e.preventDefault();
      e.stopPropagation();

      // Try tool hit on bugs first
      const hit = this.toolManager?.handleClick(e.clientX, e.clientY);

      // If bug hit, play the same active tool/weapon visual effect at impact.
      if (hit) {
        this.destruction?.fireAt({ x: e.clientX, y: e.clientY });
      }

      // If no bug hit, use legacy destruction on DOM element
      if (!hit && target) {
        this.destruction?.destroyElement(target, { x: e.clientX, y: e.clientY });
      }
    };

    this.keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.stop();
        return;
      }
      if (e.key === 'm' || e.key === 'M') {
        this.state.setMuted(!this.state.get('muted'));
        return;
      }
      // Number keys 1-9 select weapons
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= WEAPON_KEYS.length) {
        this.selectWeapon(WEAPON_KEYS[num - 1]);
      }
    };

    this.moveHandler = (e: MouseEvent) => {
      this.state.setCursorPos({ x: e.clientX, y: e.clientY });
    };

    document.addEventListener('click', this.clickHandler, true);
    document.addEventListener('keydown', this.keyHandler, true);
    document.addEventListener('mousemove', this.moveHandler, true);
  }

  private detachInput(): void {
    if (this.clickHandler) document.removeEventListener('click', this.clickHandler, true);
    if (this.keyHandler) document.removeEventListener('keydown', this.keyHandler, true);
    if (this.moveHandler) document.removeEventListener('mousemove', this.moveHandler, true);
  }

  private updateCursor(): void {
    const weapon = this.state.get('activeWeapon');
    for (const key of WEAPON_KEYS) {
      document.body.classList.remove(`pd-cursor-${key}`);
    }
    document.body.classList.add(`pd-cursor-${weapon}`);
  }

  private markTargetable(): void {
    const selector = 'div,p,span,a,img,button,input,h1,h2,h3,h4,h5,h6,li,article,section,header,footer,nav,aside,main,form,table,tr,td,th,ul,ol,figure,figcaption,blockquote,pre,code,label,video,iframe,canvas,svg';
    document.querySelectorAll(selector).forEach(el => {
      if (!(el as HTMLElement).closest('.bh-container')) {
        el.classList.add('bh-targetable');
      }
    });
  }

  private hasEnoughContentToDebug(): boolean {
    const selector = 'div,p,span,a,img,button,h1,h2,h3,h4,h5,h6,li,article,section,header,footer,nav,aside,main,table,ul,ol,figure,blockquote,pre,code,video';
    const elements = document.querySelectorAll(selector);
    let meaningful = 0;
    for (const el of elements) {
      const r = (el as HTMLElement).getBoundingClientRect();
      if (r.width * r.height >= 1000) meaningful++;
      if (meaningful >= 10) return true;
    }
    return false;
  }

  private showUnavailableNotice(): void {
    const notice = document.createElement('div');
    notice.style.cssText = [
      'position:fixed',
      'left:50%',
      'bottom:36px',
      'transform:translateX(-50%)',
      'z-index:2147483647',
      'padding:10px 14px',
      'border-radius:10px',
      'background:rgba(20,24,34,0.95)',
      'border:1px solid rgba(255,255,255,0.2)',
      'color:#fff',
      'font:13px system-ui, -apple-system, Segoe UI, sans-serif',
      'box-shadow:0 8px 24px rgba(0,0,0,0.35)',
      'pointer-events:none',
    ].join(';');
    notice.textContent = 'Not enough content to debug here';
    document.body.appendChild(notice);
    setTimeout(() => notice.remove(), 2600);
  }

  private async persistProgress(reason: 'victory' | 'defeat'): Promise<void> {
    try {
      const current = await readProgression();
      const snapshot = this.state.snapshot();
      const result = applyGameResult(current, {
        mode: snapshot.mode,
        reason,
        score: snapshot.score,
        kills: snapshot.killedCount,
        escapes: snapshot.escapedCount,
      });
      await writeProgression(result.progression);

      if (result.newUnlocks.length > 0 || result.newAchievements.length > 0) {
        this.showProgressNotice(result.newUnlocks, result.newAchievements);
      }
    } catch {
      // no-op: persistence should never block gameplay
    }
  }

  private showProgressNotice(newUnlocks: string[], newAchievements: string[]): void {
    const lines: string[] = [];
    if (newUnlocks.length > 0) {
      lines.push(`Unlocked: ${newUnlocks.join(', ')}`);
    }
    if (newAchievements.length > 0) {
      lines.push(`Achievements: ${newAchievements.join(', ')}`);
    }
    if (lines.length === 0) return;

    const notice = document.createElement('div');
    notice.style.cssText = [
      'position:fixed',
      'left:50%',
      'top:24px',
      'transform:translateX(-50%)',
      'z-index:2147483647',
      'padding:10px 14px',
      'border-radius:10px',
      'background:rgba(12,20,16,0.97)',
      'border:1px solid rgba(0,255,136,0.45)',
      'color:#d8ffe9',
      'font:12px system-ui, -apple-system, Segoe UI, sans-serif',
      'box-shadow:0 8px 24px rgba(0,0,0,0.35)',
      'pointer-events:none',
      'white-space:pre-line',
      'text-align:center',
    ].join(';');
    notice.textContent = lines.join('\n');
    document.body.appendChild(notice);
    setTimeout(() => notice.remove(), 3400);
  }

  private showDefeatScreen(): void {
    const flash = document.createElement('div');
    flash.className = 'bh-defeat-flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 650);

    if (!this.container) return;
    this.endScreenEl?.remove();

    const overlay = document.createElement('div');
    overlay.className = 'bh-end-screen';
    overlay.innerHTML = `
      <div class="bh-end-card bh-defeat-card">
        <div class="bh-end-title">System Overrun</div>
        <div class="bh-end-subtitle">Stress reached 100%. The bugs took over.</div>
        <button type="button" class="bh-end-close">Exit</button>
      </div>
    `;
    const btn = overlay.querySelector('.bh-end-close') as HTMLButtonElement | null;
    if (btn) {
      btn.addEventListener('click', () => this.stop());
    }
    this.container.appendChild(overlay);
    this.endScreenEl = overlay;
  }
}
