/**
 * 网络搜索服务
 * 支持多种搜索源：免费API、付费API、自建服务
 */

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface SearchOptions {
  maxResults?: number;
  timeout?: number;
}

/**
 * 搜索源类型
 */
export type SearchSourceType = 'duckduckgo' | 'serpapi' | 'google' | 'bing' | 'custom';

/**
 * 搜索源配置
 */
export interface SearchSourceConfig {
  type: SearchSourceType;
  name: string;
  enabled: boolean;
  apiKey?: string;
  baseUrl?: string;
}

/**
 * DuckDuckGo 搜索（免费，无需 API key）
 * 使用 DuckDuckGo Instant Answer API
 */
async function searchDuckDuckGo(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
  const maxResults = options.maxResults || 10;

  try {
    // 使用 DuckDuckGo 的 HTML 版本进行解析
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`DuckDuckGo search failed: ${response.status}`);
    }

    const html = await response.text();

    // 简单解析 HTML 提取搜索结果
    const results: SearchResult[] = [];
    const resultRegex = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>.*?<a[^>]*class="result__snippet"[^>]*>([^<]*)<\/a>/gs;

    let match;
    let count = 0;
    while ((match = resultRegex.exec(html)) !== null && count < maxResults) {
      results.push({
        url: match[1].replace(/&amp;/g, '&'),
        title: match[2].replace(/&amp;/g, '&'),
        snippet: match[3]?.replace(/&amp;/g, '&').replace(/<[^>]*>/g, '') || '',
      });
      count++;
    }

    return results;
  } catch (error) {
    console.error('DuckDuckGo search error:', error);
    return [];
  }
}

/**
 * SerpAPI 搜索（需要 API key，支持 Google、Bing 等）
 */
async function searchSerpAPI(query: string, config: SearchSourceConfig, options: SearchOptions = {}): Promise<SearchResult[]> {
  if (!config.apiKey) {
    throw new Error('SerpAPI requires an API key');
  }

  const maxResults = options.maxResults || 10;
  const engine = config.baseUrl?.includes('bing') ? 'bing' : 'google';

  const url = `https://serpapi.com/search?engine=${engine}&q=${encodeURIComponent(query)}&api_key=${config.apiKey}&num=${maxResults}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`SerpAPI failed: ${response.status}`);
    }

    const data = await response.json();

    return (data.organic_results || []).map((item: any) => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet || '',
    }));
  } catch (error) {
    console.error('SerpAPI search error:', error);
    return [];
  }
}

/**
 * 自定义搜索 API
 */
async function searchCustom(query: string, config: SearchSourceConfig, options: SearchOptions = {}): Promise<SearchResult[]> {
  if (!config.baseUrl) {
    throw new Error('Custom search requires a base URL');
  }

  const maxResults = options.maxResults || 10;
  let url = `${config.baseUrl}?q=${encodeURIComponent(query)}&maxResults=${maxResults}`;

  if (config.apiKey) {
    url += `&apiKey=${config.apiKey}`;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Custom search failed: ${response.status}`);
    }

    const data = await response.json();

    // 假设返回格式为 { results: [{ title, url, snippet }] }
    return (data.results || []).map((item: any) => ({
      title: item.title,
      url: item.url,
      snippet: item.snippet || item.description || '',
    }));
  } catch (error) {
    console.error('Custom search error:', error);
    return [];
  }
}

/**
 * 主搜索函数
 */
export async function webSearch(
  query: string,
  config: SearchSourceConfig = { type: 'duckduckgo', name: 'DuckDuckGo', enabled: true },
  options: SearchOptions = {}
): Promise<string[]> {
  console.log(`[WebSearch] 搜索: "${query}" 使用 ${config.name}`);

  let results: SearchResult[] = [];

  try {
    switch (config.type) {
      case 'duckduckgo':
        results = await searchDuckDuckGo(query, options);
        break;
      case 'serpapi':
        results = await searchSerpAPI(query, config, options);
        break;
      case 'custom':
        results = await searchCustom(query, config, options);
        break;
      default:
        console.warn(`[WebSearch] 不支持的搜索类型: ${config.type}`);
        return [];
    }

    if (results.length === 0) {
      console.warn(`[WebSearch] 未找到结果: "${query}"`);
      return [];
    }

    console.log(`[WebSearch] 找到 ${results.length} 条结果`);

    // 转换为字符串数组格式（与现有系统兼容）
    return results.map((r) => {
      // 格式: "标题: 描述" 或仅 "标题"
      const snippet = r.snippet ? ` - ${r.snippet}` : '';
      return `${r.title}${snippet}`;
    });
  } catch (error) {
    console.error(`[WebSearch] 搜索失败:`, error);
    return [];
  }
}

/**
 * 创建全局搜索函数（用于注入到 globalThis）
 */
export function createGlobalWebSearchFunction(config?: SearchSourceConfig) {
  return async (query: string): Promise<string[]> => {
    const searchConfig = config || { type: 'duckduckgo', name: 'DuckDuckGo', enabled: true };
    return webSearch(query, searchConfig, { maxResults: 20 });
  };
}

/**
 * 初始化全局搜索
 * 在应用启动时调用，注入 performWebSearch 到 globalThis
 */
export function initGlobalWebSearch(config?: SearchSourceConfig) {
  if (typeof (globalThis as any).performWebSearch === 'function') {
    console.warn('[WebSearch] 全局搜索函数已存在，跳过初始化');
    return;
  }

  (globalThis as any).performWebSearch = createGlobalWebSearchFunction(config);
  console.log('[WebSearch] 全局搜索函数已初始化，使用搜索源:', config?.name || 'DuckDuckGo');
}
