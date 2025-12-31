import React, { useState, useCallback, useRef, useEffect } from 'react';
import { X, Link, Tag, Plus, Trash2, Flag, FileText } from 'lucide-react';
import { useMindMapStore } from '../../stores/mindmapStore';
import type { MindMapNode } from '../../types';
import { getNodeWidth } from '../../lib/mindmap/nodeUtils';

interface NodeEnrichmentPanelProps {
  node: MindMapNode;
  onClose: () => void;
}

type TabType = 'hyperlink' | 'labels' | 'markers' | 'notes' | 'images' | 'attachments';

export const NodeEnrichmentPanel: React.FC<NodeEnrichmentPanelProps> = ({ node, onClose }) => {
  const { setNodeHyperlink, addNodeLabel, removeNodeLabel, addNodeMarker, removeNodeMarker, setNodeNotes, removeNodeNotes } = useMindMapStore();
  const [activeTab, setActiveTab] = useState<TabType>('hyperlink');
  const panelRef = useRef<HTMLDivElement>(null);

  // 超链接状态
  const [hyperlinkType, setHyperlinkType] = useState<'url' | 'email' | 'topic' | 'file'>(
    node.hyperlink?.type || 'url'
  );
  const [hyperlinkUrl, setHyperlinkUrl] = useState(node.hyperlink?.url || '');
  const [hyperlinkTitle, setHyperlinkTitle] = useState(node.hyperlink?.title || '');

  // 标签状态
  const [newLabel, setNewLabel] = useState({ text: '', color: '#3b82f6', backgroundColor: '#dbeafe' });

  // 标记状态
  const [markerType, setMarkerType] = useState<'priority' | 'progress' | 'risk' | 'emotion'>('priority');
  const [markerValue, setMarkerValue] = useState<number | string>(1);
  const [markerColor, setMarkerColor] = useState('#ef4444');

  // 注释状态
  const [notesContent, setNotesContent] = useState(node.notes?.content || '');
  const [notesFormat, setNotesFormat] = useState<'text' | 'markdown' | 'html'>(
    node.notes?.format || 'text'
  );

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // 保存超链接
  const handleSaveHyperlink = useCallback(() => {
    if (hyperlinkUrl.trim()) {
      setNodeHyperlink(node.id, {
        type: hyperlinkType,
        url: hyperlinkUrl.trim(),
        title: hyperlinkTitle.trim() || undefined,
      });
    } else {
      setNodeHyperlink(node.id, null);
    }
    onClose();
  }, [node.id, hyperlinkType, hyperlinkUrl, hyperlinkTitle, setNodeHyperlink, onClose]);

  // 删除超链接
  const handleRemoveHyperlink = useCallback(() => {
    setNodeHyperlink(node.id, null);
    onClose();
  }, [node.id, setNodeHyperlink, onClose]);

  // 添加标签
  const handleAddLabel = useCallback(() => {
    if (newLabel.text.trim()) {
      addNodeLabel(node.id, {
        text: newLabel.text.trim(),
        color: newLabel.color,
        backgroundColor: newLabel.backgroundColor,
      });
      setNewLabel({ text: '', color: '#3b82f6', backgroundColor: '#dbeafe' });
    }
  }, [newLabel, node.id, addNodeLabel]);

  // 添加标记
  const handleAddMarker = useCallback(() => {
    addNodeMarker(node.id, {
      type: markerType,
      value: markerType === 'progress' ? `${markerValue}%` : markerValue,
      color: markerColor,
    });
    // 重置状态
    setMarkerValue(markerType === 'emotion' ? '😊' : 1);
  }, [markerType, markerValue, markerColor, node.id, addNodeMarker]);

  // 保存注释
  const handleSaveNotes = useCallback(() => {
    if (notesContent.trim()) {
      setNodeNotes(node.id, {
        content: notesContent,
        format: notesFormat,
        lastModified: Date.now(),
      });
    } else {
      removeNodeNotes(node.id);
    }
    onClose();
  }, [node.id, notesContent, notesFormat, setNodeNotes, removeNodeNotes, onClose]);

  const tabs: { key: TabType; icon: React.ReactNode; label: string }[] = [
    { key: 'hyperlink', icon: <Link className="w-4 h-4" />, label: '超链接' },
    { key: 'labels', icon: <Tag className="w-4 h-4" />, label: '标签' },
    { key: 'markers', icon: <Flag className="w-4 h-4" />, label: '图标' },
    { key: 'notes', icon: <FileText className="w-4 h-4" />, label: '注释' },
  ];

  const nodeWidth = getNodeWidth(node);

  return (
    <div
      ref={panelRef}
      className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 w-96"
      style={{
        left: node.position.x + nodeWidth + 20,
        top: node.position.y,
      }}
    >
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">节点增强</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* 标签页 */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {/* 超链接面板 */}
        {activeTab === 'hyperlink' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                链接类型
              </label>
              <select
                value={hyperlinkType}
                onChange={(e) => setHyperlinkType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="url">网址</option>
                <option value="email">邮箱</option>
                <option value="topic">节点链接</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {hyperlinkType === 'url' ? '网址' : hyperlinkType === 'email' ? '邮箱地址' : '目标节点'}
              </label>
              <input
                type="text"
                value={hyperlinkUrl}
                onChange={(e) => setHyperlinkUrl(e.target.value)}
                placeholder={hyperlinkType === 'url' ? 'https://example.com' : hyperlinkType === 'email' ? 'user@example.com' : '节点ID'}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                显示标题（可选）
              </label>
              <input
                type="text"
                value={hyperlinkTitle}
                onChange={(e) => setHyperlinkTitle(e.target.value)}
                placeholder="链接标题"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex gap-2">
              {node.hyperlink && (
                <button
                  onClick={handleRemoveHyperlink}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  删除
                </button>
              )}
              <button
                onClick={handleSaveHyperlink}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        )}

        {/* 标签面板 */}
        {activeTab === 'labels' && (
          <div className="space-y-4">
            {/* 现有标签 */}
            {node.labels && node.labels.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  现有标签
                </label>
                <div className="flex flex-wrap gap-2">
                  {node.labels.map((label) => (
                    <div
                      key={label.id}
                      className="px-3 py-1 rounded-full flex items-center gap-2"
                      style={{
                        color: label.color,
                        backgroundColor: label.backgroundColor || `${label.color}20`,
                      }}
                    >
                      <span className="text-sm">{label.text}</span>
                      <button
                        onClick={() => removeNodeLabel(node.id, label.id)}
                        className="hover:opacity-70"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 添加新标签 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                添加新标签
              </label>
              <input
                type="text"
                value={newLabel.text}
                onChange={(e) => setNewLabel({ ...newLabel, text: e.target.value })}
                placeholder="标签文本"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={newLabel.color}
                  onChange={(e) => setNewLabel({ ...newLabel, color: e.target.value })}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">文字颜色</span>
              </div>
              <button
                onClick={handleAddLabel}
                disabled={!newLabel.text.trim()}
                className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                添加标签
              </button>
            </div>
          </div>
        )}

        {/* 图标/标记面板 */}
        {activeTab === 'markers' && (
          <div className="space-y-4">
            {/* 现有标记 */}
            {node.markers && node.markers.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  现有标记
                </label>
                <div className="flex flex-wrap gap-2">
                  {node.markers.map((marker) => (
                    <div
                      key={marker.id}
                      className="px-3 py-1 rounded-full flex items-center gap-2"
                      style={{ backgroundColor: marker.color || '#6366f1', color: 'white' }}
                    >
                      <span className="text-sm">
                        {marker.type === 'priority' && `优先级 ${marker.value}`}
                        {marker.type === 'progress' && `进度 ${marker.value}`}
                        {marker.type === 'risk' && `风险 ${marker.value}`}
                        {marker.type === 'emotion' && `${marker.value}`}
                      </span>
                      <button
                        onClick={() => removeNodeMarker(node.id, marker.id)}
                        className="hover:opacity-70"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 添加新标记 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                添加新标记
              </label>
              <select
                value={markerType}
                onChange={(e) => setMarkerType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="priority">优先级</option>
                <option value="progress">进度</option>
                <option value="risk">风险</option>
                <option value="emotion">情绪</option>
              </select>

              {markerType === 'priority' && (
                <select
                  value={markerValue}
                  onChange={(e) => setMarkerValue(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value={1}>优先级 1</option>
                  <option value={2}>优先级 2</option>
                  <option value={3}>优先级 3</option>
                  <option value={4}>优先级 4</option>
                  <option value={5}>优先级 5</option>
                </select>
              )}

              {markerType === 'progress' && (
                <div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={markerValue}
                    onChange={(e) => setMarkerValue(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                    {markerValue}%
                  </div>
                </div>
              )}

              {markerType === 'risk' && (
                <select
                  value={markerValue}
                  onChange={(e) => setMarkerValue(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value={1}>低风险</option>
                  <option value={2}>中风险</option>
                  <option value={3}>高风险</option>
                </select>
              )}

              {markerType === 'emotion' && (
                <select
                  value={markerValue}
                  onChange={(e) => setMarkerValue(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="😊">开心 😊</option>
                  <option value="😐">一般 😐</option>
                  <option value="😔">难过 😔</option>
                  <option value="😡">生气 😡</option>
                  <option value="🤔">思考 🤔</option>
                </select>
              )}

              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={markerColor}
                  onChange={(e) => setMarkerColor(e.target.value)}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">标记颜色</span>
              </div>

              <button
                onClick={handleAddMarker}
                className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                添加标记
              </button>
            </div>
          </div>
        )}

        {/* 注释面板 */}
        {activeTab === 'notes' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                格式
              </label>
              <select
                value={notesFormat}
                onChange={(e) => setNotesFormat(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="text">纯文本</option>
                <option value="markdown">Markdown</option>
                <option value="html">HTML</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                注释内容
              </label>
              <textarea
                value={notesContent}
                onChange={(e) => setNotesContent(e.target.value)}
                placeholder="输入注释内容..."
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              />
            </div>

            <div className="flex gap-2">
              {node.notes && (
                <button
                  onClick={() => {
                    removeNodeNotes(node.id);
                    onClose();
                  }}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  删除
                </button>
              )}
              <button
                onClick={handleSaveNotes}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
