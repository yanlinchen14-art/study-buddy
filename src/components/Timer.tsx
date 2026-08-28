'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface TimerProps {
  spaceId: string;
  userId: string;
  taskId?: string;
  onSessionEnd?: () => void;
}

type TimerMode = 'select' | 'running' | 'paused' | 'completed';

export function Timer({ spaceId, userId, taskId: initialTaskId, onSessionEnd }: TimerProps) {
  const [mode, setMode] = useState<TimerMode>('select');
  const [presetMinutes, setPresetMinutes] = useState(25);
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [subject, setSubject] = useState('');
  const [notes, setNotes] = useState('');
  const [taskId, setTaskId] = useState(initialTaskId || '');
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 获取任务列表
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('space_id', spaceId)
          .eq('status', 'not_started')
          .limit(10);

        if (error) throw error;
        setTasks(data || []);
      } catch (err) {
        console.error('Failed to fetch tasks:', err);
      }
    };

    fetchTasks();
  }, [spaceId]);

  // 计时器倒计时逻辑
  useEffect(() => {
    if (mode !== 'running') return;

    const timer = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          setMode('completed');
          toast.success('学习时间到！');
          return 0;
        }
        return prev - 1;
      });

      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [mode]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    if (presetMinutes < 1 || presetMinutes > 480) {
      setError('请输入 1-480 分钟之间的时间');
      return;
    }
    setMode('running');
    setError(null);
  };

  const handlePause = () => {
    setMode('paused');
  };

  const handleResume = () => {
    setMode('running');
  };

  const handleReset = () => {
    setMode('select');
    setRemainingSeconds(presetMinutes * 60);
    setElapsedSeconds(0);
    setSubject('');
    setNotes('');
    setTaskId(initialTaskId || '');
  };

  const handleComplete = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const durationMinutes = Math.floor(elapsedSeconds / 60);

      if (durationMinutes < 1) {
        setError('学习时间不能少于 1 分钟');
        setIsSaving(false);
        return;
      }

      // 保存学习会话
      const { error: sessionError } = await supabase
        .from('learning_sessions')
        .insert({
          space_id: spaceId,
          user_id: userId,
          task_id: taskId || null,
          subject: subject || null,
          notes: notes || null,
          start_time: new Date(Date.now() - elapsedSeconds * 1000).toISOString(),
          end_time: new Date().toISOString(),
          duration_minutes: durationMinutes,
        });

      if (sessionError) throw sessionError;

      // 记录经验值
      const expAmount = durationMinutes * 10; // 每分钟 10 经验
      const { error: expError } = await supabase
        .from('experience_logs')
        .insert({
          space_id: spaceId,
          user_id: userId,
          exp_type: 'session_end',
          exp_amount: expAmount,
        });

      if (expError) throw expError;

      // 如果关联了任务，更新任务状态
      if (taskId) {
        const { error: taskError } = await supabase
          .from('tasks')
          .update({ status: 'in_progress' })
          .eq('id', taskId);

        if (taskError) throw taskError;
      }

      toast.success(`太棒了！完成了 ${durationMinutes} 分钟的学习！`);
      onSessionEnd?.();
      handleReset();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '保存失败';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  if (mode === 'select') {
    return (
      <div className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Preset Times */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            选择预设时间
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[25, 45, 60].map((min) => (
              <button
                key={min}
                type="button"
                onClick={() => {
                  setPresetMinutes(min);
                  setTotalSeconds(min * 60);
                  setRemainingSeconds(min * 60);
                  setElapsedSeconds(0);
                }}
                className={`py-4 rounded-xl font-semibold transition-all ${
                  presetMinutes === min
                    ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {min} 分钟
              </button>
            ))}
          </div>
        </div>

        {/* Custom Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            自定义时间（分钟）
          </label>
          <input
            type="number"
            value={presetMinutes}
            onChange={(e) => {
              const val = Math.max(1, Math.min(480, parseInt(e.target.value) || 25));
              setPresetMinutes(val);
              setTotalSeconds(val * 60);
              setRemainingSeconds(val * 60);
              setElapsedSeconds(0);
            }}
            min="1"
            max="480"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            科目
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="你要学习的科目"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>

        {/* Task Selection */}
        {tasks.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              关联任务（可选）
            </label>
            <select
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300"
            >
              <option value="">-- 不关联 --</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            备注
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="记录一些学习笔记或想法..."
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
            rows={2}
          />
        </div>

        {/* Start Button */}
        <button
          onClick={handleStart}
          className="w-full py-4 bg-gradient-to-r from-orange-400 to-orange-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-orange-200 transition flex items-center justify-center gap-2 text-lg"
        >
          <Play className="w-6 h-6" />
          开始学习
        </button>
      </div>
    );
  }

  if (mode === 'completed') {
    return (
      <div className="text-center space-y-6">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            太棒了！
          </h2>
          <p className="text-gray-600 mb-4">
            你完成了 {Math.floor(elapsedSeconds / 60)} 分钟的学习
          </p>
          <div className="p-4 bg-green-50 border border-green-200 rounded-2xl">
            <p className="text-green-700 font-semibold">
              +{Math.floor(elapsedSeconds / 60) * 10} 经验值
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition"
          >
            再来一次
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-center">
      {/* Timer Display */}
      <div className="p-8 bg-gradient-to-br from-orange-50 to-purple-50 rounded-3xl">
        <div className="text-6xl font-bold text-transparent bg-gradient-to-r from-orange-400 to-purple-500 bg-clip-text font-mono">
          {formatTime(remainingSeconds)}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-orange-400 to-orange-500 h-2 rounded-full transition-all"
          style={{
            width: `${((elapsedSeconds / totalSeconds) * 100)}%`,
          }}
        />
      </div>

      {/* Info */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="p-3 bg-gray-50 rounded-xl">
          <p className="text-xs text-gray-600">已学</p>
          <p className="font-semibold text-gray-800">
            {Math.floor(elapsedSeconds / 60)}m
          </p>
        </div>
        <div className="p-3 bg-gray-50 rounded-xl">
          <p className="text-xs text-gray-600">剩余</p>
          <p className="font-semibold text-gray-800">
            {Math.floor(remainingSeconds / 60)}m
          </p>
        </div>
        <div className="p-3 bg-gray-50 rounded-xl">
          <p className="text-xs text-gray-600">科目</p>
          <p className="font-semibold text-gray-800 truncate">
            {subject || '-'}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        {mode === 'paused' ? (
          <button
            onClick={handleResume}
            className="flex-1 py-3 bg-gradient-to-r from-green-400 to-green-500 text-white font-semibold rounded-xl hover:shadow-lg transition flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            继续
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="flex-1 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white font-semibold rounded-xl hover:shadow-lg transition flex items-center justify-center gap-2"
          >
            <Pause className="w-5 h-5" />
            暂停
          </button>
        )}

        <button
          onClick={handleReset}
          className="px-4 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition flex items-center justify-center"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      {/* Complete Button */}
      <button
        onClick={handleComplete}
        disabled={isSaving || elapsedSeconds < 60}
        className="w-full py-3 bg-gradient-to-r from-purple-400 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSaving ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            保存中...
          </>
        ) : (
          <>
            <CheckCircle className="w-5 h-5" />
            结束学习
          </>
        )}
      </button>
    </div>
  );
}
