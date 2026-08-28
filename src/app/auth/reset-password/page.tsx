'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { Mail, Loader2, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/update-password`,
      });

      if (error) throw error;

      setSubmitted(true);
      toast.success('重置链接已发送到你的邮箱');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '请求失败，请重试';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-lg shadow-green-100 p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">发送成功</h2>
            <p className="text-gray-600 mb-6">
              密码重置链接已发送到 <span className="font-semibold">{email}</span>
            </p>
            <p className="text-sm text-gray-500 mb-8">
              请检查你的收件箱并点击链接以重置密码。链接 1 小时内有效。
            </p>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-400 to-blue-400 text-white font-semibold rounded-xl hover:shadow-lg transition"
            >
              <ArrowLeft className="w-4 h-4" />
              返回登录
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-purple-400 bg-clip-text text-transparent">
            Study Buddy
          </h1>
          <p className="text-gray-500 mt-2">重置你的密码</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-lg shadow-purple-100 p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">密码重置</h2>
          <p className="text-gray-600 text-sm mb-6">
            输入关联的邮箱地址，我们会发送重置链接到你的邮箱。
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                邮箱地址
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 transition"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !email}
              className="w-full py-3 bg-gradient-to-r from-orange-400 to-orange-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-orange-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  发送中...
                </>
              ) : (
                '发送重置链接'
              )}
            </button>

            {/* Back to Login */}
            <Link
              href="/auth/login"
              className="block text-center text-orange-500 hover:text-orange-600 text-sm font-medium transition"
            >
              返回登录
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
