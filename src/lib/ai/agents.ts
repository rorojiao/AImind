import type { MindMapData, MindMapNode, AIAgentConfig } from '../../types';
import { getTreeDepth, getNodeCount } from '../utils';

// Agent模式核心逻辑
export class AIAgent {
  private config: AIAgentConfig;
  private mindmapData: MindMapData;

  constructor(data: MindMapData, config: AIAgentConfig) {
    this.mindmapData = data;
    this.config = config;
  }

  // 分析思维导图
  analyzeMindmap(): {
    completeness: number;
    depth: number;
    nodeCount: number;
    suggestions: string[];
    areasToImprove: string[];
  } {
    const depth = getTreeDepth(this.mindmapData.root);
    const nodeCount = getNodeCount(this.mindmapData.root);
    const targetDepth = this.config.depth;
    const targetNodes = this.estimateTargetNodes(targetDepth);

    // 计算完整度
    const completeness = Math.min(100, Math.round((nodeCount / targetNodes) * 100));

    // 生成建议
    const suggestions = this.generateSuggestions(depth, nodeCount);
    const areasToImprove = this.identifyAreasToImprove();

    return {
      completeness,
      depth,
      nodeCount,
      suggestions,
      areasToImprove,
    };
  }

  // 查找需要扩展的节点
  findNodesToExpand(): Array<{ node: MindMapNode; priority: number }> {
    const nodes: Array<{ node: MindMapNode; priority: number }> = [];

    const traverse = (node: MindMapNode, currentDepth: number) => {
      const shouldExpand = this.shouldExpandNode(node, currentDepth);

      if (shouldExpand.expand) {
        nodes.push({ node, priority: shouldExpand.priority });
      }

      if (currentDepth < this.config.depth) {
        node.children.forEach((child) => traverse(child, currentDepth + 1));
      }
    };

    traverse(this.mindmapData.root, 0);
    return nodes.sort((a, b) => b.priority - a.priority);
  }

  // 检查节点是否需要扩展
  private shouldExpandNode(
    node: MindMapNode,
    currentDepth: number
  ): { expand: boolean; priority: number } {
    // const nodeDepth = getTreeDepth(node);

    // 根节点总是需要扩展
    if (node.type === 'root' && node.children.length === 0) {
      return { expand: true, priority: 100 };
    }

    // 超过最大深度
    if (currentDepth >= this.config.depth) {
      return { expand: false, priority: 0 };
    }

    // 叶子节点需要扩展
    if (node.children.length === 0 && currentDepth < this.config.depth - 1) {
      return { expand: true, priority: 80 - currentDepth * 10 };
    }

    // 子节点太少
    if (node.children.length < 3 && currentDepth < this.config.depth - 1) {
      return { expand: true, priority: 60 - currentDepth * 10 };
    }

    return { expand: false, priority: 0 };
  }

  // 生成改进建议
  private generateSuggestions(depth: number, nodeCount: number): string[] {
    const suggestions: string[] = [];

    if (this.mindmapData.root.children.length === 0) {
      suggestions.push('思维导图还是空的，从创建主要分支开始吧！');
      return suggestions;
    }

    if (depth < this.config.depth) {
      suggestions.push(`当前深度为${depth}，建议扩展到${this.config.depth}层`);
    }

    const targetCount = this.estimateTargetNodes(this.config.depth);
    if (nodeCount < targetCount * 0.5) {
      suggestions.push('思维导图内容较少，可以继续扩展更多分支');
    }

    if (this.mindmapData.aiContext?.domain) {
      suggestions.push(`当前领域：${this.mindmapData.aiContext.domain}，可以围绕此领域深入展开`);
    }

    return suggestions;
  }

  // 识别需要改进的区域
  private identifyAreasToImprove(): string[] {
    const areas: string[] = [];
    const leafNodes = this.findLeafNodes(this.mindmapData.root);

    // 查找深度不足的分支
    leafNodes.forEach((node) => {
      const path = this.getNodePath(node.id);
      if (path.length < this.config.depth) {
        areas.push(`"${node.content}" 分支可以继续扩展`);
      }
    });

    return areas.slice(0, 5);
  }

  // 查找所有叶子节点
  private findLeafNodes(node: MindMapNode): MindMapNode[] {
    if (node.children.length === 0) {
      return [node];
    }
    return node.children.flatMap((child) => this.findLeafNodes(child));
  }

  // 获取节点路径
  private getNodePath(nodeId: string): string[] {
    const path: string[] = [];

    const findPath = (node: MindMapNode, targetId: string, currentPath: string[]): boolean => {
      currentPath.push(node.content);

      if (node.id === targetId) {
        path.push(...currentPath);
        return true;
      }

      for (const child of node.children) {
        if (findPath(child, targetId, [...currentPath])) {
          return true;
        }
      }

      return false;
    };

    findPath(this.mindmapData.root, nodeId, []);
    return path;
  }

  // 估算目标节点数
  private estimateTargetNodes(depth: number): number {
    const breadth = this.config.breadth;
    // 简单估算：1 + breadth + breadth^2 + ... + breadth^depth
    return Array.from({ length: depth + 1 }, (_, i) => Math.pow(breadth, i)).reduce((a, b) => a + b, 0);
  }
}

// 创建初始思维导图
export function createInitialMindmap(title: string): MindMapData {
  const now = Date.now();

  return {
    id: generateId(),
    title,
    root: {
      id: generateId(),
      content: title,
      type: 'root',
      position: { x: 0, y: 0 },
      style: {
        backgroundColor: '#3b82f6',
        borderColor: '#1d4ed8',
        borderWidth: 2,
        textColor: '#ffffff',
        fontSize: 18,
        fontWeight: 600,
        fontFamily: 'Microsoft YaHei, sans-serif',
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'center',
        shape: 'rounded',
      },
      children: [],
      collapsed: false,
      metadata: {
        created: now,
        modified: now,
        aiGenerated: false,
      },
    },
    layout: 'horizontal',
    theme: 'ai-blue',
    created: now,
    modified: now,
  };
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
