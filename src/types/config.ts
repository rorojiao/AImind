// 应用配置
export interface AppConfig {
  theme: 'light' | 'dark' | 'nature' | 'ai-blue' | 'system';
  autoSave: boolean;
  autoSaveInterval: number;
  defaultLayout: 'horizontal' | 'vertical' | 'radial' | 'free';
  recentFiles: RecentFile[];
  maxRecentFiles: number;
}

export interface RecentFile {
  id: string;
  title: string;
  timestamp: number;
}

// UI状态
export interface UIState {
  sidebarOpen: boolean;
  outlinePanelOpen: boolean;
  aiPanelOpen: boolean;
  stylePanelOpen: boolean;
  exportDialogOpen: boolean;
  settingsDialogOpen: boolean;
  selectedNodeId: string | null;
  zoom: number;
}

// 导出选项
export interface ExportOptions {
  format: 'png' | 'svg' | 'pdf' | 'markdown' | 'json';
  quality?: number;
  includeTheme?: boolean;
  scale?: number;
  backgroundColor?: string;
}
