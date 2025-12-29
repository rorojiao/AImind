import React, { useState, useEffect } from 'react';
import { useMindMapStore } from '../../stores/mindmapStore';
import {
  listServerFiles,
  loadFromServer,
  deleteFromServer,
  renameServerFile,
  createServerFile,
} from '../../lib/server/api';
import { Cloud, Trash2, Edit2, Check, X, RefreshCw } from 'lucide-react';

interface ServerFilesProps {
  onClose: () => void;
}

interface ServerFile {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export const ServerFiles: React.FC<ServerFilesProps> = ({ onClose }) => {
  const { loadMindmap } = useMindMapStore();
  const [files, setFiles] = useState<ServerFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // 加载文件列表
  const loadFiles = async () => {
    setLoading(true);
    try {
      const serverFiles = await listServerFiles();
      setFiles(serverFiles);
    } catch (error) {
      console.error('Failed to load server files:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleFileClick = async (fileId: string) => {
    try {
      const data = await loadFromServer(fileId);
      if (data) {
        loadMindmap(data);
        onClose();
      } else {
        alert('加载文件失败');
      }
    } catch (error) {
      alert('加载文件失败: ' + (error as Error).message);
    }
  };

  const handleDelete = async (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('确定要删除这个文件吗?')) return;

    try {
      const success = await deleteFromServer(fileId);
      if (success) {
        setFiles(files.filter((f) => f.id !== fileId));
      } else {
        alert('删除失败');
      }
    } catch (error) {
      alert('删除文件失败: ' + (error as Error).message);
    }
  };

  const handleStartEdit = (fileId: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(fileId);
    setEditTitle(currentTitle);
  };

  const handleSaveEdit = async (fileId: string) => {
    if (!editTitle.trim()) return;

    try {
      const success = await renameServerFile(fileId, editTitle.trim());
      if (success) {
        setFiles(
          files.map((f) =>
            f.id === fileId ? { ...f, title: editTitle.trim() } : f
          )
        );
        setEditingId(null);
      } else {
        alert('重命名失败');
      }
    } catch (error) {
      alert('重命名失败: ' + (error as Error).message);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const handleCreateNew = async () => {
    const title = prompt('请输入思维导图标题:', '新思维导图');
    if (!title) return;

    try {
      const newMindmap = await createServerFile(title);
      loadMindmap(newMindmap);
      onClose();
    } catch (error) {
      alert('创建失败: ' + (error as Error).message);
    }
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

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Cloud className="w-5 h-5 text-blue-500" />
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            云端文件
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadFiles}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            title="刷新"
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={handleCreateNew}
            className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg transition-colors"
          >
            新建
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-sm">加载中...</p>
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Cloud className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>暂无云端文件</p>
          <p className="text-sm mt-2">点击"新建"或"保存到云端"开始使用</p>
        </div>
      ) : (
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {files.map((file) => (
            <div
              key={file.id}
              className="group relative flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
              onClick={() => handleFileClick(file.id)}
            >
              <div className="flex-1 min-w-0">
                {editingId === file.id ? (
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(file.id);
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                      className="flex-1 px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none"
                      autoFocus
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveEdit(file.id);
                      }}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                    >
                      <Check className="w-4 h-4 text-green-500" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelEdit();
                      }}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {file.title}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <span>更新于 {formatTimestamp(file.updatedAt)}</span>
                    </div>
                  </>
                )}
              </div>

              {editingId !== file.id && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleStartEdit(file.id, file.title, e)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                    title="重命名"
                  >
                    <Edit2 className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(file.id, e)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          文件保存在本地模拟服务器中
          <br />
          实际部署后可连接到云端实现多人协作
        </p>
      </div>
    </div>
  );
};
