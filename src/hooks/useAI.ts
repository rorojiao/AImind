import { useAIStore } from '../stores/aiStore';
import {
  getInitialAnalysisPrompt,
  getBranchExpandPrompt,
  getSmartExpandPrompt,
  getOverallAnalysisPrompt,
} from '../lib/ai/prompts';
import { extractJSON, parseNodeArray, parseAgentAnalysis, parseOverallAnalysis } from '../lib/ai/formatters';
import type { AIMessage } from '../types';

// AI调用Hook
export function useAI() {
  const { currentProvider, setLoading, setError, addMessage, messages } = useAIStore();

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

  // 智能扩展节点
  const expandNode = async (content: string): Promise<string[]> => {
    const prompt = getSmartExpandPrompt(content);
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
    isLoading: useAIStore((s) => s.isLoading),
    error: useAIStore((s) => s.error),
    messages,
    currentProvider,

    callAI,
    expandNode,
    analyzeInitial,
    expandBranch,
    analyzeMindmap,
    chat,
  };
}
