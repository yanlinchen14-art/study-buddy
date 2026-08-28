'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  Copy,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';

type Step = 'options' | 'create' | 'join';

export default function SpaceSettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState<Step>('options');
  const [spaceName, setSpaceName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState('');
  const [existingSpace, setExistingSpace] = useState<any | null>(null);
  const router = useRouter();

  // 检查是否已有空间
  useEffect(() => {
    if (!user) return;

    const checkSpace = async () => {
      try {
        const { data: members, error: memberError } = await supabase
          .from('study_space_members')
          .select('space_id, study_spaces(name, invite_code)')
          .eq('user_id', user.id)
          .limit(1);

        if (memberError) throw memberError;

        if (members && members.length > 0) {
          setExistingSpace(members[0]);
          setTimeout(() => router.replace('/'), 1200);
        }
      } catch (err) {
        console.error('Failed to check space:', err);
      }
    };

    checkSpace();
  }, [user, router]);

  const generateInviteCode = () =>
    Math.random().toString(36).substring(2, 8).toUpperCase();

  const handleCreateSpace = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!spaceName.trim()) {
      setError('请输入学习空间名称');
      return;
    }

    if (!user) return;

    setIsSubmitting(true);

    try {
      const code = generatedCode || generateInviteCode();
      if (!generatedCode) setGeneratedCode(code);

      // 通过数据库事务函数同时创建空间和创建者成员关系，避免只创建一半。
      const { data: createdRows, error: createError } = await supabase.rpc(
        'create_study_space_with_owner',
        {
          p_name: spaceName.trim(),
          p_invite_code: code,
        },
      );

      if (createError) throw createError;

      const created = Array.isArray(createdRows) ? createdRows[0] : createdRows;
      if (!created) throw new Error('创建失败，数据库未返回学习空间');

      toast.success('学习空间创建成功！');
      setExistingSpace({
        space_id: created.space_id,
        study_spaces: {
          name: created.space_name,
          invite_code: created.invite_code_out,
        },
      });
      setTimeout(() => router.replace('/'), 1200);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '创建失败';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinSpace = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!inviteCode.trim()) {
      setError('请输入邀请码');
      return;
    }

    if (!user) return;

    setIsSubmitting(true);

    try {
      // 通过数据库事务函数按邀请码加入，服务端会校验邀请码、人数上限和重复加入。
      const { data: joinedRows, error: joinError } = await supabase.rpc(
        'join_study_space_by_code',
        { p_invite_code: inviteCode.trim().toUpperCase() },
      );

      if (joinError) throw joinError;

      const joined = Array.isArray(joinedRows) ? joinedRows[0] : joinedRows;
      if (!joined) throw new Error('加入失败，数据库未返回学习空间');

      toast.success('成功加入学习空间！');
      setExistingSpace({
        space_id: joined.space_id,
        study_spaces: {
          name: joined.space_name,
          invite_code: joined.invite_code_out,
        },
      });
      setTimeout(() => router.replace('/'), 1200);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '加入失败';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-purple-50">
        <Loader2 className="w-10 h-10 animate-spin text-orange-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 shadow-md text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-gray-700">登录会话不存在，请重新登录。</p>
          <button
            type="button"
            onClick={() => router.replace('/auth/login')}
            className="mt-4 px-5 py-2 bg-orange-400 text-white rounded-xl"
          >
            返回登录
          </button>
        </div>
      </div>
    );
  }

  if (existingSpace) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">成功！</h2>
          <p className="text-gray-600">
            已连接到学习空间"{existingSpace.study_spaces?.name}"
          </p>
          <p className="text-sm text-gray-500 mt-4">正在跳转到首页...</p>
        </div>
      </div>
    );
  }

  if (step === 'options') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-purple-400 bg-clip-text text-transparent">
              Study Buddy
            </h1>
            <p className="text-gray-600 mt-2">双人学习空间绑定</p>
          </div>

          <div className="space-y-4">
            {/* Create Button */}
            <button
              onClick={() => {
                setGeneratedCode(generateInviteCode());
                setStep('create');
                setError(null);
              }}
              className="w-full p-6 bg-gradient-to-br from-orange-400 to-orange-500 text-white rounded-2xl hover:shadow-lg transition flex items-center gap-4"
            >
              <div className="flex-1 text-left">
                <h3 className="font-bold text-lg">创建学习空间</h3>
                <p className="text-sm text-orange-100">邀请你的学习伙伴</p>
              </div>
              <div className="text-2xl">🏗️</div>
            </button>

            {/* Join Button */}
            <button
              onClick={() => {
                setStep('join');
                setError(null);
              }}
              className="w-full p-6 bg-gradient-to-br from-purple-400 to-purple-500 text-white rounded-2xl hover:shadow-lg transition flex items-center gap-4"
            >
              <div className="flex-1 text-left">
                <h3 className="font-bold text-lg">加入学习空间</h3>
                <p className="text-sm text-purple-100">输入邀请码加入</p>
              </div>
              <div className="text-2xl">🔗</div>
            </button>
          </div>

          {/* Info */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <h4 className="font-semibold text-blue-900 mb-2">💙 关于双人空间</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 一个学习空间只能有两个成员</li>
              <li>• 可以共享任务、成果和学习记录</li>
              <li>• 邀请码可以分享给你的学习伙伴</li>
              <li>• 一起学习，互相陪伴</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'create') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <button
              onClick={() => setStep('options')}
              className="text-gray-600 hover:text-gray-800 mb-4"
            >
              ← 返回
            </button>
            <h1 className="text-2xl font-bold text-gray-800">创建学习空间</h1>
          </div>

          <form onSubmit={handleCreateSpace} className="bg-white rounded-2xl p-6 shadow-md space-y-5">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Space Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                学习空间名称
              </label>
              <input
                type="text"
                value={spaceName}
                onChange={(e) => setSpaceName(e.target.value)}
                placeholder="比如：小明和小红的学习空间"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300"
                disabled={isSubmitting}
              />
            </div>

            {/* Invite Code Display */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                邀请码
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={generatedCode}
                  readOnly
                  className="flex-1 px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-center font-mono text-lg font-bold text-gray-800"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedCode);
                    toast.success('已复制到剪贴板');
                  }}
                  className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition flex items-center justify-center"
                >
                  <Copy className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                分享这个邀请码给你的学习伙伴
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || !spaceName.trim()}
              className="w-full py-3 bg-gradient-to-r from-orange-400 to-orange-500 text-white font-semibold rounded-xl hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  创建中...
                </>
              ) : (
                <>
                  <Users className="w-5 h-5" />
                  创建空间
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <button
            onClick={() => setStep('options')}
            className="text-gray-600 hover:text-gray-800 mb-4"
          >
            ← 返回
          </button>
          <h1 className="text-2xl font-bold text-gray-800">加入学习空间</h1>
        </div>

        <form onSubmit={handleJoinSpace} className="bg-white rounded-2xl p-6 shadow-md space-y-5">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Invite Code Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              邀请码
            </label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="输入邀请码 (6个字符)"
              maxLength={6}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 text-center text-lg font-mono font-bold"
              disabled={isSubmitting}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting || !inviteCode.trim()}
            className="w-full py-3 bg-gradient-to-r from-purple-400 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                加入中...
              </>
            ) : (
              <>
                <Users className="w-5 h-5" />
                加入空间
              </>
            )}
          </button>
        </form>

        {/* Help */}
        <div className="mt-6 bg-purple-50 border border-purple-200 rounded-2xl p-4">
          <h4 className="font-semibold text-purple-900 mb-2">💜 如何获取邀请码？</h4>
          <p className="text-sm text-purple-800">
            让你的学习伙伴创建学习空间后，他会得到一个 6 位的邀请码，分享给你即可。
          </p>
        </div>
      </div>
    </div>
  );
}
