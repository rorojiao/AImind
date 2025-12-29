import type { AIProvider, AIMessage } from '../../types';

// AI提供者类型定义
export type AIProviderType = AIProvider['type'];

// 获取默认端点
export function getDefaultBaseURL(type: AIProviderType): string {
  switch (type) {
    case 'openai':
      return 'https://api.openai.com/v1';
    case 'deepseek':
      return 'https://api.deepseek.com/v1';
    case 'anthropic':
      return 'https://api.anthropic.com/v1';
    case 'ollama':
      return 'http://localhost:11434/v1';
    case 'custom':
      return '';
    default:
      return '';
  }
}

// 获取默认模型
export function getDefaultModel(type: AIProviderType): string {
  switch (type) {
    case 'openai':
      return 'gpt-4o-mini';
    case 'deepseek':
      return 'deepseek-chat';
    case 'anthropic':
      return 'claude-3-5-sonnet-20241022';
    case 'ollama':
      return 'llama3.2';
    case 'custom':
      return '';
    default:
      return '';
  }
}

// 构建API请求头
export function buildHeaders(provider: AIProvider): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (provider.type === 'anthropic') {
    headers['x-api-key'] = provider.apiKey || '';
    headers['anthropic-version'] = '2023-06-01';
  } else {
    headers['Authorization'] = `Bearer ${provider.apiKey || ''}`;
  }

  return headers;
}

// 构建API请求体
export function buildRequestBody(
  provider: AIProvider,
  messages: AIMessage[]
): Record<string, any> {
  const baseBody = {
    model: provider.model,
    temperature: provider.temperature ?? 0.7,
    max_tokens: provider.maxTokens ?? 2000,
  };

  if (provider.type === 'anthropic') {
    // Anthropic使用不同的格式
    return {
      ...baseBody,
      messages: messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({
          role: m.role,
          content: m.content,
        })),
      system: messages.find((m) => m.role === 'system')?.content || '',
    };
  }

  return {
    ...baseBody,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  };
}

// 解析API响应
export function parseResponse(provider: AIProvider, response: any): string {
  if (provider.type === 'anthropic') {
    return response.content[0]?.text || '';
  }
  return response.choices?.[0]?.message?.content || '';
}

// 检查API密钥格式
export function validateAPIKey(type: AIProviderType, key: string): boolean {
  if (!key) return false;

  switch (type) {
    case 'openai':
      return key.startsWith('sk-');
    case 'deepseek':
      return key.startsWith('sk-');
    case 'anthropic':
      return key.startsWith('sk-ant-');
    case 'ollama':
      return true; // Ollama不需要API密钥
    case 'custom':
      return key.length > 0;
    default:
      return false;
  }
}

// 获取提供者显示名称
export function getProviderDisplayName(type: AIProviderType): string {
  const names: Record<AIProviderType, string> = {
    openai: 'OpenAI',
    deepseek: 'DeepSeek',
    anthropic: 'Anthropic',
    ollama: 'Ollama (本地)',
    custom: '自定义',
  };
  return names[type];
}

// 获取提供者图标
export function getProviderIcon(type: AIProviderType): string {
  switch (type) {
    case 'openai':
      return '🤖';
    case 'deepseek':
      return '🧠';
    case 'anthropic':
      return '✨';
    case 'ollama':
      return '🦙';
    case 'custom':
      return '⚙️';
    default:
      return '🔌';
  }
}
