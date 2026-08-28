# Study Buddy - 双人学习陪伴平台

一个温柔、治愈的双人学习陪伴空间，为两个学习搭子打造的专属平台。

## 🎯 核心功能

- **🔐 完整认证系统** - 邮箱注册、登录、密码重置、登录状态保持
- **📋 任务管理** - 创建、编辑、删除任务，支持科目、优先级、截止时间
- **⏱️ 学习计时** - 正向/倒计时、预设时间（25/45/60 分钟）、自定义
- **👥 一起学习** - 双人共同学习房间，陪伴感为主
- **😊 心情打卡** - 每日心情记录，温柔建议
- **📚 学习成果** - 上传学习内容和图片（笔记、作业、错题等）
- **🎮 游戏化系统** - 经验值、等级（1-10 级）、积分、徽章
- **✅ 打卡系统** - 连续打卡追踪、历史记录保留
- **💬 一句话分享** - 每日一句话，双方共享
- **📅 日历统计** - 查看学习历史、累计数据
- **🚫 请假管理** - 支持请假豁免，不触发惩罚
- **📱 移动端优先** - 底部导航、原生 APP 体验
- **🔔 通知系统** - 克制提醒，不频繁打扰

## 🛠️ 技术栈

- **前端**: Next.js 14 + TypeScript + React
- **样式**: TailwindCSS + 自定义设计系统
- **数据库**: Supabase PostgreSQL
- **认证**: Supabase Auth
- **存储**: Supabase Storage
- **部署**: Vercel
- **图标**: Lucide React
- **通知**: React Hot Toast

## 📦 项目结构

```
study-buddy-app/
├── src/
│   ├── app/                    # Next.js 应用路由
│   │   ├── auth/              # 认证页面
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── reset-password/
│   │   ├── (dashboard)/       # 仪表盘
│   │   │   ├── page.tsx       # 首页工作台
│   │   │   ├── tasks/         # 任务管理
│   │   │   ├── timer/         # 学习计时
│   │   │   ├── costudy/       # 一起学习
│   │   │   ├── outcomes/      # 学习成果
│   │   │   ├── profile/       # 个人资料
│   │   │   └── settings/      # 设置
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/            # React 组件
│   │   ├── BottomNav.tsx      # 底部导航
│   │   ├── MoodCheckin.tsx    # 心情打卡
│   │   ├── OutcomeUpload.tsx  # 成果上传
│   │   ├── TaskForm.tsx       # 任务表单
│   │   └── Timer.tsx          # 计时器
│   ├── hooks/                 # 自定义 Hooks
│   │   ├── useAuth.ts         # 认证 Hook
│   │   └── useGameification.ts # 游戏化逻辑
│   ├── lib/                   # 工具库
│   │   ├── supabase.ts        # Supabase 客户端
│   │   ├── types.ts           # 类型定义
│   │   └── utils/             # 辅助函数
│   └── middleware.ts          # 路由中间件
├── public/                    # 静态资源
├── database.sql               # 数据库架构
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
└── README.md
```

## 🚀 快速开始

### 1. 环境准备

```bash
# 安装依赖
npm install

# 创建环境配置文件
cp .env.example .env.local
```

### 2. 配置 Supabase

在 `.env.local` 中添加：
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. 初始化数据库

在 Supabase 控制面板执行 `database.sql` 文件中的 SQL 语句

### 4. 本地开发

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)

### 5. 生产构建

```bash
npm run build
npm start
```

## 📋 部署到 Vercel

1. 推送代码到 GitHub
2. 在 Vercel 中导入项目
3. 设置环境变量
4. 自动部署

## 🎨 设计特色

- **温柔治愈** - 使用低饱和度的奶油色、薄荷色、淡紫色、浅蓝色
- **圆角卡片** - 所有卡片 16px 圆角，柔和阴影
- **动效流畅** - 淡入、滑上等轻微动效
- **移动优先** - 响应式设计，底部导航
- **无障碍** - 完整的 ARIA 标签和键盘支持

## 🔐 安全特性

- Row Level Security (RLS) - 数据库级权限控制
- 邮箱验证 - Supabase Auth 内置
- 密码加密 - Supabase 自动处理
- HTTPS - 所有连接加密
- 权限检查 - API 层面的验证

## 📱 移动端特性

- 底部导航栏
- 响应式布局
- 虚拟键盘适配
- PWA 支持（后续）
- 离线缓存（后续）

## 🐛 故障排除

### 连接 Supabase 失败
- 检查环境变量是否正确
- 确认 Supabase 项目已创建
- 验证 API 密钥有效期

### 构建失败
- 删除 `.next` 目录
- 重新运行 `npm install`
- 检查 Node.js 版本 >= 16

### 数据库表不存在
- 在 Supabase SQL 编辑器中执行 `database.sql`
- 刷新数据库视图

## 📖 API 文档

### 认证
- `POST /api/auth/login` - 登录
- `POST /api/auth/register` - 注册
- `POST /api/auth/logout` - 登出
- `POST /api/auth/reset-password` - 重置密码

### 任务
- `GET /api/tasks` - 获取任务列表
- `POST /api/tasks` - 创建任务
- `PUT /api/tasks/:id` - 更新任务
- `DELETE /api/tasks/:id` - 删除任务

### 学习记录
- `GET /api/sessions` - 获取学习记录
- `POST /api/sessions` - 创建学习记录
- `GET /api/stats` - 获取统计数据

## 🎓 功能说明

### 双人空间绑定
两个用户需要通过邀请码加入同一个学习空间，才能看到彼此的数据和进行一起学习。

### 经验值和等级
- 完成任务：+50 EXP
- 完成学习计时：+30 EXP
- 上传学习成果：+30 EXP
- 每日打卡：+20 EXP
- 每级需要 100 EXP

### 徽章解锁条件
- 第一次一起学习
- 累计学习 10 小时
- 连续打卡 3 天
- 连续打卡 7 天
- 连续打卡 30 天
- 完成 50 个任务
- 第一次上传学习成果
- 双方同一天完成全部任务

### 轻惩罚机制
- 未完成扣 10 积分（可恢复）
- 打卡中断但历史记录保留
- 无法获得当天奖励
- 绝不清零等级、徽章、积分

## 🤝 贡献指南

欢迎提交 Issue 和 PR！

## 📄 许可证

MIT License

## 💬 联系方式

有问题或建议？欢迎反馈！

---

**Study Buddy** - 一起学习，一起成长 ✨
