import React, { useState, useEffect } from 'react';
import { useMindMapStore } from '../../stores/mindmapStore';
import {
  Type,
  Palette,
  Box,
  Square,
  Circle,
  Aperture,
  RotateCw,
  Maximize2
} from 'lucide-react';

const darkColorPresets = [
  { name: '深蓝', bg: '#1e3a8a', border: '#1e40af', text: '#ffffff' },
  { name: '深紫', bg: '#581c87', border: '#6b21a8', text: '#ffffff' },
  { name: '深绿', bg: '#14532d', border: '#166534', text: '#ffffff' },
  { name: '深红', bg: '#7f1d1d', border: '#991b1b', text: '#ffffff' },
  { name: '深橙', bg: '#9a3412', border: '#c2410c', text: '#ffffff' },
  { name: '深青', bg: '#164e63', border: '#155e75', text: '#ffffff' },
  { name: '深灰', bg: '#374151', border: '#4b5563', text: '#ffffff' },
  { name: '深粉', bg: '#831843', border: '#9d174d', text: '#ffffff' },
];

const lightColorPresets = [
  { name: '浅蓝', bg: '#dbeafe', border: '#3b82f6', text: '#1e3a8a' },
  { name: '浅紫', bg: '#f3e8ff', border: '#a855f7', text: '#581c87' },
  { name: '浅绿', bg: '#dcfce7', border: '#22c55e', text: '#14532d' },
  { name: '浅红', bg: '#fee2e2', border: '#ef4444', text: '#7f1d1d' },
  { name: '浅橙', bg: '#ffedd5', border: '#f97316', text: '#9a3412' },
  { name: '浅青', bg: '#cffafe', border: '#06b6d4', text: '#164e63' },
  { name: '浅灰', bg: '#f3f4f6', border: '#6b7280', text: '#374151' },
  { name: '浅粉', bg: '#fce7f3', border: '#ec4899', text: '#831843' },
];

type TabType = 'colors' | 'text' | 'border';

export const StylePanel: React.FC = () => {
  const { mindmap, selectedNodeId, updateNode } = useMindMapStore();
  const [selectedTab, setSelectedTab] = useState<TabType>('colors');

  const selectedNode = selectedNodeId
    ? findNodeById(mindmap?.root, selectedNodeId)
    : null;

  const [nodeStyle, setNodeStyle] = useState(
    selectedNode?.style || {
      backgroundColor: '#3b82f6',
      borderColor: '#2563eb',
      textColor: '#ffffff',
      fontSize: 16,
      fontWeight: 400,
      shape: 'rounded',
      borderWidth: 2,
    }
  );

  useEffect(() => {
    if (selectedNode) {
      setNodeStyle(selectedNode.style);
    }
  }, [selectedNode]);

  const handleStyleChange = (updates: Partial<typeof nodeStyle>) => {
    const newStyle = { ...nodeStyle, ...updates };
    setNodeStyle(newStyle);
    if (selectedNodeId) {
      updateNode(selectedNodeId, { style: newStyle });
    }
  };

  const applyColorPreset = (preset: typeof darkColorPresets[0]) => {
    handleStyleChange({
      backgroundColor: preset.bg,
      borderColor: preset.border,
      textColor: preset.text,
    });
  };

  const tabs: Array<{ key: TabType; label: string; icon: any }> = [
    { key: 'colors', label: '颜色', icon: Palette },
    { key: 'text', label: '文字', icon: Type },
    { key: 'border', label: '边框', icon: Box },
  ];

  if (!selectedNode) {
    return (
      <div className="h-full p-6 flex flex-col items-center justify-center text-center">
        <Aperture className="w-12 h-12 text-gray-400 mb-3" />
        <p className="text-gray-500 dark:text-gray-400 text-sm">请选择一个节点</p>
        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">以编辑其样式</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors ${
                selectedTab === tab.key
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {selectedTab === 'colors' && (
          <>
            <div>
              <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">深色方案</h4>
              <div className="grid grid-cols-4 gap-2">
                {darkColorPresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyColorPreset(preset)}
                    className="group relative aspect-square rounded-lg overflow-hidden ring-1 ring-gray-200 dark:ring-gray-700 hover:ring-2 hover:ring-blue-500 transition-all"
                    style={{ backgroundColor: preset.bg }}
                    title={preset.name}
                  >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full border-2" style={{ borderColor: preset.border }} />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">浅色方案</h4>
              <div className="grid grid-cols-4 gap-2">
                {lightColorPresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyColorPreset(preset)}
                    className="group relative aspect-square rounded-lg overflow-hidden ring-1 ring-gray-200 dark:ring-gray-700 hover:ring-2 hover:ring-blue-500 transition-all"
                    style={{ backgroundColor: preset.bg }}
                    title={preset.name}
                  >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full border-2" style={{ borderColor: preset.border }} />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300">自定义颜色</h4>
              <div className="space-y-2">
                <label className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">背景色</span>
                  <input
                    type="color"
                    value={nodeStyle.backgroundColor}
                    onChange={(e) => handleStyleChange({ backgroundColor: e.target.value })}
                    className="w-16 h-8 rounded cursor-pointer border-0"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">边框色</span>
                  <input
                    type="color"
                    value={nodeStyle.borderColor}
                    onChange={(e) => handleStyleChange({ borderColor: e.target.value })}
                    className="w-16 h-8 rounded cursor-pointer border-0"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">文字色</span>
                  <input
                    type="color"
                    value={nodeStyle.textColor}
                    onChange={(e) => handleStyleChange({ textColor: e.target.value })}
                    className="w-16 h-8 rounded cursor-pointer border-0"
                  />
                </label>
              </div>
            </div>
          </>
        )}

        {selectedTab === 'text' && (
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">字体大小</label>
                <span className="text-xs text-gray-500 dark:text-gray-400">{nodeStyle.fontSize}px</span>
              </div>
              <input
                type="range"
                min="10"
                max="32"
                value={nodeStyle.fontSize}
                onChange={(e) => handleStyleChange({ fontSize: parseInt(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>10px</span>
                <span>32px</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">字体粗细</label>
              <div className="grid grid-cols-3 gap-2">
                {[300, 400, 500, 600, 700].map((weight) => (
                  <button
                    key={weight}
                    onClick={() => handleStyleChange({ fontWeight: weight })}
                    className={`py-2 px-3 text-xs rounded-md border transition-all ${
                      nodeStyle.fontWeight === weight
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                    style={{ fontWeight: weight }}
                  >
                    {weight}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">预览</label>
              <div
                className="p-3 rounded-lg text-center"
                style={{
                  backgroundColor: nodeStyle.backgroundColor,
                  color: nodeStyle.textColor,
                  fontSize: `${nodeStyle.fontSize}px`,
                  fontWeight: nodeStyle.fontWeight,
                }}
              >
                示例文本
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'border' && (
          <div className="space-y-5">
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">节点形状</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'rounded', label: '圆角', icon: Square },
                  { value: 'rectangle', label: '矩形', icon: Maximize2 },
                  { value: 'ellipse', label: '椭圆', icon: Circle },
                ].map((shape) => {
                  const Icon = shape.icon;
                  return (
                    <button
                      key={shape.value}
                      onClick={() => handleStyleChange({ shape: shape.value as any })}
                      className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg border transition-all ${
                        nodeStyle.shape === shape.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs">{shape.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">边框宽度</label>
                <span className="text-xs text-gray-500 dark:text-gray-400">{nodeStyle.borderWidth}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="8"
                value={nodeStyle.borderWidth}
                onChange={(e) => handleStyleChange({ borderWidth: parseInt(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0px</span>
                <span>8px</span>
              </div>
            </div>

            <div className="mt-4">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">预览</label>
              <div className="flex justify-center">
                <div
                  className="flex items-center justify-center px-4 py-2"
                  style={{
                    backgroundColor: nodeStyle.backgroundColor,
                    border: `${nodeStyle.borderWidth}px solid ${nodeStyle.borderColor}`,
                    borderRadius: nodeStyle.shape === 'rounded' ? '8px' : nodeStyle.shape === 'ellipse' ? '9999px' : '4px',
                  }}
                >
                  <span style={{ color: nodeStyle.textColor, fontSize: `${nodeStyle.fontSize}px`, fontWeight: nodeStyle.fontWeight }}>
                    预览
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <RotateCw className="w-3.5 h-3.5" />
          <span className="truncate">选中: {selectedNode.content}</span>
        </div>
      </div>
    </div>
  );
};

function findNodeById(node: any, id: string): any {
  if (!node) return null;
  if (node.id === id) return node;
  for (const child of node.children) {
    const found = findNodeById(child, id);
    if (found) return found;
  }
  return null;
}
