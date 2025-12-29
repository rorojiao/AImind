import { create } from 'zustand';
import type { MindMapData } from '../types';

interface HistoryState {
  // 历史记录栈
  past: MindMapData[];
  present: MindMapData | null;
  future: MindMapData[];

  // 操作
  pushState: (state: MindMapData) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clear: () => void;
}

const MAX_HISTORY = 50; // 最多保存50步历史

export const useHistoryStore = create<HistoryState>((set, get) => ({
  past: [],
  present: null,
  future: [],

  pushState: (state: MindMapData) => {
    const { past, present } = get();

    // 如果有当前状态，推入 past
    const newPast = present ? [...past, present] : [];

    // 限制历史记录长度
    if (newPast.length > MAX_HISTORY) {
      newPast.shift();
    }

    set({
      past: newPast,
      present: state,
      future: [], // 新操作会清空 redo 栈
    });
  },

  undo: () => {
    const { past, present, future } = get();

    if (past.length === 0) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    set({
      past: newPast,
      present: previous,
      future: present ? [present, ...future] : future,
    });
  },

  redo: () => {
    const { past, present, future } = get();

    if (future.length === 0) return;

    const next = future[0];
    const newFuture = future.slice(1);

    set({
      past: present ? [...past, present] : past,
      present: next,
      future: newFuture,
    });
  },

  canUndo: () => {
    return get().past.length > 0;
  },

  canRedo: () => {
    return get().future.length > 0;
  },

  clear: () => {
    set({
      past: [],
      present: null,
      future: [],
    });
  },
}));
