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
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;

      if (session?.user) {
        const currentUser = session.user;

        setState(prev => ({
          ...prev,
          user: currentUser,
          error: null,
        }));

        // 不要在 onAuthStateChange 回调里直接 await Supabase 请求，
        // 否则可能造成 supabase-js 认证死锁，表现为“登录中...”一直不结束。
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

        if (!data.user) {
          throw new Error('注册失败，未创建用户');
        }

        // Supabase 在邮箱确认开启时，为防止泄露“某邮箱是否已注册”，
        // 对某些重复注册请求可能返回一个模糊用户对象而不直接报错。
        if (
          Array.isArray(data.user.identities) &&
          data.user.identities.length === 0
        ) {
          throw new Error('该邮箱可能已经注册，请直接登录或使用其他邮箱');
        }

        setState(prev => ({
          ...prev,
          user: data.user,
          loading: false,
        }));

        // 如果注册后已经有登录会话，再读取用户资料。
        // 如果开启邮箱验证，通常 session 为 null，验证并登录后再读取即可。
        if (data.session) {
          await fetchUserProfile(data.user.id);
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
