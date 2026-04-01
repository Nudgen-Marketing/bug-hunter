import type { EdgeGraph, EdgeNode, EdgeGraphEdge, Rect, Vec2 } from '../../types';
import { BALANCE } from '../../config/balance';

const SNAP_DIST = BALANCE.bugs.edgeSnapDistancePx;
const DEDUP_DIST = 5;
const MAX_ELEMENTS = 100;
const MIN_ELEMENT_AREA = 1000;
const MIN_NODES_FOR_GRAPH = 8;

export function buildEdgeGraph(rects: Rect[]): EdgeGraph | null {
  if (rects.length === 0) return null;

  // Sort by area descending, take top N
  const sorted = rects
    .filter(r => r.width * r.height >= MIN_ELEMENT_AREA)
    .sort((a, b) => (b.width * b.height) - (a.width * a.height))
    .slice(0, MAX_ELEMENTS);

  if (sorted.length < 3) return null;

  // Create corner nodes for each rect
  let nodeId = 0;
  const rawNodes: EdgeNode[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const r = sorted[i];
    rawNodes.push(
      { id: nodeId++, pos: { x: r.x, y: r.y }, elementIndex: i },
      { id: nodeId++, pos: { x: r.x + r.width, y: r.y }, elementIndex: i },
      { id: nodeId++, pos: { x: r.x + r.width, y: r.y + r.height }, elementIndex: i },
      { id: nodeId++, pos: { x: r.x, y: r.y + r.height }, elementIndex: i },
    );
  }

  // Deduplicate nodes within DEDUP_DIST
  const nodes: EdgeNode[] = [];
  const mergeMap = new Map<number, number>(); // old id -> new id

  for (const node of rawNodes) {
    let merged = false;
    for (const existing of nodes) {
      if (dist(node.pos, existing.pos) < DEDUP_DIST) {
        mergeMap.set(node.id, existing.id);
        merged = true;
        break;
      }
    }
    if (!merged) {
      const newNode = { ...node, id: nodes.length };
      mergeMap.set(node.id, newNode.id);
      nodes.push(newNode);
    }
  }

  if (nodes.length < MIN_NODES_FOR_GRAPH) return null;

  // Create edges: element borders + cross-element connections
  const edges: EdgeGraphEdge[] = [];
  const edgeSet = new Set<string>();

  function addEdge(fromId: number, toId: number) {
    const a = Math.min(fromId, toId);
    const b = Math.max(fromId, toId);
    const key = `${a}-${b}`;
    if (a === b || edgeSet.has(key)) return;
    edgeSet.add(key);
    edges.push({ from: a, to: b, cost: dist(nodes[a].pos, nodes[b].pos) });
  }

  // Element border edges (connect 4 corners of each rect)
  for (let i = 0; i < rawNodes.length; i += 4) {
    const ids = [
      mergeMap.get(rawNodes[i].id)!,
      mergeMap.get(rawNodes[i + 1].id)!,
      mergeMap.get(rawNodes[i + 2].id)!,
      mergeMap.get(rawNodes[i + 3].id)!,
    ];
    addEdge(ids[0], ids[1]); // top
    addEdge(ids[1], ids[2]); // right
    addEdge(ids[2], ids[3]); // bottom
    addEdge(ids[3], ids[0]); // left
  }

  // Cross-element edges (nearby corners of different elements)
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (nodes[i].elementIndex === nodes[j].elementIndex) continue;
      if (dist(nodes[i].pos, nodes[j].pos) <= SNAP_DIST) {
        addEdge(i, j);
      }
    }
  }

  // Build adjacency map
  const adjacency = new Map<number, EdgeGraphEdge[]>();
  for (const node of nodes) {
    adjacency.set(node.id, []);
  }
  for (const edge of edges) {
    adjacency.get(edge.from)!.push(edge);
    adjacency.get(edge.to)!.push({ from: edge.to, to: edge.from, cost: edge.cost });
  }

  return { nodes, edges, adjacency };
}

export function findNearestNode(pos: Vec2, graph: EdgeGraph): EdgeNode | null {
  let nearest: EdgeNode | null = null;
  let minDist = Infinity;
  for (const node of graph.nodes) {
    const d = dist(pos, node.pos);
    if (d < minDist) {
      minDist = d;
      nearest = node;
    }
  }
  return nearest;
}

function dist(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}
