export interface User {
  id: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  learning_goals?: string;
  common_subjects?: string[];
  created_at: string;
}

export interface StudySpace {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
}

export interface Task {
  id: string;
  space_id: string;
  created_by: string;
  title: string;
  description?: string;
  subject?: string;
  estimated_minutes?: number;
  priority: 'low' | 'medium' | 'high';
  status: 'not_started' | 'in_progress' | 'completed' | 'missed' | 'excused';
  deadline?: string;
  excuse_reason?: string;
  excuse_type?: string;
  excuse_approved?: boolean;
  created_at: string;
  completed_at?: string;
}

export interface LearningSession {
  id: string;
  space_id: string;
  user_id: string;
  task_id?: string;
  subject?: string;
  notes?: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  created_at: string;
}

export interface MoodEntry {
  id: string;
  space_id: string;
  user_id: string;
  mood_date: string;
  mood: 'happy' | 'good' | 'normal' | 'low' | 'tired' | 'anxious' | 'unfocused' | 'recovering';
  note?: string;
  created_at: string;
}

export interface DailyThought {
  id: string;
  space_id: string;
  user_id: string;
  thought_date: string;
  content: string;
  created_at: string;
}

export interface LearningOutcome {
  id: string;
  space_id: string;
  user_id: string;
  task_id?: string;
  subject?: string;
  outcome_date: string;
  title?: string;
  description?: string;
  summary?: string;
  images?: string[];
  created_at: string;
}

export interface DailyCheckin {
  id: string;
  space_id: string;
  user_id: string;
  checkin_date: string;
  consecutive_days: number;
  created_at: string;
}

export interface Badge {
  id: string;
  code: string;
  name: string;
  description?: string;
  icon_url?: string;
  unlock_condition?: Record<string, any>;
}

export interface UserLevel {
  id: string;
  space_id: string;
  user_id: string;
  current_level: number;
  total_experience: number;
  current_experience: number;
  level_up_at?: string;
}

export interface StudyStreak {
  id: string;
  space_id: string;
  user_id: string;
  current_streak: number;
  total_streaks: number;
  longest_streak: number;
  last_checkin_date?: string;
  streak_started_at?: string;
}

export interface DailyStats {
  id: string;
  space_id: string;
  user_id: string;
  stat_date: string;
  total_minutes: number;
  tasks_completed: number;
  tasks_total: number;
  checkin_done: boolean;
  mood?: string;
  points_earned: number;
  points_deducted: number;
}
