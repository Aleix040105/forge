import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getConversations, acceptConversation, rejectConversation } from '@/lib/queries/messages';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatRelativeDate } from '@/lib/utils';
import { RequestActions } from '@/components/messages/RequestActions';

export const metadata = { title: 'Solicitudes de mensaje — Forge' };

export default async function RequestsPage() {
  const conversations = await getConversations();
  const pending = conversations.filter(c => !c.is_requester && c.request_status === 'pending');

  return (
    <div className="pb-20">
      <div className="sticky top-14 z-20 flex items-center gap-3 px-4 py-3 border-b border-border/40 bg-background/95 backdrop-blur-sm">
        <Link href="/messages" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-semibold text-sm">Solicitudes de mensaje</h1>
        {pending.length > 0 && (
          <span className="text-xs bg-orange-500 text-white px-1.5 py-0.5 rounded-full font-bold">
            {pending.length}
          </span>
        )}
      </div>

      {pending.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <p className="font-semibold text-sm mb-1">Sin solicitudes pendientes</p>
          <p className="text-xs text-muted-foreground">Cuando alguien quiera escribirte aparecerá aquí.</p>
        </div>
      ) : (
        <div className="px-4 pt-4 space-y-3">
          {pending.map(conv => (
            <div key={conv.id} className="flex items-center gap-3 p-3 rounded-xl border border-border">
              <Link href={`/profile/${conv.other?.username}`}>
                <Avatar className="w-12 h-12 shrink-0">
                  <AvatarImage src={conv.other?.avatar_url ?? ''} />
                  <AvatarFallback className="bg-orange-500/20 text-orange-400 font-semibold">
                    {conv.other?.display_name?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/profile/${conv.other?.username}`} className="text-sm font-semibold hover:underline">
                  {conv.other?.display_name}
                </Link>
                <p className="text-xs text-muted-foreground">
                  @{conv.other?.username} · {formatRelativeDate(conv.created_at)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Quiere enviarte un mensaje</p>
              </div>
              <RequestActions conversationId={conv.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
