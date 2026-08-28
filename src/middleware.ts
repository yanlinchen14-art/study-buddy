import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 不需要认证的路由
  const publicRoutes = ['/auth/login', '/auth/register', '/auth/reset-password'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // 创建中间件客户端
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });

  // 获取当前会话
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // 如果没有会话，重定向到登录页
  if (!session && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return res;
}

// 配置中间件作用的路由
export const config = {
  matcher: [
    /*
     * 匹配所有请求路径，除了:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
