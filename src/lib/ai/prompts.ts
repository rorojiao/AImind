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

// 智能扩展
export function getSmartExpandPrompt(content: string): string {
  return `你是一个思维导图助手。用户选中了节点"${content}"，
请生成4-6个有价值的子节点，帮助扩展这个主题。
要求：
1. 简洁明了，每个子节点不超过10个字
2. 逻辑清晰，覆盖主要方面
3. 用JSON数组格式返回，例如：["子节点1", "子节点2", ...]`;
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
