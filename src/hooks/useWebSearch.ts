import { useState } from 'react';
import { useAIStore } from '../stores/aiStore';
import { searchMultiple, getFallbackResults } from '../lib/ai/searchEngine';

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
 * 检查真实网络搜索是否可用
 */
function hasRealWebSearch(): boolean {
  return typeof (globalThis as any).performWebSearch === 'function';
}

/**
 * 网络搜索Hook（使用真实搜索引擎或知识库fallback）
 */
export function useWebSearch() {
  const [isSearching, setIsSearching] = useState(false);
  const { addSearchLog, updateSearchLog } = useAIStore();

  /**
   * 执行智能搜索（增强版 - 利用完整上下文）
   * 总是尝试搜索，使用真实搜索或fallback到知识库
   */
  const search = async (
    nodeContent: string,
    context: SearchContext
  ): Promise<string | null> => {
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

    // 检查真实搜索是否可用
    const hasRealSearch = hasRealWebSearch();
    const searchType = hasRealSearch ? '网络搜索' : '知识库搜索';

    // 添加搜索开始日志
    const logId = `search-${Date.now()}`;
    addSearchLog({
      query: searchQuery,
      status: 'searching',
      message: `正在${searchType}...`,
    });

    try {
      // 尝试使用真实搜索（如果可用）
      let realResults: string[] = [];
      let usedRealSearch = false;

      if (hasRealSearch) {
        console.log(`[搜索] 使用真实网络搜索: ${searchQuery}`);
        realResults = await searchMultiple(searchQuery);
        usedRealSearch = realResults.length > 0;
      } else {
        console.warn(`[搜索] 真实网络搜索不可用，使用知识库: ${searchQuery}`);
      }

      // 如果真实搜索没有结果，使用fallback
      const finalResults = realResults.length > 0 ? realResults : getFallbackResults(searchQuery, 20);

      if (finalResults.length === 0) {
        updateSearchLog(logId, {
          status: 'skipped',
          message: '未找到结果',
        });
        return null;
      }

      // 构建结果描述（区分真实搜索和知识库）
      const resultSource = usedRealSearch ? '网络搜索' : '知识库';
      const resultMessage = usedRealSearch
        ? `从网络找到 ${finalResults.length} 条结果`
        : `从知识库找到 ${finalResults.length} 条结果（网络搜索不可用）`;

      // 更新搜索成功日志
      updateSearchLog(logId, {
        status: 'success',
        resultCount: finalResults.length,
        message: resultMessage,
        results: finalResults,
        source: usedRealSearch ? 'web' : 'knowledge', // 标记来源
      });

      // 格式化搜索结果为AI可用的上下文（增强版 - 包含来源信息）
      let contextText = `## 搜索参考\n\n`;

      // 添加搜索来源信息
      contextText += `**数据来源**：${resultSource}\n`;
      contextText += `**当前位置**：${context.fullNodePath.join(' → ')}\n`;
      contextText += `**搜索查询**：${searchQuery}\n\n`;

      // 添加兄弟节点信息（如果有）
      if (context.siblings && context.siblings.length > 0) {
        contextText += `**相关节点（已覆盖）**：${context.siblings.join('、')}\n`;
        contextText += `请生成与已有节点不重复的内容。\n\n`;
      }

      contextText += `**搜索结果**（${resultMessage}）：\n\n`;

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
