import { useEffect, useState, useRef } from 'react';
import { Toolbar } from './components/toolbar/Toolbar';
import { MindMapCanvas } from './components/mindmap/MindMapCanvas';
import { AIPanel } from './components/ai/AIPanel';
import { OutlinePanel } from './components/panels/OutlinePanel';
import { OnboardingGuide } from './components/guide/OnboardingGuide';
import { KeyboardShortcuts } from './components/guide/KeyboardShortcuts';
import { ToastContainer } from './components/common/Toast';
import { FontStylePanel } from './components/panels/FontStylePanel';
import { StyleSettingsPanel } from './components/panels/StyleSettingsPanel';
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
  const [showStyleSettings, setShowStyleSettings] = useState(false);
  const { toasts, close } = useToast();
  const initializedRef = useRef(false);

  useShortcuts();
  useTheme();
  useHistoryRecorder(); // 自动记录历史
  useAutoSave(); // 自动保存

  // 初始化：只执行一次
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    console.log('🚀 初始化 AImind...');

    // Load recent files from localStorage
    const recentFiles = loadRecentFiles();
    if (recentFiles.length > 0) {
      setAppConfig({ recentFiles });
      console.log('📁 已加载最近文件:', recentFiles.length);
    }

    // Try to restore from localStorage auto-save
    const saved = loadFromLocalStorage();
    if (saved) {
      const nodeCount = countNodes(saved.root);
      console.log('✅ 从 localStorage 恢复思维导图:', saved.root.content);
      console.log('📊 恢复的节点数量:', nodeCount);
      console.log('🌳 根节点子节点数:', saved.root.children.length);
      saved.root.children.forEach((child, i) => {
        console.log(`  └─ [${i}] ${child.content} (${child.children.length} 个子节点)`);
      });
      useMindMapStore.getState().loadMindmap(saved);

      // 验证加载后的状态
      setTimeout(() => {
        const current = useMindMapStore.getState().mindmap;
        if (current) {
          console.log('✅ 验证: 已加载到 store - 节点数:', countNodes(current.root));
        } else {
          console.error('❌ 错误: store 中的 mindmap 仍为 null!');
        }
      }, 100);
    } else {
      console.log('📝 创建新的思维导图');
      useMindMapStore.getState().createMindmap('欢迎使用AImind');
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
      <Toolbar
        onShowShortcuts={() => setShowShortcuts(true)}
        onShowStyleSettings={() => setShowStyleSettings(true)}
      />

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

      {/* 样式设置面板 */}
      {showStyleSettings && (
        <div className="fixed top-14 right-0 bottom-8 w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-xl z-40">
          <StyleSettingsPanel onClose={() => setShowStyleSettings(false)} />
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

function countNodes(node: import('./types').MindMapNode): number {
  return 1 + node.children.reduce((sum, child) => sum + countNodes(child), 0);
}

function getTreeDepth(node: import('./types').MindMapNode): number {
  if (node.children.length === 0) return 1;
  return 1 + Math.max(...node.children.map(getTreeDepth));
}

export default App;
