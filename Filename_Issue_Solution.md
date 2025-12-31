# 文件名空格问题 - 紧急修复报告

**日期**: 2025-12-28
**问题**: NodeEditor.tsx 文件被自动重命名为 "NodeEditor 2.tsx"（带空格）

---

## 🚨 紧急情况

### 问题描述
页面一片空白，TypeScript 编译错误：
```
error TS2307: Cannot find module './NodeEditor' or its corresponding type declarations.
```

### 根本原因
Windows 系统或编辑器在保存文件时，自动将 `NodeEditor.tsx` 重命名为 `NodeEditor 2.tsx`。

**这是反复出现的问题！**

### 修复步骤
1. 删除带空格的文件：`rm "NodeEditor 2.tsx"`
2. 重新创建正确命名的文件：`NodeEditor.tsx`
3. TypeScript 编译通过

---

## 🛠️ 预防措施

### 1. 添加 npm 脚本

在 `package.json` 中添加：

```json
{
  "scripts": {
    "check-filenames": "bash fix-filenames.sh",
    "predev": "bash fix-filenames.sh",
    "prebuild": "bash fix-filenames.sh",
    "pretauri:dev": "bash fix-filenames.sh"
  }
}
```

### 2. 创建 Git 钩子

创建 `.git/hooks/pre-commit`：

```bash
#!/bin/bash
# 检查是否有带空格的文件
if find src -type f \( -name "* 2.*" -o -name "* *.ts" -o -name "* *.tsx" \) | grep -q .; then
  echo "❌ 发现带空格的文件！请先修复。"
  find src -type f \( -name "* 2.*" -o -name "* *.ts" -o -name "* *.tsx" \)
  exit 1
fi
```

### 3. 配置 .gitignore

在 `.gitignore` 中添加：

```gitignore
# 忽略带空格的文件
* 2.*
* *.ts
* *.tsx
* *.js
* *.jsx
```

### 4. VSCode 设置

在 `.vscode/settings.json` 中添加：

```json
{
  "files.exclude": {
    "**/* 2.*": true,
    "**/* *.ts": true,
    "**/* *.tsx": true
  },
  "files.trimTrailingWhitespace": true,
  "files.insertFinalNewline": true
}
```

---

## 🔍 检查命令

### 手动检查
```bash
cd "m:\iCloudDrive\Documents\cursorAPP\AImind"
find src -type f \( -name "* *.ts" -o -name "* *.tsx" -o -name "* 2.*" \)
```

### 自动修复
```bash
cd "m:\iCloudDrive\Documents\cursorAPP\AImind"
bash fix-filenames.sh
```

---

## 📋 问题总结

### 为什么会反复出现？

1. **Windows 文件系统** - 某些 Windows 工具会在文件名中添加空格
2. **编辑器自动保存** - 某些编辑器的自动保存功能可能产生副本
3. **文件复制粘贴** - 使用资源管理器复制粘贴可能产生空格

### 解决方案

1. ✅ **使用命令行操作** - 避免图形界面问题
2. ✅ **定期检查文件名** - 使用 find 命令
3. ✅ **配置编辑器设置** - 自动清理空格
4. ✅ **添加 Git 钩子** - 防止提交问题文件
5. ✅ **npm scripts 预检查** - 每次 dev/build 前自动清理

---

## ✅ 当前状态

- ✅ 已删除 `NodeEditor 2.tsx`
- ✅ 已重新创建 `NodeEditor.tsx`
- ✅ TypeScript 编译通过
- ✅ 页面应该恢复正常

**创建的文件**:
- `fix-filenames.sh` - 自动修复脚本
- 本文档 - 问题记录和解决方案

---

**重要提醒**:
这个问题还会反复出现！请在每次开发前运行 `bash fix-filenames.sh`，或者配置 npm scripts 自动执行。
