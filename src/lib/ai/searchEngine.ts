// 网络搜索引擎

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface SearchContext {
  query: string;
  results: SearchResult[];
  timestamp: number;
}

/**
 * 智能判断是否需要搜索
 * 基于以下因素：
 * 1. 时效性关键词
 * 2. 技术术语
 * 3. 数据/统计类内容
 * 4. 具体领域知识
 */
export function shouldSearchOnline(nodeContent: string, depth: number): boolean {
  // 如果深度太深，通常不需要搜索
  if (depth > 2) return false;

  // 时效性关键词 - 需要最新信息
  const timeSensitiveKeywords = [
    '最新', '2024', '2025', '2026', '趋势', '动态', '新闻',
    '价格', '费用', '成本', '行情', '汇率',
    '发布', '推出', '上线', '更新', '升级',
    '政策', '法规', '标准', '规范',
  ];

  // 技术术语 - 需要准确信息
  const technicalKeywords = [
    'API', '框架', '库', '工具', '平台', '技术',
    '算法', '模型', '架构', '设计模式',
    '数据库', '服务器', '部署', '配置',
  ];

  // 数据统计类 - 需要具体数据
  const dataKeywords = [
    '数据', '统计', '报告', '研究', '调查',
    '数量', '比例', '率', '指标',
  ];

  const combinedKeywords = [
    ...timeSensitiveKeywords,
    ...technicalKeywords,
    ...dataKeywords,
  ];

  // 检查是否包含关键词
  const hasKeyword = combinedKeywords.some((keyword) =>
    nodeContent.toLowerCase().includes(keyword.toLowerCase())
  );

  if (hasKeyword) return true;

  // 检查是否是问句形式
  if (nodeContent.includes('？') || nodeContent.includes('?')) {
    return true;
  }

  // 检查是否是具体的专有名词（大写字母较多）
  const uppercaseRatio = (nodeContent.match(/[A-Z]/g) || []).length / nodeContent.length;
  if (uppercaseRatio > 0.3) {
    return true;
  }

  return false;
}

/**
 * 生成搜索查询
 * 基于节点内容和上下文生成优化的搜索词
 */
export function generateSearchQuery(
  nodeContent: string,
  parentContent: string | null,
  _rootTopic: string
): string {
  // 如果是根节点，直接搜索主题
  if (!parentContent) {
    return `${nodeContent} 指南 方法`;
  }

  // 组合父节点和当前节点生成查询
  // 例如：父"项目管理" + 当前"风险管理" → "项目管理 风险管理 方法"
  const query = `${parentContent} ${nodeContent}`;

  // 根据内容类型添加后缀
  const suffixes = ['方法', '指南', '技巧', '实践', '步骤'];
  const relevantSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];

  return `${query} ${relevantSuffix}`;
}

/**
 * 检测语言类型
 */
export function detectLanguage(content: string): 'zh' | 'en' | 'mixed' {
  const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
  const totalChars = content.length;

  if (chineseChars / totalChars > 0.3) {
    return 'zh';
  } else if (chineseChars === 0) {
    return 'en';
  } else {
    return 'mixed';
  }
}

/**
 * 执行多次搜索（预留接口）
 * TODO: 集成真实搜索API
 */
export async function searchMultiple(_query: string): Promise<string[]> {
  // 目前返回空数组，实际使用时可以集成搜索API
  // 例如：Bing Search API, Google Custom Search API
  // _query 参数用于实际的搜索查询
  return [];
}
