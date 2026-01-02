import { useAIStore } from '../stores/aiStore';
import {
  getInitialAnalysisPrompt,
  getBranchExpandPrompt,
  getOverallAnalysisPrompt,
  getContextAwareExpandPrompt,
} from '../lib/ai/prompts';
import { extractJSON, parseNodeArray, parseAgentAnalysis, parseOverallAnalysis } from '../lib/ai/formatters';
import type { AIMessage, MindMapNode } from '../types';
import { useWebSearch, type SearchContext } from './useWebSearch';

// 辅助函数：获取节点路径和深度
function getNodePath(node: MindMapNode, targetId: string, currentPath: string[] = []): string[] | null {
  if (node.id === targetId) {
    return [...currentPath, node.content];
  }
  for (const child of node.children) {
    const result = getNodePath(child, targetId, [...currentPath, node.content]);
    if (result) return result;
  }
  return null;
}

function getNodeDepth(node: MindMapNode, targetId: string, currentDepth: number = 0): number | null {
  if (node.id === targetId) {
    return currentDepth;
  }
  for (const child of node.children) {
    const result = getNodeDepth(child, targetId, currentDepth + 1);
    if (result !== null) return result;
  }
  return null;
}

function findNodeById(node: MindMapNode, targetId: string): MindMapNode | null {
  if (node.id === targetId) return node;
  for (const child of node.children) {
    const result = findNodeById(child, targetId);
    if (result) return result;
  }
  return null;
}

/**
 * 获取节点的兄弟节点内容
 */
function getSiblings(node: MindMapNode, parent: MindMapNode | null): string[] {
  if (!parent || parent.children.length <= 1) {
    return [];
  }
  return parent.children
    .filter(child => child.id !== node.id)
    .map(child => child.content);
}

/**
 * 获取父节点
 */
function getParentNode(root: MindMapNode, targetId: string, parent: MindMapNode | null = null): MindMapNode | null {
  if (root.id === targetId) {
    return parent;
  }
  for (const child of root.children) {
    const result = getParentNode(child, targetId, root);
    if (result !== null) return result;
  }
  return null;
}

/**
 * 获取思维导图的结构信息
 */
function getMindmapStructure(root: MindMapNode): { totalNodes: number; maxDepth: number; branchCount: number } {
  let totalNodes = 0;
  let maxDepth = 0;

  const traverse = (node: MindMapNode, depth: number) => {
    totalNodes++;
    maxDepth = Math.max(maxDepth, depth);
    for (const child of node.children) {
      traverse(child, depth + 1);
    }
  };

  traverse(root, 0);
  return {
    totalNodes,
    maxDepth,
    branchCount: root.children.length,
  };
}

// AI调用Hook
export function useAI() {
  const { currentProvider, setLoading, setError, addMessage, messages, agentConfig } = useAIStore();
  const { search, isSearching: isWebSearching } = useWebSearch();

  // 调用AI API
  const callAI = async (prompt: string, systemPrompt?: string): Promise<string> => {
    if (!currentProvider) {
      throw new Error('请先配置AI服务');
    }

    // ollama和custom类型允许不配置API密钥(本地服务)
    if (!currentProvider.apiKey && currentProvider.type !== 'ollama' && currentProvider.type !== 'custom') {
      throw new Error('请先配置API密钥');
    }

    setLoading(true);
    setError(null);

    try {
      // 构建消息
      const apiMessages: AIMessage[] = [];
      if (systemPrompt) {
        apiMessages.push({
          role: 'system',
          content: systemPrompt,
          timestamp: Date.now(),
        });
      }
      apiMessages.push({
        role: 'user',
        content: prompt,
        timestamp: Date.now(),
      });

      // 调用API
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // 只在有API密钥时才添加Authorization
      if (currentProvider.apiKey) {
        headers['Authorization'] = `Bearer ${currentProvider.apiKey}`;
        if (currentProvider.type === 'anthropic') {
          headers['x-api-key'] = currentProvider.apiKey;
          headers['anthropic-version'] = '2023-06-01';
        }
      }

      const response = await fetch(`${currentProvider.baseURL}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: currentProvider.model,
          messages: apiMessages.map((m) => ({ role: m.role, content: m.content })),
          temperature: currentProvider.temperature ?? 0.7,
          max_tokens: currentProvider.maxTokens ?? 2000,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`AI API错误: ${error}`);
      }

      const data = await response.json();

      // 解析响应
      let content = '';
      if (currentProvider.type === 'anthropic') {
        content = data.content?.[0]?.text || '';
      } else {
        content = data.choices?.[0]?.message?.content || '';
      }

      // 添加到历史
      addMessage({
        role: 'assistant',
        content,
        timestamp: Date.now(),
        provider: currentProvider.id,
      });

      return content;
    } catch (err) {
      const error = err instanceof Error ? err.message : '未知错误';
      setError(error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 智能扩展节点（上下文感知版本 + 搜索增强 - 完整版）
  const expandNode = async (
    content: string,
    context?: {
      root: MindMapNode;
      nodeId: string;
    }
  ): Promise<string[]> => {
    // 如果提供了上下文，使用上下文感知提示词
    if (context) {
      const { root, nodeId } = context;

      const path = getNodePath(root, nodeId);
      const depth = getNodeDepth(root, nodeId);
      const node = findNodeById(root, nodeId);

      if (!path || depth === null || !node) {
        // 降级：直接返回内容分割
        return [content];
      }

      // 获取父节点内容
      const parentContent = path.length > 2 ? path[path.length - 2] : null;
      const parent = parentContent ? getParentNode(root, nodeId) : null;

      // 获取兄弟节点
      const siblings = getSiblings(node, parent);

      // 获取思维导图结构信息
      const structure = getMindmapStructure(root);

      // 智能搜索 - 仅在forceSearch开启时进行（传递完整上下文）
      let searchContext: string | undefined = undefined;
      if (agentConfig.forceSearch) {
        try {
          const searchResult = await search(content, {
            nodeContent: content,
            fullNodePath: path,
            parentContent,
            rootTopic: root.content,
            depth,
            siblings,
            nodeStructure: structure,
          } as SearchContext);
          if (searchResult) {
            searchContext = searchResult;
          }
        } catch (error) {
          // 搜索失败不影响主流程，静默处理
          console.debug('搜索跳过或失败:', error);
        }
      }

      // 获取已有子节点
      const existingChildren = node.children.map((c) => c.content);

      // 使用上下文感知提示词（包含完整上下文和搜索结果）
      const prompt = getContextAwareExpandPrompt({
        rootTopic: root.content,
        nodePath: path,
        currentContent: content,
        existingChildren: existingChildren.length > 0 ? existingChildren : undefined,
        depth,
        siblingCount: siblings.length,
        siblings, // 传递兄弟节点
        nodeStructure: structure, // 传递结构信息
        searchContext, // 传入搜索结果
      });

      const response = await callAI(prompt);

      // 尝试解析JSON
      const jsonStr = extractJSON(response);
      if (jsonStr) {
        const parsed = parseNodeArray(jsonStr);
        if (parsed) return parsed;
      }

      // 如果解析失败，返回原始内容按行分割
      return response.split('\n').filter((line) => line.trim());
    }

    // 没有上下文时的简化提示词
    const prompt = `你是一个思维导图助手。请为节点"${content}"生成4-6个有价值的子节点。
要求：
1. 简洁明了，每个子节点不超过10个字
2. 逻辑清晰，覆盖主要方面
3. 用JSON数组格式返回：["子节点1", "子节点2", ...]`;

    const response = await callAI(prompt);

    // 尝试解析JSON
    const jsonStr = extractJSON(response);
    if (jsonStr) {
      const parsed = parseNodeArray(jsonStr);
      if (parsed) return parsed;
    }

    // 如果解析失败，返回原始内容按行分割
    return response.split('\n').filter((line) => line.trim());
  };

  // Agent初始分析
  const analyzeInitial = async (topic: string) => {
    const prompt = getInitialAnalysisPrompt(topic);
    const response = await callAI(prompt);

    const jsonStr = extractJSON(response);
    if (jsonStr) {
      const parsed = parseAgentAnalysis(jsonStr);
      if (parsed) return parsed;
    }

    return null;
  };

  // 分支扩展
  const expandBranch = async (content: string, path: string, domain: string): Promise<string[]> => {
    const prompt = getBranchExpandPrompt(content, path, domain);
    const response = await callAI(prompt);

    const jsonStr = extractJSON(response);
    if (jsonStr) {
      const parsed = parseNodeArray(jsonStr);
      if (parsed) return parsed;
    }

    return response.split('\n').filter((line) => line.trim());
  };

  // 整体分析
  const analyzeMindmap = async (
    rootTopic: string,
    totalNodes: number,
    maxDepth: number,
    mainBranches: string[]
  ) => {
    const prompt = getOverallAnalysisPrompt(rootTopic, totalNodes, maxDepth, mainBranches);
    const response = await callAI(prompt);

    const jsonStr = extractJSON(response);
    if (jsonStr) {
      const parsed = parseOverallAnalysis(jsonStr);
      if (parsed) return parsed;
    }

    return null;
  };

  // 普通聊天
  const chat = async (userMessage: string, context?: string): Promise<string> => {
    const systemPrompt = context
      ? `你是一个思维导图AI助手。当前上下文：${context}`
      : '你是一个思维导图AI助手。';

    addMessage({
      role: 'user',
      content: userMessage,
      timestamp: Date.now(),
    });

    return callAI(userMessage, systemPrompt);
  };

  return {
    isLoading: useAIStore((s) => s.isLoading) || isWebSearching,
    error: useAIStore((s) => s.error),
    messages,
    currentProvider,
    isWebSearching,

    callAI,
    expandNode,
    analyzeInitial,
    expandBranch,
    analyzeMindmap,
    chat,
  };
}
