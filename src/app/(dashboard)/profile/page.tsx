'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useGameification } from '@/hooks/useGameification';
import { Loader2, LogOut, Award, TrendingUp, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Badge } from '@/lib/types';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, profile, logout } = useAuth();
  const { getUserBadges } = useGameification();
  const [spaceId, setSpaceId] = useState<string | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bio, setBio] = useState('');
  const [learningGoals, setLearningGoals] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  // 初始化
  useEffect(() => {
    if (!user || !profile) return;

    const initProfile = async () => {
      try {
        const { data: members } = await supabase
          .from('study_space_members')
          .select('space_id')
          .eq('user_id', user.id)
          .limit(1);

        if (!members || members.length === 0) return;

        const currentSpaceId = members[0].space_id;
        setSpaceId(currentSpaceId);

        // 获取徽章
        const userBadges = await getUserBadges(currentSpaceId, user.id);
        setBadges(userBadges || []);

        // 获取统计数据
        const today = new Date().toISOString().split('T')[0];
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];

        const { data: weeklyStats } = await supabase
          .from('daily_stats')
          .select('total_minutes, tasks_completed')
          .eq('space_id', currentSpaceId)
          .eq('user_id', user.id)
          .gte('stat_date', oneWeekAgo)
          .lte('stat_date', today);

        const totalMinutes = weeklyStats?.reduce((sum, s) => sum + s.total_minutes, 0) || 0;
        const totalTasks = weeklyStats?.reduce((sum, s) => sum + s.tasks_completed, 0) || 0;

        setStats({
          weeklyMinutes: totalMinutes,
          weeklyTasks: totalTasks,
          dataPoints: weeklyStats?.length || 0,
        });

        // 初始化表单
        setBio(profile.bio || '');
        setLearningGoals(profile.learning_goals || '');
      } catch (err) {
        console.error('Failed to init profile:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initProfile();
  }, [user, profile, getUserBadges]);

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          bio: bio.trim() || null,
          learning_goals: learningGoals.trim() || null,
        })
        .eq('id', user.id);

      if (error) throw error;
      toast.success('个人资料已更新');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '更新失败');
    } finally {
      setIsSaving(false);
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

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">个人资料</h1>
        <button
          onClick={handleLogout}
          className="p-2 hover:bg-red-50 rounded-full transition"
          title="登出"
        >
          <LogOut className="w-6 h-6 text-red-500" />
        </button>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-3xl shadow-md p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white text-2xl font-bold">
            {profile?.username?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {profile?.username}
            </h2>
            <p className="text-sm text-gray-600">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Weekly Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">周学习时间</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              {stats.weeklyMinutes}
            </p>
            <p className="text-xs text-blue-700 mt-1">分钟</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-900">周任务完成</span>
            </div>
            <p className="text-2xl font-bold text-green-900">
              {stats.weeklyTasks}
            </p>
            <p className="text-xs text-green-700 mt-1">个</p>
          </div>
        </div>
      )}

      {/* Bio */}
      <div className="bg-white rounded-2xl p-5 space-y-3">
        <label className="text-sm font-medium text-gray-700">
          个人简介
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="介绍一下你自己..."
          maxLength={200}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
          rows={3}
        />
        <p className="text-xs text-gray-500">{bio.length}/200</p>
      </div>

      {/* Learning Goals */}
      <div className="bg-white rounded-2xl p-5 space-y-3">
        <label className="text-sm font-medium text-gray-700">
          学习目标
        </label>
        <textarea
          value={learningGoals}
          onChange={(e) => setLearningGoals(e.target.value)}
          placeholder="分享你的学习目标和计划..."
          maxLength={200}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
          rows={3}
        />
        <p className="text-xs text-gray-500">{learningGoals.length}/200</p>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSaveProfile}
        disabled={isSaving}
        className="w-full py-3 bg-gradient-to-r from-orange-400 to-orange-500 text-white font-semibold rounded-xl hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isSaving ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            保存中...
          </>
        ) : (
          '保存资料'
        )}
      </button>

      {/* Badges Section */}
      {badges.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            我的徽章
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {badges.map(badge => (
              <div
                key={badge.id}
                className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-4 text-center"
              >
                <div className="text-2xl mb-2">{badge.icon_url || '🏅'}</div>
                <p className="text-xs font-medium text-gray-800">{badge.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-red-900">⚠️ 危险区域</h3>
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2 text-sm font-semibold text-red-600 border border-red-300 rounded-xl hover:bg-red-100 transition"
        >
          登出账户
        </button>
      </div>
    </div>
  );
}
