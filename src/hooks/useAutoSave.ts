import { useEffect } from 'react';
import { useMindMapStore } from '../stores/mindmapStore';
import { useConfigStore } from '../stores/configStore';
import { saveToLocalStorage, saveVersion } from '../lib/storage/localStorage';

export function useAutoSave() {
  const { mindmap } = useMindMapStore();
  const { appConfig } = useConfigStore();

  useEffect(() => {
    if (!mindmap || !appConfig.autoSave) return;

    // Save on change (using timestamp as indicator)
    const saveTimer = setTimeout(() => {
      // 保存到自动恢复位置 (用于刷新后恢复)
      saveToLocalStorage(mindmap);

      // 同时保存为一个版本 (带版本历史)
      const timestamp = new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
      saveVersion(mindmap, `自动保存 ${timestamp}`, true);

      // 仅在开发模式输出日志
      // console.log('Auto-saved mindmap with version');
    }, appConfig.autoSaveInterval);

    return () => clearTimeout(saveTimer);
  }, [mindmap?.modified, appConfig.autoSave, appConfig.autoSaveInterval]);
}
