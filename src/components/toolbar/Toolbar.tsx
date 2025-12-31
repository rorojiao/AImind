import React, { useState, useRef, useEffect } from 'react';
import { useMindMapStore } from '../../stores/mindmapStore';
import { useConfigStore } from '../../stores/configStore';
import { useHistoryStore } from '../../stores/historyStore';
import { Button } from '../common/Button';
import { AIProviderSelector } from '../ai/AIProviderSelector';
import { RecentFiles } from '../common/RecentFiles';
import { ServerFiles } from '../common/ServerFiles';
import { VersionHistory } from '../common/VersionHistory';
import { downloadAsJSON, uploadFromJSON, selectJSONFile } from '../../lib/storage/fileStorage';
import { saveRecentFiles, saveVersion } from '../../lib/storage/localStorage';
import { saveToServer } from '../../lib/server/api';
import type { RecentFile } from '../../types/config';
import {
  FilePlus,
  FolderOpen,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Plus,
  Minus,
  Clock,
  Cloud,
  Download,
  HelpCircle,
  History,
  Palette,
} from 'lucide-react';

interface ToolbarProps {
  onShowShortcuts?: () => void;
  onShowStyleSettings?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onShowShortcuts, onShowStyleSettings }) => {
  const { mindmap, createMindmap, loadMindmap } = useMindMapStore();
  const { ui, setUI, appConfig, setAppConfig } = useConfigStore();
  const { undo, redo, canUndo, canRedo } = useHistoryStore();
  const [showRecentFiles, setShowRecentFiles] = useState(false);
  const [showServerFiles, setShowServerFiles] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const recentFilesButtonRef = useRef<HTMLButtonElement>(null);
  const serverFilesButtonRef = useRef<HTMLButtonElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // 关闭最近文件下拉菜单
      if (
        showRecentFiles &&
        recentFilesButtonRef.current &&
        !recentFilesButtonRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest('.recent-files-dropdown')
      ) {
        setShowRecentFiles(false);
      }

      // 关闭服务器文件下拉菜单
      if (
        showServerFiles &&
        serverFilesButtonRef.current &&
        !serverFilesButtonRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest('.server-files-dropdown')
      ) {
        setShowServerFiles(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showRecentFiles, showServerFiles]);

  const handleNew = () => {
    const title = prompt('请输入思维导图标题:', '新思维导图');
    if (title) {
      createMindmap(title);
    }
  };

  const handleOpen = async () => {
    try {
      const file = await selectJSONFile();
      const data = await uploadFromJSON(file);

      // Add to recent files
      const recentFile = {
        id: data.id,
        title: data.root.content,
        timestamp: Date.now(),
      };

      const updatedRecentFiles = [
        recentFile,
        ...(appConfig.recentFiles || []).filter((f: RecentFile) => f.id !== data.id),
      ].slice(0, appConfig.maxRecentFiles);

      setAppConfig({ recentFiles: updatedRecentFiles });
      saveRecentFiles(updatedRecentFiles);

      loadMindmap(data);
    } catch (error) {
      if ((error as Error).message !== 'File selection cancelled') {
        alert('打开文件失败: ' + (error as Error).message);
      }
    }
  };

  const handleSave = () => {
    if (!mindmap) return;

    try {
      downloadAsJSON(mindmap);

      // 保存到版本历史
      const timestamp = new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
      saveVersion(mindmap, `手动保存 ${timestamp}`, false);

      // Update recent files
      const recentFile = {
        id: mindmap.id,
        title: mindmap.root.content,
        timestamp: Date.now(),
      };

      const updatedRecentFiles = [
        recentFile,
        ...(appConfig.recentFiles || []).filter((f: RecentFile) => f.id !== mindmap.id),
      ].slice(0, appConfig.maxRecentFiles);

      setAppConfig({ recentFiles: updatedRecentFiles });
      saveRecentFiles(updatedRecentFiles);
    } catch (error) {
      alert('保存文件失败: ' + (error as Error).message);
    }
  };

  const handleSaveToServer = async () => {
    if (!mindmap) return;

    try {
      const result = await saveToServer(mindmap);
      alert(`已保存到服务器: ${result.title}`);
    } catch (error) {
      alert('保存到服务器失败: ' + (error as Error).message);
    }
  };

  const handleZoomIn = () => {
    setUI({ zoom: Math.min(3, ui.zoom + 0.1) });
  };

  const handleZoomOut = () => {
    setUI({ zoom: Math.max(0.1, ui.zoom - 0.1) });
  };

  const handleResetZoom = () => {
    setUI({ zoom: 1 });
  };

  const handleUndo = () => {
    if (!canUndo()) return;
    undo();
    const { present } = useHistoryStore.getState();
    if (present) {
      useMindMapStore.getState().loadMindmap(present);
    }
  };

  const handleRedo = () => {
    if (!canRedo()) return;
    redo();
    const { present } = useHistoryStore.getState();
    if (present) {
      useMindMapStore.getState().loadMindmap(present);
    }
  };

  return (
    <div className="h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 gap-4">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <span className="text-white font-bold text-sm">AI</span>
        </div>
        <span className="font-semibold text-gray-900 dark:text-gray-100">AImind</span>
      </div>

      <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />

      {/* 文件操作 */}
      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost" onClick={handleNew} title="新建 (Ctrl+N)">
          <FilePlus className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={handleOpen} title="打开 (Ctrl+O)">
          <FolderOpen className="w-4 h-4" />
        </Button>
        <div className="relative">
          <Button
            ref={recentFilesButtonRef}
            size="sm"
            variant="ghost"
            onClick={() => setShowRecentFiles(!showRecentFiles)}
            title="最近文件"
            className={showRecentFiles ? 'bg-gray-100 dark:bg-gray-700' : ''}
          >
            <Clock className="w-4 h-4" />
          </Button>

          {showRecentFiles && (
            <div className="recent-files-dropdown absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
              <RecentFiles onClose={() => setShowRecentFiles(false)} />
            </div>
          )}
        </div>

        {/* 云端保存 */}
        <div className="relative">
          <Button
            ref={serverFilesButtonRef}
            size="sm"
            variant="ghost"
            onClick={() => setShowServerFiles(!showServerFiles)}
            title="云端文件"
            className={showServerFiles ? 'bg-gray-100 dark:bg-gray-700' : ''}
          >
            <Cloud className="w-4 h-4" />
          </Button>

          {showServerFiles && (
            <div className="server-files-dropdown absolute top-full left-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
              <ServerFiles onClose={() => setShowServerFiles(false)} />
            </div>
          )}
        </div>

        <Button size="sm" variant="ghost" onClick={handleSaveToServer} title="保存到云端" disabled={!mindmap}>
          <Cloud className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={handleSave} title="下载到本地" disabled={!mindmap}>
          <Download className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setShowVersionHistory(true)} title="版本历史" disabled={!mindmap}>
          <History className="w-4 h-4" />
        </Button>
      </div>

      <div className="h-6 w-px bg-gray-200 dark:border-gray-700" />

      {/* 节点操作 */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          title="新建子节点 (Tab)"
          disabled={!mindmap}
          onClick={() => {
            const { selectedNodeId, addNode } = useMindMapStore.getState();
            if (selectedNodeId) {
              addNode(selectedNodeId, '新节点');
            }
          }}
        >
          <Plus className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          title="删除选中节点 (Delete)"
          disabled={!mindmap}
          onClick={() => {
            const { selectedNodeId, selectedNodeIds, deleteNode, deleteSelectedNodes } = useMindMapStore.getState();
            if (selectedNodeIds.length > 1) {
              deleteSelectedNodes();
            } else if (selectedNodeId) {
              deleteNode(selectedNodeId);
            }
          }}
        >
          <Minus className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1" />

      {/* 撤销/重做 */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={handleUndo}
          title="撤销 (Ctrl+Z)"
          disabled={!canUndo()}
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleRedo}
          title="重做 (Ctrl+Y 或 Ctrl+Shift+Z)"
          disabled={!canRedo()}
        >
          <RotateCw className="w-4 h-4" />
        </Button>
      </div>

      <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />

      {/* 缩放控制 */}
      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost" onClick={handleZoomOut} title="缩小 (Ctrl+-)">
          <ZoomOut className="w-4 h-4" />
        </Button>
        <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-center">
          {Math.round(ui.zoom * 100)}%
        </span>
        <Button size="sm" variant="ghost" onClick={handleZoomIn} title="放大 (Ctrl++)">
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={handleResetZoom} title="重置 (Ctrl+0)">
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      <div className="h-6 w-px bg-gray-200 dark:border-gray-700" />

      {/* AI服务选择 */}
      <AIProviderSelector />

      <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />

      {/* 样式设置 */}
      <Button
        size="sm"
        variant="ghost"
        onClick={onShowStyleSettings}
        title="样式设置"
        disabled={!mindmap}
      >
        <Palette className="w-4 h-4" />
      </Button>

      <div className="h-6 w-px bg-gray-200 dark:border-gray-700" />

      {/* 帮助按钮 */}
      <Button
        size="sm"
        variant="ghost"
        onClick={onShowShortcuts}
        title="查看快捷键 (?)"
      >
        <HelpCircle className="w-4 h-4" />
      </Button>

      {/* 版本历史侧边栏 */}
      {showVersionHistory && (
        <div className="fixed top-14 right-0 bottom-0 w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-xl z-40">
          <VersionHistory onClose={() => setShowVersionHistory(false)} />
        </div>
      )}
    </div>
  );
};
