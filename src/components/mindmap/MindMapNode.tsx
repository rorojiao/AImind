import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useMindMapStore } from '../../stores/mindmapStore';
import { ChevronRight, ChevronDown, Sparkles, Plus, Type, Check } from 'lucide-react';
import { NodeEditor } from './NodeEditor';
import { useNodeContextMenu, ContextMenu } from '../common/ContextMenu';
import { getNodeWidth, getNodeHeight } from '../../lib/mindmap/nodeUtils';

interface MindMapNodeProps {
  node: import('../../types').MindMapNode;
}

// 全局拖拽状态
let dragNodeId: string | null = null;

export const MindMapNode: React.FC<MindMapNodeProps> = ({ node }) => {

  const { selectedNodeId, selectedNodeIds, selectNode, toggleNodeSelection, updateNode, toggleCollapse, addNode, moveNode } = useMindMapStore();
  const isSelected = selectedNodeId === node.id;
  const isMultiSelected = selectedNodeIds.includes(node.id);

  // 使用 useRef 保持编辑状态，防止组件重新渲染时状态丢失
  const isEditingRef = useRef(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);

  // 右键菜单
  const { contextMenu, handleContextMenu, closeContextMenu, menuItems } = useNodeContextMenu(node.id);

  // 进入编辑模式
  const startEditing = useCallback(() => {
    isEditingRef.current = true;
    setIsEditing(true);
  }, []);

  // 退出编辑模式
  const stopEditing = useCallback(() => {
    isEditingRef.current = false;
    setIsEditing(false);
  }, []);

  // 监听编辑事件（从快捷键触发）
  useEffect(() => {
    const handleEditEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ nodeId: string }>;
      if (customEvent.detail.nodeId === node.id && !isEditingRef.current) {
        startEditing();
      }
    };

    window.addEventListener('edit-node', handleEditEvent as EventListener);
    return () => {
      window.removeEventListener('edit-node', handleEditEvent as EventListener);
    };
  }, [node.id, startEditing]);

  // 完成编辑
  const handleFinishEdit = useCallback((newContent: string) => {
    if (newContent.trim() !== '' && newContent !== node.content) {
      updateNode(node.id, { content: newContent.trim() });
    }
    stopEditing();
  }, [node.content, node.id, updateNode, stopEditing]);

  // 取消编辑
  const handleCancelEdit = useCallback(() => {
    stopEditing();
  }, [stopEditing]);

  // 双击编辑
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isEditingRef.current) {
      startEditing();
    }
  }, [startEditing]);

  // 单击选择（支持Ctrl+点击多选）
  const handleClick = useCallback((e: React.MouseEvent) => {
    // 如果正在编辑，不处理点击
    if (isEditingRef.current) {
      e.stopPropagation();
      return;
    }
    e.stopPropagation();

    // Ctrl/Cmd + 点击：切换多选状态
    if (e.ctrlKey || e.metaKey) {
      toggleNodeSelection(node.id);
    } else {
      // 普通点击：选中节点
      selectNode(node.id);
    }
  }, [selectNode, toggleNodeSelection, node.id]);

  const handleCollapseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleCollapse(node.id);
  };

  // 快速添加子节点
  const handleAddChild = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    addNode(node.id, '新节点');
    // 触发编辑事件
    setTimeout(() => {
      const children = node.children;
      if (children.length > 0) {
        const newChild = children[children.length - 1];
        window.dispatchEvent(new CustomEvent('edit-node', { detail: { nodeId: newChild.id } }));
      }
    }, 100);
  }, [node.id, node.children, addNode]);

  // 拖拽开始
  const handleDragStart = useCallback((e: React.DragEvent) => {
    if (isEditingRef.current) {
      e.preventDefault();
      return;
    }
    dragNodeId = node.id;
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', node.id);

    // 创建自定义拖拽预览
    const dragPreview = document.createElement('div');
    dragPreview.className = 'px-4 py-2 bg-blue-500 text-white rounded-lg shadow-lg';
    dragPreview.textContent = node.content;
    dragPreview.style.position = 'absolute';
    dragPreview.style.top = '-1000px';
    document.body.appendChild(dragPreview);

    e.dataTransfer.setDragImage(dragPreview, 0, 0);

    // 清理预览元素
    setTimeout(() => {
      document.body.removeChild(dragPreview);
    }, 0);
  }, [node.id, node.content]);

  // 拖拽结束
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setIsDragOver(false);
    dragNodeId = null;
  }, []);

  // 拖拽进入
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (dragNodeId && dragNodeId !== node.id) {
      setIsDragOver(true);
    }
  }, [node.id]);

  // 拖拽离开
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  // 拖拽悬停
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  // 放置
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const draggedId = e.dataTransfer.getData('text/plain');
    if (draggedId && draggedId !== node.id) {
      moveNode(draggedId, node.id);
    }
  }, [node.id, moveNode]);

  const hasChildren = node.children.length > 0;
  const width = getNodeWidth(node);
  const height = getNodeHeight(node);

  // 如果正在编辑，显示编辑器
  if (isEditing) {
    return (
      <div
        className="absolute rounded-lg bg-white dark:bg-gray-800"
        style={{
          left: node.position.x,
          top: node.position.y,
          width: 'auto',
          minWidth: width,
          height: 'auto',
          minHeight: height,
          border: `${node.style.borderWidth}px solid ${node.style.borderColor}`,
          borderRadius: node.style.shape === 'ellipse' ? '50%' : node.style.shape === 'rectangle' ? '4px' : '12px',
          backgroundColor: node.style.backgroundColor,
          zIndex: 1000,
        }}
      >
        <NodeEditor
          content={node.content}
          nodeStyle={node.style}
          onFinish={handleFinishEdit}
          onCancel={handleCancelEdit}
        />
      </div>
    );
  }

  return (
    <>
      {/* 节点 */}
      <div
        ref={nodeRef}
        draggable={!isEditing}
        className={`absolute rounded-lg cursor-pointer transition-all duration-200 ${
          isMultiSelected
            ? 'ring-2 ring-purple-500 ring-offset-2'
            : isSelected
            ? 'ring-2 ring-blue-500 ring-offset-2'
            : isDragOver
            ? 'ring-2 ring-green-500 ring-offset-2 ring-opacity-75'
            : 'hover:shadow-lg'
        } ${isDragging ? 'opacity-50' : ''}`}
        style={{
          left: node.position.x,
          top: node.position.y,
          width,
          height,
          backgroundColor: node.style.backgroundColor,
          border: `${node.style.borderWidth}px solid ${node.style.borderColor}`,
          borderRadius: node.style.shape === 'ellipse' ? '50%' : node.style.shape === 'rectangle' ? '4px' : '12px',
        }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* 节点内容 */}
        <div className="flex items-center justify-center h-full px-3">
          <span
            className="text-center truncate"
            style={{
              color: node.style.textColor,
              fontSize: `${node.style.fontSize}px`,
              fontWeight: node.style.fontWeight,
              fontFamily: node.style.fontFamily,
              fontStyle: node.style.fontStyle,
              textDecoration: node.style.textDecoration,
              textAlign: node.style.textAlign as any,
            }}
          >
            {node.content}
          </span>
          {node.metadata.aiGenerated && (
            <Sparkles className="w-3 h-3 ml-1 text-blue-400 flex-shrink-0" />
          )}
        </div>

        {/* 多选标记（右上角小圆点） */}
        {isMultiSelected && (
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple-500 border-2 border-white dark:border-gray-800 flex items-center justify-center z-20">
            <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
          </div>
        )}

        {/* 快速添加子节点按钮（悬停时显示） */}
        <button
          className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-blue-500 hover:bg-blue-600 text-white border-2 border-white dark:border-gray-800 flex items-center justify-center shadow-sm z-10"
          onClick={handleAddChild}
          title="添加子节点"
          style={{ opacity: isSelected || isDragOver ? 1 : 0 }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = isSelected || isDragOver ? '1' : '0'; }}
        >
          <Plus className="w-3 h-3" />
        </button>

        {/* 字体样式快捷按钮（选中时显示） */}
        {isSelected && (
          <button
            className="absolute -bottom-3 -right-3 w-8 h-8 rounded-full bg-purple-500 hover:bg-purple-600 text-white border-2 border-white dark:border-gray-800 flex items-center justify-center shadow-sm z-10"
            onClick={(e) => {
              e.stopPropagation();
              // 触发全局事件打开字体面板
              window.dispatchEvent(new CustomEvent('toggle-font-panel'));
            }}
            title="字体样式"
          >
            <Type className="w-4 h-4" />
          </button>
        )}

        {/* 折叠/展开按钮 */}
        {hasChildren && (
          <button
            className={`absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors z-10`}
            onClick={handleCollapseClick}
          >
            {node.collapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        )}
      </div>

      {/* 右键菜单 */}
      {contextMenu.show && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={menuItems}
          onClose={closeContextMenu}
        />
      )}
    </>
  );
};
