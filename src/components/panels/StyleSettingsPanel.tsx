import React from 'react';
import { useMindMapStore } from '../../stores/mindmapStore';
import { themes, applyThemeToNode } from '../../lib/themes';
import { Button } from '../common/Button';
import { X, Layout, GitBranch, Palette } from 'lucide-react';

interface StyleSettingsPanelProps {
  onClose: () => void;
}

export const StyleSettingsPanel: React.FC<StyleSettingsPanelProps> = ({ onClose }) => {
  const { mindmap, setLayout, setEdgeStyle } = useMindMapStore();

  if (!mindmap) return null;

  const edgeStyles: Array<{ value: 'curve' | 'straight' | 'orthogonal'; label: string; icon: string }> = [
    { value: 'curve', label: '曲线', icon: '〰️' },
    { value: 'straight', label: '直线', icon: '─' },
    { value: 'orthogonal', label: '折线', icon: '┐' },
  ];

  const layouts: Array<{ value: 'horizontal' | 'vertical' | 'free'; label: string; icon: string }> = [
    { value: 'horizontal', label: '水平', icon: '↔️' },
    { value: 'vertical', label: '垂直', icon: '↕️' },
    { value: 'free', label: '自由', icon: '🖱️' },
  ];

  const handleApplyTheme = (themeId: string) => {
    const theme = themes.find((t) => t.id === themeId);
    if (theme) {
      // 应用主题到所有节点 - 使用 loadMindmap 确保正确更新
      const updatedMindmap = JSON.parse(JSON.stringify(mindmap));
      applyThemeToNode(updatedMindmap.root, theme);
      updatedMindmap.theme = themeId;
      updatedMindmap.modified = Date.now();
      useMindMapStore.getState().loadMindmap(updatedMindmap);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">样式设置</h3>
        <Button size="sm" variant="ghost" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* 布局方向 */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Layout className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">布局方向</h4>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {layouts.map((layout) => (
              <button
                key={layout.value}
                onClick={() => setLayout(layout.value)}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                  mindmap.layout === layout.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <span className="text-xl">{layout.icon}</span>
                <span className="text-xs text-gray-600 dark:text-gray-400">{layout.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* 连接线样式 */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <GitBranch className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">连接线样式</h4>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {edgeStyles.map((style) => (
              <button
                key={style.value}
                onClick={() => setEdgeStyle(style.value)}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                  mindmap.edgeStyle === style.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <span className="text-xl">{style.icon}</span>
                <span className="text-xs text-gray-600 dark:text-gray-400">{style.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* 主题配色 */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Palette className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">主题配色</h4>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleApplyTheme(theme.id)}
                className={`relative p-3 rounded-lg border-2 transition-all overflow-hidden ${
                  mindmap.theme === theme.id
                    ? 'border-blue-500 ring-2 ring-blue-500/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {/* 主题预览 */}
                <div
                  className="absolute inset-0 opacity-20"
                  style={{ background: theme.preview }}
                />
                {/* 主题色块 */}
                <div className="relative flex items-center gap-2 mb-2">
                  <div
                    className="w-6 h-6 rounded"
                    style={{ backgroundColor: theme.colors.root.bg }}
                  />
                  <div
                    className="w-6 h-6 rounded"
                    style={{ backgroundColor: theme.colors.branch.bg }}
                  />
                  <div
                    className="w-6 h-6 rounded"
                    style={{ backgroundColor: theme.colors.leaf.bg }}
                  />
                </div>
                <div className="relative text-sm font-medium text-gray-700 dark:text-gray-300">
                  {theme.name}
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
