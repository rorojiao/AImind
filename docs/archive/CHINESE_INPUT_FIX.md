# 中文输入与删除顺序修复报告

**日期**: 2025-12-26
**问题**: 中文输入顺序错乱，删除顺序错误

---

## 🐛 问题分析

### 根本原因
使用受控组件（`value` state）与 `contentEditable` 配合时，React 的重新渲染会导致：
1. **光标位置重置** - 每次 state 更新都会重新渲染
2. **中文输入错乱** - IME 组合期间的状态更新导致字符出现在错误位置
3. **删除顺序错误** - state 与 DOM 不同步导致删除字符顺序混乱

### 为什么受控方式不行？
```typescript
// ❌ 错误方式 - 受控组件
const [value, setValue] = useState(content);

<div contentEditable onInput={(e) => setValue(e.currentTarget.textContent)}>
  {value}  {/* 每次 value 变化都会重新渲染，光标重置 */}
</div>
```

**问题流程**:
1. 用户输入 "你"
2. `onInput` 触发，更新 `value`
3. React 重新渲染组件
4. DOM 被替换，光标重置到开头
5. 下一个字符出现在开头，而不是后面

---

## ✅ 解决方案

### 使用非受控组件
直接操作 DOM，让 contentEditable 自己管理内容和光标位置：

```typescript
// ✅ 正确方式 - 非受控组件
const editorRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const editor = editorRef.current;
  if (!editor) return;

  // 直接设置 DOM 内容
  editor.textContent = content;

  // 聚焦并全选
  editor.focus();
  requestAnimationFrame(() => {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(editor);
    selection.removeAllRanges();
    selection.addRange(range);
  });
}, [content]);

// 不使用受控的 value
<div
  ref={editorRef}
  contentEditable
  onCompositionStart={() => isComposingRef.current = true}
  onCompositionEnd={() => {
    isComposingRef.current = false;
    // 恢复光标位置
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    selection.removeAllRanges();
    selection.addRange(range);
  }}
/>
```

### 关键改进

#### 1. **直接 DOM 操作**
```typescript
// 设置初始内容
editor.textContent = content;

// 读取内容
const textContent = editor.textContent?.trim() || '';
```

#### 2. **组合输入期间不更新状态**
```typescript
const handleInput = () => {
  // 不更新状态，让 contentEditable 自己处理 DOM
  // IME 组合期间不会触发重新渲染
};

// 只在组合结束时恢复光标
const handleCompositionEnd = () => {
  isComposingRef.current = false;
  // 恢复光标位置
  const selection = window.getSelection();
  if (selection) {
    const range = selection.getRangeAt(0);
    if (range) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }
};
```

#### 3. **使用 requestAnimationFrame**
```typescript
// 确保浏览器完成 DOM 更新后再操作
requestAnimationFrame(() => {
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(editor);
  selection.removeAllRanges();
  selection.addRange(range);
});
```

#### 4. **防止重复调用**
```typescript
const isFinishedRef = useRef(false);

const finishEditing = () => {
  if (isFinishedRef.current) return;
  isFinishedRef.current = true;

  // ... 完成编辑逻辑

  setTimeout(() => {
    isFinishedRef.current = false;  // 重置标志
  }, 0);
};
```

---

## 🎯 修复效果

### 修复前 ❌
- 输入中文：字符出现在最左边
- 删除字符：顺序混乱
- 光标位置：不断重置
- 用户体验：极差

### 修复后 ✅
- 输入中文：字符出现在光标位置正确
- 删除字符：正常删除
- 光标位置：稳定
- 用户体验：流畅

---

## 📊 技术细节

### ContentEditable 的特殊性

ContentEditable 是一个特殊的 HTML 属性，它让浏览器自己管理编辑状态：

1. **浏览器原生管理**
   - 光标位置
   - 文本选择
   - IME 组合输入
   - 撤销重做栈

2. **React 的重新渲染会干扰**
   - 替换 DOM 元素
   - 重置光标位置
   - 清除浏览器内部状态

3. **解决方案**
   - 使用非受控方式
   - 让浏览器自己管理
   - 只在必要时读取内容

### 为什么不使用 value prop？

```typescript
// ❌ 使用 value prop（受控）
<div contentEditable>{value}</div>
// 问题：每次 value 变化都会重新渲染整个 DOM

// ✅ 不使用 value prop（非受控）
<div contentEditable ref={editorRef} />
// 优势：浏览器自己管理，不会重置光标
```

---

## 🔍 测试场景

### 中文输入测试
- ✅ 输入：`你好世界`
- ✅ 顺序：从左到右正确显示
- ✅ 光标：跟随输入位置
- ✅ 删除：Backspace 从右到左删除

### 混合输入测试
- ✅ 中英文混合：`Hello世界123`
- ✅ 数字输入：`2025年12月`
- ✅ 符号输入：`你好！@#$%`

### 编辑操作测试
- ✅ 光标移动：方向键正常
- ✅ 文本选择：鼠标拖拽选择
- ✅ 全选：Ctrl+A 正常
- ✅ 复制粘贴：Ctrl+C/V 正常

---

## ✅ 最终代码特点

1. **非受控组件** - 不使用 `value` prop
2. **直接 DOM 操作** - 通过 ref 直接操作
3. **IME 友好** - 正确处理组合输入
4. **光标稳定** - 不会意外重置
5. **性能优化** - 减少不必要的渲染

---

## 🎉 总结

**关键原则**: ContentEditable 是一个"黑盒"，应该让浏览器自己管理它，而不是试图用 React state 去控制它。

**最佳实践**:
- ✅ 使用非受控方式
- ✅ 只在必要时读取 DOM 内容
- ✅ 组合输入期间不干扰
- ✅ 使用 ref 直接操作 DOM
- ❌ 不要使用受控的 value prop

**修复完成时间**: 2025-12-26 23:45
**测试状态**: ✅ 中文输入完全正常
**用户体验**: ✅ 流畅无卡顿
