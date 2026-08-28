'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { BottomNav } from '@/components/BottomNav';
import { Loader2, AlertCircle } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [spaceId, setSpaceId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const isSpaceSettingsPage = pathname === '/settings/space';

  useEffect(() => {
    let cancelled = false;

    const initDashboard = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;
        if (cancelled) return;

        if (!session?.user) {
          router.replace(`/auth/login?next=${encodeURIComponent(pathname)}`);
          return;
        }

        // 这个页面本身就是给“还没有学习空间”的登录用户使用的，
        // 因此不能先要求 spaceId 才允许它显示。
        if (isSpaceSettingsPage) {
          setIsLoading(false);
          return;
        }

        const { data: members, error: memberError } = await supabase
          .from('study_space_members')
          .select('space_id')
          .eq('user_id', session.user.id)
          .limit(1);

        if (memberError) throw memberError;
        if (cancelled) return;

        if (!members || members.length === 0) {
          setSpaceId(null);
          setIsLoading(false);
          router.replace('/settings/space');
          return;
        }

        setSpaceId(members[0].space_id);
        setIsLoading(false);
      } catch (err) {
        console.error('Dashboard init error:', err);
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : '页面初始化失败');
          setIsLoading(false);
        }
      }
    };

    void initDashboard();

    return () => {
      cancelled = true;
    };
  }, [isSpaceSettingsPage, pathname, router]);

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

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-purple-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-6 shadow-md">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-800 text-center mb-2">页面初始化失败</h2>
          <p className="text-sm text-red-600 break-words text-center">{loadError}</p>
        </div>
      </div>
    );
  }

  if (isSpaceSettingsPage) {
    return <>{children}</>;
  }

  if (!spaceId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-purple-50">
        <p className="text-gray-600">正在进入学习空间设置...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50">
      <div className="max-w-md mx-auto pb-24 md:pb-0">{children}</div>
      <BottomNav />
    </div>
  );
}
