'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, MessageSquare, ShoppingBag, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/feed',        label: 'Feed',     icon: Home          },
  { href: '/explore',     label: 'Explore',  icon: Search        },
  { href: '/messages',    label: 'Mensajes', icon: MessageSquare },
  { href: '/marketplace', label: 'Market',   icon: ShoppingBag   },
  { href: '/profile',     label: 'Perfil',   icon: User          },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border/50 bg-background/95 backdrop-blur-sm safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-colors min-w-0',
                isActive
                  ? 'text-orange-500'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon
                className="w-5 h-5"
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
