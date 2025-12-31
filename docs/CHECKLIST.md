# AImind 开发检查清单

## ⚡ 自动检查（已启用）

### Git 提交前自动检查
每次 `git commit` 时会自动运行：
- TypeScript 类型检查 (`npm run type-check`)
- 如果检查失败，提交会被阻止

### 构建前自动检查
每次 `npm run build` 时会自动运行：
- TypeScript 编译检查
- Vite 构建检查

---

## 修改代码前必读

### 1. 类型安全检查
- [ ] 新增接口/类型后，确保所有使用该类型的地方都更新了
- [ ] 添加了新的必需属性后，检查所有创建该对象的地方是否都包含该属性
- [ ] 未使用的变量/导入必须删除（使用 `_` 前缀或移除）

### 2. 导入路径检查
- [ ] 新的导入路径必须验证文件存在
- [ ] 避免相对路径 `../lib/api/xxx`，确认实际目录结构
- [ ] 使用 Glob 工具搜索文件是否存在

### 3. 状态管理检查 (Zustand)
- [ ] 更新嵌套对象必须使用深拷贝：`deepClone(obj)` 或 `JSON.parse(JSON.stringify(obj))`
- [ ] 不要使用浅拷贝 `{ ...obj }` 更新嵌套数据
- [ ] 更新后必须设置 `modified: Date.now()`

### 4. 新文件创建检查
- [ ] 新建组件文件后，立即在 `App.tsx` 或其他地方引入使用
- [ ] 新建工具函数后，立即创建对应的调用方
- [ ] 如果函数只是"预留接口"，添加 `TODO` 注释说明

### 5. 构建验证
- [ ] 每次修改后必须运行 `npm run build` 验证
- [ ] 修复所有 TypeScript 错误，不能容忍任何错误
- [ ] 如果是"预留功能"，使用空实现而非报错

---

## 常见错误及解决方案

### 错误1: Property 'xxx' is missing
**原因**: 添加了新的必需属性到接口，但创建对象时未包含

**解决**:
```typescript
// ❌ 错误
const data: MindMapData = { id: '1', title: 'test' }; // 缺少 edgeStyle

// ✅ 正确
const data: MindMapData = {
  id: '1',
  title: 'test',
  edgeStyle: 'curve', // 添加所有必需属性
  // ... 其他属性
};
```

### 错误2: Cannot find module '../lib/xxx'
**原因**: 导入路径错误或文件不存在

**解决**:
```bash
# 先用 Glob 确认文件位置
glob "**/searchApi.ts"  # 搜索文件

# 然后使用正确的导入路径
import { searchMultiple } from '../lib/ai/searchEngine';
```

### 错误3: 状态更新不触发渲染
**原因**: 使用浅拷贝更新嵌套对象

**解决**:
```typescript
// ❌ 错误 - 浅拷贝
set({ mindmap: { ...state.mindmap, root: newRoot } });

// ✅ 正确 - 深拷贝
set({ mindmap: deepClone({ ...state.mindmap, root: newRoot }) });

// ✅ 或使用 loadMindmap
useMindMapStore.getState().loadMindmap(updatedMindmap);
```

### 错误4: Variable is declared but its value is never read
**原因**: 未使用的变量

**解决**:
```typescript
// ❌ 错误
const { setTheme } = useMindMapStore();

// ✅ 正确 - 移除未使用的解构
const { mindmap, setLayout } = useMindMapStore();

// ✅ 或使用 _ 前缀表示有意不使用
const { setTheme: _setTheme } = useMindMapStore();
```

---

## 修改代码的标准流程

1. **修改前**
   - 阅读相关代码，理解现有逻辑
   - 用 Glob/Grep 搜索可能影响的其他文件
   - 列出需要修改的所有文件清单

2. **修改中**
   - 一次修改一个问题，避免大批量修改
   - 每修改一个文件，立即保存并检查语法
   - 新增的接口/类型立即添加到所有必需位置

3. **修改后**
   - 运行 `npm run type-check` 快速检查类型错误
   - 运行 `npm run build` 验证完整构建
   - 运行开发服务器检查运行时错误
   - 测试相关功能是否正常

4. **提交时** 🚫 自动检查会执行
   - Git 提交时自动运行类型检查
   - 如果有错误，提交会被阻止
   - 修复错误后再次提交

   ```bash
   # 手动运行检查（可选）
   npm run type-check
   ```
