import React, { useRef, useEffect, useState } from 'react';
import { useMindMapStore } from '../../stores/mindmapStore';
import { useConfigStore } from '../../stores/configStore';
import { MindMapNode } from './MindMapNode';
import { getMindmapBounds } from '../../lib/mindmap/layout';
import {
  getNodeRightEdge,
  getNodeCenterY,
} from '../../lib/mindmap/nodeUtils';

export const MindMapCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const { mindmap, selectNode } = useMindMapStore();
  const { ui } = useConfigStore();

  // 处理画布拖拽
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
      selectNode(null);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setOffset({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  // 处理滚轮缩放
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      useConfigStore.getState().setZoom(ui.zoom + delta);
    }
  };

  if (!mindmap) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <p className="text-lg mb-2">还没有思维导图</p>
          <p className="text-sm">点击"新建"创建一个吧</p>
        </div>
      </div>
    );
  }

  // 计算画布边界
  const bounds = getMindmapBounds(mindmap.root);
  const centerX = (canvasRef.current?.clientWidth || 0) / 2;
  const centerY = (canvasRef.current?.clientHeight || 0) / 2;

  return (
    <div
      ref={canvasRef}
      className="absolute inset-0 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950"
      onMouseDown={handleMouseDown}
      onWheel={handleWheel}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {/* 画布内容 */}
      <div
        data-mindmap-container
        className="absolute"
        style={{
          transform: `translate(${offset.x + centerX}px, ${offset.y + centerY}px) scale(${ui.zoom})`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.1s ease-out',
        }}
      >
        {/* 连接线 */}
        <svg
          className="absolute pointer-events-none"
          style={{
            left: bounds.minX - 100,
            top: bounds.minY - 100,
            width: bounds.width + 200,
            height: bounds.height + 200,
          }}
        >
          {renderEdges(mindmap.root, bounds.minX - 100, bounds.minY - 100)}
        </svg>

        {/* 节点 */}
        {renderNodes(mindmap.root)}
      </div>
    </div>
  );
};

// 渲染节点
function renderNodes(node: import('../../types').MindMapNode): React.ReactNode {
  if (node.collapsed && node.children.length > 0) {
    return <MindMapNode key={node.id} node={node} />;
  }

  return (
    <>
      <MindMapNode key={node.id} node={node} />
      {node.children.map((child) => (
        <React.Fragment key={child.id}>
          {renderNodes(child)}
        </React.Fragment>
      ))}
    </>
  );
}

// 渲染连接线
function renderEdges(
  node: import('../../types').MindMapNode,
  svgOffsetX: number,
  svgOffsetY: number
): React.ReactNode {
  const edges: React.ReactNode[] = [];

  const renderEdge = (child: import('../../types').MindMapNode) => {
    // 使用工具函数计算连接点（相对于容器）
    const startX = getNodeRightEdge(node);  // 父节点右边缘
    const startY = getNodeCenterY(node);    // 父节点垂直中心
    const endX = child.position.x;          // 子节点左边缘
    const endY = getNodeCenterY(child);     // 子节点垂直中心

    // 转换为 SVG 内部坐标（减去 SVG 偏移）
    const svgStartX = startX - svgOffsetX;
    const svgStartY = startY - svgOffsetY;
    const svgEndX = endX - svgOffsetX;
    const svgEndY = endY - svgOffsetY;

    // 贝塞尔曲线控制点
    const midX = (svgStartX + svgEndX) / 2;

    return (
      <path
        key={`${node.id}-${child.id}`}
        d={`M ${svgStartX} ${svgStartY} C ${midX} ${svgStartY}, ${midX} ${svgEndY}, ${svgEndX} ${svgEndY}`}
        fill="none"
        stroke="#9ca3af"
        strokeWidth="2"
        className="dark:stroke-gray-600"
      />
    );
  };

  if (!node.collapsed) {
    node.children.forEach((child) => {
      edges.push(renderEdge(child));
      edges.push(...(renderEdges(child, svgOffsetX, svgOffsetY) as React.ReactNode[]));
    });
  }

  return edges;
}
