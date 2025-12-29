import React, { useState, useEffect } from 'react';
import {
  loadAllVersions,
  restoreVersion,
  deleteVersion,
  clearAllVersions,
  type MindMapVersion,
} from '../../lib/storage/localStorage';
import { useMindMapStore } from '../../stores/mindmapStore';
import {
  Clock,
  RotateCcw,
  Trash2,
  FileText,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from './Button';

interface VersionHistoryProps {
  onClose: () => void;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({ onClose }) => {
  const { mindmap, loadMindmap } = useMindMapStore();
  const [versions, setVersions] = useState<MindMapVersion[]>([]);
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());

  // 加载版本列表
  useEffect(() => {
    refreshVersions();
  }, [mindmap]);

  const refreshVersions = () => {
    const allVersions = loadAllVersions();
    // 如果有当前思维导图，只显示相关的版本
    if (mindmap) {
      const relevantVersions = allVersions.filter(
        (v) => v.mindmapId === mindmap.id || v.mindmapId === ''
      );
      setVersions(relevantVersions);
    } else {
      setVersions(allVersions);
    }
  };

  const handleRestore = (versionId: string) => {
    if (!confirm('确定要恢复到此版本吗?当前状态将被保存为新版本。')) {
      return;
    }

    const restoredData = restoreVersion(versionId);
    if (restoredData) {
      loadMindmap(restoredData);
      refreshVersions();
      alert('版本已恢复');
    }
  };

  const handleDelete = (versionId: string) => {
    if (!confirm('确定要删除此版本吗?此操作无法撤销。')) {
      return;
    }

    if (deleteVersion(versionId)) {
      refreshVersions();
      alert('版本已删除');
    }
  };

  const handleClearAll = () => {
    if (!confirm('确定要清除所有版本历史吗?此操作无法撤销。')) {
      return;
    }

    clearAllVersions();
    refreshVersions();
    alert('所有版本已清除');
  };

  const toggleExpand = (versionId: string) => {
    setExpandedVersions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(versionId)) {
        newSet.delete(versionId);
      } else {
        newSet.add(versionId);
      }
      return newSet;
    });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getNodeCount = (data: typeof mindmap): number => {
    if (!data) return 0;

    const count = (node: any): number => {
      return 1 + node.children.reduce((sum: number, child: any) => sum + count(child), 0);
    };

    return count(data.root);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">版本历史</h3>
          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
            {versions.length} 个版本
          </span>
        </div>
        <Button size="sm" variant="ghost" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Actions */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <Button
          size="sm"
          variant="ghost"
          onClick={handleClearAll}
          className="text-red-600 hover:text-red-700 dark:text-red-400"
          disabled={versions.length === 0}
        >
          <Trash2 className="w-4 h-4 mr-1" />
          清除所有版本
        </Button>
      </div>

      {/* Version List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {versions.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>暂无版本历史</p>
            <p className="text-xs mt-1">编辑思维导图后自动保存会创建版本</p>
          </div>
        ) : (
          versions.map((version) => (
            <div
              key={version.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
            >
              {/* Version Header */}
              <div className="p-3 bg-gray-50 dark:bg-gray-900/50 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        version.isAutoSaved
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                          : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                      }`}
                    >
                      {version.isAutoSaved ? '自动保存' : '手动保存'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {getNodeCount(version.data)} 个节点
                    </span>
                  </div>
                  <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                    {version.title}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatDate(version.timestamp)}
                  </p>
                  {version.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {version.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleExpand(version.id)}
                    title="查看详情"
                  >
                    {expandedVersions.has(version.id) ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRestore(version.id)}
                    title="恢复此版本"
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(version.id)}
                    title="删除此版本"
                    className="text-red-600 hover:text-red-700 dark:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedVersions.has(version.id) && (
                <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">版本ID:</span>
                      <span className="font-mono text-gray-700 dark:text-gray-300">
                        {version.id}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">导图ID:</span>
                      <span className="font-mono text-gray-700 dark:text-gray-300">
                        {version.mindmapId}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">修改时间:</span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {formatDate(version.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
        <p>💡 提示:</p>
        <ul className="mt-1 space-y-1 ml-4 list-disc">
          <li>自动保存最多保留 5 个版本</li>
          <li>手动保存的版本会永久保留</li>
          <li>总版本数量限制为 20 个</li>
        </ul>
      </div>
    </div>
  );
};
