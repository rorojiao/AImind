// ==================== 节点增强功能类型 ====================

// 超链接
export interface NodeHyperlink {
  type: 'url' | 'email' | 'topic' | 'file';
  url: string;
  title?: string; // 显示的标题，可选
  targetNodeId?: string; // type='topic' 时使用
}

// 图片
export interface NodeImage {
  id: string;
  url: string; // 可以是 base64 或外部 URL
  width: number;
  height: number;
  alignment: 'left' | 'center' | 'right';
  size: 'thumbnail' | 'small' | 'medium' | 'large' | 'original';
}

// 注释（富文本）
export interface NodeNotes {
  content: string; // HTML 或 Markdown 格式
  format: 'text' | 'markdown' | 'html';
  lastModified: number;
}

// 标签
export interface NodeLabel {
  id: string;
  text: string;
  color: string;
  backgroundColor?: string;
}

// 图标/标记
export interface NodeMarker {
  id: string;
  type: 'priority' | 'progress' | 'risk' | 'emotion' | 'custom';
  value: string | number; // 优先级1-5，进度0-100等
  icon?: string; // 自定义图标
  color?: string;
}

// 附件
export interface NodeAttachment {
  id: string;
  name: string;
  url: string; // base64 或文件路径
  size: number; // 字节
  mimeType: string;
  title?: string;
}

// 任务
export interface NodeTask {
  enabled: boolean;
  status: 'not-started' | 'in-progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high';
  startDate?: number;
  dueDate?: number;
  assignees?: string[];
  progress?: number; // 0-100
}

// 边界（视觉分组）
export interface NodeBoundary {
  id: string;
  scope: string[]; // 包含的节点ID列表
  color: string;
  shape: 'rounded' | 'rectangle';
  label?: string;
}

// 关系线（跨节点连接）
export interface NodeRelationship {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  type: 'solid' | 'dashed' | 'dotted';
  color: string;
  label?: string;
  arrow: 'none' | 'start' | 'end' | 'both';
}

// ==================== 节点类型 ====================

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

  // === 新增功能字段 ===
  // 超链接
  hyperlink?: NodeHyperlink;

  // 图片（支持多张）
  images?: NodeImage[];

  // 注释
  notes?: NodeNotes;

  // 标签（支持多个）
  labels?: NodeLabel[];

  // 图标/标记（支持多个）
  markers?: NodeMarker[];

  // 附件（支持多个）
  attachments?: NodeAttachment[];

  // 任务
  task?: NodeTask;
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

  // === 新增功能字段 ===
  // 边界列表
  boundaries?: NodeBoundary[];

  // 关系线列表
  relationships?: NodeRelationship[];
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
