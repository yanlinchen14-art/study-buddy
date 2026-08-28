# Study Buddy 快速开始指南

## 项目准备

### 1. 环境要求
- Node.js 18+ 
- npm 或 yarn
- Supabase 账户
- 文本编辑器（VS Code 推荐）

### 2. 环境配置

创建 `.env.local` 文件：

```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Supabase 初始化

在 Supabase 控制面板执行 `database.sql` 中的所有 SQL 语句来初始化数据库。

## 本地开发

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

服务器将在 `http://localhost:3000` 启动

### 编译检查
```bash
npm run build
```

## 代码结构速览

### 添加新页面
1. 在 `src/app/(dashboard)/` 中创建新文件夹
2. 创建 `page.tsx` 文件
3. 导入必要的 hooks 和组件
4. 集成到底部导航

### 添加新组件
1. 在 `src/components/` 中创建组件文件
2. 使用 'use client' 指令（如需交互）
3. 导出 React 组件
4. 在页面中导入使用

### 添加新的数据操作
1. 在组件或 hook 中使用 `supabase` 客户端
2. 使用 TypeScript 类型进行类型检查
3. 添加错误处理
4. 使用 toast 提示用户

## 常见任务

### 显示用户信息
```typescript
import { useAuth } from '@/hooks/useAuth';

export default function MyComponent() {
  const { user, profile } = useAuth();
  
  return <div>{profile?.username}</div>;
}
```

### 记录经验值
```typescript
import { useGameification } from '@/hooks/useGameification';

export default function MyComponent() {
  const { addExperience } = useGameification();
  
  const handleAction = async () => {
    await addExperience(spaceId, userId, 'task_complete', 50);
  };
}
```

### 保存数据
```typescript
import { supabase } from '@/lib/supabase';

const { error } = await supabase
  .from('tasks')
  .insert({
    space_id: spaceId,
    title: 'New Task',
    // ... 其他字段
  });

if (error) {
  toast.error(error.message);
} else {
  toast.success('Success!');
}
```

### 显示加载状态
```typescript
import { Loader2 } from 'lucide-react';

if (isLoading) {
  return <Loader2 className="w-6 h-6 animate-spin" />;
}
```

## 调试技巧

### 检查认证状态
在浏览器控制台运行：
```javascript
// 获取当前会话
localStorage.getItem('sb-auth-token')
```

### 查看数据库错误
使用 toast 显示详细错误：
```typescript
catch (err) {
  console.error('Error:', err);
  toast.error(err.message);
}
```

### Supabase Dashboard
- 访问 supabase.com 查看实时数据
- 检查认证用户列表
- 监视存储使用
- 查看行级安全策略

## 样式指南

### TailwindCSS 类名
```tsx
// 背景色
bg-orange-50 / bg-purple-50 / bg-blue-50

// 文本颜色
text-gray-800 / text-orange-500 / text-purple-600

// 圆角
rounded-xl / rounded-2xl / rounded-3xl

// 阴影
shadow-md / shadow-lg

// 渐变
bg-gradient-to-r from-orange-400 to-orange-500
```

### 常用模式
```tsx
// 按钮
<button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:shadow-lg transition" />

// 卡片
<div className="bg-white rounded-2xl shadow-md p-4 space-y-4" />

// 输入框
<input className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300" />

// 加载状态
<Loader2 className="w-6 h-6 animate-spin text-orange-400" />
```

## 部署到 Vercel

### 前提条件
- GitHub 账户
- Vercel 账户

### 步骤

1. **推送到 GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git push origin main
```

2. **连接 Vercel**
   - 访问 vercel.com
   - Import Project
   - 选择 GitHub 仓库
   - 配置环境变量

3. **部署**
   - Vercel 自动构建
   - 等待部署完成
   - 分享 URL

## 故障排除

### 问题：无法登录
**解决**：
- 检查 Supabase 认证配置
- 确认用户已注册
- 检查邮箱配置

### 问题：页面空白
**解决**：
- 检查浏览器控制台错误
- 确认 `.env.local` 配置
- 清除浏览器缓存

### 问题：数据未保存
**解决**：
- 检查网络连接
- 确认 Supabase 权限
- 查看数据库日志

### 问题：图片上传失败
**解决**：
- 检查 Storage 权限
- 确认文件大小 < 5MB
- 检查文件类型

## 下一步

1. **本地测试**
   - 创建测试账户
   - 体验所有功能
   - 检查数据流

2. **自定义**
   - 修改品牌颜色
   - 添加公司 Logo
   - 调整文案

3. **部署**
   - 设置生产环境
   - 配置自定义域名
   - 设置监控

## 有用的资源

### 文档
- [Next.js 文档](https://nextjs.org/docs)
- [Supabase 文档](https://supabase.com/docs)
- [TailwindCSS 文档](https://tailwindcss.com/docs)

### 工具
- [Vercel Deploy](https://vercel.com/deploy)
- [GitHub](https://github.com)
- [Supabase Dashboard](https://supabase.com/dashboard)

## 支持和帮助

如遇问题：
1. 检查错误消息
2. 查看项目文档
3. 查看浏览器控制台
4. 检查 Supabase 日志

---

**祝你开发愉快！🎉**
