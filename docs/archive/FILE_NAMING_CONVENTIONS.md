# 文件命名规范与预防措施

**日期**: 2025-12-26
**问题**: 带空格的文件名导致 404 错误反复出现

---

## 🐛 问题描述

在 Windows 系统上，某些工具（如编辑器、文件管理器）会在文件名中添加空格，导致：
1. 文件名变成 `MindMapCanvas 2.tsx` 而不是 `MindMapCanvas.tsx`
2. TypeScript/导入路径找不到文件
3. 404 错误：`Failed to load resource`

---

## ✅ 解决方案

### 1. 立即修复（已完成）
```bash
# 删除所有带空格的文件
find src -type f \( -name "* 2*" -o -name "* *.ts" -o -name "* *.tsx" \) -delete

# 或手动重命名
mv "MindMapCanvas 2.tsx" MindMapCanvas.tsx
```

### 2. 预防措施

#### 配置 Git 忽略规则
在 `.gitignore` 中添加：
```gitignore
# 忽略带空格的文件
* 2.*
* *.ts
* *.tsx
* *.js
* *.jsx
```

#### 配置 EditorConfig
创建 `.editorconfig`：
```ini
[*.ts]
[*.tsx]
insert_final_newline = true
trim_trailing_whitespace = true
```

#### VSCode 设置
在 `.vscode/settings.json` 中添加：
```json
{
  "files.trimTrailingWhitespace": true,
  "files.insertFinalNewline": true,
  "files.exclude": {
    "**/* 2.*": true,
    "**/* *.ts": true,
    "**/* *.tsx": true
  }
}
```

---

## 📋 文件命名规范

### ✅ 正确的命名
- `MindMapCanvas.tsx` ✅
- `NodeEditor.tsx` ✅
- `useToast.ts` ✅
- `mindmapStore.ts` ✅

### ❌ 错误的命名
- `MindMapCanvas 2.tsx` ❌
- `NodeEditor 2.tsx` ❌
- `index 2.css` ❌
- `App 2.tsx` ❌

---

## 🔍 检查脚本

### 添加到 package.json
```json
{
  "scripts": {
    "check-filenames": "find src -type f \\( -name '* 2.*' -o -name '* *.ts' -o -name '* *.tsx' \\)",
    "fix-filenames": "find src -type f \\( -name '* 2.*' -o -name '* *.ts' -o -name '* *.tsx' \\) -delete"
  }
}
```

### 使用方法
```bash
# 检查是否有问题文件
npm run check-filenames

# 自动删除问题文件
npm run fix-filenames
```

---

## 🛠️ 工具建议

### 避免使用的工具
- ❌ Windows 资源管理器复制粘贴（可能产生空格）
- ❌ 某些编辑器的自动保存功能

### 推荐使用的工具
- ✅ Git Bash / WSL 命令行
- ✅ VSCode 集成终端
- ✅ npm/yarn 命令

---

## 📝 最佳实践

### 1. 使用命令行操作文件
```bash
# 正确的复制
cp MindMapCanvas.tsx MindMapCanvas.backup.tsx

# 错误的复制（可能产生空格）
# 使用文件管理器复制粘贴
```

### 2. 提交前检查
```bash
# 提交前运行检查
npm run check-filenames
tsc --noEmit
```

### 3. Git 钩子
创建 `.git/hooks/pre-commit`：
```bash
#!/bin/bash
# 检查是否有带空格的文件
if find src -type f \( -name "* 2.*" -o -name "* *.ts" \) | grep -q .; then
  echo "❌ 发现带空格的文件！请先修复。"
  find src -type f \( -name "* 2.*" -o -name "* *.ts" \)
  exit 1
fi
```

---

## 🎯 总结

1. **使用命令行操作文件** - 避免图形界面问题
2. **定期检查文件名** - 使用 `find` 命令
3. **配置编辑器设置** - 自动清理空格
4. **添加 Git 钩子** - 防止提交问题文件
5. **立即删除带空格文件** - 不要累积

**当前状态**: ✅ 所有文件已修复，无带空格文件

**维护策略**: 每次编译前运行 `npm run check-filenames`
