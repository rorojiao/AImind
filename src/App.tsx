import { useEffect, useState } from 'react';
import { Toolbar } from './components/toolbar/Toolbar';
import { MindMapCanvas } from './components/mindmap/MindMapCanvas';
import { AIPanel } from './components/ai/AIPanel';
import { OutlinePanel } from './components/panels/OutlinePanel';
import { OnboardingGuide } from './components/guide/OnboardingGuide';
import { KeyboardShortcuts } from './components/guide/KeyboardShortcuts';
import { ToastContainer } from './components/common/Toast';
import { FontStylePanel } from './components/panels/FontStylePanel';
import { useMindMapStore } from './stores/mindmapStore';
import { useConfigStore } from './stores/configStore';
import { useShortcuts } from './hooks/useShortcuts';
import { useTheme } from './hooks/useTheme';
import { useHistoryRecorder } from './hooks/useHistoryRecorder';
import { useAutoSave } from './hooks/useAutoSave';
import { useToast } from './hooks/useToast';
import { loadFromLocalStorage, loadRecentFiles } from './lib/storage/localStorage';

function App() {
  const { mindmap } = useMindMapStore();
  const { ui, setAppConfig } = useConfigStore();
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showFontPanel, setShowFontPanel] = useState(false);
  const { toasts, close } = useToast();

  useShortcuts();
  useTheme();
  useHistoryRecorder(); // 自动记录历史
  useAutoSave(); // 自动保存

  // 初始化时加载最近文件配置和恢复自动保存的内容
  useEffect(() => {
    // Load recent files from localStorage
    const recentFiles = loadRecentFiles();
    if (recentFiles.length > 0) {
      setAppConfig({ recentFiles });
    }

    // Try to restore from localStorage auto-save
    if (!mindmap) {
      const saved = loadFromLocalStorage();
      if (saved) {
        useMindMapStore.getState().loadMindmap(saved);
      } else {
        useMindMapStore.getState().createMindmap('欢迎使用AImind');
      }
    }

    // 监听快捷键帮助
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '?' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        setShowShortcuts(true);
      }
    };

    // 监听字体面板打开事件
    const handleFontPanelEvent = () => {
      setShowFontPanel(true);
    };

    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('toggle-font-panel', handleFontPanelEvent);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('toggle-font-panel', handleFontPanelEvent);
    };
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* 工具栏 */}
      <Toolbar onShowShortcuts={() => setShowShortcuts(true)} />

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧大纲面板 */}
        {ui.sidebarOpen && ui.outlinePanelOpen && (
          <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
            <OutlinePanel />
          </div>
        )}

        {/* 中间画布 */}
        <div className="flex-1 relative">
          <MindMapCanvas />
        </div>

        {/* 右侧AI面板 */}
        {ui.aiPanelOpen && (
          <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
            <AIPanel />
          </div>
        )}
      </div>

      {/* 状态栏 */}
      <div className="h-8 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center px-4 text-xs text-gray-500 dark:text-gray-400">
        {mindmap ? (
          <>
            <span>节点: {getNodeCount(mindmap.root)}</span>
            <span className="mx-2">|</span>
            <span>深度: {getTreeDepth(mindmap.root)}</span>
            <span className="mx-2">|</span>
            <span>缩放: {Math.round(ui.zoom * 100)}%</span>
            <span className="mx-2">|</span>
            <span className="cursor-pointer hover:text-blue-500" onClick={() => setShowShortcuts(true)}>
              按 ? 查看快捷键
            </span>
          </>
        ) : (
          <span>未打开思维导图</span>
        )}
        <div className="flex-1" />
        <span>AImind v1.1.0</span>
      </div>

      {/* 新手引导 */}
      <OnboardingGuide
        onComplete={() => {}}
        skip={() => {}}
      />

      {/* 快捷键帮助 */}
      {showShortcuts && (
        <KeyboardShortcuts onClose={() => setShowShortcuts(false)} />
      )}

      {/* 字体样式面板 */}
      {showFontPanel && (
        <div className="fixed top-20 right-4 z-50" onClick={(e) => e.stopPropagation()}>
          <FontStylePanel onClose={() => setShowFontPanel(false)} />
        </div>
      )}

      {/* Toast 通知 */}
      <ToastContainer toasts={toasts} onClose={close} />
    </div>
  );
}

function getNodeCount(node: import('./types').MindMapNode): number {
  return 1 + node.children.reduce((sum, child) => sum + getNodeCount(child), 0);
}

function getTreeDepth(node: import('./types').MindMapNode): number {
  if (node.children.length === 0) return 1;
  return 1 + Math.max(...node.children.map(getTreeDepth));
}

export default App;
