import React, { useEffect, useRef, useCallback } from 'react';

interface NodeEditorProps {
  content: string;
  nodeStyle: import('../../types').NodeStyle;
  onFinish: (newContent: string) => void;
  onCancel: () => void;
}

// 编辑状态枚举 - 统一状态管理
type EditState = 'idle' | 'editing' | 'composing' | 'finishing';

export const NodeEditor: React.FC<NodeEditorProps> = ({
  content,
  nodeStyle,
  onFinish,
  onCancel,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const editStateRef = useRef<EditState>('idle');
  const finishTimerRef = useRef<number | null>(null);

  // 使用ref存储最新回调,避免闭包陷阱
  const finishEditingRef = useRef<(shouldCancel?: boolean) => void>(() => {});
  finishEditingRef.current = useCallback((shouldCancel: boolean = false) => {
    // 防止重复调用和非法状态
    if (editStateRef.current === 'finishing' || editStateRef.current === 'idle') {
      return;
    }

    const editor = editorRef.current;
    if (!editor) {
      editStateRef.current = 'finishing';
      onCancel();
      return;
    }

    // 如果正在组合输入,不结束编辑
    if (editStateRef.current === 'composing') {
      return;
    }

    const textContent = editor.textContent?.trim() || '';

    // 设置为结束状态
    editStateRef.current = 'finishing';

    // 清除可能存在的定时器
    if (finishTimerRef.current !== null) {
      clearTimeout(finishTimerRef.current);
      finishTimerRef.current = null;
    }

    // 调用回调
    if (shouldCancel || !textContent) {
      onCancel();
    } else {
      onFinish(textContent);
    }
  }, [onFinish, onCancel]);

  // 创建稳定的finishEditing函数,不依赖其他状态
  const finishEditing = useCallback((shouldCancel?: boolean) => {
    finishEditingRef.current(shouldCancel);
  }, []);

  // Blur 处理：点击外部时触发
  // 使用事件优先级队列: blur → compositionend → finishEditing
  const handleBlur = useCallback(() => {
    // 立即清除可能存在的定时器
    if (finishTimerRef.current !== null) {
      clearTimeout(finishTimerRef.current);
    }

    // 使用双层延迟确保在所有事件之后执行
    // requestAnimationFrame: 等待浏览器重绘
    // setTimeout(..., 0): 等待事件循环末尾
    requestAnimationFrame(() => {
      setTimeout(() => {
        // 检查状态: 只有非组合输入且未结束时才完成
        if (editStateRef.current !== 'composing' && editStateRef.current !== 'finishing' && editStateRef.current !== 'idle') {
          finishEditing();
        }
      }, 0);
    });
  }, [finishEditing]);

  // 键盘处理
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // 只在编辑状态下响应
    if (editStateRef.current !== 'editing' && editStateRef.current !== 'composing') {
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      // 组合输入时不响应
      if (editStateRef.current === 'composing') {
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
    editStateRef.current = 'composing';
  }, []);

  // 组合输入结束
  const handleCompositionEnd = useCallback(() => {
    if (editStateRef.current === 'composing') {
      editStateRef.current = 'editing';
    }
  }, []);

  // 输入处理
  const handleInput = useCallback(() => {
    // 确保在输入时状态正确
    if (editStateRef.current === 'idle' || editStateRef.current === 'finishing') {
      editStateRef.current = 'editing';
    }
  }, []);

  // 初始化编辑器
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    // 如果已经结束,不执行任何操作
    if (editStateRef.current === 'finishing') return;

    // 设置初始内容
    editor.textContent = content;

    // 设置状态为编辑中
    editStateRef.current = 'editing';

    // 聚焦并全选文本
    editor.focus();

    // 延迟选择,确保 DOM 已准备好
    requestAnimationFrame(() => {
      if (editStateRef.current === 'finishing') return;

      const selection = window.getSelection();
      if (selection && editor.childNodes.length > 0) {
        const range = document.createRange();
        range.selectNodeContents(editor);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    });

    // 清理函数:组件卸载时确保编辑状态结束
    return () => {
      // 清除定时器
      if (finishTimerRef.current !== null) {
        clearTimeout(finishTimerRef.current);
      }

      // 设置为结束状态
      if (editStateRef.current === 'editing' || editStateRef.current === 'composing') {
        editStateRef.current = 'finishing';
      }
    };
  }, [content]);

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
      onInput={handleInput}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    />
  );
};
