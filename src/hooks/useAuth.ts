'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { User } from '@/lib/types';

interface UseAuthState {
  user: SupabaseUser | null;
  profile: User | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<UseAuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null,
  });
  const router = useRouter();

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      setState(prev => ({
        ...prev,
        profile: data ?? null,
        error: data ? null : '用户资料尚未初始化',
      }));
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      setState(prev => ({
        ...prev,
        profile: null,
        error: err instanceof Error ? err.message : '获取用户信息失败',
      }));
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) throw error;
        if (!isMounted) return;

        if (session?.user) {
          setState(prev => ({
            ...prev,
            user: session.user,
            loading: false,
            error: null,
          }));
          void fetchUserProfile(session.user.id);
        } else {
          setState(prev => ({
            ...prev,
            user: null,
            profile: null,
            loading: false,
            error: null,
          }));
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (isMounted) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: err instanceof Error ? err.message : '认证初始化失败',
          }));
        }
      }
    };

    void initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;

      if (session?.user) {
        const currentUser = session.user;
        setState(prev => ({
          ...prev,
          user: currentUser,
          loading: false,
          error: null,
        }));

        // 避免在 onAuthStateChange 回调内部直接 await 其他 Supabase 请求。
        window.setTimeout(() => {
          if (isMounted) {
            void fetchUserProfile(currentUser.id);
          }
        }, 0);
      } else {
        setState(prev => ({
          ...prev,
          user: null,
          profile: null,
          loading: false,
          error: null,
        }));
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const register = useCallback(
    async (email: string, password: string, username: string) => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username },
          },
        });

        if (error) throw error;
        if (!data.user) throw new Error('注册失败，未创建用户');

        if (
          Array.isArray(data.user.identities) &&
          data.user.identities.length === 0
        ) {
          throw new Error('该邮箱已经注册，请直接登录');
        }

        setState(prev => ({
          ...prev,
          user: data.session?.user ?? null,
          loading: false,
          error: null,
        }));

        if (data.session?.user) {
          void fetchUserProfile(data.session.user.id);
        }

        return {
          requiresEmailConfirmation: !data.session,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : '注册失败';
        setState(prev => ({
          ...prev,
          loading: false,
          error: message,
        }));
        throw err;
      }
    },
    [fetchUserProfile],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        if (!data.user || !data.session) {
          throw new Error('登录失败，未建立登录会话');
        }

        setState(prev => ({
          ...prev,
          user: data.user,
          loading: false,
          error: null,
        }));

        // 登录成功本身不再等待 profile 查询，避免资料查询阻塞页面跳转。
        void fetchUserProfile(data.user.id);

        return data.session;
      } catch (err) {
        const message = err instanceof Error ? err.message : '登录失败';
        setState(prev => ({
          ...prev,
          loading: false,
          error: message,
        }));
        throw err;
      }
    },
    [fetchUserProfile],
  );

  const logout = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setState({
        user: null,
        profile: null,
        loading: false,
        error: null,
      });
      router.replace('/auth/login');
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : '登出失败',
      }));
    }
  }, [router]);

  const resetPassword = useCallback(async (email: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const siteUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        (typeof window !== 'undefined' ? window.location.origin : '');

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/auth/reset-password`,
      });

      if (error) throw error;
      setState(prev => ({ ...prev, loading: false }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : '密码重置请求失败',
      }));
      throw err;
    }
  }, []);

  return {
    ...state,
    register,
    login,
    logout,
    resetPassword,
  };
}
