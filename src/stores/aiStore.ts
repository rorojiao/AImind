import { create } from 'zustand';
import type { AIConfig, AIProvider, AIAgentConfig, AIMessage } from '../types';
import { loadAIConfig, saveAIConfig } from '../lib/storage/localStorage';

// 搜索日志类型
export interface SearchLog {
  id: string;
  query: string;
  status: 'searching' | 'success' | 'failed' | 'skipped';
  resultCount?: number;
  message?: string;
  timestamp: number;
}

interface AIState {
  // 配置
  config: AIConfig;

  // 当前AI提供者
  currentProvider: AIProvider | null;

  // 聊天历史
  messages: AIMessage[];

  // Agent配置
  agentConfig: AIAgentConfig;

  // 搜索日志
  searchLogs: SearchLog[];

  // 加载状态
  isLoading: boolean;
  error: string | null;

  // 操作
  setConfig: (config: AIConfig) => void;
  setCurrentProvider: (id: string) => void;
  addProvider: (provider: AIProvider) => void;
  updateProvider: (id: string, updates: Partial<AIProvider>) => void;
  deleteProvider: (id: string) => void;

  // Agent配置
  setAgentConfig: (config: Partial<AIAgentConfig>) => void;

  // 聊天
  addMessage: (message: AIMessage) => void;
  clearMessages: () => void;

  // 搜索日志
  addSearchLog: (log: Omit<SearchLog, 'id' | 'timestamp'>) => void;
  updateSearchLog: (id: string, updates: Partial<SearchLog>) => void;
  clearSearchLogs: () => void;

  // 状态
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// 默认配置
const defaultConfig: AIConfig = {
  providers: [
    {
      id: 'openai-default',
      name: 'OpenAI',
      type: 'openai',
      apiKey: '',
      baseURL: 'https://api.openai.com/v1',
      model: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 2000,
      enabled: true,
    },
    {
      id: 'deepseek-default',
      name: 'DeepSeek',
      type: 'deepseek',
      apiKey: '',
      baseURL: 'https://api.deepseek.com/v1',
      model: 'deepseek-chat',
      temperature: 0.7,
      maxTokens: 2000,
      enabled: false,
    },
    {
      id: 'ollama-default',
      name: 'Ollama (本地)',
      type: 'ollama',
      apiKey: '',
      baseURL: 'http://localhost:11434/v1',
      model: 'llama3.2',
      temperature: 0.7,
      maxTokens: 2000,
      enabled: false,
    },
  ],
  currentProvider: 'openai-default',
};

// 默认Agent配置
const defaultAgentConfig: AIAgentConfig = {
  mode: 'guided',
  depth: 3,
  breadth: 4,
  style: 'structured',
};

// 从localStorage加载配置或使用默认配置
const loadInitialConfig = (): AIConfig => {
  const savedConfig = loadAIConfig();
  // 验证保存的配置是否有效
  if (savedConfig && savedConfig.providers && savedConfig.providers.length > 0) {
    return savedConfig;
  }
  return defaultConfig;
};

export const useAIStore = create<AIState>((set, get) => ({
  // 初始状态
  config: loadInitialConfig(),
  currentProvider: (() => {
    const config = loadInitialConfig();
    const provider = config.providers.find((p) => p.id === config.currentProvider);
    return provider || config.providers[0];
  })(),
  messages: [],
  agentConfig: defaultAgentConfig,
  searchLogs: [],
  isLoading: false,
  error: null,

  // 设置配置
  setConfig: (config: AIConfig) => {
    set({ config });
    saveAIConfig(config); // 持久化到localStorage
    // 更新当前提供者
    const provider = config.providers.find((p) => p.id === config.currentProvider);
    if (provider) {
      set({ currentProvider: provider });
    }
  },

  // 设置当前提供者
  setCurrentProvider: (id: string) => {
    const { config } = get();
    const provider = config.providers.find((p) => p.id === id);
    if (provider) {
      const newConfig = { ...config, currentProvider: id };
      set({
        currentProvider: provider,
        config: newConfig,
      });
      saveAIConfig(newConfig); // 持久化到localStorage
    }
  },

  // 添加提供者
  addProvider: (provider: AIProvider) => {
    const { config } = get();
    const newProviders = [...config.providers, provider];
    const newConfig = { ...config, providers: newProviders };
    set({
      config: newConfig,
    });
    saveAIConfig(newConfig); // 持久化到localStorage
  },

  // 更新提供者
  updateProvider: (id: string, updates: Partial<AIProvider>) => {
    const { config, currentProvider } = get();
    const newProviders = config.providers.map((p) =>
      p.id === id ? { ...p, ...updates } : p
    );
    const newConfig = { ...config, providers: newProviders };
    set({
      config: newConfig,
      currentProvider:
        currentProvider?.id === id
          ? { ...currentProvider, ...updates }
          : currentProvider,
    });
    saveAIConfig(newConfig); // 持久化到localStorage
  },

  // 删除提供者
  deleteProvider: (id: string) => {
    const { config } = get();
    const newProviders = config.providers.filter((p) => p.id !== id);
    let newCurrentProvider = config.currentProvider;

    // 如果删除的是当前提供者，切换到另一个
    if (id === config.currentProvider) {
      const nextProvider = newProviders[0];
      newCurrentProvider = nextProvider?.id || '';
      set({ currentProvider: nextProvider || null });
    }

    const newConfig = { ...config, providers: newProviders, currentProvider: newCurrentProvider };
    set({
      config: newConfig,
    });
    saveAIConfig(newConfig); // 持久化到localStorage
  },

  // 设置Agent配置
  setAgentConfig: (updates: Partial<AIAgentConfig>) => {
    set((state) => ({
      agentConfig: { ...state.agentConfig, ...updates },
    }));
  },

  // 添加消息
  addMessage: (message: AIMessage) => {
    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  // 清空消息
  clearMessages: () => {
    set({ messages: [] });
  },

  // 添加搜索日志
  addSearchLog: (log) => {
    const newLog: SearchLog = {
      ...log,
      id: `search-${Date.now()}`,
      timestamp: Date.now(),
    };
    set((state) => ({
      searchLogs: [newLog, ...state.searchLogs].slice(0, 10), // 只保留最近10条
    }));
  },

  // 更新搜索日志
  updateSearchLog: (id, updates) => {
    set((state) => ({
      searchLogs: state.searchLogs.map((log) =>
        log.id === id ? { ...log, ...updates } : log
      ),
    }));
  },

  // 清空搜索日志
  clearSearchLogs: () => {
    set({ searchLogs: [] });
  },

  // 设置加载状态
  setLoading: (isLoading: boolean) => {
    set({ isLoading });
  },

  // 设置错误
  setError: (error: string | null) => {
    set({ error });
  },
}));
