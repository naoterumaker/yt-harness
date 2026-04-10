'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/videos', label: 'Videos' },
  { href: '/comments', label: 'Comments' },
  { href: '/gates', label: 'Gates' },
  { href: '/subscribers', label: 'Subscribers' },
  { href: '/sequences', label: 'Sequences' },
  { href: '/playlists', label: 'Playlists' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/settings', label: 'Settings' },
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
