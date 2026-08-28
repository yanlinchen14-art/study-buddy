'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { TaskForm } from '@/components/TaskForm';
import { Loader2, Plus, Trash2, CheckCircle, Circle } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Task } from '@/lib/types';

type ViewMode = 'list' | 'create' | 'edit';

export default function TasksPage() {
  const { user } = useAuth();
  const [spaceId, setSpaceId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // 获取学习空间和任务
  useEffect(() => {
    if (!user) return;

    const initTasks = async () => {
      try {
        const { data: members } = await supabase
          .from('study_space_members')
          .select('space_id')
          .eq('user_id', user.id)
          .limit(1);

        if (!members || members.length === 0) return;

        const currentSpaceId = members[0].space_id;
        setSpaceId(currentSpaceId);

        // 获取任务
        let query = supabase
          .from('tasks')
          .select('*')
          .eq('space_id', currentSpaceId)
          .order('deadline', { ascending: true, nullsFirst: false });

        const { data, error } = await query;
        if (error) throw error;

        setTasks(data || []);
      } catch (err) {
        console.error('Failed to fetch tasks:', err);
        toast.error('获取任务失败');
      } finally {
        setIsLoading(false);
      }
    };

    initTasks();
  }, [user]);

  const handleToggleStatus = async (task: Task) => {
    if (!user) return;

    const newStatus = task.status === 'completed' ? 'not_started' : 'completed';

    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
        })
        .eq('id', task.id);

      if (error) throw error;

      setTasks(prev =>
        prev.map(t =>
          t.id === task.id
            ? { ...t, status: newStatus as Task['status'] }
            : t,
        ),
      );

      toast.success(newStatus === 'completed' ? '任务已完成！' : '任务已重新打开');

      // 如果完成了任务，记录经验值
      if (newStatus === 'completed') {
        await supabase.from('experience_logs').insert({
          space_id: spaceId,
          user_id: user.id,
          exp_type: 'task_complete',
          exp_amount: 50,
          related_id: task.id,
        });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('确定要删除这个任务吗？')) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev => prev.filter(t => t.id !== taskId));
      toast.success('任务已删除');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '删除失败');
    }
  };

  const handleFormSuccess = () => {
    setViewMode('list');
    setEditingTask(null);
    // 重新加载任务
    if (user && spaceId) {
      supabase
        .from('tasks')
        .select('*')
        .eq('space_id', spaceId)
        .order('deadline', { ascending: true, nullsFirst: false })
        .then(({ data }) => {
          if (data) setTasks(data);
        });
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'completed') return task.status === 'completed';
    if (filter === 'pending') return task.status !== 'completed';
    return true;
  });

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-orange-500';
      case 'low':
        return 'text-green-500';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-orange-400" />
      </div>
    );
  }

  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => {
              setViewMode('list');
              setEditingTask(null);
            }}
            className="text-gray-600 hover:text-gray-800"
          >
            ← 返回
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            {editingTask ? '编辑任务' : '新建任务'}
          </h1>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-md">
          {spaceId && user && (
            <TaskForm
              spaceId={spaceId}
              userId={user.id}
              task={editingTask || undefined}
              onSuccess={handleFormSuccess}
              onCancel={() => {
                setViewMode('list');
                setEditingTask(null);
              }}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">我的任务</h1>
        <button
          onClick={() => {
            setEditingTask(null);
            setViewMode('create');
          }}
          className="p-2 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-full hover:shadow-lg transition"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'pending', 'completed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full font-medium transition-all ${
              filter === f
                ? 'bg-orange-400 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? '全部' : f === 'pending' ? '未完成' : '已完成'}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">暂无任务</p>
            <button
              onClick={() => {
                setEditingTask(null);
                setViewMode('create');
              }}
              className="px-6 py-2 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-full hover:shadow-lg transition"
            >
              创建第一个任务
            </button>
          </div>
        ) : (
          filteredTasks.map(task => (
            <div
              key={task.id}
              className={`bg-white rounded-2xl p-4 shadow-md transition-all ${
                task.status === 'completed' ? 'opacity-60' : ''
              }`}
            >
              <div className="flex gap-3">
                {/* Status Button */}
                <button
                  onClick={() => handleToggleStatus(task)}
                  className="flex-shrink-0 mt-1 hover:scale-110 transition"
                >
                  {task.status === 'completed' ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-300" />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3
                    className={`font-semibold ${
                      task.status === 'completed'
                        ? 'text-gray-500 line-through'
                        : 'text-gray-800'
                    }`}
                  >
                    {task.title}
                  </h3>

                  {task.subject && (
                    <p className="text-sm text-gray-600 mt-1">{task.subject}</p>
                  )}

                  {task.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {task.description}
                    </p>
                  )}

                  {/* Meta Info */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span
                      className={`text-xs font-medium ${getPriorityColor(task.priority)} bg-opacity-10 bg-current px-2 py-1 rounded-full`}
                    >
                      {task.priority === 'high'
                        ? '高'
                        : task.priority === 'medium'
                        ? '中'
                        : '低'}
                    </span>

                    {task.estimated_minutes && (
                      <span className="text-xs text-gray-500 px-2 py-1">
                        ⏱ {task.estimated_minutes} min
                      </span>
                    )}

                    {task.deadline && (
                      <span className="text-xs text-gray-500 px-2 py-1">
                        📅{' '}
                        {new Date(task.deadline).toLocaleDateString('zh-CN')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => {
                      setEditingTask(task);
                      setViewMode('edit');
                    }}
                    className="text-gray-400 hover:text-gray-600 transition"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-gray-400 hover:text-red-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
