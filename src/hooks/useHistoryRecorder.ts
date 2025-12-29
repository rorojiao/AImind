import { useEffect } from 'react';
import { useMindMapStore } from '../stores/mindmapStore';
import { useHistoryStore } from '../stores/historyStore';

/**
 * 自动记录思维导图操作历史的 Hook
 */
export function useHistoryRecorder() {
  const { mindmap } = useMindMapStore();
  const { pushState } = useHistoryStore();

  useEffect(() => {
    if (!mindmap) return;

    // 推入历史记录
    pushState(mindmap);
  }, [mindmap?.modified]); // 仅在修改时间变化时记录
}
