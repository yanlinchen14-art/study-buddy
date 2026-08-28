'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  const isSpaceSettingsPage = pathname === '/settings/space';

  useEffect(() => {
    let mounted = true;

    const initDashboard = async () => {
      setIsLoading(true);

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Get session error:', sessionError);
        }

        if (!session?.user) {
          if (mounted) {
            setIsAuthenticated(false);
            setIsLoading(false);
          }
          router.replace('/auth/login');
          return;
        }

        if (!mounted) return;
        setIsAuthenticated(true);

        // 空间设置页本身必须允许“尚未加入空间”的已登录用户访问，
        // 否则会发生 /settings/space 自己重定向到自己的死循环。
        if (isSpaceSettingsPage) {
          setIsLoading(false);
          return;
        }

        const { data: members, error: memberError } = await supabase
          .from('study_space_members')
          .select('space_id')
          .eq('user_id', session.user.id)
          .limit(1);

        if (memberError) {
          console.error('Failed to load study space membership:', memberError);

          // 数据库权限或查询异常时，不要错误地把用户踢回登录页。
          // 先进入空间设置页，后续再处理数据库权限。
          if (mounted) {
            setSpaceId(null);
            setIsLoading(false);
          }
          router.replace('/settings/space');
          return;
        }

        if (members && members.length > 0) {
          if (mounted) {
            setSpaceId(members[0].space_id);
            setIsLoading(false);
          }
        } else {
          if (mounted) {
            setSpaceId(null);
            setIsLoading(false);
          }
          router.replace('/settings/space');
        }
      } catch (err) {
        console.error('Dashboard init error:', err);

        // 这里只在确实没有登录会话时才应该去登录页。
        // 其他异常不要把已经登录的用户误判成未登录。
        if (mounted) {
          setIsLoading(false);
        }
        router.replace('/settings/space');
      }
    };

    void initDashboard();

    return () => {
      mounted = false;
    };
  }, [router, isSpaceSettingsPage]);

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

  if (!isAuthenticated) {
    return null;
  }

  // 空间绑定页不要求用户已经拥有 spaceId。
  // 它正是用来创建/加入学习空间的。
  if (isSpaceSettingsPage) {
    return <>{children}</>;
  }

  if (!spaceId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-purple-50">
        <div className="text-center">
          <p className="text-gray-600">正在前往学习空间设置...</p>
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
