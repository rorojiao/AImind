import { create } from 'zustand';
import type { AppConfig, UIState } from '../types';

interface ConfigState {
  appConfig: AppConfig;
  ui: UIState;
  setAppConfig: (config: Partial<AppConfig>) => void;
  setUI: (updates: Partial<UIState>) => void;
  toggleSidebar: () => void;
  togglePanel: (panel: 'outline' | 'ai' | 'style') => void;
  setZoom: (zoom: number) => void;
}

const defaultAppConfig: AppConfig = {
  theme: 'ai-blue',
  autoSave: true,
  autoSaveInterval: 30000,
  defaultLayout: 'horizontal',
  recentFiles: [],
  maxRecentFiles: 10,
};

const defaultUI: UIState = {
  sidebarOpen: true,
  outlinePanelOpen: false,
  aiPanelOpen: true,
  stylePanelOpen: false,
  exportDialogOpen: false,
  settingsDialogOpen: false,
  selectedNodeId: null,
  zoom: 1,
};

export const useConfigStore = create<ConfigState>((set) => ({
  appConfig: defaultAppConfig,
  ui: defaultUI,

  setAppConfig: (config) => {
    set((state) => ({ appConfig: { ...state.appConfig, ...config } }));
  },

  setUI: (updates) => {
    set((state) => ({ ui: { ...state.ui, ...updates } }));
  },

  toggleSidebar: () => {
    set((state) => ({ ui: { ...state.ui, sidebarOpen: !state.ui.sidebarOpen } }));
  },

  togglePanel: (panel) => {
    set((state) => {
      const updates: Partial<UIState> = {};
      switch (panel) {
        case 'outline':
          updates.outlinePanelOpen = !state.ui.outlinePanelOpen;
          break;
        case 'ai':
          updates.aiPanelOpen = !state.ui.aiPanelOpen;
          break;
        case 'style':
          updates.stylePanelOpen = !state.ui.stylePanelOpen;
          break;
      }
      return { ui: { ...state.ui, ...updates } };
    });
  },

  setZoom: (zoom) => {
    set((state) => ({
      ui: { ...state.ui, zoom: Math.max(0.1, Math.min(3, zoom)) },
    }));
  },
}));
