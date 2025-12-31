import type { MindMapNode } from '../../types';
import { getNodeWidth, getNodeHeight, getNodeDimensions, clearNodeSizeCache } from './layout';

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

// 重新导出节点尺寸计算函数
export { getNodeWidth, getNodeHeight, getNodeDimensions, clearNodeSizeCache };
