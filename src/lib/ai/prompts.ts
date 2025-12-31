// Agent模式 - 初始分析
export function getInitialAnalysisPrompt(topic: string): string {
  return `你是一个思维导图AI助手。用户创建了主题"${topic}"。

请执行以下任务：
1. 分析这个主题的核心维度
2. 确定应该从哪些主要角度展开
3. 生成3-6个一级分支

返回JSON格式：
{
  "analysis": "对主题的分析",
  "branches": ["分支1", "分支2", ...],
  "suggestedDepth": 3,
  "domain": "识别的领域"
}`;
}

// Agent模式 - 分支扩展
export function getBranchExpandPrompt(
  content: string,
  path: string,
  domain: string
): string {
  return `你正在帮助用户完善思维导图。

当前节点路径：${path}
节点内容：${content}
思维导图领域：${domain}

请为这个节点生成4-6个子节点，要求：
1. 符合该领域的知识体系
2. 保持逻辑层次清晰
3. 每个子节点简洁明了（不超过10字）

返回JSON数组：["子节点1", "子节点2", ...]`;
}

// 引导拆分模式
export function getExpandSuggestionPrompt(
  content: string,
  childCount: number
): string {
  return `用户正在完善思维导图。

当前节点：${content}
子节点数量：${childCount}

请分析：
1. 这个节点是否需要进一步拆分？
2. 如果需要，应该从哪些角度拆分？
3. 给出具体的拆分建议

返回JSON：
{
  "needExpand": true/false,
  "reason": "原因说明",
  "suggestions": ["建议1", "建议2", ...],
  "priority": "high" | "medium" | "low"
}`;
}

// 整体分析
export function getOverallAnalysisPrompt(
  rootTopic: string,
  totalNodes: number,
  maxDepth: number,
  mainBranches: string[]
): string {
  return `请分析用户当前的思维导图。

主题：${rootTopic}
节点总数：${totalNodes}
最大深度：${maxDepth}
主要分支：${mainBranches.join(', ')}

请评估：
1. 思维导图的完整度（0-100）
2. 哪些部分需要进一步扩展？
3. 给出3-5条改进建议

返回JSON：
{
  "completeness": 75,
  "areasToImprove": ["区域1", "区域2"],
  "suggestions": ["建议1", "建议2", ...]
}`;
}

// 智能扩展（上下文感知版本 - 优化版 + 搜索增强）
export function getContextAwareExpandPrompt(params: {
  rootTopic: string; // 中心主题
  nodePath: string[]; // 从根到当前节点的路径
  currentContent: string; // 当前节点内容
  existingChildren?: string[]; // 已存在的子节点
  depth: number; // 当前深度（0=根节点）
  siblingCount?: number; // 兄弟节点数量
  searchContext?: string; // 网络搜索结果（可选）
}): string {
  const { rootTopic, nodePath, currentContent, existingChildren, depth, searchContext } = params;

  // 获取父节点
  const parentContent = nodePath.length > 1 ? nodePath[nodePath.length - 2] : null;

  // 检查是否是新闻列表类内容
  const isNewsList =
    currentContent.includes('条') &&
    (currentContent.includes('新闻') ||
     currentContent.includes('资讯') ||
     currentContent.includes('最新') ||
     currentContent.includes('今日') ||
     currentContent.includes('今天'));

  // 如果是新闻列表类，使用专门的提示词
  if (isNewsList) {
    return generateNewsListPrompt(currentContent, parentContent || rootTopic);
  }

  // 构建精简的上下文（突出父子关系）
  let contextInfo = `# 上下文信息\n`;
  contextInfo += `中心主题：「${rootTopic}」\n`;
  if (parentContent) {
    contextInfo += `父节点：「${parentContent}」\n`;
  }
  contextInfo += `当前节点：「${currentContent}」\n`;

  // 已有子节点提示
  if (existingChildren && existingChildren.length > 0) {
    contextInfo += `已有子节点：${existingChildren.map((c) => `「${c}」`).join('、')}（请避免重复）\n`;
  }

  // 添加搜索上下文
  if (searchContext) {
    contextInfo += `\n${searchContext}\n`;
  }

  // 根据深度提供具体示例和指导
  let instructions = '';

  if (depth === 0) {
    // 根节点 - 顶层维度拆分
    instructions = `
# 拆分要求
这是中心主题，需要从**核心维度**进行顶层分类。

## 正确示例
- 主题「软件开发」 → ["需求分析", "系统设计", "编码实现", "测试验证", "部署上线"]
- 主题「学习计划」 → ["目标设定", "资源准备", "时间安排", "进度跟踪", "效果评估"]

## 你的任务
为主题「${currentContent}」生成 4-6 个**一级分类**，要求：
1. 每个分类是一个独立的核心维度
2. 分类之间互不重叠
3. 覆盖主题的主要方面
`;
  } else if (depth === 1) {
    // 一级分支 - 深度分解
    instructions = `
# 拆分要求
这是一级分支，需要对「${parentContent}」下的「${currentContent}」进行**深入分解**。

## 正确示例
- 父「项目管理」 → 当前「风险管理」 → ["风险识别", "风险评估", "应对策略", "监控机制"]
- 父「软件开发」 → 当前「需求分析」 → ["用户调研", "需求收集", "需求分析", "需求评审", "需求文档"]

## 你的任务
为「${currentContent}」生成 4-6 个**子环节**，要求：
1. 按照"流程步骤"或"构成要素"拆分
2. 每个子节点是具体的、可操作的环节
3. 保持逻辑顺序或分类清晰
`;
  } else if (depth === 2) {
    // 二级分支 - 具体执行
    instructions = `
# 拆分要求
这是二级分支，需要提供**具体执行要点**。

## 正确示例
- 路径「风险管理 → 风险识别」 → ["头脑风暴", "检查表法", "SWOT分析", "专家访谈"]
- 路径「需求分析 → 需求收集」 → ["用户访谈", "问卷调查", "竞品分析", "数据分析"]

## 你的任务
为「${currentContent}」生成 3-5 个**具体方法**，要求：
1. 每个节点是可执行的方法、工具或要点
2. 简洁实用（2-6个字）
3. 避免过于抽象的描述
`;
  } else {
    // 三级及以下 - 细节要点
    instructions = `
# 拆分要求
这是细节层级，需要提供**操作要点**或**建议停止**。

## 正确示例
- 继续拆分：["关键要点1", "关键要点2", "注意事项"]
- 建议停止：["✓ 已完成"]

## 你的任务
判断「${currentContent}」是否需要继续拆分：
- 如果需要：生成 2-4 个具体要点
- 如果已经是最小单元：返回 ["✓ 已完成"]
`;
  }

  return `${contextInfo}
${instructions}

# 输出格式
直接返回JSON数组，不要添加任何其他文字：
["子节点1", "子节点2", "子节点3"]`;
}

/**
 * 生成新闻列表的专门提示词
 */
function generateNewsListPrompt(content: string, topic: string): string {
  // 尝试提取数量
  const countMatch = content.match(/(\d+)条/);
  const count = countMatch ? parseInt(countMatch[1]) : 10;

  return `# 任务说明
用户要求生成「${content}」的子节点列表。

# 主题分析
- 主题领域：${topic}
- 请求类型：新闻/资讯列表
- 数量要求：${count}条

# 生成要求
请为主题「${topic}」生成 ${count} 条有价值的新闻标题作为子节点。

## 标题要求
1. 每条新闻应该是具体的事件、进展或趋势
2. 标题简洁明了（8-20字）
3. 涵盖该领域的重要方面
4. 符合当前（2025年）该领域的实际发展状况

## 示例格式
如果主题是"AI"，则应该生成类似：
["大模型性能突破新里程碑", "AI Agent应用场景持续扩展", "多模态AI技术日趋成熟", "AI芯片市场竞争加剧", "开源AI模型生态繁荣", "AI安全监管框架完善", "AI与医疗深度融合", "教育行业AI应用提速"]

# 输出格式
直接返回JSON数组：
["新闻标题1", "新闻标题2", "新闻标题3", ...]
`;
}

// 内容续写
export function getContentContinuationPrompt(path: string, content: string): string {
  return `你是思维导图助手。基于路径"${path}"，当前节点是"${content}"，
请生成有意义的后续内容，帮助用户深入思考。
返回JSON数组格式的建议列表。`;
}

// 创意启发
export function getCreativeInspirationPrompt(content: string): string {
  return `你是创意助手。针对主题"${content}"，提供3个全新的、意想不到的角度。
帮助用户打破思维定式。返回JSON数组。`;
}

// 总结
export function getSummaryPrompt(content: string): string {
  return `请为以下思维导图分支生成简洁的总结："${content}"`;
}

// 文字优化
export function getOptimizeTextPrompt(content: string): string {
  return `请优化以下思维导图节点的文字表达，使其更简洁准确："${content}"
返回优化后的文字即可。`;
}
