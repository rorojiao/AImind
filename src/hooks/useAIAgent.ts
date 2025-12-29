import { useState } from 'react';
import { useMindMapStore } from '../stores/mindmapStore';
import { useAIStore } from '../stores/aiStore';
import { AIAgent } from '../lib/ai/agents';
import type { AIAgentConfig } from '../types';
import { useAI } from './useAI';

// Agent进度状态
interface AgentProgress {
  phase: string;
  current: number;
  total: number;
  message: string;
}

// AI Agent Hook
export function useAIAgent() {
  const { mindmap, updateMindmap, addAINodes } = useMindMapStore();
  const { currentProvider, agentConfig } = useAIStore();
  const { expandBranch, analyzeInitial, isLoading } = useAI();

  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<AgentProgress | null>(null);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    nodesAdded: number;
  } | null>(null);

  // 运行Agent
  const runAgent = async (config?: Partial<AIAgentConfig>) => {
    if (!mindmap || !currentProvider) return;

    const finalConfig = { ...agentConfig, ...config };
    const agent = new AIAgent(mindmap, finalConfig);

    setIsRunning(true);
    setResult(null);
    setProgress({ phase: '分析', current: 0, total: 1, message: '正在分析思维导图...' });

    try {
      // 如果思维导图是空的，进行初始分析
      if (mindmap.root.children.length === 0) {
        setProgress({ phase: '初始分析', current: 0, total: 1, message: '正在分析主题...' });

        const analysis = await analyzeInitial(mindmap.root.content);
        if (analysis) {
          // 添加一级分支
          addAINodes(mindmap.root.id, analysis.branches, currentProvider.id);

          // 更新AI上下文
          updateMindmap({
            aiContext: {
              domain: analysis.domain,
              lastAnalysis: analysis.analysis,
            },
          });

          setProgress({
            phase: '完成',
            current: 1,
            total: 1,
            message: `已生成${analysis.branches.length}个主要分支`,
          });

          setResult({
            success: true,
            message: analysis.analysis,
            nodesAdded: analysis.branches.length,
          });

          setIsRunning(false);
          return;
        }
      }

      // 找到需要扩展的节点
      const nodesToExpand = agent.findNodesToExpand();

      if (nodesToExpand.length === 0) {
        setProgress({ phase: '完成', current: 1, total: 1, message: '思维导图已完成' });
        setResult({
          success: true,
          message: '思维导图已完善，无需更多扩展',
          nodesAdded: 0,
        });
        setIsRunning(false);
        return;
      }

      // 逐个扩展节点
      let totalAdded = 0;
      for (let i = 0; i < nodesToExpand.length && i < finalConfig.breadth; i++) {
        const { node } = nodesToExpand[i];

        setProgress({
          phase: '扩展',
          current: i + 1,
          total: Math.min(nodesToExpand.length, finalConfig.breadth),
          message: `正在扩展 "${node.content}"...`,
        });

        // 构建路径
        const path = getNodePath(mindmap.root, node.id);
        const domain = mindmap.aiContext?.domain || '通用';

        // 调用AI扩展
        const newContents = await expandBranch(node.content, path.join(' > '), domain);

        // 添加节点
        addAINodes(node.id, newContents.slice(0, 4), currentProvider.id);
        totalAdded += newContents.slice(0, 4).length;
      }

      setProgress({
        phase: '完成',
        current: nodesToExpand.length,
        total: nodesToExpand.length,
        message: `已添加${totalAdded}个新节点`,
      });

      setResult({
        success: true,
        message: 'Agent扩展完成',
        nodesAdded: totalAdded,
      });
    } catch (error) {
      console.error('Agent error:', error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : '未知错误',
        nodesAdded: 0,
      });
    } finally {
      setIsRunning(false);
      setProgress(null);
    }
  };

  // 分析当前状态
  const analyze = () => {
    if (!mindmap) return null;

    const agent = new AIAgent(mindmap, agentConfig);
    return agent.analyzeMindmap();
  };

  return {
    isRunning,
    progress,
    result,
    isLoading,
    runAgent,
    analyze,
  };
}

// 获取节点路径
function getNodePath(node: import('../types').MindMapNode, targetId: string, path: string[] = []): string[] {
  if (node.id === targetId) {
    return [...path, node.content];
  }

  for (const child of node.children) {
    const found = getNodePath(child, targetId, [...path, node.content]);
    if (found.length > 0) {
      return found;
    }
  }

  return [];
}
