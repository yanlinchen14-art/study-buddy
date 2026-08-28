-- Study Buddy Platform - Complete Database Schema
-- PostgreSQL 14+

-- 1. Users Table (Extended Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  learning_goals TEXT,
  common_subjects JSONB DEFAULT '[]'::jsonb,
  interface_preference JSONB DEFAULT '{"theme": "light", "notifications": true}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Dual Study Spaces (核心多人空间表)
CREATE TABLE IF NOT EXISTS public.study_spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100),
  invite_code VARCHAR(20) UNIQUE NOT NULL,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Study Space Members
CREATE TABLE IF NOT EXISTS public.study_space_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.study_spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member', -- 'admin' or 'member'
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(space_id, user_id)
);

-- 4. Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.study_spaces(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  subject VARCHAR(100),
  estimated_minutes INTEGER,
  priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high'
  status VARCHAR(50) DEFAULT 'not_started', -- 'not_started', 'in_progress', 'completed', 'missed', 'excused'
  deadline TIMESTAMP WITH TIME ZONE,
  excuse_reason TEXT,
  excuse_type VARCHAR(50), -- 'sick', 'state', 'busy', 'rest_day', 'other'
  excuse_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Learning Sessions (学习计时记录)
CREATE TABLE IF NOT EXISTS public.learning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.study_spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  subject VARCHAR(100),
  notes TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Daily Check-in (每日打卡)
CREATE TABLE IF NOT EXISTS public.daily_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.study_spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL,
  consecutive_days INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(space_id, user_id, checkin_date)
);

-- 7. Mood Tracking (心情追踪)
CREATE TABLE IF NOT EXISTS public.mood_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.study_spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  mood_date DATE NOT NULL,
  mood VARCHAR(50), -- 'happy', 'good', 'normal', 'low', 'tired', 'anxious', 'unfocused', 'recovering'
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(space_id, user_id, mood_date)
);

-- 8. Daily One-liner (每日一句话)
CREATE TABLE IF NOT EXISTS public.daily_thoughts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.study_spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  thought_date DATE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(space_id, user_id, thought_date)
);

-- 9. Learning Outcomes (学习成果)
CREATE TABLE IF NOT EXISTS public.learning_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.study_spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  subject VARCHAR(100),
  outcome_date DATE NOT NULL,
  title VARCHAR(200),
  description TEXT,
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Outcome Images (成果图片)
CREATE TABLE IF NOT EXISTS public.outcome_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outcome_id UUID NOT NULL REFERENCES public.learning_outcomes(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Excuses/Leave Requests (请假表)
CREATE TABLE IF NOT EXISTS public.excuse_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.study_spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  excuse_type VARCHAR(50), -- 'sick', 'state', 'busy', 'rest_day', 'other'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  partner_acknowledged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Experience & Progression Records (经验记录)
CREATE TABLE IF NOT EXISTS public.experience_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.study_spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  exp_type VARCHAR(100), -- 'task_complete', 'session_end', 'outcome_upload', 'checkin', 'consecutive_streak', etc
  exp_amount INTEGER NOT NULL,
  related_id UUID, -- task_id, session_id, etc
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Points/Scores (积分记录)
CREATE TABLE IF NOT EXISTS public.points_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.study_spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  points_type VARCHAR(100), -- 'task_bonus', 'daily_bonus', 'streak_bonus', 'penalty', etc
  points_amount INTEGER NOT NULL, -- can be negative
  reason TEXT,
  recoverable BOOLEAN DEFAULT TRUE, -- can be restored?
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. Levels/Ranks (等级)
CREATE TABLE IF NOT EXISTS public.user_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.study_spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  current_level INTEGER DEFAULT 1,
  total_experience INTEGER DEFAULT 0,
  current_experience INTEGER DEFAULT 0,
  level_up_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(space_id, user_id)
);

-- 15. Badges (徽章定义和用户拥有)
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_url TEXT,
  unlock_condition JSONB, -- stores condition config
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 16. User Badge Relationships
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.study_spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(space_id, user_id, badge_id)
);

-- 17. Interactions (互动系统)
CREATE TABLE IF NOT EXISTS public.interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.study_spaces(id) ON DELETE CASCADE,
  from_user UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  to_user UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  interaction_type VARCHAR(50), -- 'poke', 'encourage', 'outcome_response', 'message', etc
  content TEXT,
  related_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (from_user != to_user)
);

-- 18. Shared Learning Plans (共享计划)
CREATE TABLE IF NOT EXISTS public.shared_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.study_spaces(id) ON DELETE CASCADE,
  plan_type VARCHAR(50), -- 'weekly', 'monthly', 'longterm'
  title VARCHAR(200) NOT NULL,
  description TEXT,
  target_date DATE,
  progress_percentage INTEGER DEFAULT 0,
  is_personal BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 19. Notifications (通知)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  related_user UUID REFERENCES public.users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50), -- 'partner_started', 'study_invite', 'outcome_response', 'task_deadline', etc
  content TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  related_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 20. Study Streak Records (连续打卡记录)
CREATE TABLE IF NOT EXISTS public.study_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.study_spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  total_streaks INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_checkin_date DATE,
  streak_started_at DATE,
  UNIQUE(space_id, user_id)
);

-- 21. Co-study Sessions (一起学习房间记录)
CREATE TABLE IF NOT EXISTS public.costudy_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.study_spaces(id) ON DELETE CASCADE,
  user1_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_start TIMESTAMP WITH TIME ZONE NOT NULL,
  session_end TIMESTAMP WITH TIME ZONE,
  user1_subject VARCHAR(100),
  user2_subject VARCHAR(100),
  co_study_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (user1_id < user2_id)
);

-- 22. Daily Data Cache (日期数据缓存，用于快速查询)
CREATE TABLE IF NOT EXISTS public.daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.study_spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stat_date DATE NOT NULL,
  total_minutes INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  tasks_total INTEGER DEFAULT 0,
  checkin_done BOOLEAN DEFAULT FALSE,
  mood VARCHAR(50),
  points_earned INTEGER DEFAULT 0,
  points_deducted INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(space_id, user_id, stat_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_space_id ON public.tasks(space_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON public.tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_user ON public.learning_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_space ON public.learning_sessions(space_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_date ON public.learning_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_mood_entries_date ON public.mood_entries(mood_date);
CREATE INDEX IF NOT EXISTS idx_daily_thoughts_date ON public.daily_thoughts(thought_date);
CREATE INDEX IF NOT EXISTS idx_learning_outcomes_date ON public.learning_outcomes(outcome_date);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_space ON public.interactions(space_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON public.daily_stats(stat_date);
CREATE INDEX IF NOT EXISTS idx_study_space_members_space ON public.study_space_members(space_id);

-- Row Level Security (RLS) Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_space_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_thoughts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outcome_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.excuse_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.costudy_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (will be extended in app logic)
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);
