import type { MindMapTheme } from '../../types';

// 主题定义
export const themes: MindMapTheme[] = [
  {
    id: 'ai-blue',
    name: 'AI 蓝',
    preview: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    colors: {
      root: { bg: '#3b82f6', border: '#1d4ed8', text: '#ffffff' },
      branch: { bg: '#dbeafe', border: '#3b82f6', text: '#1e3a8a' },
      leaf: { bg: '#f3f4f6', border: '#d1d5db', text: '#1f2937' },
    },
    edge: { color: '#9ca3af', width: 2 },
  },
  {
    id: 'sunset',
    name: '日落橙',
    preview: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    colors: {
      root: { bg: '#f97316', border: '#ea580c', text: '#ffffff' },
      branch: { bg: '#ffedd5', border: '#f97316', text: '#9a3412' },
      leaf: { bg: '#fef3c7', border: '#fbbf24', text: '#78350f' },
    },
    edge: { color: '#fb923c', width: 2 },
  },
  {
    id: 'forest',
    name: '森林绿',
    preview: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    colors: {
      root: { bg: '#22c55e', border: '#16a34a', text: '#ffffff' },
      branch: { bg: '#dcfce7', border: '#22c55e', text: '#14532d' },
      leaf: { bg: '#f0fdf4', border: '#86efac', text: '#166534' },
    },
    edge: { color: '#4ade80', width: 2 },
  },
  {
    id: 'purple',
    name: '紫罗兰',
    preview: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
    colors: {
      root: { bg: '#a855f7', border: '#9333ea', text: '#ffffff' },
      branch: { bg: '#f3e8ff', border: '#a855f7', text: '#6b21a8' },
      leaf: { bg: '#faf5ff', border: '#d8b4fe', text: '#581c87' },
    },
    edge: { color: '#c084fc', width: 2 },
  },
  {
    id: 'minimal',
    name: '极简灰',
    preview: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
    colors: {
      root: { bg: '#6b7280', border: '#4b5563', text: '#ffffff' },
      branch: { bg: '#f3f4f6', border: '#9ca3af', text: '#374151' },
      leaf: { bg: '#ffffff', border: '#e5e7eb', text: '#6b7280' },
    },
    edge: { color: '#9ca3af', width: 1 },
  },
  {
    id: 'professional',
    name: '商务黑',
    preview: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
    colors: {
      root: { bg: '#1f2937', border: '#111827', text: '#ffffff' },
      branch: { bg: '#374151', border: '#4b5563', text: '#e5e7eb' },
      leaf: { bg: '#6b7280', border: '#9ca3af', text: '#f3f4f6' },
    },
    edge: { color: '#6b7280', width: 2 },
  },
  {
    id: 'ocean',
    name: '海洋蓝',
    preview: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    colors: {
      root: { bg: '#06b6d4', border: '#0891b2', text: '#ffffff' },
      branch: { bg: '#cffafe', border: '#06b6d4', text: '#164e63' },
      leaf: { bg: '#ecfeff', border: '#67e8f9', text: '#155e75' },
    },
    edge: { color: '#22d3ee', width: 2 },
  },
  {
    id: 'rose',
    name: '玫瑰红',
    preview: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
    colors: {
      root: { bg: '#f43f5e', border: '#e11d48', text: '#ffffff' },
      branch: { bg: '#ffe4e6', border: '#f43f5e', text: '#881337' },
      leaf: { bg: '#fff1f2', border: '#fda4af', text: '#9f1239' },
    },
    edge: { color: '#fb7185', width: 2 },
  },
];

// 获取主题
export function getTheme(id: string): MindMapTheme {
  return themes.find((t) => t.id === id) || themes[0];
}

// 应用主题到节点
export function applyThemeToNode(
  node: import('../../types').MindMapNode,
  theme: MindMapTheme
): void {
  const type = node.type;

  if (type === 'root') {
    node.style = {
      ...node.style,
      backgroundColor: theme.colors.root.bg,
      borderColor: theme.colors.root.border,
      textColor: theme.colors.root.text,
    };
  } else if (type === 'branch') {
    node.style = {
      ...node.style,
      backgroundColor: theme.colors.branch.bg,
      borderColor: theme.colors.branch.border,
      textColor: theme.colors.branch.text,
    };
  } else {
    node.style = {
      ...node.style,
      backgroundColor: theme.colors.leaf.bg,
      borderColor: theme.colors.leaf.border,
      textColor: theme.colors.leaf.text,
    };
  }

  // 递归应用到子节点
  node.children.forEach((child) => applyThemeToNode(child, theme));
}
