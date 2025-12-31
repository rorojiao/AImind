import { useEffect } from 'react';
import { useMindMapStore } from '../stores/mindmapStore';
import { useConfigStore } from '../stores/configStore';
import { useHistoryStore } from '../stores/historyStore';
import { useAIStore } from '../stores/aiStore';
import { downloadAsJSON } from '../lib/storage/fileStorage';
import { saveRecentFiles } from '../lib/storage/localStorage';
import { useAI } from './useAI';

function findNode(node: import('../types').MindMapNode, id: string): import('../types').MindMapNode | null {
  if (node.id === id) return node;
  for (const child of node.children) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

export function useShortcuts() {
  const {
    mindmap,
    selectedNodeId,
    selectedNodeIds,
    addNode,
    addSiblingNode,
    deleteNode,
    deleteSelectedNodes,
    toggleCollapse,
    loadMindmap,
    copyNode,
    pasteNode,
    addAINodes,
    toggleNodeSelection,
    clearSelection,
    selectAllNodes,
    updateSelectedNodesStyle,
    collapseSelectedNodes,
    expandSelectedNodes,
  } = useMindMapStore();
  const { ui, setUI, togglePanel, appConfig, setAppConfig } = useConfigStore();
  const { undo, redo, canUndo, canRedo } = useHistoryStore();
  const { expandNode, isLoading } = useAI();
  const { currentProvider } = useAIStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果在输入框或编辑模式中，不处理大部分快捷键
      const isEditing = (e.target as HTMLElement).isContentEditable ||
                      e.target instanceof HTMLInputElement ||
                      e.target instanceof HTMLTextAreaElement;

      if (isEditing) {
        // 编辑模式下只处理 Esc
        if (e.key === 'Escape') {
          useMindMapStore.getState().selectNode(null);
        }
        return;
      }

      // Ctrl/Cmd + S: 保存到本地
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (mindmap) {
          try {
            downloadAsJSON(mindmap);
            // 更新最近文件
            const recentFile = {
              id: mindmap.id,
              title: mindmap.root.content,
              timestamp: Date.now(),
            };
            const updatedRecentFiles = [
              recentFile,
              ...(appConfig.recentFiles || []).filter((f: any) => f.id !== mindmap.id),
            ].slice(0, appConfig.maxRecentFiles);
            setAppConfig({ recentFiles: updatedRecentFiles });
            saveRecentFiles(updatedRecentFiles);
          } catch (error) {
            console.error('保存失败:', error);
          }
        }
        return;
      }

      // Ctrl/Cmd + Z: 撤销
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo()) {
          undo();
          const { present } = useHistoryStore.getState();
          if (present) loadMindmap(present);
        }
        return;
      }

      // Ctrl/Cmd + Shift + Z 或 Ctrl/Cmd + Y: 重做
      if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') ||
          ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
        e.preventDefault();
        if (canRedo()) {
          redo();
          const { present } = useHistoryStore.getState();
          if (present) loadMindmap(present);
        }
        return;
      }

      // Ctrl/Cmd + C: 复制
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedNodeId) {
        e.preventDefault();
        copyNode(selectedNodeId);
        return;
      }

      // Ctrl/Cmd + V: 粘贴
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && selectedNodeId) {
        e.preventDefault();
        pasteNode(selectedNodeId);
        return;
      }

      // Ctrl/Cmd + X: 剪切（复制+删除）
      if ((e.ctrlKey || e.metaKey) && e.key === 'x' && selectedNodeId && mindmap && selectedNodeId !== mindmap.root.id) {
        e.preventDefault();
        copyNode(selectedNodeId);
        deleteNode(selectedNodeId);
        return;
      }

      // Space 或 F2: 进入编辑模式
      if ((e.key === ' ' || e.key === 'F2') && selectedNodeId) {
        e.preventDefault();
        // 触发编辑模式 - 通过设置自定义属性
        const editEvent = new CustomEvent('edit-node', { detail: { nodeId: selectedNodeId } });
        window.dispatchEvent(editEvent);
        return;
      }

      // Tab: 新建子节点
      if (e.key === 'Tab' && selectedNodeId) {
        e.preventDefault();
        addNode(selectedNodeId, '新节点');
        return;
      }

      // Shift + Tab: 添加父级兄弟节点（暂时同 Enter）
      if (e.shiftKey && e.key === 'Tab' && selectedNodeId && mindmap && selectedNodeId !== mindmap.root.id) {
        e.preventDefault();
        addSiblingNode(selectedNodeId, '新节点');
        return;
      }

      // Enter: 新建兄弟节点
      if (e.key === 'Enter' && selectedNodeId && mindmap && selectedNodeId !== mindmap.root.id) {
        e.preventDefault();
        addSiblingNode(selectedNodeId, '新节点');
        return;
      }

      // Delete/Backspace: 删除节点（支持批量删除）
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeId) {
        e.preventDefault();
        // 如果多选了节点，使用批量删除
        if (selectedNodeIds.length > 1) {
          deleteSelectedNodes();
        } else {
          deleteNode(selectedNodeId);
        }
        return;
      }

      // /: 折叠/展开（单个节点）
      if (e.key === '/' && selectedNodeId) {
        e.preventDefault();
        // 如果多选了节点，批量折叠/展开
        if (selectedNodeIds.length > 1) {
          // 判断第一个选中节点的状态，如果折叠则展开，展开则折叠
          const { mindmap } = useMindMapStore.getState();
          if (mindmap) {
            const firstSelectedId = selectedNodeIds[0];
            const findNode = (node: import('../types').MindMapNode, id: string): import('../types').MindMapNode | null => {
              if (node.id === id) return node;
              for (const child of node.children) {
                const found = findNode(child, id);
                if (found) return found;
              }
              return null;
            };
            const firstNode = findNode(mindmap.root, firstSelectedId);
            if (firstNode?.collapsed) {
              expandSelectedNodes();
            } else {
              collapseSelectedNodes();
            }
          }
        } else {
          toggleCollapse(selectedNodeId);
        }
        return;
      }

      // Ctrl/Cmd + B: 粗体（批量）
      if ((e.ctrlKey || e.metaKey) && e.key === 'b' && selectedNodeIds.length > 0) {
        e.preventDefault();
        updateSelectedNodesStyle({ fontWeight: 700 });
        return;
      }

      // Ctrl/Cmd + I: 斜体（批量）
      if ((e.ctrlKey || e.metaKey) && e.key === 'i' && selectedNodeIds.length > 0) {
        e.preventDefault();
        updateSelectedNodesStyle({ fontStyle: 'italic' });
        return;
      }

      // Ctrl/Cmd + U: 下划线（批量）
      if ((e.ctrlKey || e.metaKey) && e.key === 'u' && selectedNodeIds.length > 0) {
        e.preventDefault();
        updateSelectedNodesStyle({ textDecoration: 'underline' });
        return;
      }

      // Ctrl/Cmd + J: AI扩展
      if ((e.ctrlKey || e.metaKey) && e.key === 'j') {
        e.preventDefault();
        if (selectedNodeId && mindmap && !isLoading) {
          const node = findNode(mindmap.root, selectedNodeId);
          if (node) {
            expandNode(node.content, {
              root: mindmap.root,
              nodeId: selectedNodeId,
            }).then((newNodes) => {
              addAINodes(selectedNodeId, newNodes, currentProvider?.id || '');
            }).catch(console.error);
          }
        }
        return;
      }

      // Ctrl/Cmd + Shift + A: AI Agent模式
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        // 触发Agent模式 - 通过事件触发
        window.dispatchEvent(new CustomEvent('trigger-ai-agent'));
        return;
      }

      // Ctrl/Cmd + Alt + S: 切换AI服务 - 打开AI面板
      if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === 's') {
        e.preventDefault();
        togglePanel('ai');
        return;
      }

      // Ctrl/Cmd + 1/2/3: 切换面板
      if ((e.ctrlKey || e.metaKey) && ['1', '2', '3'].includes(e.key)) {
        e.preventDefault();
        const panels = ['outline', 'ai', 'style'] as const;
        togglePanel(panels[parseInt(e.key) - 1]);
        return;
      }

      // Ctrl/Cmd + =: 放大
      if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        setUI({ zoom: Math.min(3, ui.zoom + 0.1) });
        return;
      }

      // Ctrl/Cmd + -: 缩小
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        setUI({ zoom: Math.max(0.1, ui.zoom - 0.1) });
        return;
      }

      // Ctrl/Cmd + 0: 重置缩放
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        setUI({ zoom: 1 });
        return;
      }

      // Ctrl/Cmd + A: 全选节点
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        selectAllNodes();
        return;
      }

      // Escape: 取消选择（清空多选）
      if (e.key === 'Escape') {
        clearSelection();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedNodeId,
    selectedNodeIds,
    mindmap,
    addNode,
    addSiblingNode,
    deleteNode,
    deleteSelectedNodes,
    toggleCollapse,
    loadMindmap,
    copyNode,
    pasteNode,
    addAINodes,
    toggleNodeSelection,
    clearSelection,
    selectAllNodes,
    setUI,
    togglePanel,
    ui,
    undo,
    redo,
    canUndo,
    canRedo,
    expandNode,
    isLoading,
    currentProvider,
    appConfig,
    setAppConfig,
  ]);
}
