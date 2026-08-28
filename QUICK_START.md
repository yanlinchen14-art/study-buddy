# Study Buddy - 快速部署指南

**预计时间**：15 分钟  
**难度**：⭐⭐☆☆☆ 简单

## 一键部署流程

### 步骤 1：准备账号（5 分钟）

你需要以下三个免费账号：

1. **GitHub 账号** - 代码托管
   - 访问 https://github.com/signup
   - 创建账号（如果没有）

2. **Supabase 账号** - 数据库 + 认证
   - 访问 https://supabase.com
   - 点击"Sign Up"用 GitHub 账号登录（推荐）

3. **Vercel 账号** - 网站部署
   - 访问 https://vercel.com/signup
   - 用 GitHub 账号登录

### 步骤 2：创建 Supabase 数据库（3 分钟）

1. 登录 Supabase 控制面板
2. 点击"New Project"
3. 填写：
   - **Name**: study-buddy
   - **Database Password**: 输入一个强密码（保存好！）
   - **Region**: 选择离你最近的地区
4. 点击"Create new project"等待 30-60 秒

### 步骤 3：初始化数据库表（2 分钟）

项目创建后：

1. 进入"SQL Editor"
2. 点击"New Query"
3. 打开 `database.sql` 文件，复制全部内容
4. 粘贴到 SQL 编辑器
5. 点击"Run"执行

### 步骤 4：获取 API 密钥（1 分钟）

1. 进入"Settings" → "API"
2. 复制以下内容到记事本：
   ```
   NEXT_PUBLIC_SUPABASE_URL=___paste_here___
   NEXT_PUBLIC_SUPABASE_ANON_KEY=___paste_here___
   SUPABASE_SERVICE_ROLE_KEY=___paste_here___
   ```

### 步骤 5：上传到 GitHub（2 分钟）

1. 在 GitHub 创建新仓库：
   - 访问 https://github.com/new
   - **Repository name**: study-buddy
   - 保持 Public
   - 点击"Create repository"

2. 进入项目目录，执行：
   ```bash
   cd C:\Users\Admin\WorkBuddy\2026-08-27-22-29-19\study-buddy-app
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/study-buddy.git
   git branch -M main
   git push -u origin main
   ```

### 步骤 6：部署到 Vercel（2 分钟）

1. 访问 https://vercel.com/new
2. 点击"Import Git Repository"
3. 授权 GitHub（如果需要）
4. 选择 `study-buddy` 仓库
5. 点击"Import"
6. 在环境变量部分添加：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL` = 你的 Vercel 域名（稍后可改）
7. 点击"Deploy"

### 步骤 7：配置 Storage（1 分钟）

1. 回到 Supabase 控制面板
2. 进入"Storage"
3. 点击"New bucket"
4. 名称：`outcomes`
5. 勾选"Public bucket"
6. 创建

## 🎉 完成！

部署完成后，你会获得一个网址，类似：
```
https://study-buddy.vercel.app
```

## 第一次使用

1. 用浏览器打开上面的网址
2. 点击"注册"创建账号
3. 验证邮箱
4. 创建或加入双人学习空间
5. 邀请你的学习搭子

## 常见问题

### Q: 部署后打开网站显示错误怎么办？

A: 检查以下几点：
1. 环境变量是否都已添加（4 个）
2. Supabase 数据库是否正常运行
3. 在 Vercel 中点击"Redeploy"重新部署

### Q: 忘记了 Supabase 密钥怎么办？

A: 进入 Supabase 控制面板 → "Settings" → "API"，重新复制

### Q: 如何修改网站内容？

A: 修改代码后 push 到 GitHub，Vercel 会自动部署：
```bash
git add .
git commit -m "Update: your changes"
git push
```

### Q: 如何使用自定义域名？

A: 在 Vercel 项目设置 → "Domains" 中添加，按提示配置 DNS

### Q: 数据会不会丢失？

A: Supabase 自动备份，Vercel 存储代码。放心使用！

## 下一步

部署成功后，建议阅读：
- `README.md` - 功能说明
- `DEPLOYMENT.md` - 详细部署指南

## 需要帮助？

遇到问题可以查看：
- **Vercel 文档**: https://vercel.com/docs
- **Supabase 文档**: https://supabase.com/docs

---

**Happy Learning! 🚀**
