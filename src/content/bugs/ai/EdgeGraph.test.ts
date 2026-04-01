import { describe, expect, it } from 'vitest';
import { buildEdgeGraph, findNearestNode } from './EdgeGraph';

describe('EdgeGraph', () => {
  it('returns null for insufficient or empty geometry', () => {
    expect(buildEdgeGraph([])).toBeNull();
    expect(buildEdgeGraph([{ x: 0, y: 0, width: 10, height: 10 }])).toBeNull();
  });

  it('builds a graph for valid rects and resolves nearest node', () => {
    const rects = [
      { x: 0, y: 0, width: 60, height: 60 },
      { x: 80, y: 0, width: 60, height: 60 },
      { x: 160, y: 0, width: 60, height: 60 },
    ];
    const graph = buildEdgeGraph(rects);
    expect(graph).not.toBeNull();
    expect(graph!.nodes.length).toBeGreaterThanOrEqual(8);
    expect(graph!.edges.length).toBeGreaterThan(0);

    const nearest = findNearestNode({ x: 4, y: 3 }, graph!);
    expect(nearest).not.toBeNull();
    expect(nearest!.id).toBeTypeOf('number');
  });
});
