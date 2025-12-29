import React, { useState, useEffect } from 'react';
import { X, Monitor, Moon, Sun, Save, RotateCcw } from 'lucide-react';
import { useConfigStore } from '../../stores/configStore';
import { loadConfig, saveConfig, applyTheme } from '../../lib/config/storage';

type ThemeOption = 'light' | 'dark' | 'system';

const themeOptions: Array<{ value: ThemeOption; label: string; icon: any }> = [
  { value: 'light', label: '浅色', icon: Sun },
  { value: 'dark', label: '深色', icon: Moon },
  { value: 'system', label: '跟随系统', icon: Monitor },
];

export const SettingsDialog: React.FC = () => {
  const { appConfig, ui, setAppConfig, setUI } = useConfigStore();
  const [hasChanges, setHasChanges] = useState(false);
  const [localConfig, setLocalConfig] = useState(appConfig);

  const isOpen = ui.settingsDialogOpen;

  useEffect(() => {
    if (isOpen) {
      loadConfig().then(setLocalConfig);
      setHasChanges(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (hasChanges) {
      if (confirm('有未保存的更改，确定要关闭吗？')) {
        setUI({ settingsDialogOpen: false });
      }
    } else {
      setUI({ settingsDialogOpen: false });
    }
  };

  const handleSave = () => {
    saveConfig(localConfig);
    applyTheme(localConfig.theme);
    setAppConfig(localConfig);
    setHasChanges(false);
    setUI({ settingsDialogOpen: false });
  };

  const handleReset = () => {
    if (confirm('确定要重置为默认设置吗？')) {
      const defaultConfig = {
        theme: 'ai-blue' as const,
        autoSave: true,
        autoSaveInterval: 30000,
        defaultLayout: 'horizontal' as const,
        recentFiles: [],
        maxRecentFiles: 10,
      };
      setLocalConfig(defaultConfig);
      setHasChanges(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">设置</h2>
          <button
            onClick={handleClose}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-6 max-h-[60vh] overflow-y-auto">
          <section>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">主题</h3>
            <div className="grid grid-cols-3 gap-2">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = localConfig.theme === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => {
                      setLocalConfig({ ...localConfig, theme: option.value });
                      setHasChanges(true);
                    }}
                    className={`flex flex-col items-center gap-2 py-3 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'}`} />
                    <span className={`text-xs ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">自动保存</h3>
              <button
                onClick={() => {
                  setLocalConfig({ ...localConfig, autoSave: !localConfig.autoSave });
                  setHasChanges(true);
                }}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  localConfig.autoSave ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    localConfig.autoSave ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {localConfig.autoSave && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400">保存间隔</span>
                  <span className="text-xs text-gray-500">{(localConfig.autoSaveInterval! / 1000).toFixed(0)}秒</span>
                </div>
                <input
                  type="range"
                  min="10000"
                  max="120000"
                  step="5000"
                  value={localConfig.autoSaveInterval}
                  onChange={(e) => {
                    setLocalConfig({ ...localConfig, autoSaveInterval: parseInt(e.target.value) });
                    setHasChanges(true);
                  }}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>10秒</span>
                  <span>2分钟</span>
                </div>
              </div>
            )}
          </section>

          <section>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">默认布局</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'horizontal', label: '水平' },
                { value: 'vertical', label: '垂直' },
                { value: 'radial', label: '放射' },
                { value: 'free', label: '自由' },
              ].map((layout) => (
                <button
                  key={layout.value}
                  onClick={() => {
                    setLocalConfig({ ...localConfig, defaultLayout: layout.value as any });
                    setHasChanges(true);
                  }}
                  className={`py-2 px-4 rounded-lg border-2 text-sm transition-all ${
                    localConfig.defaultLayout === layout.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {layout.label}
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            <RotateCcw className="w-4 h-4" />
            重置默认
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
