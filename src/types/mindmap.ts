// 思维导图节点类型
export interface MindMapNode {
  id: string;
  content: string;
  type: 'root' | 'branch' | 'leaf';
  position: { x: number; y: number };
  style: NodeStyle;
  children: MindMapNode[];
  collapsed: boolean;
  icon?: string;
  metadata: NodeMetadata;
}

export interface NodeStyle {
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  textColor: string;
  fontSize: number;
  fontWeight: number;
  fontFamily: string;
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline';
  textAlign: 'left' | 'center' | 'right';
  shape: 'rounded' | 'rectangle' | 'ellipse';
}

export interface NodeMetadata {
  created: number;
  modified: number;
  aiGenerated: boolean;
  aiProvider?: string;
  expandLevel?: number;
}

// 思维导图数据
export interface MindMapData {
  id: string;
  title: string;
  root: MindMapNode;
  layout: 'horizontal' | 'vertical' | 'free';
  theme: string;
  edgeStyle: 'curve' | 'straight' | 'orthogonal';
  aiContext?: AIContext;
  created: number;
  modified: number;
}

// 连接线样式配置
export interface EdgeStyleConfig {
  type: 'curve' | 'straight' | 'orthogonal';
  color: string;
  width: number;
}

// 主题配置
export interface MindMapTheme {
  id: string;
  name: string;
  preview: string;
  colors: {
    root: { bg: string; border: string; text: string };
    branch: { bg: string; border: string; text: string };
    leaf: { bg: string; border: string; text: string };
  };
  edge: {
    color: string;
    width: number;
  };
}

export interface AIContext {
  domain?: string;
  lastAnalysis?: string;
}

// 文件格式
export interface MindMapFile {
  version: string;
  format: string;
  data: MindMapData;
  encrypted?: boolean;
}

// 节点路径
export type NodePath = string[];
