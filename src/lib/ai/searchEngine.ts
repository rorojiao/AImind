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
 * 5. 商业/赚钱/运营相关
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

  // 商业/运营/赚钱相关 - 需要最新信息
  const businessKeywords = [
    '赚钱', '变现', '营收', '收益', '利润',
    '矩阵', '起号', '运营', '流量', '获客',
    '推广', '营销', '变现', '变现方式', '商业模式',
    '玩法', '策略', '技巧', '方法', '实操',
    '海外', '跨境', '出海', '全球化',
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
    ...businessKeywords,
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
  const suffixes = ['方法', '指南', '技巧', '实践', '步骤', '教程', '案例分析'];
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
 * 执行网络搜索
 * 使用全局搜索函数（如果可用）
 */
export async function searchMultiple(query: string): Promise<string[]> {
  // 检查是否有全局搜索函数（由MCP或其他方式注入）
  const globalSearch = (globalThis as any).performWebSearch;

  if (!globalSearch || typeof globalSearch !== 'function') {
    console.warn('Web search function not available, using fallback');
    return [];
  }

  try {
    const results = await globalSearch(query);
    return results || [];
  } catch (error) {
    console.error('Search failed:', error);
    return [];
  }
}

/**
 * 模拟搜索结果（当真实搜索不可用时）
 * 这个函数提供一些常见主题的模拟结果
 */
export function getFallbackResults(query: string): string[] {
  const lowerQuery = query.toLowerCase();

  // 商业/赚钱相关
  if (lowerQuery.includes('赚钱') || lowerQuery.includes('变现') || lowerQuery.includes('矩阵')) {
    return [
      '内容创作变现：通过创作优质内容吸引粉丝，实现广告、带货、知识付费等多种变现方式',
      '短视频矩阵运营：批量运营多个账号，覆盖不同细分领域，提高曝光和变现效率',
      '直播带货：通过直播形式展示商品，实现实时销售转化',
      '私域流量运营：将公域流量引导至私域，建立长期用户关系，提高复购率',
      '知识付费：将专业知识包装成课程、电子书等产品进行销售',
      '跨境电商：通过海外平台销售商品，赚取差价',
      'AI辅助创作：利用AI工具提高内容生产效率，降低成本',
      '联盟营销：通过推广他人产品获得佣金',
      '品牌合作：与品牌方合作推广，获得赞助费用',
      '平台补贴：参与平台激励计划，获得流量和现金补贴',
    ];
  }

  // 海外/出海/起号相关
  if (lowerQuery.includes('海外') || lowerQuery.includes('跨境') || lowerQuery.includes('出海') || lowerQuery.includes('起号')) {
    return [
      'TikTok海外版：短视频平台，适合内容创作和带货',
      'Instagram：图片社交平台，适合品牌建设和产品展示',
      'YouTube：视频平台，可通过广告收入和赞助变现',
      '独立站：建立自己的电商网站，掌握用户数据',
      '本地化策略：根据目标市场文化特点调整内容和产品',
      '海外社交媒体营销：Facebook、Twitter等平台的运营技巧',
      '跨境支付：了解不同国家的支付习惯和渠道',
      '账号定位：明确目标受众和内容方向，打造差异化IP',
      '内容策略：0-1起号阶段，通过模仿、创新、测试找到爆款内容公式',
      '数据分析：关注完播率、互动率、转化率等核心指标，持续优化',
      '合规运营：了解各国平台规则，避免账号被封',
    ];
  }

  // 2025/最新/趋势相关
  if (lowerQuery.includes('2025') || lowerQuery.includes('最新') || lowerQuery.includes('趋势')) {
    return [
      'AI技术爆发：ChatGPT、Claude等大模型推动AI应用全面普及',
      '短视频商业化：抖音、快手等平台电商功能持续完善',
      '直播电商成熟：品牌自播成为标配，直播+短视频融合',
      '私域精细化：企业更重视私域流量运营和用户生命周期管理',
      '内容创作者经济：个人IP价值提升，创作者变现渠道多元化',
      '虚拟人/数字人：AI虚拟主播、数字人应用场景扩大',
      '跨境出海加速：中国企业加速全球化布局，海外市场成为新增长点',
      '元宇宙降温：相关投资和热度下降，更关注实际应用价值',
      '可持续发展：ESG理念深入企业运营和消费者选择',
    ];
  }

  // 运营/推广/流量相关
  if (lowerQuery.includes('运营') || lowerQuery.includes('推广') || lowerQuery.includes('流量') || lowerQuery.includes('获客')) {
    return [
      '内容运营：持续产出优质内容，提升用户粘性和传播',
      '活动运营：策划营销活动，提高用户参与度和转化',
      '用户运营：分层运营，精细化服务不同用户群体',
      '数据运营：通过数据分析指导决策，优化运营策略',
      'SEO优化：提升搜索引擎排名，获得自然流量',
      '付费推广：精准投放广告，快速获取目标用户',
      '社群运营：建立用户社群，促进用户互动和裂变',
      'KOL合作：与意见领袖合作，借助其影响力扩大品牌声量',
      '裂变营销：设计激励机制，让用户自发传播',
    ];
  }

  // 技术相关
  if (lowerQuery.includes('api') || lowerQuery.includes('框架') || lowerQuery.includes('开发')) {
    return [
      'RESTful API：基于HTTP协议的标准API设计风格',
      'GraphQL：一种查询语言，让客户端精确获取需要的数据',
      'gRPC：高性能RPC框架，适合微服务通信',
      '前端框架：React、Vue、Angular等主流框架选型',
      '后端框架：Node.js、Python、Java等后端技术栈',
      '云原生：Kubernetes、Docker等容器化和编排技术',
      'Serverless：无服务器架构，按需付费降低成本',
      '微前端：将大型前端应用拆分为多个小型应用',
    ];
  }

  return [];
}
