import { useEffect, useRef } from 'react';
import { useMindMapStore } from '../stores/mindmapStore';
import { useHistoryStore } from '../stores/historyStore';

/**
 * 自动记录思维导图操作历史的 Hook
 */
export function useHistoryRecorder() {
  // 使用选择器精确订阅 modified 字段
  const modified = useMindMapStore((state) => state.mindmap?.modified ?? null);
  const { pushState } = useHistoryStore();
  const lastModifiedRef = useRef<number | null>(null);

  useEffect(() => {
    if (!modified) return;

    // 避免重复记录同一个时间戳
    if (lastModifiedRef.current === modified) return;
    lastModifiedRef.current = modified;

    // 获取最新的 mindmap 数据
    const mindmap = useMindMapStore.getState().mindmap;
    if (!mindmap) return;

    // 推入历史记录（深拷贝以确保数据独立）
    pushState(JSON.parse(JSON.stringify(mindmap)));
    console.log('📝 已记录历史 - modified:', modified);
  }, [modified, pushState]);
}
