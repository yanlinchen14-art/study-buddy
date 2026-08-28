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

  // 获取用户信息
  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setState(prev => ({ ...prev, profile: data, error: null }));
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : '获取用户信息失败',
      }));
    }
  }, []);

  // 初始化认证状态
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (session?.user) {
          setState(prev => ({ ...prev, user: session.user }));
          await fetchUserProfile(session.user.id);
        }

        setState(prev => ({ ...prev, loading: false }));
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

    initAuth();

    // 监听认证状态变化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (session?.user) {
        setState(prev => ({ ...prev, user: session.user, error: null }));
        await fetchUserProfile(session.user.id);
      } else {
        setState(prev => ({
          ...prev,
          user: null,
          profile: null,
          error: null,
        }));
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [fetchUserProfile]);

  // 注册
  const register = useCallback(
    async (email: string, password: string, username: string) => {
      setState(prev => ({ ...prev, loading: true, error: null }));
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username,
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          setState(prev => ({
            ...prev,
            user: data.user,
            loading: false,
          }));

          // 如果注册后已经有登录会话，再读取用户资料。
          // 如果 Supabase 开启了邮箱验证，注册时通常还没有 session，
          // 这时先等待用户验证并登录，避免被 RLS 拦截。
          if (data.session) {
            await fetchUserProfile(data.user.id);
          }
        } else {
          setState(prev => ({ ...prev, loading: false }));
        }
      } catch (err) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : '注册失败',
        }));
        throw err;
      }
    },
    [fetchUserProfile],
  );

  // 登录
  const login = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        setState(prev => ({
          ...prev,
          user: data.user,
          loading: false,
        }));
        await fetchUserProfile(data.user.id);
      }
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : '登录失败',
      }));
      throw err;
    }
  }, [fetchUserProfile]);

  // 登出
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
      router.push('/auth/login');
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : '登出失败',
      }));
    }
  }, [router]);

  // 重置密码
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
