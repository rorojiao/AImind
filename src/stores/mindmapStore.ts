import { create } from 'zustand';
import type { MindMapData, MindMapNode } from '../types';
import { calculateLayout, defaultLayoutConfig } from '../lib/mindmap/layout';
import { deepClone, generateId } from '../lib/utils';

// 创建初始思维导图
function createInitialMindmap(title: string): MindMapData {
  const now = Date.now();

  return {
    id: generateId(),
    title,
    root: {
      id: generateId(),
      content: title,
      type: 'root',
      position: { x: 0, y: 0 },
      style: {
        backgroundColor: '#3b82f6',
        borderColor: '#1d4ed8',
        borderWidth: 2,
        textColor: '#ffffff',
        fontSize: 18,
        fontWeight: 600,
        fontFamily: 'Microsoft YaHei, sans-serif',
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'center',
        shape: 'rounded',
      },
      children: [],
      collapsed: false,
      metadata: {
        created: now,
        modified: now,
        aiGenerated: false,
      },
    },
    layout: 'horizontal',
    theme: 'ai-blue',
    created: now,
    modified: now,
  };
}

interface MindMapState {
  // 数据
  mindmap: MindMapData | null;
  selectedNodeId: string | null;
  clipboard: MindMapNode | null;

  // 操作
  createMindmap: (title: string) => void;
  loadMindmap: (data: MindMapData) => void;
  updateMindmap: (updates: Partial<MindMapData>) => void;

  // 节点操作
  addNode: (parentId: string, content: string) => void;
  addSiblingNode: (nodeId: string, content: string) => void;
  updateNode: (nodeId: string, updates: Partial<MindMapNode>) => void;
  deleteNode: (nodeId: string) => void;
  selectNode: (nodeId: string | null) => void;
  toggleCollapse: (nodeId: string) => void;

  // AI生成节点
  addAINodes: (parentId: string, contents: string[], provider: string) => void;

  // 布局
  applyLayout: () => void;

  // 复制粘贴
  copyNode: (nodeId: string) => void;
  pasteNode: (parentId: string) => void;

  // 节点拖拽
  moveNode: (nodeId: string, newParentId: string, position?: number) => void;
}

export const useMindMapStore = create<MindMapState>((set, get) => ({
  // 初始状态
  mindmap: null,
  selectedNodeId: null,
  clipboard: null,

  // 创建新思维导图
  createMindmap: (title: string) => {
    const mindmap = createInitialMindmap(title);
    set({ mindmap, selectedNodeId: mindmap.root.id });
  },

  // 加载思维导图
  loadMindmap: (data: MindMapData) => {
    set({ mindmap: deepClone(data), selectedNodeId: data.root.id });
  },

  // 更新思维导图
  updateMindmap: (updates: Partial<MindMapData>) => {
    set((state) => ({
      mindmap: state.mindmap ? { ...state.mindmap, ...updates, modified: Date.now() } : null,
    }));
  },

  // 添加子节点
  addNode: (parentId: string, content: string) => {
    const { mindmap } = get();
    if (!mindmap) return;

    const newNode: MindMapNode = {
      id: generateId(),
      content,
      type: 'leaf',
      position: { x: 0, y: 0 },
      style: {
        backgroundColor: '#f3f4f6',
        borderColor: '#d1d5db',
        borderWidth: 1,
        textColor: '#1f2937',
        fontSize: 14,
        fontWeight: 400,
        fontFamily: 'Microsoft YaHei, sans-serif',
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'center',
        shape: 'rounded',
      },
      children: [],
      collapsed: false,
      metadata: {
        created: Date.now(),
        modified: Date.now(),
        aiGenerated: false,
      },
    };

    const addToParent = (node: MindMapNode): boolean => {
      if (node.id === parentId) {
        node.children.push(newNode);
        node.type = node.children.length > 0 ? 'branch' : 'leaf';
        return true;
      }
      for (const child of node.children) {
        if (addToParent(child)) return true;
      }
      return false;
    };

    addToParent(mindmap.root);
    get().applyLayout();
    set({ mindmap: { ...mindmap, modified: Date.now() }, selectedNodeId: newNode.id });
  },

  // 添加兄弟节点
  addSiblingNode: (nodeId: string, content: string) => {
    const { mindmap } = get();
    if (!mindmap || nodeId === mindmap.root.id) return;

    // 找到父节点
    let parent: MindMapNode | null = null;
    const findParent = (node: MindMapNode, targetId: string): MindMapNode | null => {
      if (node.children.some((c) => c.id === targetId)) {
        return node;
      }
      for (const child of node.children) {
        const found = findParent(child, targetId);
        if (found) return found;
      }
      return null;
    };

    parent = findParent(mindmap.root, nodeId);
    if (parent) {
      get().addNode(parent.id, content);
    }
  },

  // 更新节点
  updateNode: (nodeId: string, updates: Partial<MindMapNode>) => {
    const { mindmap } = get();
    if (!mindmap) return;

    const updateInTree = (node: MindMapNode): boolean => {
      if (node.id === nodeId) {
        Object.assign(node, updates);
        node.metadata.modified = Date.now();
        return true;
      }
      for (const child of node.children) {
        if (updateInTree(child)) return true;
      }
      return false;
    };

    updateInTree(mindmap.root);
    set({ mindmap: { ...mindmap, modified: Date.now() } });
  },

  // 删除节点
  deleteNode: (nodeId: string) => {
    const { mindmap } = get();
    if (!mindmap || nodeId === mindmap.root.id) return;

    const deleteFromTree = (node: MindMapNode): boolean => {
      const index = node.children.findIndex((c) => c.id === nodeId);
      if (index !== -1) {
        node.children.splice(index, 1);
        node.type = node.children.length > 0 ? 'branch' : 'leaf';
        return true;
      }
      for (const child of node.children) {
        if (deleteFromTree(child)) return true;
      }
      return false;
    };

    deleteFromTree(mindmap.root);
    get().applyLayout();
    set({ mindmap: { ...mindmap, modified: Date.now() }, selectedNodeId: null });
  },

  // 选择节点
  selectNode: (nodeId: string | null) => {
    set({ selectedNodeId: nodeId });
  },

  // 切换折叠
  toggleCollapse: (nodeId: string) => {
    const { mindmap } = get();
    if (!mindmap) return;

    const toggleInTree = (node: MindMapNode): boolean => {
      if (node.id === nodeId) {
        node.collapsed = !node.collapsed;
        return true;
      }
      for (const child of node.children) {
        if (toggleInTree(child)) return true;
      }
      return false;
    };

    toggleInTree(mindmap.root);
    get().applyLayout();
    set({ mindmap: { ...mindmap, modified: Date.now() } });
  },

  // AI生成节点
  addAINodes: (parentId: string, contents: string[], provider: string) => {
    const { mindmap } = get();
    if (!mindmap) return;

    const now = Date.now();

    contents.forEach((content) => {
      const newNode: MindMapNode = {
        id: generateId(),
        content,
        type: 'leaf',
        position: { x: 0, y: 0 },
        style: {
          backgroundColor: '#dbeafe',
          borderColor: '#3b82f6',
          borderWidth: 2,
          textColor: '#1e3a8a',
          fontSize: 14,
          fontWeight: 500,
          fontFamily: 'Microsoft YaHei, sans-serif',
          fontStyle: 'normal',
          textDecoration: 'none',
          textAlign: 'center',
          shape: 'rounded',
        },
        children: [],
        collapsed: false,
        metadata: {
          created: now,
          modified: now,
          aiGenerated: true,
          aiProvider: provider,
        },
      };

      const addToParent = (node: MindMapNode): boolean => {
        if (node.id === parentId) {
          node.children.push(newNode);
          node.type = 'branch';
          return true;
        }
        for (const child of node.children) {
          if (addToParent(child)) return true;
        }
        return false;
      };

      addToParent(mindmap.root);
    });

    get().applyLayout();
    set({ mindmap: { ...mindmap, modified: Date.now() } });
  },

  // 应用布局
  applyLayout: () => {
    const { mindmap } = get();
    if (!mindmap) return;

    const config = {
      ...defaultLayoutConfig,
      direction: mindmap.layout,
    };
    calculateLayout(mindmap.root, config);
    set({ mindmap: { ...mindmap, modified: Date.now() } });
  },

  // 复制节点
  copyNode: (nodeId: string) => {
    const { mindmap } = get();
    if (!mindmap) return;

    const findAndCopy = (node: MindMapNode): MindMapNode | null => {
      if (node.id === nodeId) {
        return deepClone(node);
      }
      for (const child of node.children) {
        const found = findAndCopy(child);
        if (found) return found;
      }
      return null;
    };

    const copied = findAndCopy(mindmap.root);
    if (copied) {
      set({ clipboard: copied });
    }
  },

  // 粘贴节点
  pasteNode: (parentId: string) => {
    const { clipboard, mindmap } = get();
    if (!clipboard || !mindmap) return;

    // 生成新ID
    const generateNewIds = (node: MindMapNode): void => {
      node.id = generateId();
      node.metadata.created = Date.now();
      node.metadata.modified = Date.now();
      node.children.forEach(generateNewIds);
    };

    const newNode = deepClone(clipboard);
    generateNewIds(newNode);

    const addToParent = (node: MindMapNode): boolean => {
      if (node.id === parentId) {
        node.children.push(newNode);
        node.type = 'branch';
        return true;
      }
      for (const child of node.children) {
        if (addToParent(child)) return true;
      }
      return false;
    };

    addToParent(mindmap.root);
    get().applyLayout();
    set({ mindmap: { ...mindmap, modified: Date.now() }, selectedNodeId: newNode.id });
  },

  // 移动节点
  moveNode: (nodeId: string, newParentId: string, position?: number) => {
    const { mindmap } = get();
    if (!mindmap || nodeId === newParentId) return;

    // 找到要移动的节点和其旧父节点
    let nodeToMove: MindMapNode | null = null;
    let oldParent: MindMapNode | null = null;
    let foundOldParent = false;

    const findNodes = (node: MindMapNode, targetId: string): boolean => {
      if (node.id === targetId) {
        return true;
      }
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        if (child.id === targetId) {
          nodeToMove = child;
          oldParent = node;
          foundOldParent = true;
          node.children.splice(i, 1);
          return true;
        }
        if (findNodes(child, targetId)) {
          return true;
        }
      }
      return false;
    };

    findNodes(mindmap.root, nodeId);

    if (!nodeToMove || !oldParent) return;

    // 添加到新父节点
    const addToNewParent = (node: MindMapNode): boolean => {
      if (node.id === newParentId) {
        if (position !== undefined) {
          node.children.splice(position, 0, nodeToMove!);
        } else {
          node.children.push(nodeToMove!);
        }
        return true;
      }
      for (const child of node.children) {
        if (addToNewParent(child)) return true;
      }
      return false;
    };

    addToNewParent(mindmap.root);

    // 更新节点类型
    if (oldParent && foundOldParent) {
      const parent = oldParent as MindMapNode;
      parent.type = parent.children.length > 0 ? 'branch' : 'leaf';
    }

    get().applyLayout();
    set({ mindmap: { ...mindmap, modified: Date.now() } });
  },
}));
