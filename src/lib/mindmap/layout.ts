import type { MindMapNode } from '../../types';

export type LayoutDirection = 'horizontal' | 'vertical' | 'free';

export interface LayoutConfig {
  direction: LayoutDirection;
  nodeSpacing: { x: number; y: number };
  levelSpacing: number;
}

export const defaultLayoutConfig: LayoutConfig = {
  direction: 'horizontal',
  nodeSpacing: { x: 40, y: 50 },
  levelSpacing: 200,
};

// 子树尺寸信息
interface SubtreeSize {
  width: number;
  height: number;
}

export function calculateLayout(root: MindMapNode, config: LayoutConfig = defaultLayoutConfig): void {
  if (config.direction === 'free') return;

  if (config.direction === 'horizontal') {
    // 第一步：后序遍历，计算每个子树的尺寸
    const subtreeSizes = new Map<string, SubtreeSize>();
    calcSubtreeSize(root, config, subtreeSizes);
    // 第二步：前序遍历，设置节点位置
    setNodePosition(root, 0, 0, config, subtreeSizes);
  } else {
    const subtreeSizes = new Map<string, SubtreeSize>();
    calcSubtreeSizeVertical(root, config, subtreeSizes);
    setNodePositionVertical(root, 0, 0, config, subtreeSizes);
  }
}

// ==================== 水平布局 ====================

// 计算子树尺寸（后序遍历）
function calcSubtreeSize(
  node: MindMapNode,
  config: LayoutConfig,
  sizes: Map<string, SubtreeSize>
): SubtreeSize {
  const nodeWidth = getNodeWidth(node);
  const nodeHeight = getNodeHeight(node);

  if (node.children.length === 0 || node.collapsed) {
    const size = { width: nodeWidth, height: nodeHeight };
    sizes.set(node.id, size);
    return size;
  }

  // 递归计算子节点尺寸
  const childSizes = node.children.map(child => calcSubtreeSize(child, config, sizes));

  // 子树总高度 = 所有子节点高度 + 间距
  const totalHeight = childSizes.reduce((sum, size) => sum + size.height, 0)
    + (childSizes.length - 1) * config.nodeSpacing.y;

  // 子树宽度 = 节点宽度 + 层级间距 + 最大子节点宽度
  const maxChildWidth = Math.max(...childSizes.map(s => s.width));

  const size: SubtreeSize = {
    width: nodeWidth + config.levelSpacing + maxChildWidth,
    height: Math.max(nodeHeight, totalHeight)
  };

  sizes.set(node.id, size);
  return size;
}

// 设置节点位置（前序遍历）
function setNodePosition(
  node: MindMapNode,
  x: number,
  y: number,
  config: LayoutConfig,
  sizes: Map<string, SubtreeSize>
): void {
  const subtreeSize = sizes.get(node.id)!;

  // 设置当前节点位置
  node.position = { x, y };

  if (node.children.length === 0 || node.collapsed) return;

  // 计算子节点的起始Y位置（使子节点区域相对于父节点居中）
  const childSizes = node.children.map(child => sizes.get(child.id)!);
  const totalChildHeight = childSizes.reduce((sum, s) => sum + s.height, 0)
    + (childSizes.length - 1) * config.nodeSpacing.y;

  // 子节点区域起点 = 当前节点Y + (子树高度 - 子节点区域高度) / 2
  const childStartY = y + (subtreeSize.height - totalChildHeight) / 2;

  // 设置子节点位置
  const childX = x + getNodeWidth(node) + config.levelSpacing;
  let currentY = childStartY;

  node.children.forEach((child) => {
    const childSize = sizes.get(child.id)!;
    // 子节点在其空间内垂直居中
    const centeredY = currentY + (childSize.height - getNodeHeight(child)) / 2;
    child.position = { x: childX, y: centeredY };
    // 递归设置子节点的子节点
    setNodePosition(child, childX, centeredY, config, sizes);
    currentY += childSize.height + config.nodeSpacing.y;
  });
}

// ==================== 垂直布局 ====================

function calcSubtreeSizeVertical(
  node: MindMapNode,
  config: LayoutConfig,
  sizes: Map<string, SubtreeSize>
): SubtreeSize {
  const nodeWidth = getNodeWidth(node);
  const nodeHeight = getNodeHeight(node);

  if (node.children.length === 0 || node.collapsed) {
    const size = { width: nodeWidth, height: nodeHeight };
    sizes.set(node.id, size);
    return size;
  }

  const childSizes = node.children.map(child => calcSubtreeSizeVertical(child, config, sizes));

  const totalWidth = childSizes.reduce((sum, size) => sum + size.width, 0)
    + (childSizes.length - 1) * config.nodeSpacing.x;

  const maxChildHeight = Math.max(...childSizes.map(s => s.height));

  const size: SubtreeSize = {
    width: Math.max(nodeWidth, totalWidth),
    height: nodeHeight + config.levelSpacing + maxChildHeight
  };

  sizes.set(node.id, size);
  return size;
}

function setNodePositionVertical(
  node: MindMapNode,
  x: number,
  y: number,
  config: LayoutConfig,
  sizes: Map<string, SubtreeSize>
): void {
  const subtreeSize = sizes.get(node.id)!;

  node.position = { x, y };

  if (node.children.length === 0 || node.collapsed) return;

  const childSizes = node.children.map(child => sizes.get(child.id)!);
  const totalChildWidth = childSizes.reduce((sum, s) => sum + s.width, 0)
    + (childSizes.length - 1) * config.nodeSpacing.x;

  const childStartX = x + (subtreeSize.width - totalChildWidth) / 2;

  const childY = y + getNodeHeight(node) + config.levelSpacing;
  let currentX = childStartX;

  node.children.forEach((child) => {
    const childSize = sizes.get(child.id)!;
    const centeredX = currentX + (childSize.width - getNodeWidth(child)) / 2;
    child.position = { x: centeredX, y: childY };
    setNodePositionVertical(child, centeredX, childY, config, sizes);
    currentX += childSize.width + config.nodeSpacing.x;
  });
}

// ==================== 工具函数 ====================

/**
 * 计算节点的宽度（支持中英文混排）
 * 中文字符宽度 = fontSize * 0.7
 * 英文字符宽度 = fontSize * 0.4
 * 最小宽度 120px
 */
export function getNodeWidth(node: MindMapNode): number {
  const chineseChars = (node.content.match(/[\u4e00-\u9fa5]/g) || []).length;
  const otherChars = node.content.length - chineseChars;
  const textWidth = chineseChars * node.style.fontSize * 0.7 + otherChars * node.style.fontSize * 0.4;
  const padding = 40;
  return Math.max(120, textWidth + padding);
}

/**
 * 计算节点的高度
 * 基于字体大小和行高
 * 最小高度 50px
 */
export function getNodeHeight(node: MindMapNode): number {
  const fontSize = node.style.fontSize;
  const lineHeight = fontSize * 1.5;
  const padding = 24;
  return Math.max(50, lineHeight + padding);
}

export function getNodeBounds(node: MindMapNode): { x: number; y: number; width: number; height: number } {
  return {
    x: node.position.x,
    y: node.position.y,
    width: getNodeWidth(node),
    height: getNodeHeight(node),
  };
}

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
