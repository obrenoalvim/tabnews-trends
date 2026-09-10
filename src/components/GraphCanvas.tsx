import { DataSet } from 'vis-data';
import { Network, type Edge, type Node } from 'vis-network';
import { useEffect, useRef, useState } from 'react';

import type { TrendNode, TrendEdge } from '../types';

interface HoverInfo {
  label: string;
  count: number;
  tabcoins: number;
}

interface GraphCanvasProps {
  nodes: TrendNode[];
  edges: TrendEdge[];
}

export function GraphCanvas({ nodes, edges }: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<HoverInfo | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || nodes.length === 0) return;

    const maxCount = Math.max(...nodes.map((n) => n.count));
    const nodeById = new Map(nodes.map((n) => [n.id, n]));

    const visNodes = new DataSet<Node>(
      nodes.map((n) => {
        const intensity = 0.5 + 0.5 * (n.count / maxCount);
        return {
          id: n.id,
          label: n.label,
          value: n.count,
          color: {
            background: `rgba(255, ${Math.round(179 * intensity)}, 0, ${0.85 * intensity + 0.15})`,
            border: 'rgba(255, 217, 140, 0.9)',
            highlight: { background: '#ffd98c', border: '#fff2cf' },
            hover: { background: '#ffcf5c', border: '#fff2cf' },
          },
          font: { color: '#ece7d6', face: 'IBM Plex Mono', size: 13, strokeWidth: 3, strokeColor: '#0b0c0a' },
        };
      }),
    );

    const validEdges = edges.filter((e) => nodeById.has(e.source) && nodeById.has(e.target));
    const visEdges = new DataSet<Edge>(
      validEdges.map((e) => ({
        from: e.source,
        to: e.target,
        value: e.weight,
        color: { color: 'rgba(122, 90, 0, 0.55)', highlight: '#ffb300', hover: '#ffb300' },
        smooth: { enabled: true, type: 'continuous', roundness: 0.2 },
      })),
    );

    const network = new Network(
      container,
      { nodes: visNodes, edges: visEdges },
      {
        nodes: {
          shape: 'dot',
          scaling: { min: 8, max: 46 },
          borderWidth: 1.5,
          shadow: { enabled: true, color: 'rgba(255,179,0,0.35)', size: 14, x: 0, y: 0 },
        },
        edges: {
          scaling: { min: 0.6, max: 5 },
          smooth: { enabled: true, type: 'continuous', roundness: 0.2 },
        },
        interaction: { hover: true, tooltipDelay: 0, dragView: true, zoomView: true },
        physics: {
          solver: 'forceAtlas2Based',
          forceAtlas2Based: {
            gravitationalConstant: -70,
            centralGravity: 0.012,
            springLength: 140,
            springConstant: 0.18,
            damping: 0.55,
            avoidOverlap: 0.6,
          },
          stabilization: { iterations: 250, fit: true },
          minVelocity: 0.75,
          maxVelocity: 30,
          adaptiveTimestep: true,
        },
      },
    );

    network.on('hoverNode', (params) => {
      const node = nodeById.get(params.node);
      if (node) setHover({ label: node.label, count: node.count, tabcoins: node.tabcoins });
    });
    network.on('blurNode', () => setHover(null));
    network.on('dragStart', (params) => {
      if (params.nodes.length) {
        const node = nodeById.get(params.nodes[0]);
        if (node) setHover({ label: node.label, count: node.count, tabcoins: node.tabcoins });
      }
    });

    return () => {
      network.destroy();
    };
  }, [nodes, edges]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />

      <div className="pointer-events-none absolute bottom-4 left-4 min-w-[220px] rounded border border-amber-dim/40 bg-ink/80 px-4 py-3 font-mono text-xs backdrop-blur-sm">
        {hover ? (
          <div className="rise-in">
            <div className="text-amber text-shadow-glow text-sm font-semibold">{hover.label}</div>
            <div className="text-paper-dim mt-1">{hover.count} posts</div>
            <div className="text-paper-dim">{hover.tabcoins} tabcoins</div>
          </div>
        ) : (
          <div className="text-paper-dim">passe o mouse ou arraste um nó</div>
        )}
      </div>
    </div>
  );
}
