import type { GameEvents } from '../types';
import type { EventBus } from '../core/EventBus';
import type { GameState } from '../core/GameState';
import { WEAPONS } from './weapons';
import { playLegacyWeaponEffect, spawnLegacyRuins } from './weapon-effects';

interface DestroyedElement {
  element: HTMLElement;
  originalVisibility: string;
  originalPointerEvents: string;
  animationClass: string;
}

export class LegacyDestruction {
  private bus: EventBus<GameEvents>;
  private state: GameState;
  private destroyed: DestroyedElement[] = [];
  private particlesContainer: HTMLElement;

  constructor(bus: EventBus<GameEvents>, state: GameState, particlesContainer: HTMLElement) {
    this.bus = bus;
    this.state = state;
    this.particlesContainer = particlesContainer;
  }

  destroyElement(target: HTMLElement, pos: { x: number; y: number }): void {
    if (target.classList.contains('pd-destroyed')) return;
    if (this.isUIElement(target)) return;
    if (this.isOversized(target)) return;

    const weaponId = this.state.get('activeWeapon');
    const weapon = WEAPONS[weaponId];
    if (!weapon) return;
    const rect = target.getBoundingClientRect();

    // Store for restoration
    this.destroyed.push({
      element: target,
      originalVisibility: target.style.visibility,
      originalPointerEvents: target.style.pointerEvents,
      animationClass: weapon.animationClass,
    });

    // Apply destruction
    target.classList.add('pd-destroyed', weapon.animationClass);
    playLegacyWeaponEffect(this.particlesContainer, weaponId, pos.x, pos.y, rect);

    this.bus.emit('weapon:fired', { weaponId, pos, element: target });

    // Hide after animation
    setTimeout(() => {
      spawnLegacyRuins(this.particlesContainer, rect);
      target.style.visibility = 'hidden';
      target.style.pointerEvents = 'none';
    }, weapon.duration);
  }

  fireAt(pos: { x: number; y: number }): void {
    const weaponId = this.state.get('activeWeapon');
    const weapon = WEAPONS[weaponId];
    if (!weapon) return;
    playLegacyWeaponEffect(this.particlesContainer, weaponId, pos.x, pos.y);
  }

  restoreAll(): void {
    for (const { element, originalVisibility, originalPointerEvents, animationClass } of this.destroyed) {
      element.classList.remove('pd-destroyed', animationClass);
      element.style.visibility = originalVisibility || '';
      element.style.pointerEvents = originalPointerEvents || '';
    }
    this.destroyed.length = 0;
  }

  private isUIElement(el: HTMLElement): boolean {
    return !!(el.closest('.bh-container') ||
              el.closest('#bh-toolbar') ||
              el.closest('#pd-toolbar') ||
              el.closest('#pd-particles-container'));
  }

  private isOversized(el: HTMLElement): boolean {
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    return (rect.width > vw * 0.5 && rect.height > vh * 0.5) &&
           (rect.width > 800 && rect.height > 600);
  }
}
