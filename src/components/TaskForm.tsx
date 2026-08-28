'use client';

import { useState, FormEvent, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Task } from '@/lib/types';

interface TaskFormProps {
  spaceId: string;
  userId: string;
  task?: Task;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TaskForm({
  spaceId,
  userId,
  task,
  onSuccess,
  onCancel,
}: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [deadline, setDeadline] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 初始化编辑模式
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setSubject(task.subject || '');
      setDescription(task.description || '');
      setEstimatedMinutes(task.estimated_minutes?.toString() || '');
      setPriority(task.priority);
      if (task.deadline) {
        const date = new Date(task.deadline).toISOString().split('T')[0];
        setDeadline(date);
      }
    }
  }, [task]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('任务标题不能为空');
      return;
    }

    setIsSubmitting(true);

    try {
      const taskData = {
        title: title.trim(),
        subject: subject.trim() || null,
        description: description.trim() || null,
        estimated_minutes: estimatedMinutes ? parseInt(estimatedMinutes) : null,
        priority,
        deadline: deadline ? new Date(`${deadline}T23:59:59`).toISOString() : null,
      };

      if (task) {
        // 更新现有任务
        const { error } = await supabase
          .from('tasks')
          .update(taskData)
          .eq('id', task.id);

        if (error) throw error;
        toast.success('任务已更新');
      } else {
        // 创建新任务
        const { error } = await supabase.from('tasks').insert({
          space_id: spaceId,
          created_by: userId,
          status: 'not_started',
          ...taskData,
        });

        if (error) throw error;
        toast.success('任务已创建');
      }

      onSuccess?.();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '操作失败';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          任务标题 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="比如：完成数学习题集第5章"
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 transition"
          disabled={isSubmitting}
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
          placeholder="比如：数学、英语、编程"
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 transition"
          disabled={isSubmitting}
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          说明
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="详细说明任务内容..."
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
          rows={3}
          disabled={isSubmitting}
        />
      </div>

      {/* Two Column Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Estimated Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            预计时间（分钟）
          </label>
          <input
            type="number"
            value={estimatedMinutes}
            onChange={(e) => setEstimatedMinutes(e.target.value)}
            placeholder="60"
            min="0"
            max="480"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 transition"
            disabled={isSubmitting}
          />
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            优先级
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as any)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 transition"
            disabled={isSubmitting}
          >
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
          </select>
        </div>
      </div>

      {/* Deadline */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          截止时间
        </label>
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 transition"
          disabled={isSubmitting}
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition disabled:opacity-50"
          >
            取消
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting || !title.trim()}
          className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-400 to-orange-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-orange-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              提交中...
            </>
          ) : (
            task ? '更新任务' : '创建任务'
          )}
        </button>
      </div>
    </form>
  );
}
