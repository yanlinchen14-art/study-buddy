'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Timer } from '@/components/Timer';
import { Loader2, Clock } from 'lucide-react';

export default function TimerPage() {
  const { user } = useAuth();
  const [spaceId, setSpaceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const initTimer = async () => {
      try {
        const { data: members } = await supabase
          .from('study_space_members')
          .select('space_id')
          .eq('user_id', user.id)
          .limit(1);

        if (!members || members.length === 0) return;

        const currentSpaceId = members[0].space_id;
        setSpaceId(currentSpaceId);

        // 获取最近的学习会话
        const { data: sessions } = await supabase
          .from('learning_sessions')
          .select('*')
          .eq('space_id', currentSpaceId)
          .eq('user_id', user.id)
          .order('end_time', { ascending: false })
          .limit(5);

        setRecentSessions(sessions || []);
      } catch (err) {
        console.error('Failed to init timer:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initTimer();
  }, [user]);

  const handleSessionEnd = async () => {
    if (!user || !spaceId) return;

    try {
      const { data: sessions } = await supabase
        .from('learning_sessions')
        .select('*')
        .eq('space_id', spaceId)
        .eq('user_id', user.id)
        .order('end_time', { ascending: false })
        .limit(5);

      setRecentSessions(sessions || []);
    } catch (err) {
      console.error('Failed to refresh sessions:', err);
    }
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">学习计时</h1>
        <p className="text-gray-600 mt-1">专注学习，记录每一分钟</p>
      </div>

      {/* Timer Component */}
      {spaceId && user && (
        <div className="bg-white rounded-2xl p-6 shadow-md">
          <Timer
            spaceId={spaceId}
            userId={user.id}
            onSessionEnd={handleSessionEnd}
          />
        </div>
      )}

      {/* Recent Sessions */}
      {recentSessions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">最近的学习</h2>

          <div className="space-y-3">
            {recentSessions.map(session => (
              <div
                key={session.id}
                className="bg-white rounded-2xl p-4 shadow-md flex items-start gap-4"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>

                <div className="flex-1 min-w-0">
                  {session.subject && (
                    <h3 className="font-semibold text-gray-800">
                      {session.subject}
                    </h3>
                  )}

                  {session.notes && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {session.notes}
                    </p>
                  )}

                  <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                    <span className="font-medium text-orange-600">
                      {session.duration_minutes} 分钟
                    </span>
                    <span>
                      {new Date(session.end_time).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
        <h3 className="font-semibold text-blue-900 mb-2">💡 小贴士</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 选择适合你的计时时长，保持专注</li>
          <li>• 关联任务，自动追踪学习进度</li>
          <li>• 每完成一个计时周期，记得休息一下</li>
          <li>• 学习时间越长，获得经验值越多</li>
        </ul>
      </div>
    </div>
  );
}
