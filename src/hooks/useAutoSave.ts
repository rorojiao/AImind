import { useEffect, useRef } from 'react';
import { useMindMapStore } from '../stores/mindmapStore';
import { useConfigStore } from '../stores/configStore';
import { saveToLocalStorage, saveVersion } from '../lib/storage/localStorage';

export function useAutoSave() {
  // 使用选择器精确订阅
  const modified = useMindMapStore((state) => state.mindmap?.modified ?? null);
  const { appConfig } = useConfigStore();
  const lastModifiedRef = useRef<number | null>(null);
  const lastSavedDataRef = useRef<string>('');

  useEffect(() => {
    if (!modified || !appConfig.autoSave) return;

    // 获取最新的 mindmap 数据
    const mindmap = useMindMapStore.getState().mindmap;
    if (!mindmap) return;

    // 序列化当前数据用于比较
    const currentData = JSON.stringify(mindmap);

    // 如果数据和上次保存的完全一样，跳过
    if (currentData === lastSavedDataRef.current) return;

    // 避免重复保存同一个时间戳
    if (lastModifiedRef.current === modified) return;
    lastModifiedRef.current = modified;

    // 立即保存，不使用防抖
    saveToLocalStorage(mindmap);
    lastSavedDataRef.current = currentData;

    // 同时保存为一个版本 (带版本历史)
    const timestamp = new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    saveVersion(mindmap, `自动保存 ${timestamp}`, true);

    console.log('✅ 已立即保存:', timestamp, '- 节点数:', countNodes(mindmap.root));
  }, [modified, appConfig.autoSave]);

  // 页面卸载时立即保存（双重保障）
  useEffect(() => {
    const handleBeforeUnload = () => {
      const mindmap = useMindMapStore.getState().mindmap;
      if (mindmap) {
        const currentData = JSON.stringify(mindmap);
        if (currentData !== lastSavedDataRef.current) {
          saveToLocalStorage(mindmap);
          console.log('💾 页面卸载前立即保存');
        }
      }
    };

    // 监听页面卸载和隐藏事件
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        handleBeforeUnload();
      }
    });

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleBeforeUnload);
      // 组件卸载时也保存
      handleBeforeUnload();
    };
  }, []);
}

// 辅助函数：计算节点数量
function countNodes(node: import('../types').MindMapNode): number {
  return 1 + node.children.reduce((sum, child) => sum + countNodes(child), 0);
}
