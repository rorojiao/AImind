import { useState } from 'react';
import { useAIStore } from '../stores/aiStore';
import { searchMultiple, getFallbackResults, shouldSearchOnline } from '../lib/ai/searchEngine';

/**
 * 网络搜索Hook（使用真实搜索引擎）
 */
export function useWebSearch() {
  const [isSearching, setIsSearching] = useState(false);
  const { addSearchLog, updateSearchLog } = useAIStore();

  /**
   * 执行智能搜索
   */
  const search = async (
    nodeContent: string,
    context: {
      parentContent: string | null;
      rootTopic: string;
      depth: number;
    }
  ): Promise<string | null> => {
    // 判断是否是新闻列表类内容（这类内容让AI直接生成）
    const isNewsList =
      nodeContent.includes('条') &&
      (nodeContent.includes('新闻') ||
        nodeContent.includes('资讯') ||
        nodeContent.includes('最新') ||
        nodeContent.includes('今日') ||
        nodeContent.includes('今天'));

    if (isNewsList) {
      addSearchLog({
        query: nodeContent,
        status: 'skipped',
        message: '新闻列表 - AI将基于知识生成',
      });
      return null;
    }

    // 使用改进的搜索判断逻辑
    if (!shouldSearchOnline(nodeContent, context.depth)) {
      return null;
    }

    setIsSearching(true);

    // 生成搜索查询
    const searchQuery = context.parentContent
      ? `${context.parentContent} ${nodeContent}`
      : `${context.rootTopic} ${nodeContent}`;

    // 添加搜索开始日志
    const logId = `search-${Date.now()}`;
    addSearchLog({
      query: searchQuery,
      status: 'searching',
      message: '正在搜索...',
    });

    try {
      // 使用真实搜索
      const results = await searchMultiple(searchQuery);

      // 如果没有搜索结果，尝试使用fallback结果
      const finalResults = results.length > 0 ? results : getFallbackResults(searchQuery);

      if (finalResults.length === 0) {
        updateSearchLog(logId, {
          status: 'skipped',
          message: '未找到结果 - AI将使用本地知识',
        });
        return null;
      }

      // 更新搜索成功日志
      updateSearchLog(logId, {
        status: 'success',
        resultCount: finalResults.length,
        message: `找到 ${finalResults.length} 条结果`,
      });

      // 格式化搜索结果为AI可用的上下文
      let contextText = `## 网络搜索参考（查询："${searchQuery}"）\n\n`;
      contextText += `以下是搜索到的相关信息，请参考这些内容生成更准确的子节点：\n\n`;

      finalResults.forEach((result, index) => {
        contextText += `${index + 1}. ${result}\n`;
      });

      contextText += `\n请基于以上搜索结果，生成相关的子节点。`;

      return contextText;
    } catch (error) {
      updateSearchLog(logId, {
        status: 'skipped',
        message: '搜索服务暂不可用',
      });
      return null;
    } finally {
      setIsSearching(false);
    }
  };

  return {
    isSearching,
    search,
  };
}
