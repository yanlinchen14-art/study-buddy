'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertCircle, Loader2, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface MoodCheckinProps {
  spaceId: string;
  userId: string;
  onSuccess?: () => void;
}

const moods = [
  { value: 'happy', emoji: '😄', label: '开心' },
  { value: 'good', emoji: '😊', label: '不错' },
  { value: 'normal', emoji: '😐', label: '平常' },
  { value: 'low', emoji: '😔', label: '低落' },
  { value: 'tired', emoji: '😴', label: '疲惫' },
  { value: 'anxious', emoji: '😰', label: '焦虑' },
  { value: 'unfocused', emoji: '🤔', label: '分心' },
  { value: 'recovering', emoji: '💪', label: '恢复中' },
];

export function MoodCheckin({ spaceId, userId, onSuccess }: MoodCheckinProps) {
  const [mood, setMood] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [todayMood, setTodayMood] = useState<any | null>(null);

  const today = new Date().toISOString().split('T')[0];

  // 获取今天的心情记录
  useEffect(() => {
    const fetchTodayMood = async () => {
      try {
        const { data, error } = await supabase
          .from('mood_entries')
          .select('*')
          .eq('space_id', spaceId)
          .eq('user_id', userId)
          .eq('mood_date', today)
          .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (data) {
          setTodayMood(data);
          setMood(data.mood);
          setNote(data.note || '');
        }
      } catch (err) {
        console.error('Failed to fetch today mood:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTodayMood();
  }, [spaceId, userId, today]);

  const handleSubmit = async () => {
    if (!mood) {
      setError('请选择一个心情');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (todayMood) {
        // 更新现有记录
        const { error } = await supabase
          .from('mood_entries')
          .update({
            mood,
            note,
            updated_at: new Date().toISOString(),
          })
          .eq('id', todayMood.id);

        if (error) throw error;
        toast.success('心情已更新');
      } else {
        // 创建新记录
        const { error } = await supabase.from('mood_entries').insert({
          space_id: spaceId,
          user_id: userId,
          mood_date: today,
          mood,
          note,
        });

        if (error) throw error;

        // 记录经验值
        await supabase.from('experience_logs').insert({
          space_id: spaceId,
          user_id: userId,
          exp_type: 'mood_checkin',
          exp_amount: 5,
        });

        toast.success('心情已保存');
      }

      onSuccess?.();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '保存失败';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          {todayMood ? '更新你的心情' : '今天的心情如何？'}
        </h3>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Mood Selection Grid */}
      <div className="grid grid-cols-4 gap-3">
        {moods.map((m) => (
          <button
            key={m.value}
            onClick={() => setMood(m.value)}
            disabled={isSubmitting}
            className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${
              mood === m.value
                ? 'bg-orange-100 border-2 border-orange-400 scale-105'
                : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
            } disabled:opacity-50`}
          >
            <span className="text-3xl">{m.emoji}</span>
            <span className="text-xs font-medium text-gray-600">{m.label}</span>
          </button>
        ))}
      </div>

      {/* Note Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          附加备注（可选）
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="分享你的想法或感受..."
          maxLength={200}
          disabled={isSubmitting}
          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
          rows={3}
        />
        <p className="text-xs text-gray-500 mt-1">
          {note.length}/200
        </p>
      </div>

      {/* Gentle Message */}
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl text-sm text-purple-700">
        <p className="mb-2">💜 <strong>温柔提示</strong></p>
        <p>
          {mood === 'happy' && '很高兴看到你心情这么好！继续保持哦～'}
          {mood === 'good' && '不错的状态，记得休息的时候慢下来享受～'}
          {mood === 'normal' && '平常心是最好的心。今天也要加油呢～'}
          {mood === 'low' && '没关系，每个人都有低落的时候。想想有什么可以让你开心的事？'}
          {mood === 'tired' && '身体疲惫了？试试休息一下或者做点喜欢的事～'}
          {mood === 'anxious' && '感到焦虑很正常。可以尝试深呼吸或者找朋友倾诉～'}
          {mood === 'unfocused' && '分心的时候很正常。试试换个环境或者休息一下吧～'}
          {mood === 'recovering' && '很高兴看到你在恢复中。继续加油！💪'}
          {!mood && '选择你现在的心情，我们一起加油～'}
        </p>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting || !mood}
        className="w-full py-3 bg-gradient-to-r from-orange-400 to-orange-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-orange-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            保存中...
          </>
        ) : (
          <>
            <Check className="w-5 h-5" />
            {todayMood ? '更新' : '保存'}心情
          </>
        )}
      </button>
    </div>
  );
}
