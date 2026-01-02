import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SearchSourceConfig } from '../lib/search/webSearchService';
import { loadWebSearchConfig, saveWebSearchConfig } from '../lib/storage/localStorage';
import { initGlobalWebSearch } from '../lib/search/webSearchService';

interface WebSearchState {
  // 搜索源配置
  searchSource: SearchSourceConfig;

  // 可用的搜索源列表
  availableSources: Array<{
    type: SearchSourceConfig['type'];
    name: string;
    description: string;
    requiresApiKey: boolean;
    helpUrl?: string;
  }>;

  // 操作
  setSearchSource: (source: SearchSourceConfig) => void;
  resetSearchSource: () => void;
}

// 默认搜索源配置
const defaultSearchSource: SearchSourceConfig = {
  type: 'zhipu',
  name: '智谱AI',
  enabled: true,
  apiKey: '8611232f6f8e42f19d29eb454f14b20f.8L7DTW3fIsLoivJF',
};

// 可用的搜索源列表
const availableSources = [
  {
    type: 'zhipu' as const,
    name: '智谱AI',
    description: '智谱AI Web Search API，真实网络搜索',
    requiresApiKey: true,
    helpUrl: 'https://open.bigmodel.cn/',
  },
  {
    type: 'duckduckgo' as const,
    name: 'DuckDuckGo',
    description: '免费搜索引擎，无需 API key，隐私保护',
    requiresApiKey: false,
    helpUrl: 'https://duckduckgo.com/',
  },
];

// 从 localStorage 加载配置或使用默认配置
const loadInitialConfig = (): SearchSourceConfig => {
  const savedConfig = loadWebSearchConfig();
  if (savedConfig) {
    return savedConfig;
  }
  return defaultSearchSource;
};

export const useWebSearchStore = create<WebSearchState>()(
  persist(
    (set) => ({
      // 初始状态
      searchSource: loadInitialConfig(),
      availableSources,

      // 设置搜索源
      setSearchSource: (source: SearchSourceConfig) => {
        set({ searchSource: source });
        saveWebSearchConfig(source);

        // 重新初始化全局搜索函数
        initGlobalWebSearch(source);
      },

      // 重置为默认搜索源
      resetSearchSource: () => {
        set({ searchSource: defaultSearchSource });
        saveWebSearchConfig(defaultSearchSource);

        // 重新初始化全局搜索函数
        initGlobalWebSearch(defaultSearchSource);
      },
    }),
    {
      name: 'web-search-storage',
    }
  )
);
