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
    edgeStyle: 'curve',
    created: now,
    modified: now,
  };
}

interface MindMapState {
  // 数据
  mindmap: MindMapData | null;
  selectedNodeId: string | null; // 保留向后兼容
  selectedNodeIds: string[]; // 多选
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
  deleteSelectedNodes: () => void;
  selectNode: (nodeId: string | null) => void;
  toggleNodeSelection: (nodeId: string) => void; // 切换选中状态
  clearSelection: () => void;
  selectAllNodes: () => void;
  toggleCollapse: (nodeId: string) => void;

  // AI生成节点
  addAINodes: (parentId: string, contents: string[], provider: string) => void;

  // 布局
  applyLayout: () => void;
  setLayout: (layout: 'horizontal' | 'vertical' | 'free') => void;
  setEdgeStyle: (edgeStyle: 'curve' | 'straight' | 'orthogonal') => void;
  setTheme: (theme: string) => void;

  // 复制粘贴
  copyNode: (nodeId: string) => void;
  pasteNode: (parentId: string) => void;

  // 节点拖拽
  moveNode: (nodeId: string, newParentId: string, position?: number) => void;

  // 批量操作
  updateSelectedNodesStyle: (updates: Partial<MindMapNode['style']>) => void;
  collapseSelectedNodes: () => void;
  expandSelectedNodes: () => void;

  // ==================== 新增功能方法 ====================

  // 超链接
  setNodeHyperlink: (nodeId: string, hyperlink: import('../types').NodeHyperlink | null) => void;
  removeNodeHyperlink: (nodeId: string) => void;

  // 标签
  addNodeLabel: (nodeId: string, label: Omit<import('../types').NodeLabel, 'id'>) => void;
  removeNodeLabel: (nodeId: string, labelId: string) => void;

  // 图标/标记
  addNodeMarker: (nodeId: string, marker: Omit<import('../types').NodeMarker, 'id'>) => void;
  removeNodeMarker: (nodeId: string, markerId: string) => void;

  // 注释
  setNodeNotes: (nodeId: string, notes: import('../types').NodeNotes) => void;
  removeNodeNotes: (nodeId: string) => void;

  // 图片
  addNodeImage: (nodeId: string, image: Omit<import('../types').NodeImage, 'id'>) => void;
  removeNodeImage: (nodeId: string, imageId: string) => void;

  // 附件
  addNodeAttachment: (nodeId: string, attachment: Omit<import('../types').NodeAttachment, 'id'>) => void;
  removeNodeAttachment: (nodeId: string, attachmentId: string) => void;

  // 任务
  setNodeTask: (nodeId: string, task: import('../types').NodeTask) => void;
  removeNodeTask: (nodeId: string) => void;

  // 边界
  addBoundary: (boundary: Omit<import('../types').NodeBoundary, 'id'>) => void;
  removeBoundary: (boundaryId: string) => void;
  updateBoundary: (boundaryId: string, updates: Partial<import('../types').NodeBoundary>) => void;

  // 关系线
  addRelationship: (relationship: Omit<import('../types').NodeRelationship, 'id'>) => void;
  removeRelationship: (relationshipId: string) => void;
  updateRelationship: (relationshipId: string, updates: Partial<import('../types').NodeRelationship>) => void;
}

export const useMindMapStore = create<MindMapState>((set, get) => ({
  // 初始状态
  mindmap: null,
  selectedNodeId: null,
  selectedNodeIds: [],
  clipboard: null,

  // 创建新思维导图
  createMindmap: (title: string) => {
    const mindmap = createInitialMindmap(title);
    set({ mindmap, selectedNodeId: mindmap.root.id, selectedNodeIds: [] });
  },

  // 加载思维导图
  loadMindmap: (data: MindMapData) => {
    set({ mindmap: deepClone(data), selectedNodeId: data.root.id, selectedNodeIds: [] });
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
    // 使用深拷贝确保状态更新被正确检测
    const updatedMindmap = deepClone(mindmap);
    updatedMindmap.modified = Date.now();
    set({ mindmap: updatedMindmap, selectedNodeId: newNode.id });
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
    // 使用深拷贝确保状态更新被正确检测
    const updatedMindmap = deepClone(mindmap);
    updatedMindmap.modified = Date.now();
    set({ mindmap: updatedMindmap, selectedNodeId: null });
  },

  // 选择节点（单选会清空多选状态）
  selectNode: (nodeId: string | null) => {
    set({ selectedNodeId: nodeId, selectedNodeIds: [] });
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
    // 使用深拷贝确保状态更新被正确检测
    const updatedMindmap = deepClone(mindmap);
    updatedMindmap.modified = Date.now();
    set({ mindmap: updatedMindmap });
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
    // 使用深拷贝确保状态更新被正确检测
    const updatedMindmap = deepClone(mindmap);
    updatedMindmap.modified = Date.now();
    set({ mindmap: updatedMindmap });
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

  // 设置布局方向
  setLayout: (layout: 'horizontal' | 'vertical' | 'free') => {
    const { mindmap } = get();
    if (!mindmap) return;

    get().updateMindmap({ layout });
    get().applyLayout();
  },

  // 设置连接线样式
  setEdgeStyle: (edgeStyle: 'curve' | 'straight' | 'orthogonal') => {
    const { mindmap } = get();
    if (!mindmap) return;

    get().updateMindmap({ edgeStyle });
  },

  // 设置主题
  setTheme: (theme: string) => {
    const { mindmap } = get();
    if (!mindmap) return;

    get().updateMindmap({ theme });
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
    // 使用深拷贝确保状态更新被正确检测
    const updatedMindmap = deepClone(mindmap);
    updatedMindmap.modified = Date.now();
    set({ mindmap: updatedMindmap, selectedNodeId: newNode.id });
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
    // 使用深拷贝确保状态更新被正确检测
    const updatedMindmap = deepClone(mindmap);
    updatedMindmap.modified = Date.now();
    set({ mindmap: updatedMindmap });
  },

  // 切换节点选中状态（多选）
  toggleNodeSelection: (nodeId: string) => {
    const { mindmap, selectedNodeIds } = get();
    if (!mindmap || nodeId === mindmap.root.id) {
      // 根节点只能单独选中
      set({ selectedNodeId: nodeId, selectedNodeIds: [] });
      return;
    }

    const isSelected = selectedNodeIds.includes(nodeId);
    if (isSelected) {
      // 取消选中
      const newSelected = selectedNodeIds.filter((id) => id !== nodeId);
      set({
        selectedNodeIds: newSelected,
        selectedNodeId: newSelected.length > 0 ? newSelected[0] : null,
      });
    } else {
      // 添加选中
      const newSelected = [...selectedNodeIds, nodeId];
      set({
        selectedNodeIds: newSelected,
        selectedNodeId: nodeId,
      });
    }
  },

  // 清空选择
  clearSelection: () => {
    set({ selectedNodeIds: [], selectedNodeId: null });
  },

  // 全选（除了根节点）
  selectAllNodes: () => {
    const { mindmap } = get();
    if (!mindmap) return;

    const allIds: string[] = [];
    const collectIds = (node: MindMapNode) => {
      if (node.id !== mindmap.root.id) {
        allIds.push(node.id);
      }
      node.children.forEach(collectIds);
    };

    collectIds(mindmap.root);
    set({ selectedNodeIds: allIds, selectedNodeId: allIds[0] || null });
  },

  // 批量删除选中节点
  deleteSelectedNodes: () => {
    const { mindmap, selectedNodeIds } = get();
    if (!mindmap || selectedNodeIds.length === 0) return;

    // 需要从后往前删除，避免索引问题
    const sortedIds = [...selectedNodeIds].reverse();

    sortedIds.forEach((nodeId) => {
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
    });

    get().applyLayout();
    // 使用深拷贝确保状态更新被正确检测
    const updatedMindmap = deepClone(mindmap);
    updatedMindmap.modified = Date.now();
    set({ mindmap: updatedMindmap, selectedNodeIds: [], selectedNodeId: null });
  },

  // 批量更新选中节点样式
  updateSelectedNodesStyle: (updates) => {
    const { mindmap, selectedNodeIds } = get();
    if (!mindmap || selectedNodeIds.length === 0) return;

    selectedNodeIds.forEach((nodeId) => {
      const updateInTree = (node: MindMapNode): boolean => {
        if (node.id === nodeId) {
          if (node.style) {
            Object.assign(node.style, updates);
          }
          node.metadata.modified = Date.now();
          return true;
        }
        for (const child of node.children) {
          if (updateInTree(child)) return true;
        }
        return false;
      };

      updateInTree(mindmap.root);
    });

    // 使用深拷贝确保状态更新被正确检测
    const updatedMindmap = deepClone(mindmap);
    updatedMindmap.modified = Date.now();
    set({ mindmap: updatedMindmap });
  },

  // 批量折叠选中节点
  collapseSelectedNodes: () => {
    const { mindmap, selectedNodeIds } = get();
    if (!mindmap || selectedNodeIds.length === 0) return;

    selectedNodeIds.forEach((nodeId) => {
      const collapseInTree = (node: MindMapNode): boolean => {
        if (node.id === nodeId) {
          node.collapsed = true;
          return true;
        }
        for (const child of node.children) {
          if (collapseInTree(child)) return true;
        }
        return false;
      };

      collapseInTree(mindmap.root);
    });

    get().applyLayout();
    // 使用深拷贝确保状态更新被正确检测
    const updatedMindmap = deepClone(mindmap);
    updatedMindmap.modified = Date.now();
    set({ mindmap: updatedMindmap });
  },

  // 批量展开选中节点
  expandSelectedNodes: () => {
    const { mindmap, selectedNodeIds } = get();
    if (!mindmap || selectedNodeIds.length === 0) return;

    selectedNodeIds.forEach((nodeId) => {
      const expandInTree = (node: MindMapNode): boolean => {
        if (node.id === nodeId) {
          node.collapsed = false;
          return true;
        }
        for (const child of node.children) {
          if (expandInTree(child)) return true;
        }
        return false;
      };

      expandInTree(mindmap.root);
    });

    get().applyLayout();
    // 使用深拷贝确保状态更新被正确检测
    const updatedMindmap = deepClone(mindmap);
    updatedMindmap.modified = Date.now();
    set({ mindmap: updatedMindmap });
  },

  // ==================== 新增功能实现 ====================

  // 设置节点超链接
  setNodeHyperlink: (nodeId: string, hyperlink: import('../types').NodeHyperlink | null) => {
    const { mindmap } = get();
    if (!mindmap) return;

    const updateInTree = (node: MindMapNode): boolean => {
      if (node.id === nodeId) {
        node.hyperlink = hyperlink || undefined;
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

  // 移除节点超链接
  removeNodeHyperlink: (nodeId: string) => {
    get().setNodeHyperlink(nodeId, null);
  },

  // 添加节点标签
  addNodeLabel: (nodeId: string, label: Omit<import('../types').NodeLabel, 'id'>) => {
    const { mindmap } = get();
    if (!mindmap) return;

    const updateInTree = (node: MindMapNode): boolean => {
      if (node.id === nodeId) {
        if (!node.labels) node.labels = [];
        node.labels.push({ ...label, id: generateId() });
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

  // 移除节点标签
  removeNodeLabel: (nodeId: string, labelId: string) => {
    const { mindmap } = get();
    if (!mindmap) return;

    const updateInTree = (node: MindMapNode): boolean => {
      if (node.id === nodeId) {
        if (node.labels) {
          node.labels = node.labels.filter((l) => l.id !== labelId);
        }
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

  // 添加节点图标/标记
  addNodeMarker: (nodeId: string, marker: Omit<import('../types').NodeMarker, 'id'>) => {
    const { mindmap } = get();
    if (!mindmap) return;

    const updateInTree = (node: MindMapNode): boolean => {
      if (node.id === nodeId) {
        if (!node.markers) node.markers = [];
        node.markers.push({ ...marker, id: generateId() });
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

  // 移除节点图标/标记
  removeNodeMarker: (nodeId: string, markerId: string) => {
    const { mindmap } = get();
    if (!mindmap) return;

    const updateInTree = (node: MindMapNode): boolean => {
      if (node.id === nodeId) {
        if (node.markers) {
          node.markers = node.markers.filter((m) => m.id !== markerId);
        }
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

  // 设置节点注释
  setNodeNotes: (nodeId: string, notes: import('../types').NodeNotes) => {
    const { mindmap } = get();
    if (!mindmap) return;

    const updateInTree = (node: MindMapNode): boolean => {
      if (node.id === nodeId) {
        node.notes = notes;
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

  // 移除节点注释
  removeNodeNotes: (nodeId: string) => {
    const { mindmap } = get();
    if (!mindmap) return;

    const updateInTree = (node: MindMapNode): boolean => {
      if (node.id === nodeId) {
        node.notes = undefined;
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

  // 添加节点图片
  addNodeImage: (nodeId: string, image: Omit<import('../types').NodeImage, 'id'>) => {
    const { mindmap } = get();
    if (!mindmap) return;

    const updateInTree = (node: MindMapNode): boolean => {
      if (node.id === nodeId) {
        if (!node.images) node.images = [];
        node.images.push({ ...image, id: generateId() });
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

  // 移除节点图片
  removeNodeImage: (nodeId: string, imageId: string) => {
    const { mindmap } = get();
    if (!mindmap) return;

    const updateInTree = (node: MindMapNode): boolean => {
      if (node.id === nodeId) {
        if (node.images) {
          node.images = node.images.filter((i) => i.id !== imageId);
        }
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

  // 添加节点附件
  addNodeAttachment: (nodeId: string, attachment: Omit<import('../types').NodeAttachment, 'id'>) => {
    const { mindmap } = get();
    if (!mindmap) return;

    const updateInTree = (node: MindMapNode): boolean => {
      if (node.id === nodeId) {
        if (!node.attachments) node.attachments = [];
        node.attachments.push({ ...attachment, id: generateId() });
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

  // 移除节点附件
  removeNodeAttachment: (nodeId: string, attachmentId: string) => {
    const { mindmap } = get();
    if (!mindmap) return;

    const updateInTree = (node: MindMapNode): boolean => {
      if (node.id === nodeId) {
        if (node.attachments) {
          node.attachments = node.attachments.filter((a) => a.id !== attachmentId);
        }
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

  // 设置节点任务
  setNodeTask: (nodeId: string, task: import('../types').NodeTask) => {
    const { mindmap } = get();
    if (!mindmap) return;

    const updateInTree = (node: MindMapNode): boolean => {
      if (node.id === nodeId) {
        node.task = task;
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

  // 移除节点任务
  removeNodeTask: (nodeId: string) => {
    const { mindmap } = get();
    if (!mindmap) return;

    const updateInTree = (node: MindMapNode): boolean => {
      if (node.id === nodeId) {
        node.task = undefined;
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

  // ==================== 边界管理 ====================

  // 添加边界
  addBoundary: (boundary: Omit<import('../types').NodeBoundary, 'id'>) => {
    const { mindmap } = get();
    if (!mindmap) return;

    const newBoundary = {
      id: generateId(),
      ...boundary,
    };

    if (!mindmap.boundaries) {
      mindmap.boundaries = [];
    }
    mindmap.boundaries.push(newBoundary);
    set({ mindmap: { ...mindmap, modified: Date.now() } });
  },

  // 移除边界
  removeBoundary: (boundaryId: string) => {
    const { mindmap } = get();
    if (!mindmap || !mindmap.boundaries) return;

    mindmap.boundaries = mindmap.boundaries.filter((b) => b.id !== boundaryId);
    set({ mindmap: { ...mindmap, modified: Date.now() } });
  },

  // 更新边界
  updateBoundary: (boundaryId: string, updates: Partial<import('../types').NodeBoundary>) => {
    const { mindmap } = get();
    if (!mindmap || !mindmap.boundaries) return;

    const boundary = mindmap.boundaries.find((b) => b.id === boundaryId);
    if (boundary) {
      Object.assign(boundary, updates);
      set({ mindmap: { ...mindmap, modified: Date.now() } });
    }
  },

  // ==================== 关系线管理 ====================

  // 添加关系线
  addRelationship: (relationship: Omit<import('../types').NodeRelationship, 'id'>) => {
    const { mindmap } = get();
    if (!mindmap) return;

    const newRelationship = {
      id: generateId(),
      ...relationship,
    };

    if (!mindmap.relationships) {
      mindmap.relationships = [];
    }
    mindmap.relationships.push(newRelationship);
    set({ mindmap: { ...mindmap, modified: Date.now() } });
  },

  // 移除关系线
  removeRelationship: (relationshipId: string) => {
    const { mindmap } = get();
    if (!mindmap || !mindmap.relationships) return;

    mindmap.relationships = mindmap.relationships.filter((r) => r.id !== relationshipId);
    set({ mindmap: { ...mindmap, modified: Date.now() } });
  },

  // 更新关系线
  updateRelationship: (relationshipId: string, updates: Partial<import('../types').NodeRelationship>) => {
    const { mindmap } = get();
    if (!mindmap || !mindmap.relationships) return;

    const relationship = mindmap.relationships.find((r) => r.id === relationshipId);
    if (relationship) {
      Object.assign(relationship, updates);
      set({ mindmap: { ...mindmap, modified: Date.now() } });
    }
  },
}));
