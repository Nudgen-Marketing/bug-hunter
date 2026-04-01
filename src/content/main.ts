import { GameSession } from './core/GameSession';
import type { ModeId, ToolId, WeaponId } from './types';

// Guard against double-injection
if ((window as any).bugCatcherInstance) {
  const weapon = (window as any).bugCatcherWeapon || (window as any).pageDestroyerWeapon;
  if (weapon) {
    (window as any).bugCatcherInstance.selectWeapon(weapon);
  }
} else {
  // Read injected globals (new + legacy compat)
  const mode: ModeId = 'free-play';
  const tool: ToolId = (window as any).bugCatcherTool || 'destroy-tools';
  const weapon: WeaponId = (window as any).bugCatcherWeapon || (window as any).pageDestroyerWeapon || 'slipper';
  const muted: boolean = (window as any).bugCatcherMute ?? (window as any).pageDestroyerMute ?? false;
  const activate: boolean = (window as any).bugCatcherActivate ?? (window as any).pageDestroyerActivate ?? false;

  const session = new GameSession({ mode, tool, weapon, muted });

  (window as any).bugCatcherInstance = {
    activate: () => session.start(),
    deactivate: () => session.stop(),
    selectTool: (id: ToolId) => session.selectTool(id),
    selectWeapon: (id: WeaponId) => session.selectWeapon(id),
  };

  if (activate) {
    session.start();
  }
}
