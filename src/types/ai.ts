// AI消息类型
export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  provider?: string;
}

// AI提供者配置
export interface AIProvider {
  id: string;
  name: string;
  type: 'openai' | 'deepseek' | 'anthropic' | 'ollama' | 'custom';
  apiKey?: string;
  baseURL?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  enabled: boolean;
}

// AI配置
export interface AIConfig {
  providers: AIProvider[];
  currentProvider: string;
}

// AI Agent配置
export interface AIAgentConfig {
  mode: 'guided' | 'auto' | 'interactive';
  depth: number;
  breadth: number;
  domainHint?: string;
  style: 'creative' | 'analytical' | 'structured';
  forceSearch: boolean; // 强制搜索最新信息
}

// AI响应
export interface AIResponse {
  content: string;
  nodes?: Array<{
    content: string;
    parentId?: string;
  }>;
  suggestions?: string[];
  analysis?: AIAnalysis;
}

// AI分析结果
export interface AIAnalysis {
  completeness: number;
  depth: number;
  suggestions: string[];
  areasToImprove?: string[];
}

// Agent分析结果
export interface AgentAnalysis {
  analysis: string;
  branches: string[];
  suggestedDepth: number;
  domain: string;
}

// 引导拆分建议
export interface ExpandSuggestion {
  needExpand: boolean;
  reason: string;
  suggestions: string[];
  priority: 'high' | 'medium' | 'low';
}
