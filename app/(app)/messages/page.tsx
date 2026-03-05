import type { Metadata } from 'next';
import Link from 'next/link';
import { Edit } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Mensajes — Forge',
  description: 'Tus conversaciones con otros fundadores.',
};
import { formatRelativeDate } from '@/lib/utils';
import { getConversations } from '@/lib/queries/messages';
import { createClient } from '@/lib/supabase/server';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessagesSearch } from '@/components/messages/MessagesSearch';

export default async function MessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from('profiles').select('username, display_name').eq('id', user.id).single()
    : { data: null };

  const conversations = await getConversations();
  const pending  = conversations.filter(c => !c.is_requester && c.request_status === 'pending');
  const accepted = conversations.filter(c => c.request_status === 'accepted');
  const sent     = conversations.filter(c =>  c.is_requester && c.request_status === 'pending');
  const all      = [...accepted, ...sent];

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="sticky top-14 z-20 bg-background/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <span className="font-bold text-xl">{profile?.username ?? 'Mensajes'}</span>
          <Link
            href="/explore"
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted/60 transition-colors"
          >
            <Edit className="w-5 h-5" />
          </Link>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <MessagesSearch conversations={all} />
        </div>

        {/* Section label + requests */}
        <div className="flex items-center justify-between px-4 pb-3">
          <span className="font-semibold text-base">Mensajes</span>
          {pending.length > 0 && (
            <Link href="/messages/requests" className="text-sm font-semibold text-orange-500">
              Solicitudes ({pending.length})
            </Link>
          )}
        </div>
      </div>

      {/* Empty state */}
      {all.length === 0 && pending.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
          <div className="w-16 h-16 rounded-full border-2 border-foreground flex items-center justify-center mb-4">
            <Edit className="w-7 h-7" />
          </div>
          <p className="font-semibold text-lg mb-1">Tus mensajes</p>
          <p className="text-sm text-muted-foreground mb-5">
            Envía mensajes privados a otros fundadores.
          </p>
          <Link href="/explore" className="text-sm font-semibold text-orange-500">
            Enviar mensaje
          </Link>
        </div>
      )}

      {/* Conversation list */}
      {all.map(conv => (
        <ConversationRow key={conv.id} conv={conv} />
      ))}
    </div>
  );
}

function ConversationRow({ conv }: { conv: any }) {
  const isPending = conv.is_requester && conv.request_status === 'pending';

  return (
    <Link
      href={`/messages/${conv.id}`}
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/10 transition-colors"
    >
      <Avatar className="w-14 h-14 shrink-0">
        <AvatarImage src={conv.other?.avatar_url ?? ''} />
        <AvatarFallback className="text-base bg-orange-500/20 text-orange-400 font-semibold">
          {conv.other?.display_name?.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight mb-0.5">
          {conv.other?.display_name}
        </p>
        <div className="flex items-center gap-1.5">
          <p className={`text-sm truncate ${isPending ? 'text-muted-foreground/60 italic' : 'text-muted-foreground'}`}>
            {isPending
              ? 'Solicitud enviada'
              : conv.last_message_preview ?? 'Sin mensajes aún'}
          </p>
          {conv.last_message_at && (
            <>
              <span className="text-muted-foreground/40 shrink-0">·</span>
              <span className="text-xs text-muted-foreground/60 shrink-0 whitespace-nowrap">
                {formatRelativeDate(conv.last_message_at)}
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
