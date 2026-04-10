'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'ダッシュボード' },
  { href: '/videos', label: '動画' },
  { href: '/comments', label: 'コメント' },
  { href: '/gates', label: 'コメントゲート' },
  { href: '/subscribers', label: '登録者' },
  { href: '/sequences', label: 'シーケンス' },
  { href: '/playlists', label: 'プレイリスト' },
  { href: '/analytics', label: '分析' },
  { href: '/settings', label: '設定' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-gray-800 bg-gray-950">
      <div className="flex h-14 items-center px-5">
        <Link href="/dashboard" className="text-lg font-bold text-gray-100">
          YT Harness
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-2">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200',
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
