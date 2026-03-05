import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatRelativeDate, cn } from '@/lib/utils';
import { MessageCircle, Zap, UserPlus, HandHeart, Ship } from 'lucide-react';
import type { Notification } from '@/types';

const ICONS: Record<string, typeof MessageCircle> = {
  reply:                  MessageCircle,
  mention:                MessageCircle,
  reaction:               Zap,
  offer_help:             HandHeart,
  follow:                 UserPlus,
  project_follow:         UserPlus,
  offer_help_marked_useful: HandHeart,
};

const ICON_COLORS: Record<string, string> = {
  reply:                  'text-foreground',
  mention:                'text-orange-400',
  reaction:               'text-orange-400',
  offer_help:             'text-blue-400',
  follow:                 'text-green-400',
  project_follow:         'text-green-400',
  offer_help_marked_useful: 'text-green-400',
};

interface NotificationItemProps {
  notification: Notification;
}

export function NotificationItem({ notification: n }: NotificationItemProps) {
  const Icon = ICONS[n.type] ?? MessageCircle;
  const color = ICON_COLORS[n.type] ?? 'text-foreground';
  const actor = n.actor;

  const href = n.post_id ? `/post/${n.post_id}` : actor ? `/profile/${actor.username}` : '#';

  return (
    <Link
      href={href}
      className={cn(
        'flex items-start gap-3 px-4 py-3 hover:bg-muted/10 transition-colors',
        !n.is_read && 'bg-orange-500/5'
      )}
    >
      <div className="relative shrink-0">
        {actor ? (
          <Avatar className="w-9 h-9">
            <AvatarImage src={actor.avatar_url ?? ''} />
            <AvatarFallback className="text-xs bg-muted">
              {actor.display_name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <Icon className={cn('w-4 h-4', color)} />
          </div>
        )}
        <div className={cn(
          'absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-background flex items-center justify-center border border-background',
        )}>
          <Icon className={cn('w-2.5 h-2.5', color)} />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug">
          {actor && (
            <span className="font-semibold">{actor.display_name} </span>
          )}
          <span className="text-muted-foreground">{n.message}</span>
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatRelativeDate(n.created_at)}
        </p>
      </div>

      {!n.is_read && (
        <div className="w-2 h-2 rounded-full bg-orange-500 shrink-0 mt-1.5" />
      )}
    </Link>
  );
}
