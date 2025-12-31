import React, { useState, useEffect } from 'react';
import { useAIStore, type SearchLog } from '../../stores/aiStore';
import { useMindMapStore } from '../../stores/mindmapStore';
import { useAI } from '../../hooks/useAI';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Sparkles, Loader2, Send, Search, CheckCircle, XCircle, CircleSlash } from 'lucide-react';
import { useAIAgent } from '../../hooks/useAIAgent';

export const AIPanel: React.FC = () => {
  const { currentProvider, searchLogs } = useAIStore();
  const { mindmap, selectedNodeId } = useMindMapStore();
  const { isLoading, expandNode, isWebSearching } = useAI();
  const { isRunning, progress, runAgent } = useAIAgent();
  const [prompt, setPrompt] = useState('');

  // 监听快捷键触发的Agent事件
  useEffect(() => {
    const handleAgentTrigger = () => {
      if (!isRunning) {
        runAgent();
      }
    };
    window.addEventListener('trigger-ai-agent', handleAgentTrigger);
    return () => window.removeEventListener('trigger-ai-agent', handleAgentTrigger);
  }, [isRunning, runAgent]);

  const handleExpand = async () => {
    if (!selectedNodeId || !mindmap) return;

    const node = findNode(mindmap.root, selectedNodeId);
    if (!node) return;

    try {
      // 传递完整上下文
      const newNodes = await expandNode(node.content, {
        root: mindmap.root,
        nodeId: selectedNodeId,
      });
      useMindMapStore.getState().addAINodes(selectedNodeId, newNodes, currentProvider?.id || '');
    } catch (error) {
      console.error('Expand error:', error);
    }
  };

  const handleRunAgent = async () => {
    await runAgent();
  };

  const handleChat = async () => {
    if (!prompt.trim()) return;
    // 聊天功能计划中,当前显示提示
    alert('AI聊天功能正在开发中,敬请期待!\n\n当前可用功能:\n- AI扩展子节点: 点击上方按钮\n- AI Agent自动完善: 点击左侧按钮');
    setPrompt('');
  };

  const selectedNode = selectedNodeId && mindmap ? findNode(mindmap.root, selectedNodeId) : null;

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            AI 助手
          </h3>
          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
            {currentProvider?.name || '未配置'}
          </span>
        </div>

        {/* Agent按钮 */}
        <Button
          onClick={handleRunAgent}
          disabled={isRunning || isLoading || !mindmap}
          className="w-full"
          variant="primary"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {progress?.phase === '扩展' ? `扩展中 (${progress.current}/${progress.total})` : '分析中...'}
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              AI Agent 自动完善
            </>
          )}
        </Button>

        {/* 进度显示 */}
        {progress && (
          <div className="mt-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium text-blue-700 dark:text-blue-300">{progress.phase}</span>
              <span className="text-blue-600 dark:text-blue-400">
                {progress.current}/{progress.total}
              </span>
            </div>
            <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
              <div
                className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">{progress.message}</p>
          </div>
        )}
      </div>

      {/* 选中节点操作 */}
      {selectedNode && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            选中节点: {selectedNode.content}
          </p>
          <Button
            onClick={handleExpand}
            disabled={isLoading}
            variant="secondary"
            className="w-full"
            size="sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {isWebSearching ? '搜索中...' : '生成中...'}
              </>
            ) : (
              'AI 扩展子节点'
            )}
          </Button>
        </div>
      )}

      {/* 搜索日志 */}
      {searchLogs.length > 0 && (
        <div className="p-3 border-b border-gray-200 dark:border-gray-700 max-h-48 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
              <Search className="w-3 h-3" />
              搜索日志
            </h4>
            <button
              onClick={() => useAIStore.getState().clearSearchLogs()}
              className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              清空
            </button>
          </div>
          <div className="space-y-2">
            {searchLogs.slice(0, 5).map((log) => (
              <SearchLogItem key={log.id} log={log} />
            ))}
          </div>
        </div>
      )}

      {/* 聊天输入 */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto mb-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
            与AI对话，获取思维导图相关建议
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="输入问题..."
            onKeyPress={(e) => e.key === 'Enter' && handleChat()}
            className="flex-1"
          />
          <Button
            onClick={handleChat}
            disabled={!prompt.trim() || isLoading}
            size="sm"
            variant="primary"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

function findNode(
  node: import('../../types').MindMapNode,
  id: string
): import('../../types').MindMapNode | null {
  if (node.id === id) return node;
  for (const child of node.children) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

// 搜索日志项组件
function SearchLogItem({ log }: { log: SearchLog }) {
  const getStatusIcon = () => {
    switch (log.status) {
      case 'searching':
        return <Loader2 className="w-3 h-3 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'failed':
        return <XCircle className="w-3 h-3 text-red-500" />;
      case 'skipped':
        return <CircleSlash className="w-3 h-3 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (log.status) {
      case 'searching':
        return 'text-blue-600 dark:text-blue-400';
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'failed':
        return 'text-red-600 dark:text-red-400';
      case 'skipped':
        return 'text-gray-500 dark:text-gray-400';
    }
  };

  return (
    <div className="text-xs p-2 rounded bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start gap-2">
        <div className="mt-0.5">{getStatusIcon()}</div>
        <div className="flex-1 min-w-0">
          <p className={`font-medium ${getStatusText()} truncate`}>
            {log.query}
          </p>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5">
            {log.message}
            {log.resultCount !== undefined && ` (${log.resultCount}条)`}
          </p>
        </div>
      </div>
    </div>
  );
}
