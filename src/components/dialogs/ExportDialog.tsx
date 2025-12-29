import React, { useState } from 'react';
import { X, Download, FileImage, FileText, File, FileType } from 'lucide-react';
import { useMindMapStore } from '../../stores/mindmapStore';
import { useConfigStore } from '../../stores/configStore';
import { exportAsPNG, exportAsSVG, exportAsPDF, exportAsMarkdown, exportAsJSON } from '../../lib/mindmap/export';

type ExportFormat = 'png' | 'svg' | 'pdf' | 'markdown' | 'json';

const formatOptions: Array<{
  value: ExportFormat;
  label: string;
  icon: any;
  description: string;
}> = [
  { value: 'png', label: 'PNG 图片', icon: FileImage, description: '高清位图，适合分享' },
  { value: 'svg', label: 'SVG 矢量', icon: FileType, description: '可缩放矢量图' },
  { value: 'pdf', label: 'PDF 文档', icon: File, description: '标准文档格式' },
  { value: 'markdown', label: 'Markdown', icon: FileText, description: '文本大纲格式' },
  { value: 'json', label: 'JSON 数据', icon: File, description: '原始数据格式' },
];

export const ExportDialog: React.FC = () => {
  const { mindmap } = useMindMapStore();
  const { ui, setUI } = useConfigStore();
  const [format, setFormat] = useState<ExportFormat>('png');
  const [filename, setFilename] = useState(mindmap?.title || '思维导图');
  const [isExporting, setIsExporting] = useState(false);

  const isOpen = ui.exportDialogOpen;

  if (!isOpen) return null;

  const handleClose = () => {
    setUI({ exportDialogOpen: false });
  };

  const handleExport = async () => {
    if (!mindmap) return;

    setIsExporting(true);
    try {
      switch (format) {
        case 'png':
          await exportAsPNG(mindmap, filename);
          break;
        case 'svg':
          await exportAsSVG(mindmap, filename);
          break;
        case 'pdf':
          await exportAsPDF(mindmap, filename);
          break;
        case 'markdown':
          await exportAsMarkdown(mindmap, filename);
          break;
        case 'json':
          await exportAsJSON(mindmap, filename);
          break;
      }
      handleClose();
    } catch (error) {
      console.error('Export failed:', error);
      alert('导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">导出思维导图</h2>
          <button
            onClick={handleClose}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              文件名
            </label>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="输入文件名"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              导出格式
            </label>
            <div className="grid grid-cols-2 gap-2">
              {formatOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = format === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => setFormat(option.value)}
                    className={`flex flex-col items-start gap-1.5 p-3 rounded-lg border-2 transition-all text-left ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'}`} />
                      <span className={`text-sm font-medium ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                        {option.label}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{option.description}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <button
            onClick={handleClose}
            disabled={isExporting}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || !filename.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                导出中...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                导出
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
