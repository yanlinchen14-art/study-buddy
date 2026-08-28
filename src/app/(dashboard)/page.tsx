'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { MoodCheckin } from '@/components/MoodCheckin';
import { useAuth } from '@/hooks/useAuth';
import { useGameification } from '@/hooks/useGameification';
import {
  Loader2,
  LogOut,
  Zap,
  Target,
  Trophy,
  Calendar,
  Flame,
  Heart,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import toast from 'react-hot-toast';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { User, UserLevel, StudyStreak } from '@/lib/types';

interface DashboardData {
  userProfile: User | null;
  partner: User | null;
  userLevel: UserLevel | null;
  streak: StudyStreak | null;
  todayStats: any | null;
  todayTask: any | null;
}

export default function DashboardPage() {
  const { user: authUser, profile: userProfile, logout } = useAuth();
  const { getUserLevel, dailyCheckin } = useGameification();
  const [spaceId, setSpaceId] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData>({
    userProfile: null,
    partner: null,
    userLevel: null,
    streak: null,
    todayStats: null,
    todayTask: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [isCheckinLoading, setIsCheckinLoading] = useState(false);
  const [checked, setChecked] = useState(false);
  const router = useRouter();

  const today = new Date().toISOString().split('T')[0];

  // 初始化数据
  useEffect(() => {
    if (!authUser) return;

    const initDashboard = async () => {
      try {
        // 获取学习空间
        const { data: members } = await supabase
          .from('study_space_members')
          .select('space_id')
          .eq('user_id', authUser.id)
          .limit(1);

        if (!members || members.length === 0) {
          router.push('/settings/space');
          return;
        }

        const currentSpaceId = members[0].space_id;
        setSpaceId(currentSpaceId);

        // 获取搭档信息
        const { data: spaceMembers } = await supabase
          .from('study_space_members')
          .select('user_id')
          .eq('space_id', currentSpaceId)
          .neq('user_id', authUser.id);

        let partner = null;
        if (spaceMembers && spaceMembers.length > 0) {
          const { data: partnerProfile } = await supabase
            .from('users')
            .select('*')
            .eq('id', spaceMembers[0].user_id)
            .single();

          partner = partnerProfile;
        }

        // 获取用户等级
        const userLevel = await getUserLevel(currentSpaceId, authUser.id);

        // 获取学习条纹
        const { data: streak } = await supabase
          .from('study_streaks')
          .select('*')
          .eq('space_id', currentSpaceId)
          .eq('user_id', authUser.id)
          .single();

        // 获取今天的统计
        const { data: todayStats } = await supabase
          .from('daily_stats')
          .select('*')
          .eq('space_id', currentSpaceId)
          .eq('user_id', authUser.id)
          .eq('stat_date', today)
          .single();

        // 获取今天的任务
        const { data: todayTasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('space_id', currentSpaceId)
          .eq('created_by', authUser.id)
          .gte('deadline', `${today}T00:00:00`)
          .lt('deadline', `${today}T23:59:59`)
          .limit(1);

        setData({
          userProfile,
          partner,
          userLevel,
          streak: streak || null,
          todayStats: todayStats || null,
          todayTask: todayTasks ? todayTasks[0] : null,
        });

        setIsLoading(false);
      } catch (err) {
        console.error('Dashboard init error:', err);
        setIsLoading(false);
      }
    };

    initDashboard();
  }, [authUser, userProfile, router, getUserLevel]);

  const handleDailyCheckin = async () => {
    if (!spaceId || !authUser) return;

    setIsCheckinLoading(true);
    try {
      const result = await dailyCheckin(spaceId, authUser.id);
      if (result.checkedIn) {
        toast.success(`打卡成功！连续 ${result.streak} 天！`);
        setChecked(true);
        setShowMoodModal(true);
      } else {
        toast.success('今天已经打卡过了');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '打卡失败');
    } finally {
      setIsCheckinLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-orange-400" />
      </div>
    );
  }

  const progressPercent = data.userLevel?.current_experience && data.userLevel
    ? Math.round(
        (data.userLevel.current_experience /
          (Math.pow(data.userLevel.current_level, 1.5) * 100)) *
          100,
      )
    : 0;

  return (
    <div className="space-y-4 p-4">
      {/* Header with Logout */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {new Date().toLocaleDateString('zh-CN', {
            month: 'long',
            day: 'numeric',
            weekday: 'long',
          })}
        </h1>
        <button
          onClick={handleLogout}
          className="p-2 hover:bg-red-50 rounded-full transition"
          title="登出"
        >
          <LogOut className="w-6 h-6 text-red-500" />
        </button>
      </div>

      {/* Co-study Status Card */}
      <div className="bg-white rounded-3xl shadow-md shadow-purple-100 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">学习伙伴</h2>
        <div className="flex items-center gap-4">
          {/* User Avatar */}
          <div className="flex-1">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white font-bold">
              {userProfile?.username?.charAt(0).toUpperCase()}
            </div>
            <p className="text-sm font-medium text-gray-700 mt-2">
              {userProfile?.username}
            </p>
          </div>

          <div className="text-center text-gray-500">
            <Heart className="w-6 h-6 mx-auto mb-1" />
            <span className="text-xs">双人空间</span>
          </div>

          {/* Partner Avatar */}
          <div className="flex-1 text-right">
            {data.partner ? (
              <>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-500 flex items-center justify-center text-white font-bold ml-auto">
                  {data.partner.username?.charAt(0).toUpperCase()}
                </div>
                <p className="text-sm font-medium text-gray-700 mt-2">
                  {data.partner.username}
                </p>
              </>
            ) : (
              <div className="text-center">
                <p className="text-sm text-gray-500">还没有搭档</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Level & Experience */}
        <div className="bg-white rounded-2xl shadow-md p-4">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-medium text-gray-600">等级</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">
            Lv.{data.userLevel?.current_level || 1}
          </p>
          <div className="mt-3 bg-gray-100 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-amber-400 to-amber-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {data.userLevel?.current_experience || 0} /{' '}
            {Math.pow((data.userLevel?.current_level || 1) + 1, 1.5) * 100}
          </p>
        </div>

        {/* Streak */}
        <div className="bg-white rounded-2xl shadow-md p-4">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-5 h-5 text-red-500" />
            <span className="text-sm font-medium text-gray-600">连续天数</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">
            {data.streak?.current_streak || 0}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            最长记录：{data.streak?.longest_streak || 0} 天
          </p>
        </div>

        {/* Today's Time */}
        <div className="bg-white rounded-2xl shadow-md p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-yellow-500" />
            <span className="text-sm font-medium text-gray-600">今日学习</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">
            {data.todayStats?.total_minutes || 0}
          </p>
          <p className="text-xs text-gray-500 mt-2">分钟</p>
        </div>

        {/* Today's Tasks */}
        <div className="bg-white rounded-2xl shadow-md p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium text-gray-600">今日任务</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">
            {data.todayStats?.tasks_completed || 0}/{data.todayStats?.tasks_total || 0}
          </p>
          <p className="text-xs text-gray-500 mt-2">已完成</p>
        </div>
      </div>

      {/* Today's Thought Input */}
      <div className="bg-white rounded-2xl shadow-md p-5 space-y-3">
        <label className="text-sm font-medium text-gray-700">
          今日一句话
        </label>
        <textarea
          placeholder="分享你今天的感受、目标或提醒..."
          maxLength={100}
          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none text-sm"
          rows={2}
        />
        <p className="text-xs text-gray-500">用简短的话激励自己</p>
      </div>

      {/* Daily Checkin */}
      <button
        onClick={handleDailyCheckin}
        disabled={isCheckinLoading || checked}
        className={`w-full py-4 rounded-2xl font-bold transition-all ${
          checked
            ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
            : 'bg-gradient-to-r from-green-400 to-green-500 text-white hover:shadow-lg'
        }`}
      >
        {checked ? '✓ 今日已打卡' : '🎯 今日打卡'}
      </button>

      {/* Mood Checkin Modal */}
      {showMoodModal && spaceId && authUser && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white w-full rounded-t-3xl shadow-2xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">记录心情</h3>
              <button
                onClick={() => setShowMoodModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <MoodCheckin
              spaceId={spaceId}
              userId={authUser.id}
              onSuccess={() => setShowMoodModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
