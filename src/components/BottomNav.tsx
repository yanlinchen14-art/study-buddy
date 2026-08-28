'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
  CheckSquare,
  BookOpen,
  Zap,
  User,
} from 'lucide-react';

interface NavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
  testId?: string;
}

const navItems: NavItem[] = [
  {
    href: '/',
    icon: <Home className="w-6 h-6" />,
    label: '首页',
    testId: 'nav-home',
  },
  {
    href: '/tasks',
    icon: <CheckSquare className="w-6 h-6" />,
    label: '任务',
    testId: 'nav-tasks',
  },
  {
    href: '/costudy',
    icon: <BookOpen className="w-6 h-6" />,
    label: '一起学',
    testId: 'nav-costudy',
  },
  {
    href: '/outcomes',
    icon: <Zap className="w-6 h-6" />,
    label: '成果',
    testId: 'nav-outcomes',
  },
  {
    href: '/profile',
    icon: <User className="w-6 h-6" />,
    label: '我的',
    testId: 'nav-profile',
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg shadow-gray-200 md:hidden">
      <div className="flex items-center justify-around h-20 max-w-md mx-auto px-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              data-testid={item.testId}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all ${
                isActive
                  ? 'text-orange-500 bg-orange-50'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <div className={isActive ? 'scale-110' : ''}>{item.icon}</div>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
