# Study Buddy 架构设计文档

## 系统架构概览

```
┌─────────────────────────────────────────────────────────┐
│                    浏览器 (Web Client)                    │
│  ├─ 认证页面 (Login, Register, Reset Password)          │
│  ├─ Dashboard 布局 (Layout + Bottom Nav)                │
│  ├─ 页面 (首页, 任务, 计时, 一起学, 成果, 个人)          │
│  └─ 组件 (表单, 计时器, 心情打卡)                       │
└──────────────────────────┬──────────────────────────────┘
                           │
                   ┌───────┴────────┐
                   │                │
         ┌─────────▼──────────┐   ┌─▼────────────────┐
         │  Next.js Frontend   │   │  Middleware      │
         │  ├─ App Router      │   │  ├─ Auth Check   │
         │  ├─ Pages          │   │  └─ Redirect     │
         │  ├─ Components     │   └──────────────────┘
         │  ├─ Hooks          │
         │  └─ Styles         │
         └─────────┬──────────┘
                   │
         ┌─────────▼──────────────┐
         │  Supabase SDK         │
         │  ├─ Auth              │
         │  ├─ Database          │
         │  └─ Storage           │
         └─────────┬──────────────┘
                   │
         ┌─────────▼──────────────┐
         │  Supabase Backend      │
         │  ├─ Authentication     │
         │  ├─ PostgreSQL DB      │
         │  ├─ Storage (S3)       │
         │  └─ Row Level Security │
         └────────────────────────┘
```

## 前端架构

### 1. 页面层 (Pages)

```
/auth
  ├── /login - 用户登录
  ├── /register - 用户注册
  └── /reset-password - 密码重置

/(dashboard) - 认证保护的路由组
  ├── / - 首页工作台
  ├── /tasks - 任务管理
  ├── /timer - 学习计时
  ├── /costudy - 共同学习
  ├── /outcomes - 学习成果
  ├── /profile - 个人资料
  └── /settings/space - 空间绑定
```

### 2. 组件层 (Components)

#### 页面级组件
- `BottomNav` - 底部导航（所有页面通用）

#### 功能组件
- `TaskForm` - 任务创建/编辑表单
- `Timer` - 计时器（支持多种模式）
- `MoodCheckin` - 心情打卡
- `OutcomeUpload` - 成果上传

### 3. 逻辑层 (Hooks)

#### 认证 Hook
```typescript
useAuth()
├── user: Supabase User | null
├── profile: User | null
├── loading: boolean
├── error: string | null
├── register(email, password, username)
├── login(email, password)
├── logout()
└── resetPassword(email)
```

#### 游戏化 Hook
```typescript
useGameification()
├── addExperience(spaceId, userId, type, amount)
├── updateUserLevel(spaceId, userId, expGain)
├── dailyCheckin(spaceId, userId)
├── addPoints(spaceId, userId, type, amount)
├── checkBadgeUnlock(spaceId, userId, condition)
├── getUserLevel(spaceId, userId)
└── getUserBadges(spaceId, userId)
```

### 4. 数据层 (Lib)

#### Supabase 配置
```typescript
supabase // Supabase 客户端实例
├── getCurrentUser() // 获取当前会话用户
└── getUserProfile(userId) // 获取用户档案
```

#### 类型定义
- User - 用户档案
- StudySpace - 学习空间
- Task - 任务
- LearningSession - 学习会话
- MoodEntry - 心情记录
- LearningOutcome - 学习成果
- Badge - 徽章
- UserLevel - 用户等级
- StudyStreak - 打卡条纹

## 数据流设计

### 1. 用户认证流程

```
User Input (Email, Password)
         │
         ▼
useAuth Hook (register/login)
         │
         ▼
Supabase Auth
         │
    ┌────┴────┐
    │          │
  Success    Error
    │          │
    ▼          ▼
Create Profile  Show Error
    │
    ▼
Store Session (Local)
    │
    ▼
Redirect to Dashboard
```

### 2. 学习会话流程

```
User Start Timer
       │
       ▼
Timer Component (State: Select)
       │
       ▼
User Configure (Minutes, Subject, Task)
       │
       ▼
Timer Component (State: Running)
       │
       ▼
User End Session
       │
       ▼
Save Learning Session
       │
       ├─ Create Record in DB
       ├─ Calculate Experience
       ├─ Update User Level
       └─ Check Badge Unlock
       │
       ▼
Record Points & Log
       │
       ▼
Show Success Message
```

### 3. 打卡流程

```
User Click Checkin
       │
       ▼
dailyCheckin Hook
       │
       ├─ Check if already checked in today
       │
       ├─ Yes: Show message
       │
       └─ No:
           │
           ├─ Get last checkin
           │
           ├─ Calculate streak
           │
           ├─ Save checkin record
           │
           ├─ Add experience (20)
           │
           ├─ Check streak milestone
           │
           ├─ Add bonus experience if milestone
           │
           └─ Check badge unlock
```

## 状态管理

### 认证状态
- 位置：`useAuth` Hook
- 同步：`supabase.auth.onAuthStateChange`
- 持久化：Supabase Session (Cookie/localStorage)

### 用户档案
- 位置：`useAuth` Hook
- 来源：`users` 表
- 缓存：组件级状态

### 游戏化数据
- 位置：各组件本地状态
- 来源：数据库查询
- 更新：直接写入数据库

## 实时数据同步

### 自动同步点
1. 用户登录 - 获取档案和空间信息
2. 页面加载 - 获取该页面需要的数据
3. 操作后 - 重新获取列表数据

### 手动同步
- 用户手动刷新页面
- 使用 React Query 等缓存库（可扩展）

## API 层设计

### 路由保护

```typescript
middleware.ts
├─ 检查认证状态
├─ 如果未认证 → 重定向到 /auth/login
└─ 如果已认证 → 允许访问
```

### 数据库查询模式

```typescript
// 获取用户相关数据
supabase
  .from('users')
  .select('*')
  .eq('id', userId)

// 获取用户的学习空间
supabase
  .from('study_space_members')
  .select('space_id')
  .eq('user_id', userId)

// 获取空间的任务
supabase
  .from('tasks')
  .select('*')
  .eq('space_id', spaceId)
```

## 权限模型

### 学习空间
- 最多 2 个成员
- 创建者为 admin
- 其他用户为 member

### 数据访问
- 用户只能看到自己所属的空间数据
- 通过 `study_space_members` 表管理权限
- Supabase RLS 策略进行数据库层面的强制

## 错误处理

### 前端错误捕获
- Try-catch 块
- 错误状态 UI
- Toast 通知

### 错误类型
1. **认证错误** - 自动重定向到登录
2. **网络错误** - 显示重试按钮
3. **业务错误** - 显示友好的错误提示

## 性能优化

### 代码分割
- Next.js 自动代码分割
- 页面级分割
- 动态导入（如需）

### 图片优化
- 使用 Supabase Storage
- Next.js Image 组件（可扩展）

### 缓存策略
- 会话缓存（用户档案）
- 静态缓存（徽章定义）
- 动态数据实时获取

## 扩展点

### 1. 实时功能
- 集成 Supabase Realtime
- 搭档在线状态
- 实时通知

### 2. 数据分析
- 学习统计面板
- 进度报告
- 数据导出

### 3. 社交功能
- 学习成果评论
- 相互激励
- 学习群组

### 4. 第三方集成
- Google Calendar 同步
- Notion 导出
- Slack 通知

## 安全考虑

### 认证安全
- Supabase 管理的 JWT
- 安全的 Cookie 存储
- CSRF 保护

### 数据安全
- 行级安全 (RLS)
- 用户隔离
- 环境变量保护

### 前端安全
- 输入验证
- XSS 防护 (React 自动)
- CORS 策略

## 部署配置

### 环境变量
```
NEXT_PUBLIC_SUPABASE_URL=<url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<key>
NEXT_PUBLIC_SITE_URL=<deployment-url>
```

### 构建优化
- `npm run build` 生成优化的生产版本
- 静态分析和类型检查
- CSS 优化和 Tree Shaking

## 监测和调试

### 开发工具
- Next.js DevTools
- Browser DevTools
- Supabase Dashboard

### 日志
- 前端错误日志（可集成 Sentry）
- 数据库查询日志
- 认证事件日志

---

该架构设计强调：
- **模块化** - 清晰的层次划分
- **可维护性** - 易于理解和修改
- **可扩展性** - 容易添加新功能
- **安全性** - 多层防护
- **用户体验** - 温柔直观的界面
