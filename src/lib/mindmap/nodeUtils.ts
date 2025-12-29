import type { MindMapNode } from '../../types';

/**
 * 计算节点的宽度
 * 基于内容长度和字体大小，最小120px，最大300px
 */
export function getNodeWidth(node: MindMapNode): number {
  const baseWidth = node.content.length * node.style.fontSize * 0.6 + 40;
  return Math.max(120, Math.min(300, baseWidth));
}

/**
 * 计算节点的高度
 * 基于字体大小
 */
export function getNodeHeight(node: MindMapNode): number {
  return node.style.fontSize * 2 + 20;
}

/**
 * 获取节点的右边缘X坐标
 */
export function getNodeRightEdge(node: MindMapNode): number {
  return node.position.x + getNodeWidth(node);
}

/**
 * 获取节点的左边缘X坐标
 */
export function getNodeLeftEdge(node: MindMapNode): number {
  return node.position.x;
}

/**
 * 获取节点的垂直中心Y坐标
 */
export function getNodeCenterY(node: MindMapNode): number {
  return node.position.y + getNodeHeight(node) / 2;
}

/**
 * 获取节点的中心点坐标
 */
export function getNodeCenter(node: MindMapNode): { x: number; y: number } {
  return {
    x: node.position.x + getNodeWidth(node) / 2,
    y: node.position.y + getNodeHeight(node) / 2,
  };
}
