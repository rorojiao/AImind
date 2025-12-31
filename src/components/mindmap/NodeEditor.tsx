import React, { useEffect, useRef, useCallback, useState } from 'react';

interface NodeEditorProps {
  content: string;
  nodeStyle: import('../../types').NodeStyle;
  onFinish: (newContent: string) => void;
  onCancel: () => void;
}

// 组合输入标记
let isComposing = false;

export const NodeEditor: React.FC<NodeEditorProps> = ({
  content,
  nodeStyle,
  onFinish,
  onCancel,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const hasFinishedRef = useRef(false);

  // 完成编辑 - 简化逻辑
  const finishEditing = useCallback((shouldCancel: boolean = false) => {
    if (hasFinishedRef.current) return;

    const editor = editorRef.current;
    if (!editor) {
      hasFinishedRef.current = true;
      onCancel();
      return;
    }

    // 如果正在组合输入,不结束编辑
    if (isComposing) {
      return;
    }

    hasFinishedRef.current = true;
    const textContent = editor.textContent?.trim() || '';

    // 调用回调
    if (shouldCancel || !textContent) {
      onCancel();
    } else {
      onFinish(textContent);
    }
  }, [onFinish, onCancel]);

  // Blur 处理：点击外部时触发
  const handleBlur = useCallback(() => {
    // 使用 setTimeout 确保在其他事件处理之后执行
    setTimeout(() => {
      if (!hasFinishedRef.current && !isComposing) {
        finishEditing();
      }
    }, 10);
  }, [finishEditing]);

  // 键盘处理
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (isComposing) {
        e.preventDefault();
        return;
      }
      e.preventDefault();
      finishEditing(false);
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      finishEditing(true);
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      return;
    }
  }, [finishEditing]);

  // 组合输入开始
  const handleCompositionStart = useCallback(() => {
    isComposing = true;
  }, []);

  // 组合输入结束
  const handleCompositionEnd = useCallback(() => {
    isComposing = false;
  }, []);

  // 初始化编辑器
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || isInitialized) return;

    // 设置初始内容
    editor.textContent = content;

    // 聚焦并全选文本
    editor.focus();

    // 延迟选择,确保 DOM 已准备好
    requestAnimationFrame(() => {
      if (!hasFinishedRef.current) {
        const selection = window.getSelection();
        if (selection && editor.childNodes.length > 0) {
          const range = document.createRange();
          range.selectNodeContents(editor);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    });

    setIsInitialized(true);

    // 注意: 移除了清理函数,避免组件重渲染时意外结束编辑
    // 编辑只应在以下情况结束:
    // 1. 用户按 Enter 完成编辑
    // 2. 用户按 Escape 取消编辑
    // 3. 编辑器失去焦点 (onBlur)
  }, [content, isInitialized]);

  return (
    <div
      ref={editorRef}
      contentEditable
      suppressContentEditableWarning
      className="w-full h-full flex items-center justify-center px-3 outline-none"
      style={{
        color: nodeStyle.textColor,
        fontSize: `${nodeStyle.fontSize}px`,
        fontWeight: nodeStyle.fontWeight,
        fontFamily: nodeStyle.fontFamily,
        fontStyle: nodeStyle.fontStyle,
        textDecoration: nodeStyle.textDecoration,
        textAlign: nodeStyle.textAlign as any,
        cursor: 'text',
      }}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    />
  );
};
