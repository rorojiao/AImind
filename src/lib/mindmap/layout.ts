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

// 节点尺寸配置
export interface NodeSizeConfig {
  minWidth: number;
  maxWidth: number;
  maxHeight: number;
  lineHeight: number;
  paddingX: number;
  paddingY: number;
}

// 默认节点尺寸配置
export const defaultNodeSizeConfig: NodeSizeConfig = {
  minWidth: 120,
  maxWidth: 400,
  maxHeight: 600,
  lineHeight: 1.5,
  paddingX: 20,
  paddingY: 12,
};

// 根据节点层级获取尺寸配置
function getNodeSizeConfig(nodeType: string, nodeLevel: number = 0): NodeSizeConfig {
  const baseConfig = { ...defaultNodeSizeConfig };

  // 根节点
  if (nodeType === 'root') {
    return {
      ...baseConfig,
      minWidth: 160,
      maxWidth: 800,
      maxHeight: 800,
    };
  }

  // 一级子节点
  if (nodeLevel === 1) {
    return {
      ...baseConfig,
      maxWidth: 600,
      maxHeight: 600,
    };
  }

  // 其他节点
  return baseConfig;
}

// 计算节点在树中的层级
function getNodeLevel(node: MindMapNode, root: MindMapNode, currentLevel: number = 0): number {
  if (node.id === root.id) return 0;
  if (root.children.length === 0) return currentLevel;

  for (const child of root.children) {
    if (child.id === node.id) return currentLevel + 1;
    const level = getNodeLevel(node, child, currentLevel + 1);
    if (level > 0) return level;
  }

  return currentLevel;
}

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

// 存储节点尺寸缓存，避免重复计算
const nodeSizeCache = new Map<string, { width: number; height: number; lines: string[] }>();

/**
 * 将文本分割成多行（基于最大宽度）
 */
function wrapText(text: string, fontSize: number, maxWidth: number, paddingX: number): string[] {
  const lines: string[] = [];
  const maxWidthWithoutPadding = maxWidth - paddingX * 2;

  // 如果文本为空，返回一行
  if (!text || text.trim() === '') {
    return [''];
  }

  // 按段落分割（保留换行符）
  const paragraphs = text.split('\n');

  for (const paragraph of paragraphs) {
    if (paragraph === '') {
      lines.push('');
      continue;
    }

    let currentLine = '';

    for (let i = 0; i < paragraph.length; i++) {
      // 测试添加这个字符后的宽度
      const testLine = currentLine + paragraph[i];
      const testWidth = calculateTextWidth(testLine, fontSize);

      if (testWidth > maxWidthWithoutPadding && currentLine !== '') {
        // 当前行已满，推入并开始新行
        lines.push(currentLine);
        currentLine = paragraph[i];
      } else {
        currentLine = testLine;
      }
    }

    // 推入最后一行
    if (currentLine !== '') {
      lines.push(currentLine);
    }
  }

  // 如果没有行，至少返回一个空行
  return lines.length > 0 ? lines : [''];
}

/**
 * 计算文本宽度（支持中英文混排）
 */
function calculateTextWidth(text: string, fontSize: number): number {
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const otherChars = text.length - chineseChars;
  return chineseChars * fontSize * 0.7 + otherChars * fontSize * 0.4;
}

/**
 * 计算节点的尺寸（支持多行文本和最大宽度限制）
 * @param node 节点对象
 * @param root 根节点（用于计算层级）
 * @returns { width, height, lines } 节点宽高和分行文本
 */
export function getNodeDimensions(
  node: MindMapNode,
  root?: MindMapNode
): { width: number; height: number; lines: string[] } {
  // 检查缓存
  const cacheKey = `${node.id}_${node.content}_${node.style.fontSize}`;
  if (nodeSizeCache.has(cacheKey)) {
    return nodeSizeCache.get(cacheKey)!;
  }

  const fontSize = node.style.fontSize;
  const nodeLevel = root ? getNodeLevel(node, root) : 0;
  const sizeConfig = getNodeSizeConfig(node.type, nodeLevel);

  // 分割文本为多行
  const lines = wrapText(node.content, fontSize, sizeConfig.maxWidth, sizeConfig.paddingX);

  // 计算宽度：取最大行宽，但限制在 min 和 max 之间
  let maxLineWidth = 0;
  for (const line of lines) {
    const lineWidth = calculateTextWidth(line, fontSize);
    maxLineWidth = Math.max(maxLineWidth, lineWidth);
  }

  const contentWidth = maxLineWidth + sizeConfig.paddingX * 2;
  const width = Math.max(sizeConfig.minWidth, Math.min(contentWidth, sizeConfig.maxWidth));

  // 计算高度：基于行数
  const lineHeight = fontSize * sizeConfig.lineHeight;
  const contentHeight = lines.length * lineHeight;
  const height = Math.min(
    Math.max(50, contentHeight + sizeConfig.paddingY * 2),
    sizeConfig.maxHeight
  );

  const result = { width, height, lines };
  nodeSizeCache.set(cacheKey, result);
  return result;
}

/**
 * 计算节点的宽度（向后兼容函数）
 * @deprecated 使用 getNodeDimensions 替代
 */
export function getNodeWidth(node: MindMapNode): number {
  return getNodeDimensions(node).width;
}

/**
 * 计算节点的高度（向后兼容函数）
 * @deprecated 使用 getNodeDimensions 替代
 */
export function getNodeHeight(node: MindMapNode): number {
  return getNodeDimensions(node).height;
}

/**
 * 清除节点尺寸缓存（在节点更新后调用）
 */
export function clearNodeSizeCache(nodeId?: string): void {
  if (nodeId) {
    // 清除特定节点的缓存
    for (const [key] of nodeSizeCache) {
      if (key.startsWith(nodeId + '_')) {
        nodeSizeCache.delete(key);
      }
    }
  } else {
    // 清除所有缓存
    nodeSizeCache.clear();
  }
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
