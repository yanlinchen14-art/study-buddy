'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Mail, Lock, User, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);
  const { register, error } = useAuth();
  const router = useRouter();

  const validateForm = () => {
    if (!email.includes('@')) {
      toast.error('请输入有效的邮箱地址');
      return false;
    }
    if (username.length < 2) {
      toast.error('用户名至少需要 2 个字符');
      return false;
    }
    if (password.length < 6) {
      toast.error('密码至少需要 6 个字符');
      return false;
    }
    if (password !== confirmPassword) {
      toast.error('两次输入的密码不一致');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      await register(email, password, username);
      setRegistered(true);
      toast.success('注册成功！请检查邮箱以完成验证');
      setTimeout(() => router.push('/auth/login'), 3000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '注册失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (registered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-lg shadow-green-100 p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">注册成功！</h2>
            <p className="text-gray-600 mb-6">
              验证邮件已发送到 <span className="font-semibold">{email}</span>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              请检查收件箱并点击验证链接以激活账户。3 秒后自动跳转到登录页...
            </p>
            <Link
              href="/auth/login"
              className="inline-block px-6 py-2 bg-gradient-to-r from-green-400 to-blue-400 text-white font-semibold rounded-xl hover:shadow-lg transition"
            >
              返回登录
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Study Buddy
          </h1>
          <p className="text-gray-500 mt-2">加入温柔的学习陪伴空间</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-lg shadow-purple-100 p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">创建账户</h2>

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
                邮箱
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                用户名
              </label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="你的昵称"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
                  disabled={isSubmitting}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">至少 6 个字符</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                确认密码
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={
                isSubmitting ||
                !email ||
                !username ||
                !password ||
                !confirmPassword
              }
              className="w-full py-3 bg-gradient-to-r from-blue-400 to-blue-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  注册中...
                </>
              ) : (
                '创建账户'
              )}
            </button>
          </form>

          {/* Terms */}
          <p className="text-center text-xs text-gray-500 mt-6">
            注册即表示同意我们的《隐私政策》和《服务条款》
          </p>

          {/* Login Link */}
          <p className="text-center text-gray-600 mt-6">
            已有账户？{' '}
            <Link
              href="/auth/login"
              className="text-blue-500 hover:text-blue-600 font-semibold transition"
            >
              立即登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
