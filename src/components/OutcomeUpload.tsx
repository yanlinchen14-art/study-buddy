'use client';

import { useState, FormEvent, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertCircle, Loader2, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface OutcomeUploadProps {
  spaceId: string;
  userId: string;
  onSuccess?: () => void;
}

interface UploadedImage {
  id: string;
  url: string;
  file?: File;
}

export function OutcomeUpload({ spaceId, userId, onSuccess }: OutcomeUploadProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [summary, setSummary] = useState('');
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files) return;

    if (images.length + files.length > 5) {
      setError('最多只能上传 5 张图片');
      return;
    }

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        setError('只支持图片格式');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('单个图片不能超过 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImages(prev => [...prev, {
            id: Math.random().toString(),
            url: e.target.result as string,
            file,
          }]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const uploadImages = async (outcomeId: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const image of images) {
      if (!image.file) continue;

      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const filename = `${userId}/${timestamp}-${randomStr}.jpg`;

      const { error, data } = await supabase.storage
        .from('outcomes')
        .upload(filename, image.file, {
          contentType: image.file.type,
          upsert: false,
        });

      if (error) throw error;

      // 获取公开 URL
      const { data: { publicUrl } } = supabase.storage
        .from('outcomes')
        .getPublicUrl(filename);

      // 保存到数据库
      const { error: dbError } = await supabase
        .from('outcome_images')
        .insert({
          outcome_id: outcomeId,
          image_url: publicUrl,
        });

      if (dbError) throw dbError;

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('成果标题不能为空');
      return;
    }

    setIsSubmitting(true);

    try {
      const today = new Date().toISOString().split('T')[0];

      // 创建成果记录
      const { data: outcome, error: insertError } = await supabase
        .from('learning_outcomes')
        .insert({
          space_id: spaceId,
          user_id: userId,
          outcome_date: today,
          title: title.trim(),
          description: description.trim() || null,
          summary: summary.trim() || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // 上传图片
      if (images.length > 0) {
        await uploadImages(outcome.id);
      }

      // 记录经验值
      await supabase.from('experience_logs').insert({
        space_id: spaceId,
        user_id: userId,
        exp_type: 'outcome_upload',
        exp_amount: 30,
        related_id: outcome.id,
      });

      // 重置表单
      setTitle('');
      setDescription('');
      setSummary('');
      setImages([]);

      toast.success('成果已上传！');
      onSuccess?.();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '上传失败';
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
          成果标题 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="比如：完成项目 UI 设计、学会新的算法"
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 transition"
          disabled={isSubmitting}
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          详细描述
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="分享你的成果细节..."
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
          rows={3}
          disabled={isSubmitting}
        />
      </div>

      {/* Summary */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          总结/心得
        </label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="你的收获和感悟..."
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
          rows={2}
          disabled={isSubmitting}
        />
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          上传图片（最多 5 张，每张不超过 5MB）
        </label>

        {/* Image Preview */}
        {images.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            {images.map((img) => (
              <div key={img.id} className="relative">
                <img
                  src={img.url}
                  alt="preview"
                  className="w-full h-24 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeImage(img.id)}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isSubmitting || images.length >= 5}
          className="w-full px-4 py-3 border-2 border-dashed border-purple-300 bg-purple-50 rounded-xl hover:bg-purple-100 transition disabled:opacity-50 flex items-center justify-center gap-2 text-purple-600"
        >
          <Upload className="w-5 h-5" />
          {images.length > 0 ? `已上传 ${images.length} 张` : '选择图片'}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageSelect}
          disabled={isSubmitting}
          className="hidden"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || !title.trim()}
        className="w-full py-3 bg-gradient-to-r from-purple-400 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            上传中...
          </>
        ) : (
          '分享成果'
        )}
      </button>
    </form>
  );
}
