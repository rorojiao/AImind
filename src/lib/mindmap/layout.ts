import type { MindMapNode } from '../../types';

// 布局方向
export type LayoutDirection = 'horizontal' | 'vertical' | 'free';

// 自动布局配置
export interface LayoutConfig {
  direction: LayoutDirection;
  nodeSpacing: { x: number; y: number };
  levelSpacing: number;
}

// 默认布局配置
export const defaultLayoutConfig: LayoutConfig = {
  direction: 'horizontal',
  nodeSpacing: { x: 150, y: 80 },
  levelSpacing: 200,
};

// 计算节点布局
export function calculateLayout(root: MindMapNode, config: LayoutConfig = defaultLayoutConfig): void {
  if (config.direction === 'free') return;

  // 重置所有节点位置
  const positions = new Map<string, { x: number; y: number }>();

  if (config.direction === 'horizontal') {
    calculateHorizontalLayout(root, 0, 0, positions, config);
  } else {
    calculateVerticalLayout(root, 0, 0, positions, config);
  }

  // 应用计算的位置
  applyPositions(root, positions);
}

// 水平布局计算
function calculateHorizontalLayout(
  node: MindMapNode,
  x: number,
  y: number,
  positions: Map<string, { x: number; y: number }>,
  config: LayoutConfig
): { height: number } {
  positions.set(node.id, { x, y });

  if (node.children.length === 0 || node.collapsed) {
    return { height: config.nodeSpacing.y };
  }

  let currentY = y;
  const childX = x + config.levelSpacing;

  // 先计算所有子节点
  const childHeights: number[] = [];
  node.children.forEach((child) => {
    const result = calculateHorizontalLayout(child, childX, currentY, positions, config);
    childHeights.push(result.height);
    currentY += result.height;
  });

  // 计算子节点总高度
  const totalHeight = childHeights.reduce((sum, h) => sum + h, 0);

  // 调整父节点位置到子节点中心
  const parentPos = positions.get(node.id)!;
  parentPos.y = y + totalHeight / 2 - config.nodeSpacing.y / 2;

  // 重新调整子节点位置使其居中
  let childStartY = parentPos.y - totalHeight / 2;
  node.children.forEach((child, i) => {
    const childPos = positions.get(child.id)!;
    childPos.y = childStartY;
    childStartY += childHeights[i];
  });

  return { height: totalHeight };
}

// 垂直布局计算
function calculateVerticalLayout(
  node: MindMapNode,
  x: number,
  y: number,
  positions: Map<string, { x: number; y: number }>,
  config: LayoutConfig
): { width: number } {
  positions.set(node.id, { x, y });

  if (node.children.length === 0 || node.collapsed) {
    return { width: config.nodeSpacing.x };
  }

  let currentX = x;
  const childY = y + config.levelSpacing;

  // 先计算所有子节点
  const childWidths: number[] = [];
  node.children.forEach((child) => {
    const result = calculateVerticalLayout(child, currentX, childY, positions, config);
    childWidths.push(result.width);
    currentX += result.width;
  });

  // 计算子节点总宽度
  const totalWidth = childWidths.reduce((sum, w) => sum + w, 0);

  // 调整父节点位置到子节点中心
  const parentPos = positions.get(node.id)!;
  parentPos.x = x + totalWidth / 2 - config.nodeSpacing.x / 2;

  // 重新调整子节点位置使其居中
  let childStartX = parentPos.x - totalWidth / 2;
  node.children.forEach((child, i) => {
    const childPos = positions.get(child.id)!;
    childPos.x = childStartX;
    childStartX += childWidths[i];
  });

  return { width: totalWidth };
}

// 应用位置到节点
function applyPositions(node: MindMapNode, positions: Map<string, { x: number; y: number }>): void {
  const pos = positions.get(node.id);
  if (pos) {
    node.position = pos;
  }
  node.children.forEach((child) => applyPositions(child, positions));
}

// 获取节点边界
export function getNodeBounds(node: MindMapNode): { x: number; y: number; width: number; height: number } {
  return {
    x: node.position.x,
    y: node.position.y,
    width: getNodeWidth(node),
    height: getNodeHeight(node),
  };
}

// 获取节点宽度
function getNodeWidth(node: MindMapNode): number {
  const baseWidth = node.content.length * node.style.fontSize * 0.6 + 40;
  return Math.max(120, Math.min(300, baseWidth));
}

// 获取节点高度
function getNodeHeight(node: MindMapNode): number {
  return node.style.fontSize * 2 + 20;
}

// 计算所有节点的边界
export function getMindmapBounds(root: MindMapNode): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} {
  const bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };

  const traverse = (node: MindMapNode) => {
    const nodeBounds = getNodeBounds(node);
    bounds.minX = Math.min(bounds.minX, nodeBounds.x);
    bounds.minY = Math.min(bounds.minY, nodeBounds.y);
    bounds.maxX = Math.max(bounds.maxX, nodeBounds.x + nodeBounds.width);
    bounds.maxY = Math.max(bounds.maxY, nodeBounds.y + nodeBounds.height);
    node.children.forEach(traverse);
  };

  traverse(root);

  return {
    ...bounds,
    width: bounds.maxX - bounds.minX,
    height: bounds.maxY - bounds.minY,
  };
}
