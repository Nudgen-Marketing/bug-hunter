import { describe, expect, it } from 'vitest';
import { CockroachAI } from './CockroachAI';

function makeCtx() {
  return {
    cursorPos: { x: 1000, y: 1000 },
    edgeGraph: null,
    viewportRect: { x: 0, y: 0, width: 1920, height: 1080 },
    dt: 0.05,
  };
}

describe('CockroachAI', () => {
  it('gives flies a less-linear scatter path than default bugs', () => {
    const fly = new CockroachAI({ x: 100, y: 100 }, 80, 'fly');
    const roach = new CockroachAI({ x: 100, y: 100 }, 80, 'cockroach');

    fly.onScatter({ x: 100, y: 200 });
    roach.onScatter({ x: 100, y: 200 });

    const ctx = makeCtx();
    const flyAngles: number[] = [];
    const roachAngles: number[] = [];

    for (let i = 0; i < 12; i++) {
      flyAngles.push(fly.tick(ctx).facingAngle);
      roachAngles.push(roach.tick(ctx).facingAngle);
    }

    const flyTurn = totalTurn(flyAngles);
    const roachTurn = totalTurn(roachAngles);

    // Flies should vary heading more while fleeing; roaches remain nearly linear.
    expect(flyTurn).toBeGreaterThan(roachTurn + 0.4);
  });
});

function totalTurn(angles: number[]): number {
  let acc = 0;
  for (let i = 1; i < angles.length; i++) {
    let d = angles[i] - angles[i - 1];
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    acc += Math.abs(d);
  }
  return acc;
}
