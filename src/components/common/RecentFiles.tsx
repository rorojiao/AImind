import React from 'react';
import { useConfigStore } from '../../stores/configStore';
import { useMindMapStore } from '../../stores/mindmapStore';
import { loadFromLocalStorage, saveRecentFiles } from '../../lib/storage/localStorage';
import { Clock, X } from 'lucide-react';
import type { RecentFile } from '../../types/config';

interface RecentFilesProps {
  onClose: () => void;
}

export const RecentFiles: React.FC<RecentFilesProps> = ({ onClose }) => {
  const { appConfig, setAppConfig } = useConfigStore();
  const { loadMindmap } = useMindMapStore();
  const recentFiles = appConfig.recentFiles || [];

  const handleFileClick = async (fileId: string) => {
    // For now, we can only load from localStorage
    // In the future with Tauri, we'll load from actual files
    const saved = loadFromLocalStorage();
    if (saved && saved.id === fileId) {
      loadMindmap(saved);
      onClose();
    } else {
      alert('此文件仅在当前浏览器会话中可用。请使用"打开"按钮加载本地文件。');
    }
  };

  const handleRemoveRecent = (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentFiles.filter((f: RecentFile) => f.id !== fileId);
    setAppConfig({ recentFiles: updated });
    saveRecentFiles(updated);
  };

  const handleClearAll = () => {
    setAppConfig({ recentFiles: [] });
    saveRecentFiles([]);
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;

    return date.toLocaleDateString('zh-CN');
  };

  if (recentFiles.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500 dark:text-gray-400">
        <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>暂无最近文件</p>
        <p className="text-sm mt-2">创建或打开文件后将显示在此处</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          最近文件
        </h3>
        {recentFiles.length > 0 && (
          <button
            onClick={handleClearAll}
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            清空列表
          </button>
        )}
      </div>

      <div className="space-y-1">
        {recentFiles.map((file: RecentFile) => (
          <div
            key={file.id}
            className="group relative flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
            onClick={() => handleFileClick(file.id)}
          >
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {file.title}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTimestamp(file.timestamp)}
              </div>
            </div>

            <button
              onClick={(e) => handleRemoveRecent(file.id, e)}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-all"
              title="从列表中移除"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
