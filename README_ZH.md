# Study Buddy - 双人学习陪伴平台

温柔治愈的双人学习伙伴应用，帮助你和学习伙伴一起成长。

## ✨ 核心特色

### 🎯 双人空间
- 创建专属的双人学习空间
- 邀请你的学习伙伴
- 共享学习目标和成果

### ⏱️ 学习计时
- 灵活的计时选项（25/45/60 分钟或自定义）
- 关联任务自动追踪
- 实时记录学习时长
- 自动计算经验值

### 📝 任务管理
- 创建和管理学习任务
- 设置优先级和截止时间
- 关联科目和预计时间
- 任务完成自动获得经验

### 💭 心情打卡
- 每天记录你的学习心情
- 8 种情绪选择
- 温柔的情绪建议
- 心情趋势追踪

### 🎬 成果分享
- 拍照记录学习成果
- 上传多张图片
- 记录详细的总结
- 与伙伴分享进展

### 👥 一起学习
- 和伙伴同时学习
- 共享计时器
- 相互陪伴和激励
- 记录共同学习时间

### 🏆 游戏化系统
- 等级升级（1-10 级）
- 经验值积累和竞争
- 连续打卡激励
- 徽章解锁成就

## 🚀 快速开始

### 系统要求
- Node.js 18+
- npm 或 yarn
- Supabase 账户

### 安装步骤

1. **克隆或下载项目**
```bash
cd study-buddy-app
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境**
创建 `.env.local` 文件：
```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

4. **初始化数据库**
在 Supabase 中执行 `database.sql`

5. **启动开发服务器**
```bash
npm run dev
```

访问 `http://localhost:3000` 开始使用！

## 📖 使用流程

### 1. 账户创建
- 访问注册页面
- 输入邮箱和密码
- 验证邮件地址

### 2. 空间设置
- 创建学习空间或加入现有空间
- 邀请你的学习伙伴
- 生成或输入邀请码

### 3. 日常使用
- **早上**：打卡签到，记录心情
- **学习中**：使用计时器追踪时间
- **学习后**：记录成果，分享总结
- **随时**：和伙伴进行一起学习

### 4. 进度追踪
- 查看等级和经验值
- 查看连续打卡天数
- 查看周学习统计
- 解锁新徽章

## 🎨 设计系统

### 配色方案
- 🧡 **橙色** - 主要操作色
- 💜 **紫色** - 次要操作色
- 💚 **绿色** - 成功和激励
- 🩵 **蓝色** - 信息提示

### 设计原则
- 温柔圆润的设计
- 轻阴影增加层次
- 移动端优先
- 响应式适配

## 📱 页面导航

### 认证页面
- `/auth/login` - 登录
- `/auth/register` - 注册
- `/auth/reset-password` - 密码重置

### 应用页面
- `/` - 首页工作台
- `/tasks` - 任务管理
- `/timer` - 学习计时
- `/costudy` - 一起学习
- `/outcomes` - 学习成果
- `/profile` - 个人资料
- `/settings/space` - 空间管理

## 🛠️ 技术栈

```json
{
  "frontend": "Next.js 14 + TypeScript + TailwindCSS",
  "backend": "Supabase (PostgreSQL)",
  "auth": "Supabase Auth",
  "storage": "Supabase Storage",
  "icons": "Lucide React",
  "notifications": "React Hot Toast",
  "dates": "date-fns"
}
```

## 📊 数据库表

### 核心表
- `users` - 用户档案
- `study_spaces` - 学习空间
- `study_space_members` - 空间成员

### 功能表
- `tasks` - 学习任务
- `learning_sessions` - 学习会话记录
- `mood_entries` - 心情记录
- `learning_outcomes` - 学习成果
- `daily_thoughts` - 每日一句
- `daily_checkins` - 打卡记录

### 游戏化表
- `user_levels` - 用户等级
- `experience_logs` - 经验值日志
- `points_logs` - 积分日志
- `study_streaks` - 打卡条纹
- `badges` - 徽章定义
- `user_badges` - 用户徽章

### 社交表
- `interactions` - 用户互动
- `costudy_sessions` - 共同学习会话
- `notifications` - 通知

## 🔐 安全特性

- ✅ JWT 认证
- ✅ 行级安全 (RLS)
- ✅ 用户数据隔离
- ✅ 环境变量保护
- ✅ 输入验证
- ✅ 错误处理

## 📈 游戏化规则

### 经验值
- 任务完成：50 经验
- 学习会话：10 经验/分钟
- 成果上传：30 经验
- 每日打卡：20 经验

### 等级
- 1 级：起点
- 10 级：最高级别
- 升级需要持续积累经验

### 打卡
- 每天一次打卡
- 连续打卡获得加成
- 7 天、30 天解锁徽章

## 🤝 社区和支持

### 如何贡献
1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 发起 Pull Request

### 反馈和建议
- 提交 Issue
- 分享想法
- 报告 bug

## 📝 文档

- `PROJECT_COMPLETION.md` - 项目完成状态
- `ARCHITECTURE.md` - 架构设计文档
- `GETTING_STARTED.md` - 快速开始指南

## 🚀 部署

### 部署到 Vercel（推荐）

1. 推送代码到 GitHub
2. 连接 Vercel
3. 配置环境变量
4. 自动部署

### 自定义部署

```bash
# 构建
npm run build

# 启动
npm start
```

## 💡 扩展和定制

### 修改样式
- 编辑 `tailwind.config.ts`
- 修改 TailwindCSS 类名
- 调整配色方案

### 添加功能
- 参考现有组件结构
- 在 `src/components/` 添加新组件
- 在 `src/hooks/` 添加新逻辑
- 在 `src/app/` 添加新页面

### 集成第三方
- Google Calendar
- Notion API
- Slack
- Discord

## 📄 许可证

本项目采用 MIT 许可证。

## 🙏 致谢

感谢所有开源库和框架的维护者：
- Next.js 团队
- Supabase 团队
- React 社区
- TailwindCSS 团队

---

## 🎉 开始你的学习之旅

> "一个人可能走得很快，但一群人可以走得更远。"

立即创建你的学习空间，邀请你的伙伴，一起成长！

**访问**: https://study-buddy.vercel.app（部署后）

---

**版本**: 1.0.0  
**最后更新**: 2026 年 8 月  
**状态**: ✅ 功能完整
