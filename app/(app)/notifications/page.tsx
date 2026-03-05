import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Bell } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Notificaciones — Forge',
  description: 'Tus notificaciones en Forge.',
};
import { getNotifications, markAllAsRead } from '@/lib/queries/notifications';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { Button } from '@/components/ui/button';

export default async function NotificationsPage() {
  const notifications = await getNotifications();
  const unread = notifications.filter(n => !n.is_read);

  return (
    <div>
      <div className="sticky top-14 z-20 flex items-center justify-between px-4 py-3 border-b border-border/40 bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Link href="/feed" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="font-semibold text-sm">Notificaciones</span>
          {unread.length > 0 && (
            <span className="text-xs bg-orange-500 text-white px-1.5 py-0.5 rounded-full font-bold">
              {unread.length}
            </span>
          )}
        </div>
        {unread.length > 0 && (
          <form action={async () => {
            'use server';
            await markAllAsRead();
          }}>
            <button type="submit" className="text-xs text-orange-500 hover:underline">
              Marcar todo como leído
            </button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <Bell className="w-8 h-8 text-muted-foreground mb-3" />
          <p className="font-medium text-sm mb-1">Sin notificaciones</p>
          <p className="text-xs text-muted-foreground">
            Cuando alguien interactúe con tus posts, aparecerá aquí.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border/40">
          {notifications.map(notification => (
            <NotificationItem key={notification.id} notification={notification} />
          ))}
        </div>
      )}
    </div>
  );
}
