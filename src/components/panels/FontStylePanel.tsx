import React, { useCallback, useMemo } from 'react';
import { Type, Italic, Underline, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { useMindMapStore } from '../../stores/mindmapStore';
import type { NodeStyle } from '../../types';

interface FontStylePanelProps {
  onClose?: () => void;
}

export const FontStylePanel: React.FC<FontStylePanelProps> = ({ onClose }) => {
  const { mindmap, selectedNodeId, updateNode } = useMindMapStore();

  const selectedNode = useMemo(() => {
    if (!mindmap?.root || !selectedNodeId) return null;

    const findNode = (node: import('../../types').MindMapNode): import('../../types').MindMapNode | null => {
      if (node.id === selectedNodeId) return node;
      for (const child of node.children) {
        const found = findNode(child);
        if (found) return found;
      }
      return null;
    };

    return findNode(mindmap.root);
  }, [mindmap, selectedNodeId]);

  const handleStyleChange = useCallback((updates: Partial<NodeStyle>) => {
    if (!selectedNode || !selectedNode.id) return;

    // 直接更新节点样式,不使用localState
    updateNode(selectedNode.id, {
      style: { ...selectedNode.style, ...updates }
    });
  }, [selectedNode, updateNode]);

  // 早期返回必须在所有hooks之后
  if (!selectedNode) {
    return (
      <div className="p-4 text-center text-gray-500">
        请先选择一个节点
      </div>
    );
  }

  const fontFamilies = [
    { name: '微软雅黑', value: 'Microsoft YaHei, sans-serif' },
    { name: '宋体', value: 'SimSun, serif' },
    { name: '黑体', value: 'SimHei, sans-serif' },
    { name: 'Arial', value: 'Arial, sans-serif' },
    { name: 'Times New Roman', value: 'Times New Roman, serif' },
    { name: 'Courier New', value: 'Courier New, monospace' },
  ];

  const fontSizes = [12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72];

  const fontWeights = [
    { name: '常规', value: 400 },
    { name: '中等', value: 500 },
    { name: '粗体', value: 700 },
  ];

  return (
    <div className="p-4 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Type className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">字体样式</h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            ✕
          </button>
        )}
      </div>

      {/* 字体族 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          字体
        </label>
        <select
          value={selectedNode.style.fontFamily || ''}
          onChange={(e) => handleStyleChange({ fontFamily: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          {fontFamilies.map((font) => (
            <option key={font.value} value={font.value}>
              {font.name}
            </option>
          ))}
        </select>
      </div>

      {/* 字体大小 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          大小: {selectedNode.style.fontSize}px
        </label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="12"
            max="72"
            value={selectedNode.style.fontSize || 14}
            onChange={(e) => handleStyleChange({ fontSize: parseInt(e.target.value) })}
            className="flex-1"
          />
          <select
            value={selectedNode.style.fontSize || 14}
            onChange={(e) => handleStyleChange({ fontSize: parseInt(e.target.value) })}
            className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {fontSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 字体粗细 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          粗细
        </label>
        <div className="flex gap-2">
          {fontWeights.map((weight) => (
            <button
              key={weight.value}
              onClick={() => handleStyleChange({ fontWeight: weight.value })}
              className={`flex-1 px-3 py-2 rounded-lg border-2 transition-colors ${
                selectedNode.style.fontWeight === weight.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
              style={{ fontWeight: weight.value }}
            >
              {weight.name}
            </button>
          ))}
        </div>
      </div>

      {/* 字体颜色 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          颜色
        </label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={selectedNode.style.textColor || '#000000'}
            onChange={(e) => handleStyleChange({ textColor: e.target.value })}
            className="w-12 h-10 rounded cursor-pointer border-0"
          />
          <input
            type="text"
            value={selectedNode.style.textColor || '#000000'}
            onChange={(e) => handleStyleChange({ textColor: e.target.value })}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="#000000"
          />
        </div>
        {/* 预设颜色 */}
        <div className="flex gap-2 mt-2 flex-wrap">
          {['#000000', '#ffffff', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'].map((color) => (
            <button
              key={color}
              onClick={() => handleStyleChange({ textColor: color })}
              className={`w-6 h-6 rounded border-2 ${
                selectedNode.style.textColor === color ? 'border-blue-500' : 'border-gray-300'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* 斜体、下划线 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          样式
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => handleStyleChange({
              fontStyle: selectedNode.style.fontStyle === 'italic' ? 'normal' : 'italic'
            })}
            className={`flex-1 px-3 py-2 rounded-lg border-2 transition-colors flex items-center justify-center gap-2 ${
              selectedNode.style.fontStyle === 'italic'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
            title="斜体"
          >
            <Italic className="w-4 h-4" />
            <span className="text-sm">斜体</span>
          </button>
          <button
            onClick={() => handleStyleChange({
              textDecoration: selectedNode.style.textDecoration === 'underline' ? 'none' : 'underline'
            })}
            className={`flex-1 px-3 py-2 rounded-lg border-2 transition-colors flex items-center justify-center gap-2 ${
              selectedNode.style.textDecoration === 'underline'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
            title="下划线"
          >
            <Underline className="w-4 h-4" />
            <span className="text-sm">下划线</span>
          </button>
        </div>
      </div>

      {/* 文本对齐 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          对齐
        </label>
        <div className="flex gap-2">
          {[
            { value: 'left' as const, icon: AlignLeft, label: '左' },
            { value: 'center' as const, icon: AlignCenter, label: '中' },
            { value: 'right' as const, icon: AlignRight, label: '右' },
          ].map((align) => (
            <button
              key={align.value}
              onClick={() => handleStyleChange({ textAlign: align.value })}
              className={`flex-1 px-3 py-2 rounded-lg border-2 transition-colors flex items-center justify-center gap-1 ${
                selectedNode.style.textAlign === align.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
              title={align.label + '对齐'}
            >
              <align.icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>

      {/* 预览 */}
      <div className="mt-6 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          预览
        </label>
        <div
          className="text-center p-2 bg-gray-50 dark:bg-gray-900 rounded"
          style={{
            fontFamily: selectedNode.style.fontFamily,
            fontSize: `${Math.min(selectedNode.style.fontSize || 14, 24)}px`,
            fontWeight: selectedNode.style.fontWeight,
            fontStyle: selectedNode.style.fontStyle,
            textDecoration: selectedNode.style.textDecoration,
            color: selectedNode.style.textColor,
            textAlign: selectedNode.style.textAlign,
          }}
        >
          示例文本
        </div>
      </div>
    </div>
  );
};
