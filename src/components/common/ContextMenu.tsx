import React, { useEffect, useRef } from 'react';
import { Type } from 'lucide-react';
import { useMindMapStore } from '../../stores/mindmapStore';

interface ContextMenuItem {
  label?: string;
  icon?: React.ReactNode;
  shortcut?: string;
  action?: () => void;
  divider?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'transparent' }}
        onClick={onClose}
      />

      {/* 菜单 */}
      <div
        ref={menuRef}
        className="fixed z-50 min-w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1"
        style={{
          left: `${x}px`,
          top: `${y}px`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {items.map((item, index) => (
          <React.Fragment key={index}>
            {item.divider && (
              <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
            )}
            {!item.divider && (
              <button
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                onClick={() => {
                  item.action?.();
                  onClose();
                }}
              >
                {item.icon && <span className="w-4 h-4">{item.icon}</span>}
                <span className="flex-1">{item.label}</span>
                {item.shortcut && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {item.shortcut}
                  </span>
                )}
              </button>
            )}
          </React.Fragment>
        ))}
      </div>
    </>
  );
};

// 节点右键菜单 Hook
export function useNodeContextMenu(nodeId: string) {
  const [contextMenu, setContextMenu] = React.useState<{
    x: number;
    y: number;
    show: boolean;
  }>({ x: 0, y: 0, show: false });

  const {
    addNode,
    addSiblingNode,
    deleteNode,
    toggleCollapse,
    copyNode,
    mindmap,
  } = useMindMapStore();

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      show: true,
    });
  };

  const closeContextMenu = () => {
    setContextMenu((prev) => ({ ...prev, show: false }));
  };

  const menuItems: ContextMenuItem[] = [
    {
      label: '编辑',
      shortcut: 'Space',
      action: () => {
        const editEvent = new CustomEvent('edit-node', { detail: { nodeId } });
        window.dispatchEvent(editEvent);
      },
    },
    { divider: true },
    {
      label: '字体样式...',
      icon: <Type className="w-4 h-4" />,
      action: () => {
        // 触发全局事件打开字体面板
        window.dispatchEvent(new CustomEvent('toggle-font-panel'));
      },
    },
    { divider: true },
    {
      label: '添加子节点',
      shortcut: 'Tab',
      action: () => addNode(nodeId, '新节点'),
    },
    {
      label: '添加兄弟节点',
      shortcut: 'Enter',
      action: () => {
        if (mindmap && nodeId !== mindmap.root.id) {
          addSiblingNode(nodeId, '新节点');
        }
      },
    },
    { divider: true },
    {
      label: '复制',
      shortcut: 'Ctrl+C',
      action: () => copyNode(nodeId),
    },
    {
      label: '删除',
      shortcut: 'Delete',
      action: () => {
        if (mindmap && nodeId !== mindmap.root.id) {
          deleteNode(nodeId);
        }
      },
    },
    { divider: true },
    {
      label: '折叠/展开',
      shortcut: '/',
      action: () => toggleCollapse(nodeId),
    },
  ];

  return {
    contextMenu,
    handleContextMenu,
    closeContextMenu,
    menuItems,
  };
}
