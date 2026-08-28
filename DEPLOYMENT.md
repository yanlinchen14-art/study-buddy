# Study Buddy - 部署指南

本文档介绍如何将 Study Buddy 部署到云端（Vercel + Supabase）。

## 前置条件

1. **GitHub 账号** - 用于代码托管
2. **Supabase 账号** - 用于数据库和认证
3. **Vercel 账号** - 用于前端部署

## 步骤 1：Supabase 配置

### 1.1 创建 Supabase 项目

1. 访问 [supabase.com](https://supabase.com)
2. 点击"New Project"创建新项目
3. 填写项目名称（例如：study-buddy）
4. 选择地区（建议选择距离最近的）
5. 设置数据库密码
6. 点击"Create new project"

### 1.2 获取 API 密钥

项目创建后，进入"Settings" → "API"：
- 复制 `Project URL`
- 复制 `anon` public API key
- 复制 `service_role` secret key（用于服务端）

### 1.3 初始化数据库

1. 进入 Supabase 控制面板
2. 点击"SQL Editor"
3. 创建新查询
4. 复制 `database.sql` 文件的全部内容
5. 粘贴到 SQL 编辑器
6. 点击"Run"执行

### 1.4 配置 Storage

1. 进入"Storage"选项卡
2. 创建新 bucket，名称为 `outcomes`
3. 设置访问权限为"Public"

## 步骤 2：GitHub 配置

### 2.1 创建仓库

1. 访问 [github.com](https://github.com)
2. 点击"+"→"New repository"
3. 仓库名称：`study-buddy`
4. 设置为 Public（方便 Vercel 访问）
5. 点击"Create repository"

### 2.2 上传代码

```bash
# 进入项目目录
cd C:\Users\Admin\WorkBuddy\2026-08-27-22-29-19\study-buddy-app

# 初始化 Git
git init

# 添加所有文件
git add .

# 创建初始提交
git commit -m "Initial commit: Study Buddy platform"

# 添加远程仓库（替换 YOUR_USERNAME 和 YOUR_REPO_NAME）
git remote add origin https://github.com/YOUR_USERNAME/study-buddy.git

# 推送代码
git branch -M main
git push -u origin main
```

## 步骤 3：Vercel 部署

### 3.1 导入项目到 Vercel

1. 访问 [vercel.com](https://vercel.com)
2. 点击"New Project"
3. 选择"Import Git Repository"
4. 授权 GitHub 账号
5. 选择 `study-buddy` 仓库
6. 点击"Import"

### 3.2 配置环境变量

在 Vercel 项目设置中，点击"Environment Variables"，添加：

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app
```

### 3.3 部署

1. 所有环境变量添加完成后，点击"Deploy"
2. 等待部署完成（通常 2-5 分钟）
3. 部署成功后，会显示公开 URL

## 步骤 4：配置自定义域名（可选）

如果想使用自定义域名（例如：studybuddy.com）：

1. 在 Vercel 项目设置中，点击"Domains"
2. 输入自定义域名
3. 按照提示配置 DNS 记录
4. 等待 DNS 生效（通常 24 小时内）

## 步骤 5：本地开发

### 5.1 初始化本地环境

```bash
cd C:\Users\Admin\WorkBuddy\2026-08-27-22-29-19\study-buddy-app
npm install
```

### 5.2 创建本地环境配置

创建 `.env.local` 文件（从 `.env.example` 复制）：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5.3 启动开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)

## 步骤 6：功能验证

### 6.1 测试认证

1. 打开应用
2. 点击"注册"创建新账号
3. 输入邮箱和密码
4. 检查邮箱验证邮件
5. 验证后登录

### 6.2 测试核心功能

- [ ] 创建和管理任务
- [ ] 启动学习计时
- [ ] 打卡和记录心情
- [ ] 上传学习成果
- [ ] 邀请搭档加入
- [ ] 一起学习功能
- [ ] 查看等级和徽章

### 6.3 测试移动端

- 用手机浏览器打开网址
- 检查响应式布局
- 测试底部导航
- 验证输入框在虚拟键盘下不被遮挡

## 持续部署

配置完成后，每次 push 到 GitHub 的代码都会自动部署到 Vercel：

```bash
# 修改代码后
git add .
git commit -m "Fix: description of changes"
git push origin main
```

Vercel 会自动检测到更改并重新部署。

## 常见问题

### Q: 如何更新数据库表结构？
A: 在 Supabase SQL 编辑器中创建迁移脚本，执行新的 SQL 语句。

### Q: 如何添加新的用户字段？
A: 在 Supabase 的 `users` 表中添加列，然后在应用代码中更新 API 调用。

### Q: 如何增加存储容量？
A: Supabase Free 计划提供 1GB 存储，超出后需要升级到付费计划。

### Q: 如何处理 CORS 错误？
A: 确认 Supabase 的 CORS 设置正确（通常自动配置）。

### Q: 生产环境中如何管理密钥？
A: 所有密钥都应该通过环境变量管理，不要在代码中硬编码。

## 性能优化

### Vercel
- 自动使用 CDN 缓存
- 自动压缩和优化资源
- 自动分割代码

### Supabase
- 数据库有自动备份
- 使用 RLS 进行行级安全
- 配置适当的索引

### 前端
- 使用 Next.js 的自动代码分割
- 图片使用 WebP 格式和响应式加载
- 启用 Service Worker 缓存

## 备份和恢复

### 数据库备份

Supabase 自动每天备份，保留 7 天。访问 "Settings" → "Backup" 查看。

### 手动导出数据

```bash
# 导出所有数据为 JSON（需要 CLI 工具）
supabase db pull
```

## 支持和帮助

- **Vercel 文档**: https://vercel.com/docs
- **Supabase 文档**: https://supabase.com/docs
- **Next.js 文档**: https://nextjs.org/docs

## 成本估算

### 免费层

- **Vercel**: 每月 100GB 带宽
- **Supabase**: 500MB 数据库存储 + 1GB 文件存储

### 付费升级

当超出免费层限制时，按量计费：
- Vercel: ~$0.15/GB 超额带宽
- Supabase: ~$5/月 基础计划

---

部署完成后，应用就可以通过公网访问了！🎉
