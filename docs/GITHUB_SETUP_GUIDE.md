# 🚀 GitHub仓库创建和推送指南

## 📋 步骤总览

1. 在GitHub创建新仓库
2. 连接本地仓库到GitHub
3. 推送代码

---

## 🔵 步骤1: 在GitHub创建仓库

### 1.1 访问GitHub
打开浏览器,访问: **https://github.com**

### 1.2 登录/注册
- 如果没有账号,点击 **Sign up** 注册
- 如果已有账号,点击 **Sign in** 登录

### 1.3 创建新仓库
1. 点击右上角的 **+** 图标
2. 选择 **New repository**
3. 填写仓库信息:

```
Repository name: AImind
Description: 🧠 AI思维导图工具 - 支持自定义AI API的开源思维导图软件
```

4. **重要设置**:
   - ✅ **Public** (公开) 或 **Private** (私有)
   - ❌ **不要**勾选 "Add a README file" (我们已有)
   - ❌ **不要**勾选 "Add .gitignore" (我们已有)
   - ❌ **不要**勾选 "Choose a license" (稍后可添加)

5. 点击 **Create repository**

---

## 🔗 步骤2: 连接本地仓库到GitHub

创建仓库后,GitHub会显示快速设置页面。选择 **"…or push an existing repository from the command line"** 部分。

### 2.1 复制你的仓库URL
在GitHub仓库页面,找到绿色按钮 **"Code"**,复制HTTPS URL:
```
https://github.com/你的用户名/AImind.git
```

### 2.2 在本地执行命令
打开PowerShell或CMD,执行:

```bash
cd "M:\iCloudDrive\Documents\cursorAPP\AImind"

# 添加远程仓库 (替换为你的URL)
git remote add origin https://github.com/你的用户名/AImind.git

# 验证远程仓库
git remote -v

# 推送代码
git push -u origin master
```

### 2.3 如果需要认证
推送时会提示输入:
- **Username**: 你的GitHub用户名
- **Password**: 你的**个人访问令牌** (不是密码!)

#### 获取个人访问令牌:
1. GitHub设置 → Developer settings → Personal access tokens → Tokens (classic)
2. 点击 **Generate new token (classic)**
3. 勾选 **repo** 权限
4. 点击 **Generate token**
5. **复制token** (只显示一次!)

---

## ⚡ 步骤3: 推送成功后的命令

### 后续推送
```bash
git add .
git commit -m "你的提交信息"
git push
```

### 查看远程仓库
```bash
git remote -v
git remote show origin
```

### 查看提交历史
```bash
git log --oneline --graph --all
```

---

## 🎯 自动化方案 (可选)

### 安装GitHub CLI (推荐)
```bash
# Windows (使用winget)
winget install GitHub.cli

# 或使用scoop
scoop install gh

# 验证安装
gh --version

# 登录
gh auth login
```

### 使用gh CLI自动创建仓库
```bash
# 创建公开仓库
gh repo create AImind --public --description "AI思维导图工具"

# 推送代码
git push -u origin master
```

---

## 📝 推送后的建议操作

### 1. 添加README徽章
在README.md顶部添加:
```markdown
![GitHub stars](https://img.shields.io/github/你的用户名/AImind?style=social)
![GitHub forks](https://img.shields.io/github/你的用户名/AImind?style=social)
```

### 2. 设置仓库主题
Settings → Repository → Topics
添加: `mindmap`, `ai`, `artificial-intelligence`, `productivity`, `tools`

### 3. 启用GitHub Pages (可选)
Settings → Pages → Source: Deploy from branch → branch: master → save

### 4. 添加License
创建 `LICENSE` 文件:
```bash
echo "MIT License

Copyright (c) 2025 你的名字

Permission is hereby granted..." > LICENSE
git add LICENSE
git commit -m "Add MIT license"
git push
```

---

## 🔧 故障排查

### 问题1: 推送时提示 "fatal: remote origin already exists"
```bash
# 移除现有的远程仓库
git remote remove origin

# 重新添加
git remote add origin https://github.com/你的用户名/AImind.git
```

### 问题2: 认证失败
```bash
# 使用SSH方式 (推荐)
git remote set-url origin git@github.com:你的用户名/AImind.git

# 配置SSH密钥
ssh-keygen -t ed25519 -C "你的邮箱@example.com"
# 将 ~/.ssh/id_ed25519.pub 添加到GitHub SSH keys
```

### 问题3: 推送后看不到文件
```bash
# 检查分支
git branch

# 查看状态
git status

# 强制推送 (慎用!)
git push --force
```

---

## ✅ 完成检查清单

- [ ] GitHub仓库已创建
- [ ] 远程仓库已连接
- [ ] 代码已成功推送
- [ ] 可以在GitHub上看到文件
- [ ] README.md 正常显示

---

**准备好了吗?** 完成GitHub仓库创建后,告诉我你的仓库URL,我可以帮你生成精确的推送命令! 🚀
