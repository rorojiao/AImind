# 🔥 编辑状态Bug防范规则

## 📋 问题档案

**Bug名称**: 编辑状态无法结束
**严重级别**: 🔴 Critical
**复发次数**: 2次
**最后修复**: 2025-12-29

---

## 🔍 根本原因分析

### 1. 事件时序竞态条件
```
时间线:
t0: 用户输入中文
t1: compositionstart触发
t2: 用户立即点击外部
t3: blur触发
t4: setTimeout(10ms)创建
t5: 10ms后检查状态
t6: 调用finishEditing()
问题: 此时可能还在组合输入中!
```

### 2. 闭包陷阱
```typescript
// ❌ 问题代码
const handleBlur = useCallback(() => {
  setTimeout(() => {
    finishEditing(); // 闭包中的旧引用!
  }, 10);
}, [finishEditing]);

// 问题: 父组件重新渲染后
// - finishEditing重新创建
// - setTimeout中仍是旧版本
// - 导致调用过期的回调
```

### 3. 状态管理混乱
```typescript
// ❌ 问题: 多个独立flag
const isComposingRef = useRef(false);
const isFinishedRef = useRef(false);

// 问题:
// - blur检查isComposingRef
// - 但compositionend可能在blur之后触发
// - 两个状态不同步
```

---

## ✅ 防范规则 (永久性解决方案)

### 规则 #1: 单一状态源
```typescript
// ❌ 错误
const isComposingRef = useRef(false);
const isFinishedRef = useRef(false);
const isEditingRef = useRef(false);

// ✅ 正确: 使用枚举统一管理
type EditState = 'idle' | 'editing' | 'composing' | 'finishing';
const editStateRef = useRef<EditState>('idle');

// 优点:
// - 状态明确,不会有冲突
// - 可以添加状态转换验证
// - 易于调试
```

### 规则 #2: Ref存储最新回调
```typescript
// ❌ 错误
const handleBlur = useCallback(() => {
  setTimeout(() => finishEditing(), 10);
}, [finishEditing]); // 依赖会导致重新创建

// ✅ 正确
const finishEditingRef = useRef(finishEditing);
finishEditingRef.current = finishEditing; // 每次渲染更新

const handleBlur = useCallback(() => {
  setTimeout(() => finishEditingRef.current?.(), 10);
}, []); // 无依赖,永远稳定

// 优点:
// - 始终使用最新版本的回调
// - 不会因父组件重新渲染而出问题
// - 避免闭包陷阱
```

### 规则 #3: 事件优先级队列
```typescript
// ❌ 错误: 立即执行
onBlur={() => finishEditing()}

// ✅ 正确: 双层延迟确保时序
onBlur={() => {
  // Layer 1: requestAnimationFrame (等待浏览器重绘)
  requestAnimationFrame(() => {
    // Layer 2: setTimeout 0 (等待事件循环末尾)
    setTimeout(() => {
      // 此时compositionend已触发
      if (editStateRef.current !== 'composing') {
        finishEditing();
      }
    }, 0);
  });
}}

// 时序保证:
// blur → compositionend → rAF → setTimeout → finishEditing
```

### 规则 #4: 状态转换验证
```typescript
// ✅ 添加状态转换验证
const setState = (newState: EditState) => {
  const current = editStateRef.current;

  // 定义合法的状态转换
  const transitions: Record<EditState, EditState[]> = {
    'idle': ['editing'],
    'editing': ['composing', 'finishing'],
    'composing': ['editing', 'finishing'],
    'finishing': ['idle'],
  };

  if (!transitions[current].includes(newState)) {
    console.error(`非法状态转换: ${current} → ${newState}`);
    return;
  }

  editStateRef.current = newState;
};
```

### 规则 #5: 清理副作用
```typescript
// ✅ 清理所有定时器和副作用
useEffect(() => {
  return () => {
    // 清理定时器
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // 清理状态
    if (editStateRef.current === 'editing') {
      editStateRef.current = 'finishing';
    }
  };
}, []);
```

### 规则 #6: 调试日志 (开发模式)
```typescript
const DEBUG = process.env.NODE_ENV === 'development';

const logTransition = (from: EditState, to: EditState, reason: string) => {
  if (DEBUG) {
    console.log(`[NodeEditor] State: ${from} → ${to}`, {
      reason,
      content: editorRef.current?.textContent,
      stackTrace: new Error().stack,
    });
  }
};

// 使用
editStateRef.current = 'composing';
logTransition('editing', 'composing', 'compositionstart');
```

---

## 🚨 检测清单

每次修改编辑相关代码时,必须检查:

- [ ] 是否使用了单一状态源?
- [ ] 回调函数是否用ref存储?
- [ ] 是否有事件时序问题?
- [ ] 是否清理了所有定时器?
- [ ] 是否处理了组件卸载?
- [ ] 是否在开发模式添加了日志?
- [ ] 是否测试了中文输入?
- [ ] 是否测试了快速点击?
- [ ] 是否测试了父组件重新渲染?

---

## 🧪 测试用例

### 测试1: 中文输入后立即点击外部
```typescript
// 步骤:
1. 进入编辑模式
2. 输入中文 (触发compositionstart)
3. 立即点击外部 (触发blur)
4. 等待compositionend

// 预期: 编辑正常结束,保存中文内容
```

### 测试2: 快速连续操作
```typescript
// 步骤:
1. 进入编辑模式
2. 快速输入
3. 立即按Enter
4. 立即点击下一节点

// 预期: 第一个节点编辑结束,第二个节点进入编辑
```

### 测试3: 父组件重新渲染
```typescript
// 步骤:
1. 进入编辑模式
2. 触发父组件重新渲染 (如其他节点变化)
3. 继续输入
4. 点击外部

// 预期: 编辑正常结束,使用最新的回调
```

---

## 📝 修复记录

| 日期 | 问题 | 方案 | 结果 |
|------|------|------|------|
| 2025-12-29 初 | 编辑无法结束 | rAF → setTimeout(10ms) | ❌ 复发 |
| 2025-12-29 今 | 编辑无法结束 | **完整重构状态管理** | ✅ 待验证 |

**关键改进**:
1. 单一状态枚举
2. Ref存储回调
3. 双层延迟
4. 状态转换验证
5. 完整清理逻辑

---

## 🎯 永久性原则

### 1. 状态管理原则
- **一个状态源**: 使用枚举,不用多个boolean
- **明确转换**: 状态转换必须有明确路径
- **防御性编程**: 检查非法状态

### 2. 事件处理原则
- **延迟执行**: 使用rAF+setTimeout双层延迟
- **优先级明确**: compositionend > blur
- **清理定时器**: 立即清除旧定时器

### 3. 回调函数原则
- **Ref存储**: 始终用ref存储最新回调
- **稳定依赖**: useCallback避免依赖变化
- **闭包陷阱**: 注意异步操作中的闭包

### 4. 组件生命周期原则
- **清理副作用**: useEffect必须清理
- **状态重置**: 卸载时重置状态
- **防止泄漏**: 定时器、事件监听器必须清理

---

**重要**: 此文档是永久性参考,任何编辑相关代码修改前必须阅读!
