import React from 'react';
import { useMindMapStore } from '../../stores/mindmapStore';
import type { NodeBoundary } from '../../types';
import { getNodeDimensions } from '../../lib/mindmap/nodeUtils';

interface BoundaryRendererProps {
  mindmapId: string;
}

export const BoundaryRenderer: React.FC<BoundaryRendererProps> = () => {
  const { mindmap } = useMindMapStore();

  if (!mindmap || !mindmap.boundaries || mindmap.boundaries.length === 0) {
    return null;
  }

  // 获取节点在树中的位置和尺寸
  const getNodeBounds = (nodeId: string): { x: number; y: number; width: number; height: number } | null => {
    const findNode = (node: import('../../types').MindMapNode): import('../../types').MindMapNode | null => {
      if (node.id === nodeId) return node;
      for (const child of node.children) {
        const found = findNode(child);
        if (found) return found;
      }
      return null;
    };

    const node = findNode(mindmap.root);
    if (!node) return null;

    const { width, height } = getNodeDimensions(node, mindmap.root);
    return {
      x: node.position.x,
      y: node.position.y,
      width,
      height,
    };
  };

  // 计算边界的边界框
  const calculateBoundaryBounds = (boundary: NodeBoundary): { x: number; y: number; width: number; height: number } | null => {
    const bounds = boundary.scope
      .map((nodeId) => getNodeBounds(nodeId))
      .filter((b) => b !== null) as Array<{ x: number; y: number; width: number; height: number }>;

    if (bounds.length === 0) return null;

    const padding = 10;
    const minX = Math.min(...bounds.map((b) => b.x)) - padding;
    const minY = Math.min(...bounds.map((b) => b.y)) - padding;
    const maxX = Math.max(...bounds.map((b) => b.x + b.width)) + padding;
    const maxY = Math.max(...bounds.map((b) => b.y + b.height)) + padding;

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  };

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 5 }}
    >
      {mindmap.boundaries.map((boundary) => {
        const bounds = calculateBoundaryBounds(boundary);
        if (!bounds) return null;

        const borderRadius = boundary.shape === 'rounded' ? 12 : 4;

        return (
          <g key={boundary.id}>
            {/* 边界背景 */}
            <rect
              x={bounds.x}
              y={bounds.y}
              width={bounds.width}
              height={bounds.height}
              fill={`${boundary.color}15`}
              stroke={boundary.color}
              strokeWidth={2}
              rx={borderRadius}
              ry={borderRadius}
              opacity={0.6}
            />

            {/* 边界标签 */}
            {boundary.label && (
              <text
                x={bounds.x + 10}
                y={bounds.y - 5}
                fill={boundary.color}
                fontSize={12}
                fontWeight={500}
                fontFamily="Microsoft YaHei, sans-serif"
              >
                {boundary.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};
