import { useState } from 'react';
import { useAIStore } from '../stores/aiStore';
import { searchMultiple, getFallbackResults, shouldSearchOnline } from '../lib/ai/searchEngine';

/**
 * 扩展的搜索上下文接口
 */
export interface SearchContext {
  nodeContent: string; // 当前节点内容
  fullNodePath: string[]; // 从根到当前节点的完整路径
  parentContent: string | null; // 父节点内容
  rootTopic: string; // 根主题
  depth: number; // 当前深度
  siblings?: string[]; // 兄弟节点内容
  nodeStructure?: {
    // 节点结构信息
    totalNodes: number; // 总节点数
    maxDepth: number; // 最大深度
    branchCount: number; // 分支数量
  };
}

/**
 * 网络搜索Hook（使用真实搜索引擎）
 */
export function useWebSearch() {
  const [isSearching, setIsSearching] = useState(false);
  const { addSearchLog, updateSearchLog } = useAIStore();

  /**
   * 执行智能搜索（增强版 - 利用完整上下文）
   */
  const search = async (
    nodeContent: string,
    context: SearchContext
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

    // 生成增强的搜索查询 - 利用完整路径和上下文
    let searchQuery = '';

    if (context.fullNodePath && context.fullNodePath.length > 0) {
      // 使用完整路径生成更准确的搜索查询
      // 例如：根主题 -> 一级分类 -> 二级分类 -> 当前节点
      // 搜索查询会是："根主题 一级分类 二级分类 当前节点"
      searchQuery = context.fullNodePath.join(' ');
    } else if (context.parentContent) {
      searchQuery = `${context.parentContent} ${nodeContent}`;
    } else {
      searchQuery = `${context.rootTopic} ${nodeContent}`;
    }

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
      const finalResults = results.length > 0 ? results : getFallbackResults(searchQuery, 20);

      if (finalResults.length === 0) {
        updateSearchLog(logId, {
          status: 'skipped',
          message: '未找到结果 - AI将使用本地知识',
        });
        return null;
      }

      // 更新搜索成功日志，包含详细结果
      updateSearchLog(logId, {
        status: 'success',
        resultCount: finalResults.length,
        message: `找到 ${finalResults.length} 条结果`,
        results: finalResults, // 保存详细结果
      });

      // 格式化搜索结果为AI可用的上下文（增强版 - 包含完整上下文信息）
      let contextText = `## 网络搜索参考\n\n`;

      // 添加节点位置信息
      contextText += `**当前位置**：${context.fullNodePath.join(' → ')}\n`;
      contextText += `**搜索查询**：${searchQuery}\n\n`;

      // 添加兄弟节点信息（如果有）
      if (context.siblings && context.siblings.length > 0) {
        contextText += `**相关节点（已覆盖）**：${context.siblings.join('、')}\n`;
        contextText += `请生成与已有节点不重复的内容。\n\n`;
      }

      contextText += `**搜索结果**（找到 ${finalResults.length} 条相关信息）：\n\n`;

      finalResults.forEach((result, index) => {
        contextText += `${index + 1}. ${result}\n`;
      });

      contextText += `\n请基于以上搜索结果和节点上下文，生成相关的子节点。`;

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
