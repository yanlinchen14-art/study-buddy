'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Play, Pause, CheckCircle, BookOpen, User } from 'lucide-react';
import toast from 'react-hot-toast';
import type { User as UserType } from '@/lib/types';

export default function CostudyPage() {
  const { user } = useAuth();
  const [spaceId, setSpaceId] = useState<string | null>(null);
  const [partner, setPartner] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [userSubject, setUserSubject] = useState('');
  const [partnerSubject, setPartnerSubject] = useState('');
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // 获取搭档信息
  useEffect(() => {
    if (!user) return;

    const initCostudy = async () => {
      try {
        const { data: members } = await supabase
          .from('study_space_members')
          .select('space_id, user_id')
          .eq('user_id', user.id)
          .limit(1);

        if (!members || members.length === 0) return;

        const currentSpaceId = members[0].space_id;
        setSpaceId(currentSpaceId);

        // 获取搭档
        const { data: spaceMembers } = await supabase
          .from('study_space_members')
          .select('user_id')
          .eq('space_id', currentSpaceId)
          .neq('user_id', user.id);

        if (spaceMembers && spaceMembers.length > 0) {
          const { data: partnerData } = await supabase
            .from('users')
            .select('*')
            .eq('id', spaceMembers[0].user_id)
            .single();

          setPartner(partnerData);
        }
      } catch (err) {
        console.error('Failed to init costudy:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initCostudy();
  }, [user]);

  // 计时器
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      if (sessionStartTime) {
        const diff = new Date().getTime() - sessionStartTime.getTime();
        setElapsedMinutes(Math.floor(diff / 60000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, sessionStartTime]);

  const handleStartSession = async () => {
    if (!userSubject.trim()) {
      toast.error('请输入你的学习科目');
      return;
    }

    setIsActive(true);
    setSessionStartTime(new Date());
    toast.success('开始一起学习了！');
  };

  const handlePause = () => {
    setIsActive(false);
    toast.success('已暂停');
  };

  const handleResume = () => {
    setIsActive(true);
    toast.success('已继续');
  };

  const handleEndSession = async () => {
    if (!spaceId || !user || !partner) return;

    setIsSaving(true);

    try {
      if (elapsedMinutes < 1) {
        toast.error('学习时间不足 1 分钟');
        setIsSaving(false);
        return;
      }

      // 保存共同学习会话
      const { error } = await supabase.from('costudy_sessions').insert({
        space_id: spaceId,
        user1_id: user.id < partner.id ? user.id : partner.id,
        user2_id: user.id < partner.id ? partner.id : user.id,
        session_start: new Date(Date.now() - elapsedMinutes * 60000).toISOString(),
        session_end: new Date().toISOString(),
        user1_subject: user.id < partner.id ? userSubject : partnerSubject,
        user2_subject: user.id < partner.id ? partnerSubject : userSubject,
      });

      if (error) throw error;

      // 记录每个用户的学习会话
      await supabase.from('learning_sessions').insert({
        space_id: spaceId,
        user_id: user.id,
        subject: userSubject,
        notes: '一起学习',
        start_time: new Date(Date.now() - elapsedMinutes * 60000).toISOString(),
        end_time: new Date().toISOString(),
        duration_minutes: elapsedMinutes,
      });

      // 记录经验值
      const expAmount = elapsedMinutes * 10;
      await supabase.from('experience_logs').insert({
        space_id: spaceId,
        user_id: user.id,
        exp_type: 'costudy_session',
        exp_amount: expAmount,
      });

      toast.success(`完成了 ${elapsedMinutes} 分钟的一起学习！`);

      // 重置
      setIsActive(false);
      setUserSubject('');
      setPartnerSubject('');
      setSessionStartTime(null);
      setElapsedMinutes(0);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-orange-400" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="p-4 space-y-6 text-center py-12">
        <BookOpen className="w-16 h-16 text-gray-300 mx-auto" />
        <h2 className="text-xl font-bold text-gray-800">还没有学习伙伴</h2>
        <p className="text-gray-600">邀请你的伙伴，一起开启陪伴学习之旅吧！</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">一起学习</h1>
        <p className="text-gray-600 mt-1">和伙伴在一起，学习更专注</p>
      </div>

      {/* Partner Status Card */}
      <div className="bg-white rounded-3xl shadow-md p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">学习伙伴状态</h2>

        <div className="grid grid-cols-2 gap-4">
          {/* Your Status */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-orange-400 text-white flex items-center justify-center text-sm font-bold">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <span className="font-medium text-gray-800">你</span>
            </div>

            <input
              type="text"
              value={userSubject}
              onChange={(e) => setUserSubject(e.target.value)}
              placeholder="你的科目"
              disabled={isActive}
              className="w-full px-3 py-2 bg-white border border-orange-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:bg-gray-50"
            />

            <div className="mt-3 text-center">
              <p className="text-sm font-medium text-gray-700">
                {isActive && <span className="text-green-600">✓ 正在学习</span>}
                {!isActive && <span className="text-gray-500">未开始</span>}
              </p>
            </div>
          </div>

          {/* Partner Status */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-purple-400 text-white flex items-center justify-center text-sm font-bold">
                {partner.username?.charAt(0).toUpperCase()}
              </div>
              <span className="font-medium text-gray-800">{partner.username}</span>
            </div>

            <input
              type="text"
              value={partnerSubject}
              onChange={(e) => setPartnerSubject(e.target.value)}
              placeholder="伙伴的科目"
              disabled
              className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-600 cursor-not-allowed"
            />

            <div className="mt-3 text-center">
              <p className="text-sm font-medium text-gray-700">
                <span className="text-gray-500">等待中...</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Timer Display */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8 text-center">
        <div className="text-5xl font-bold text-transparent bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text font-mono">
          {Math.floor(elapsedMinutes / 60)
            .toString()
            .padStart(2, '0')}
          :{(elapsedMinutes % 60).toString().padStart(2, '0')}
        </div>
        <p className="text-gray-600 mt-3">已学习时间</p>
      </div>

      {/* Learning Status Card */}
      <div className="bg-white rounded-2xl p-4 shadow-md">
        <h3 className="font-semibold text-gray-800 mb-3">本次学习</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">你的科目</span>
            <span className="font-medium">{userSubject || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">状态</span>
            <span className={`font-medium ${isActive ? 'text-green-600' : 'text-gray-500'}`}>
              {isActive ? '🟢 进行中' : '⚫ 未开始'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">经验值</span>
            <span className="font-medium text-orange-600">
              +{elapsedMinutes * 10}
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-3">
        {!isActive && elapsedMinutes === 0 && (
          <button
            onClick={handleStartSession}
            disabled={!userSubject.trim()}
            className="w-full py-4 bg-gradient-to-r from-green-400 to-green-500 text-white font-bold rounded-2xl hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Play className="w-6 h-6" />
            开始学习
          </button>
        )}

        {isActive && (
          <button
            onClick={handlePause}
            className="w-full py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white font-bold rounded-2xl hover:shadow-lg transition flex items-center justify-center gap-2"
          >
            <Pause className="w-6 h-6" />
            暂停
          </button>
        )}

        {!isActive && elapsedMinutes > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleResume}
              className="py-3 bg-gradient-to-r from-green-400 to-green-500 text-white font-bold rounded-xl hover:shadow-lg transition flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              继续
            </button>
            <button
              onClick={handleEndSession}
              disabled={isSaving}
              className="py-3 bg-gradient-to-r from-purple-400 to-purple-500 text-white font-bold rounded-xl hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  结束
                </>
              )}
            </button>
          </div>
        )}

        {isActive && (
          <button
            onClick={handleEndSession}
            disabled={isSaving}
            className="w-full py-4 bg-gradient-to-r from-purple-400 to-purple-500 text-white font-bold rounded-2xl hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <CheckCircle className="w-6 h-6" />
                结束学习
              </>
            )}
          </button>
        )}
      </div>

      {/* Tips */}
      <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
        <h3 className="font-semibold text-purple-900 mb-2">💜 陪伴提示</h3>
        <ul className="text-sm text-purple-800 space-y-1">
          <li>• 告诉伙伴你要学什么科目</li>
          <li>• 互相陪伴，一起专注</li>
          <li>• 完成学习后点击结束保存</li>
          <li>• 和伙伴一起学习更有成就感</li>
        </ul>
      </div>
    </div>
  );
}
