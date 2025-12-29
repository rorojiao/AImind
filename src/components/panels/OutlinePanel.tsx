import React from 'react';
import { useMindMapStore } from '../../stores/mindmapStore';
import { ChevronRight, ChevronDown } from 'lucide-react';

export const OutlinePanel: React.FC = () => {
  const { mindmap, selectedNodeId } = useMindMapStore();

  if (!mindmap) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
        暂无大纲
      </div>
    );
  }

  const handleNodeClick = (nodeId: string) => {
    useMindMapStore.getState().selectNode(nodeId);
  };

  const handleToggleCollapse = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    useMindMapStore.getState().toggleCollapse(nodeId);
  };

  return (
    <div className="h-full overflow-y-auto p-4">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">大纲</h3>
      <div className="space-y-1">
        {renderNode(mindmap.root, 0, selectedNodeId, handleNodeClick, handleToggleCollapse)}
      </div>
    </div>
  );
};

function renderNode(
  node: import('../../types').MindMapNode,
  depth: number,
  selectedNodeId: string | null,
  onNodeClick: (nodeId: string) => void,
  onToggleCollapse: (nodeId: string, e: React.MouseEvent) => void
): React.ReactNode {
  const hasChildren = node.children.length > 0;
  const isSelected = selectedNodeId === node.id;

  return (
    <div key={node.id}>
      <div
        className={`flex items-center gap-1 py-1 px-2 rounded cursor-pointer transition-colors ${
          isSelected
            ? 'bg-blue-100 dark:bg-blue-900/30'
            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
        onClick={() => onNodeClick(node.id)}
      >
        {hasChildren && (
          <span
            className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={(e) => onToggleCollapse(node.id, e)}
          >
            {node.collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </span>
        )}
        <span
          className={`text-sm truncate flex-1 ${
            isSelected
              ? 'text-blue-700 dark:text-blue-300 font-medium'
              : 'text-gray-700 dark:text-gray-300'
          }`}
        >
          {node.content}
        </span>
      </div>
      {!node.collapsed && hasChildren && node.children.map((child) => renderNode(child, depth + 1, selectedNodeId, onNodeClick, onToggleCollapse))}
    </div>
  );
}
