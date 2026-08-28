'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { OutcomeUpload } from '@/components/OutcomeUpload';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { LearningOutcome } from '@/lib/types';

type ViewMode = 'list' | 'upload';

export default function OutcomesPage() {
  const { user } = useAuth();
  const [spaceId, setSpaceId] = useState<string | null>(null);
  const [outcomes, setOutcomes] = useState<LearningOutcome[]>([]);
  const [outcomeImages, setOutcomeImages] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // 获取学习空间和成果
  useEffect(() => {
    if (!user) return;

    const initOutcomes = async () => {
      try {
        const { data: members } = await supabase
          .from('study_space_members')
          .select('space_id')
          .eq('user_id', user.id)
          .limit(1);

        if (!members || members.length === 0) return;

        const currentSpaceId = members[0].space_id;
        setSpaceId(currentSpaceId);

        // 获取成果
        const { data, error } = await supabase
          .from('learning_outcomes')
          .select('*')
          .eq('space_id', currentSpaceId)
          .order('outcome_date', { ascending: false });

        if (error) throw error;
        setOutcomes(data || []);

        // 获取成果图片
        if (data && data.length > 0) {
          const { data: images } = await supabase
            .from('outcome_images')
            .select('outcome_id, image_url')
            .in('outcome_id', data.map(o => o.id));

          const imageMap: Record<string, string[]> = {};
          images?.forEach(img => {
            if (!imageMap[img.outcome_id]) {
              imageMap[img.outcome_id] = [];
            }
            imageMap[img.outcome_id].push(img.image_url);
          });
          setOutcomeImages(imageMap);
        }
      } catch (err) {
        console.error('Failed to fetch outcomes:', err);
        toast.error('获取成果失败');
      } finally {
        setIsLoading(false);
      }
    };

    initOutcomes();
  }, [user]);

  const handleDeleteOutcome = async (outcomeId: string) => {
    if (!confirm('确定要删除这个成果吗？')) return;

    try {
      const { error } = await supabase
        .from('learning_outcomes')
        .delete()
        .eq('id', outcomeId);

      if (error) throw error;

      setOutcomes(prev => prev.filter(o => o.id !== outcomeId));
      toast.success('成果已删除');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '删除失败');
    }
  };

  const handleUploadSuccess = async () => {
    setViewMode('list');

    // 重新加载成果
    if (user && spaceId) {
      const { data } = await supabase
        .from('learning_outcomes')
        .select('*')
        .eq('space_id', spaceId)
        .order('outcome_date', { ascending: false });

      if (data) {
        setOutcomes(data);

        // 重新获取图片
        const { data: images } = await supabase
          .from('outcome_images')
          .select('outcome_id, image_url')
          .in('outcome_id', data.map(o => o.id));

        const imageMap: Record<string, string[]> = {};
        images?.forEach(img => {
          if (!imageMap[img.outcome_id]) {
            imageMap[img.outcome_id] = [];
          }
          imageMap[img.outcome_id].push(img.image_url);
        });
        setOutcomeImages(imageMap);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-orange-400" />
      </div>
    );
  }

  if (viewMode === 'upload') {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setViewMode('list')}
            className="text-gray-600 hover:text-gray-800"
          >
            ← 返回
          </button>
          <h1 className="text-2xl font-bold text-gray-800">分享成果</h1>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-md">
          {spaceId && user && (
            <OutcomeUpload
              spaceId={spaceId}
              userId={user.id}
              onSuccess={handleUploadSuccess}
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
        <h1 className="text-2xl font-bold text-gray-800">学习成果</h1>
        <button
          onClick={() => setViewMode('upload')}
          className="p-2 bg-gradient-to-r from-purple-400 to-purple-500 text-white rounded-full hover:shadow-lg transition"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Outcomes List */}
      <div className="space-y-4">
        {outcomes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl">
            <p className="text-gray-500 mb-4">还没有分享成果</p>
            <button
              onClick={() => setViewMode('upload')}
              className="px-6 py-2 bg-gradient-to-r from-purple-400 to-purple-500 text-white rounded-full hover:shadow-lg transition"
            >
              分享第一个成果
            </button>
          </div>
        ) : (
          outcomes.map(outcome => (
            <div
              key={outcome.id}
              className="bg-white rounded-2xl shadow-md p-4 space-y-3"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">
                    {outcome.title || '无标题'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(outcome.outcome_date).toLocaleDateString('zh-CN')}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteOutcome(outcome.id)}
                  className="text-gray-400 hover:text-red-600 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Images */}
              {outcomeImages[outcome.id] && outcomeImages[outcome.id].length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {outcomeImages[outcome.id].slice(0, 4).map((url, idx) => (
                    <div key={idx} className="relative">
                      <img
                        src={url}
                        alt={`outcome ${idx}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      {outcomeImages[outcome.id].length > 4 && idx === 3 && (
                        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold">
                            +{outcomeImages[outcome.id].length - 4}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Description */}
              {outcome.description && (
                <div>
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {outcome.description}
                  </p>
                </div>
              )}

              {/* Summary */}
              {outcome.summary && (
                <div className="bg-purple-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-purple-900 mb-1">
                    心得总结
                  </p>
                  <p className="text-sm text-purple-800 line-clamp-2">
                    {outcome.summary}
                  </p>
                </div>
              )}

              {/* Subject */}
              {outcome.subject && (
                <p className="text-xs text-gray-500">📚 {outcome.subject}</p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Tips */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-4">
        <h3 className="font-semibold text-purple-900 mb-2">✨ 成果分享建议</h3>
        <ul className="text-sm text-purple-800 space-y-1">
          <li>• 拍照记录你的学习成果（笔记、作品等）</li>
          <li>• 简述完成内容和用时</li>
          <li>• 写下你的感受和收获</li>
          <li>• 和伙伴分享你的进展</li>
        </ul>
      </div>
    </div>
  );
}
