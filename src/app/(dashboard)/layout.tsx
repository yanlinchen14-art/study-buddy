'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { BottomNav } from '@/components/BottomNav';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [spaceId, setSpaceId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const initDashboard = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          router.push('/auth/login');
          return;
        }

        // 获取用户的学习空间
        const { data: members } = await supabase
          .from('study_space_members')
          .select('space_id')
          .eq('user_id', session.user.id)
          .limit(1);

        if (members && members.length > 0) {
          setSpaceId(members[0].space_id);
        } else {
          // 重定向到空间创建/绑定页面
          router.push('/settings/space');
        }
      } catch (err) {
        console.error('Dashboard init error:', err);
        router.push('/auth/login');
      } finally {
        setIsLoading(false);
      }
    };

    initDashboard();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-purple-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-400 mx-auto mb-4" />
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!spaceId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-purple-50">
        <div className="text-center">
          <p className="text-gray-600">重定向中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50">
      <div className="max-w-md mx-auto pb-24 md:pb-0">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
