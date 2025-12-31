import React from 'react';
import { useMindMapStore } from '../../stores/mindmapStore';
import type { NodeRelationship } from '../../types';
import { getNodeDimensions } from '../../lib/mindmap/nodeUtils';

interface RelationshipRendererProps {
  mindmapId: string;
}

export const RelationshipRenderer: React.FC<RelationshipRendererProps> = () => {
  const { mindmap } = useMindMapStore();

  if (!mindmap || !mindmap.relationships || mindmap.relationships.length === 0) {
    return null;
  }

  // 获取节点中心点
  const getNodeCenter = (nodeId: string): { x: number; y: number } | null => {
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
      x: node.position.x + width / 2,
      y: node.position.y + height / 2,
    };
  };

  // 计算箭头标记
  const getMarkerUrl = (id: string, _color: string, position: 'start' | 'end') => {
    return `url(#arrow-${position}-${id})`;
  };

  // 生成线型样式
  const getStrokeDasharray = (type: NodeRelationship['type']) => {
    switch (type) {
      case 'solid':
        return 'none';
      case 'dashed':
        return '8,4';
      case 'dotted':
        return '2,2';
      default:
        return 'none';
    }
  };

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 4 }}>
      <defs>
        {mindmap.relationships.map((relationship) => (
          <React.Fragment key={relationship.id}>
            {/* 起点箭头 */}
            {relationship.arrow === 'start' || relationship.arrow === 'both' ? (
              <marker
                id={`arrow-start-${relationship.id}`}
                markerWidth="10"
                markerHeight="10"
                refX="5"
                refY="5"
                orient="auto"
              >
                <path
                  d="M6,2 L2,5 L6,8"
                  fill="none"
                  stroke={relationship.color}
                  strokeWidth="2"
                />
              </marker>
            ) : null}

            {/* 终点箭头 */}
            {relationship.arrow === 'end' || relationship.arrow === 'both' ? (
              <marker
                id={`arrow-end-${relationship.id}`}
                markerWidth="10"
                markerHeight="10"
                refX="5"
                refY="5"
                orient="auto"
              >
                <path
                  d="M2,2 L6,5 L2,8"
                  fill="none"
                  stroke={relationship.color}
                  strokeWidth="2"
                />
              </marker>
            ) : null}
          </React.Fragment>
        ))}
      </defs>

      {mindmap.relationships.map((relationship) => {
        const from = getNodeCenter(relationship.fromNodeId);
        const to = getNodeCenter(relationship.toNodeId);

        if (!from || !to) return null;

        // 计算线的路径（简单的贝塞尔曲线）
        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2;
        const controlX = from.x < to.x ? midX : midX;

        const pathD = `M ${from.x} ${from.y} Q ${controlX} ${midY + 50} ${to.x} ${to.y}`;

        return (
          <g key={relationship.id}>
            {/* 关系线 */}
            <path
              d={pathD}
              stroke={relationship.color}
              strokeWidth={2}
              strokeDasharray={getStrokeDasharray(relationship.type)}
              fill="none"
              markerStart={
                relationship.arrow === 'start' || relationship.arrow === 'both'
                  ? getMarkerUrl(relationship.id, relationship.color, 'start')
                  : undefined
              }
              markerEnd={
                relationship.arrow === 'end' || relationship.arrow === 'both'
                  ? getMarkerUrl(relationship.id, relationship.color, 'end')
                  : undefined
              }
              opacity={0.7}
            />

            {/* 关系标签 */}
            {relationship.label && (
              <text
                x={midX}
                y={midY + 50}
                fill={relationship.color}
                fontSize={11}
                fontWeight={500}
                fontFamily="Microsoft YaHei, sans-serif"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {relationship.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};
