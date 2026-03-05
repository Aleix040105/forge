import Link from 'next/link';
import { Zap } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { NotificationBell } from '@/components/notifications/NotificationBell';

interface TopBarProps {
  title?: string;
}

export async function TopBar({ title }: TopBarProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-30 border-b border-border/50 bg-background/95 backdrop-blur-sm">
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        <Link href="/feed" className="flex items-center gap-1.5">
          <div className="w-6 h-6 bg-orange-500 rounded-md flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white fill-white" />
          </div>
          {title ? (
            <span className="font-semibold text-sm">{title}</span>
          ) : (
            <span className="font-bold text-base">Forge</span>
          )}
        </Link>

        <div className="flex items-center gap-1">
          {user && <NotificationBell userId={user.id} />}
        </div>
      </div>
    </header>
  );
}
