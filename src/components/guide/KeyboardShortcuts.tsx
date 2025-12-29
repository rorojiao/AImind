import React from 'react';
import { X } from 'lucide-react';

interface ShortcutItem {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: ShortcutItem[] = [
  // 基础操作
  { keys: ['Space', 'F2'], description: '编辑节点内容', category: '基础操作' },
  { keys: ['Tab'], description: '添加子节点', category: '基础操作' },
  { keys: ['Enter'], description: '添加兄弟节点', category: '基础操作' },
  { keys: ['Shift + Tab'], description: '添加父级兄弟节点', category: '基础操作' },
  { keys: ['Delete', 'Backspace'], description: '删除节点', category: '基础操作' },

  // 编辑操作
  { keys: ['Escape'], description: '取消选择 / 退出编辑', category: '编辑操作' },
  { keys: ['Ctrl + C', 'Cmd + C'], description: '复制节点', category: '编辑操作' },
  { keys: ['Ctrl + V', 'Cmd + V'], description: '粘贴节点', category: '编辑操作' },
  { keys: ['Ctrl + X', 'Cmd + X'], description: '剪切节点', category: '编辑操作' },

  // 历史操作
  { keys: ['Ctrl + Z', 'Cmd + Z'], description: '撤销', category: '历史操作' },
  { keys: ['Ctrl + Y', 'Cmd + Y'], description: '重做', category: '历史操作' },
  { keys: ['Ctrl + Shift + Z'], description: '重做', category: '历史操作' },

  // 文件操作
  { keys: ['Ctrl + S', 'Cmd + S'], description: '保存到服务器', category: '文件操作' },
  { keys: ['Ctrl + O', 'Cmd + O'], description: '打开文件', category: '文件操作' },
  { keys: ['Ctrl + N', 'Cmd + N'], description: '新建思维导图', category: '文件操作' },

  // 视图操作
  { keys: ['Ctrl + =', 'Ctrl + +'], description: '放大', category: '视图操作' },
  { keys: ['Ctrl + -'], description: '缩小', category: '视图操作' },
  { keys: ['Ctrl + 0'], description: '重置缩放', category: '视图操作' },
  { keys: ['/'], description: '折叠/展开节点', category: '视图操作' },

  // AI功能
  { keys: ['Ctrl + J', 'Cmd + J'], description: 'AI扩展节点', category: 'AI功能' },
  { keys: ['Ctrl + Shift + A'], description: 'AI Agent模式', category: 'AI功能' },

  // 面板切换
  { keys: ['Ctrl + 1'], description: '切换大纲面板', category: '面板切换' },
  { keys: ['Ctrl + 2'], description: '切换AI面板', category: '面板切换' },
  { keys: ['Ctrl + 3'], description: '切换样式面板', category: '面板切换' },

  // 帮助
  { keys: ['?'], description: '显示快捷键帮助', category: '帮助' },
];

interface KeyboardShortcutsProps {
  onClose: () => void;
}

export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({ onClose }) => {
  const categories = Array.from(new Set(shortcuts.map((s) => s.category)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden animate-fade-in">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              键盘快捷键
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              提高效率的快捷操作指南
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 快捷键列表 */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]">
          <div className="grid gap-6">
            {categories.map((category) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                  {category}
                </h3>
                <div className="space-y-2">
                  {shortcuts
                    .filter((s) => s.category === category)
                    .map((shortcut, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                      >
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {shortcut.description}
                        </span>
                        <div className="flex gap-2">
                          {shortcut.keys.map((key, keyIndex) => (
                            <kbd
                              key={keyIndex}
                              className="px-2 py-1 text-xs font-mono text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-sm"
                            >
                              {key}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 底部提示 */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-100 dark:border-blue-900">
          <p className="text-sm text-blue-800 dark:text-blue-200 text-center">
            💡 提示: 按 <kbd className="px-1.5 py-0.5 text-xs font-mono bg-white dark:bg-gray-700 rounded">?</kbd> 键可随时打开此帮助面板
          </p>
        </div>
      </div>
    </div>
  );
};
