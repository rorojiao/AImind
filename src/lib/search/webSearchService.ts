/**
 * 网络搜索服务
 * 使用智谱AI Web Search API（支持真实网络搜索）
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
export type SearchSourceType = 'zhipu' | 'duckduckgo' | 'custom';

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
 * 智谱AI Web Search API
 * 使用官方API进行真实网络搜索（正确的调用格式）
 */
async function searchZhipuAI(query: string, apiKey: string, options: SearchOptions = {}): Promise<SearchResult[]> {
  const maxResults = options.maxResults || 10;

  try {
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'glm-4-flash',
        messages: [
          {
            role: 'user',
            content: query,
          },
        ],
        tools: [
          {
            type: 'web_search',
            web_search: {
              enable: true,
              search_result: true,
              search_query: query,
              count: maxResults,
            },
          },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ZhipuAI] API error:', response.status, errorText);
      throw new Error(`ZhipuAI API failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // 解析搜索结果
    const results: SearchResult[] = [];

    // 检查响应中的tool_calls
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const message = data.choices[0].message;

      // 如果有tool_calls，提取搜索结果
      if (message.tool_calls) {
        for (const toolCall of message.tool_calls) {
          if (toolCall.type === 'web_search' && toolCall.web_search && toolCall.web_search.results) {
            const searchResults = toolCall.web_search.results;
            for (const item of searchResults) {
              results.push({
                title: item.title || '',
                url: item.media_url || item.url || '',
                snippet: item.content || item.description || '',
              });
            }
          }
        }
      }

      // 如果web_search直接在message中
      else if (message.web_search && message.web_search.results) {
        const searchResults = message.web_search.results;
        for (const item of searchResults) {
          results.push({
            title: item.title || '',
            url: item.media_url || item.url || '',
            snippet: item.content || item.description || '',
          });
        }
      }
    }

    console.log(`[ZhipuAI] 找到 ${results.length} 条结果`);
    return results;
  } catch (error) {
    console.error('[ZhipuAI] search error:', error);
    throw error;
  }
}

/**
 * DuckDuckGo 搜索（备用方案）
 */
async function searchDuckDuckGo(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
  const maxResults = options.maxResults || 10;

  try {
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
    console.error('[DuckDuckGo] search error:', error);
    return [];
  }
}

/**
 * 主搜索函数
 */
export async function webSearch(
  query: string,
  config: SearchSourceConfig = { type: 'zhipu', name: '智谱AI', enabled: true, apiKey: '' },
  options: SearchOptions = {}
): Promise<string[]> {
  console.log(`[WebSearch] 搜索: "${query}" 使用 ${config.name}`);

  let results: SearchResult[] = [];

  try {
    switch (config.type) {
      case 'zhipu':
        if (!config.apiKey) {
          throw new Error('智谱AI搜索需要 API key');
        }
        results = await searchZhipuAI(query, config.apiKey, options);
        break;

      case 'duckduckgo':
        results = await searchDuckDuckGo(query, options);
        break;

      default:
        console.warn(`[WebSearch] 不支持的搜索类型: ${config.type}`);
        return [];
    }

    if (results.length === 0) {
      console.warn(`[WebSearch] 未找到结果: "${query}"`);
      return [];
    }

    // 转换为字符串数组格式（与现有系统兼容）
    return results.map((r) => {
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
    const searchConfig = config || { type: 'zhipu', name: '智谱AI', enabled: true, apiKey: '' };
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
  console.log('[WebSearch] 全局搜索函数已初始化，使用搜索源:', config?.name || '智谱AI');
}
