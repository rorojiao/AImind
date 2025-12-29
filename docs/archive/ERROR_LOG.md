# AImind 错误日志与预防规则

**项目**: AImind - AI Powered Mind Mapping Tool
**版本**: v1.0.0
**维护**: Claude Code AI
**最后更新**: 2025-12-28

---

## 📋 目录

1. [已发生的错误](#已发生的错误)
2. [预防检查清单](#预防检查清单)
3. [修复后的验证步骤](#修复后的验证步骤)
4. [项目开发规则](#项目开发规则)

---

## 🐛 已发生的错误

### 错误 #1: 文件名带空格导致 404 错误

**错误日期**: 2025-12-26, 2025-12-28
**严重级别**: 🔴 严重（导致页面空白）
**发生频率**: 反复出现（3次以上）

#### 错误描述
Windows 系统或编辑器自动将文件名添加空格或数字后缀：
- `NodeEditor.tsx` → `NodeEditor 2.tsx`
- `MindMapCanvas.tsx` → `MindMapCanvas 2.tsx`

导致 TypeScript 编译错误：
```
error TS2307: Cannot find module './NodeEditor' or its corresponding type declarations.
```

#### 根本原因
1. Windows 文件系统在某些操作时会自动添加空格
2. 编辑器自动保存功能可能创建副本
3. 使用图形界面（资源管理器）复制粘贴文件

#### 修复方案
```bash
# 1. 删除带空格的文件
rm "NodeEditor 2.tsx"

# 2. 重新创建正确命名的文件
# 通过 Write 工具创建 NodeEditor.tsx

# 3. 验证修复
tsc --noEmit
```

#### 预防措施
- ✅ 添加了 `fix-filenames.sh` 自动清理脚本
- ✅ 配置 npm pre-hooks（predev, prebuild, pretauri:dev）
- ✅ 创建 `.gitignore` 规则忽略带空格文件
- ✅ 使用命令行操作，避免图形界面

---

### 错误 #2: React key 警告

**错误日期**: 2025-12-26
**严重级别**: 🟡 中等（React 控制台警告）
**发生频率**: 一次性

#### 错误描述
```
Warning: Each child in a list should have a unique 'key' prop.
Check the render method of `MindMapCanvas`.
```

#### 根本原因
递归渲染节点时，`node.children.map(renderNodes)` 没有提供 key。

#### 修复方案
```typescript
// 修复前
{node.children.map(renderNodes)}

// 修复后
{node.children.map((child) => (
  <React.Fragment key={child.id}>
    {renderNodes(child)}
  </React.Fragment>
))}
```

#### 预防措施
- ✅ 所有 `map()` 渲染必须添加 `key` prop
- ✅ 使用 React.Fragment 包装列表项
- ✅ 递归渲染特别要注意 key 的传递

---

### 错误 #3: 连接线位置错误

**错误日期**: 2025-12-26
**严重级别**: 🟠 中高（功能缺陷）
**发生频率**: 一次性

#### 错误描述
连接线没有正确连接到节点边缘，位置偏移。

#### 根本原因
SVG 坐标系统与节点坐标系统不匹配：
- SVG 有偏移：`left: bounds.minX - 100, top: bounds.minY - 100`
- 节点坐标是绝对坐标，没有减去 SVG 偏移

#### 修复方案
```typescript
// 1. 创建 nodeUtils.ts 工具库
// 2. 在 renderEdges 中转换坐标
const svgStartX = startX - svgOffsetX;
const svgStartY = startY - svgOffsetY;
```

#### 预防措施
- ✅ 使用统一的工具函数计算节点位置
- ✅ SVG 坐标转换必须考虑偏移量
- ✅ 详细文档记录在 `CONNECTION_FIX.md`

---

### 错误 #4: 节点编辑后无法恢复

**错误日期**: 2025-12-26
**严重级别**: 🟠 中高（功能缺陷）
**发生频率**: 一次性

#### 错误描述
双击编辑节点后，节点无法从编辑状态恢复到可选择状态。

#### 根本原因
`finishingRef` 防重复逻辑有问题，导致回调没有被调用。

#### 修复方案
```typescript
// 添加 timeout 延迟清理
const finishEditing = () => {
  if (isFinishedRef.current) return;
  isFinishedRef.current = true;

  // ...

  setTimeout(() => {
    isFinishedRef.current = false;
  }, 0);
};
```

#### 预防措施
- ✅ 使用标志位防止重复调用
- ✅ blur 事件要特殊处理（异步触发）

---

### 错误 #5: 中文输入顺序错乱

**错误日期**: 2025-12-26
**严重级别**: 🔴 严重（核心功能缺陷）
**发生频率**: 一次性（修复后稳定）

#### 错误描述
输入中文时，字符出现在错误的位置（最左边），删除顺序也混乱。

#### 根本原因
使用受控组件（`value` state）与 contentEditable 配合：
- 每次 state 更新触发 React 重新渲染
- DOM 被替换，光标位置重置
- IME 组合期间的更新导致字符错位

#### 修复方案
```typescript
// 改为非受控组件
// 1. 不使用 value prop
// 2. 直接操作 DOM: editor.textContent = content
// 3. IME 组合期间不更新状态
// 4. 使用 requestAnimationFrame 延迟光标操作
```

#### 预防措施
- ✅ ContentEditable 必须使用非受控方式
- ✅ 不使用 `value` prop
- ✅ IME 组合期间禁止状态更新
- ✅ 详细文档记录在 `CHINESE_INPUT_FIX.md`

---

### 错误 #6: 编辑状态无法退出

**错误日期**: 2025-12-28
**严重级别**: 🔴 严重（核心功能缺陷）
**发生频率**: 反复出现（2次）

#### 错误描述
修复中文输入后，编辑状态无法正常退出，节点停留在编辑模式。

#### 根本原因演进

**第一次尝试**:
```typescript
// 使用 setTimeout 延迟回调
setTimeout(() => {
  onFinish(textContent);
}, 0);
```
问题：延迟导致回调在组件卸载后执行

**第二次尝试**:
```typescript
// Enter 键调用 blur()
editorRef.current?.blur();
```
问题：blur 是异步事件，时序问题导致状态混乱

#### 最终修复方案
```typescript
// 1. Enter/Escape 直接调用回调，不依赖 blur
if (e.key === 'Enter') {
  e.preventDefault();
  finishEditing(false);  // 直接调用
  return;
}

// 2. Blur 使用 requestAnimationFrame 延迟
const handleBlur = () => {
  requestAnimationFrame(() => {
    if (!isFinishedRef.current) {
      finishEditing(false);
    }
  });
};

// 3. 所有函数使用 useCallback 缓存
const finishEditing = useCallback(..., [onFinish, onCancel]);
```

#### 预防措施
- ✅ 能同步执行的就不要异步
- ✅ Enter/Escape 直接调用回调
- ✅ Blur 事件延迟处理（避免冲突）
- ✅ 所有事件处理函数使用 useCallback
- ✅ 详细文档记录在 `NODE_EDIT_FINAL_FIX.md`

---

## ✅ 预防检查清单

### 每次修改代码后必须执行：

#### 1. TypeScript 编译检查
```bash
tsc --noEmit
```
**预期结果**: 无错误
**如果失败**: 检查文件名、导入路径、类型定义

#### 2. 文件名检查
```bash
find src -type f \( -name "* *.ts" -o -name "* *.tsx" -o -name "* 2.*" \)
```
**预期结果**: 无输出
**如果找到**: 运行 `npm run fix-filenames`

#### 3. React 警告检查
- 打开浏览器控制台
- 查看是否有 React warnings
- 常见警告：key prop、deprecated APIs

#### 4. 功能测试
- [ ] 创建节点
- [ ] 编辑节点（双击）
- [ ] 删除节点
- [ ] 中文输入测试
- [ ] Enter 保存
- [ ] Escape 取消
- [ ] 点击外部保存
- [ ] 拖拽节点

---

## 🔍 修复后的验证步骤

### 任何 Bug 修复后必须执行：

1. **编译验证**
   ```bash
   tsc --noEmit
   ```
   ✅ 必须通过

2. **文件名检查**
   ```bash
   npm run fix-filenames
   ```
   ✅ 必须清理

3. **功能验证**
   - 重启开发服务器
   - 刷新浏览器
   - 测试修复的功能
   - 测试相关功能

4. **边界测试**
   - 快速操作
   - 极端输入
   - 并发操作

5. **控制台检查**
   - 无 React warnings
   - 无 TypeScript errors
   - 无 runtime errors

---

## 📚 项目开发规则

### 核心原则

#### 1. 文件命名规则
- ✅ 正确: `NodeEditor.tsx`, `MindMapCanvas.tsx`
- ❌ 错误: `NodeEditor 2.tsx`, `MindMap Canvas.tsx`
- 📝 规则: 使用驼峰命名，无空格，无数字后缀

#### 2. React 组件规则
- ✅ 所有 `map()` 必须有 `key` prop
- ✅ 递归渲染使用 `Fragment` + `key`
- ✅ 事件处理函数使用 `useCallback`
- ✅ Props 接口明确定义

#### 3. ContentEditable 规则
- ✅ 必须使用非受控组件
- ❌ 禁止使用 `value` prop
- ✅ 直接操作 DOM: `editor.textContent`
- ✅ IME 组合期间不更新状态
- ✅ Enter/Escape 直接调用回调

#### 4. 坐标系统规则
- ✅ 使用统一的工具函数（`nodeUtils.ts`）
- ✅ SVG 坐标转换必须考虑偏移
- ✅ 节点位置 = 绝对坐标
- ✅ SVG 内部坐标 = 绝对坐标 - SVG 偏移

#### 5. 状态管理规则
- ✅ 使用不可变更新（spread operators）
- ✅ 使用标志位防止重复调用
- ✅ 能同步的不要异步
- ✅ 异步事件要延迟处理（requestAnimationFrame）

#### 6. TypeScript 规则
- ✅ 严格模式启用
- ✅ 禁用 `any` 类型
- ✅ 明确的接口定义
- ✅ 正确的导入路径

---

## 🚨 紧急修复流程

当发现问题时：

1. **立即止损**
   ```bash
   # 停止开发服务器
   # Ctrl+C

   # 检查文件名
   npm run fix-filenames

   # 编译检查
   tsc --noEmit
   ```

2. **定位问题**
   - 阅读错误消息
   - 查看控制台
   - 对比最近修改

3. **参考日志**
   - 搜索本文档中的相似错误
   - 查看修复方案
   - 应用相同的修复方法

4. **验证修复**
   - 执行"修复后的验证步骤"
   - 测试所有相关功能
   - 记录到本文档

5. **更新日志**
   - 在本文档中记录新错误
   - 更新预防措施
   - 分享给团队

---

## 📊 错误统计

### 按类型分类
- 文件名问题: 3次 🔴
- 编辑状态问题: 2次 🔴
- 中文输入问题: 1次 🔴
- React 警告: 1次 🟡
- 连接线问题: 1次 🟠

### 按严重级别
- 🔴 严重: 4个
- 🟠 中高: 2个
- 🟡 中等: 1个

### 按解决状态
- ✅ 已解决: 7个
- ⚠️ 可能复发: 2个（文件名问题、编辑状态问题）

---

## 🎯 持续改进

### 待解决的问题
1. **文件名问题反复出现**
   - 需要找到根本原因（Windows/编辑器）
   - 可能需要更换编辑器或配置
   - 考虑使用文件监控工具

2. **编辑状态的时序问题**
   - 虽然已修复，但可能还有边界情况
   - 需要更完善的测试覆盖
   - 考虑使用状态机模式

### 长期改进计划
1. 添加单元测试（Jest + React Testing Library）
2. 添加 E2E 测试（Playwright）
3. 配置 CI/CD 自动检查
4. 添加 ESLint 规则强制代码规范
5. 添加 Prettier 自动格式化

---

## 📖 参考文档

### 内部文档
- `CLAUDE.md` - 项目架构和开发指南
- `CHINESE_INPUT_FIX.md` - 中文输入修复详细说明
- `NODE_EDIT_FINAL_FIX.md` - 编辑状态修复详细说明
- `CONNECTION_FIX.md` - 连接线修复详细说明
- `FILE_NAMING_CONVENTIONS.md` - 文件命名规范
- `Filename_Issue_Solution.md` - 文件名问题解决方案

### 外部资源
- [React ContentEditable 最佳实践](https://react.dev/reference/react-dom/components/input#contenteditable-or-designrichlyeditable-inputs)
- [IME 组合输入处理](https://developer.mozilla.org/en-US/docs/Web/API/CompositionEvent)
- [React keys 详解](https://react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key)

---

**文档维护**: 每次出现新错误或修复时更新本文档
**最后审核**: 2025-12-28
**状态**: ✅ 活跃维护中
