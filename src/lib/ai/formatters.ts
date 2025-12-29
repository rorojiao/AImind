import type { AgentAnalysis, ExpandSuggestion } from '../../types';

// 解析Agent分析响应
export function parseAgentAnalysis(json: string): AgentAnalysis | null {
  try {
    const parsed = JSON.parse(json);
    if (
      typeof parsed.analysis === 'string' &&
      Array.isArray(parsed.branches) &&
      typeof parsed.suggestedDepth === 'number' &&
      typeof parsed.domain === 'string'
    ) {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

// 解析扩展建议响应
export function parseExpandSuggestion(json: string): ExpandSuggestion | null {
  try {
    const parsed = JSON.parse(json);
    if (
      typeof parsed.needExpand === 'boolean' &&
      typeof parsed.reason === 'string' &&
      Array.isArray(parsed.suggestions) &&
      ['high', 'medium', 'low'].includes(parsed.priority)
    ) {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

// 解析节点数组响应
export function parseNodeArray(json: string): string[] | null {
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

// 解析整体分析响应
export function parseOverallAnalysis(json: string): {
  completeness: number;
  areasToImprove: string[];
  suggestions: string[];
} | null {
  try {
    const parsed = JSON.parse(json);
    if (
      typeof parsed.completeness === 'number' &&
      Array.isArray(parsed.areasToImprove) &&
      Array.isArray(parsed.suggestions)
    ) {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

// 从AI响应中提取JSON
export function extractJSON(text: string): string | null {
  // 尝试直接解析
  if (parseNodeArray(text) || parseAgentAnalysis(text)) {
    return text;
  }

  // 尝试提取markdown代码块
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // 尝试提取花括号内容
  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    return braceMatch[0];
  }

  // 尝试提取方括号内容
  const bracketMatch = text.match(/\[[\s\S]*\]/);
  if (bracketMatch) {
    return bracketMatch[0];
  }

  return null;
}

// 清理AI响应文本
export function cleanResponse(text: string): string {
  return text
    .replace(/^```[\s\S]*?\n/, '')
    .replace(/\n```$/, '')
    .replace(/^["']|["']$/g, '')
    .trim();
}
