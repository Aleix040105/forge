'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { MessageCircle, Repeat2, Zap, HandHeart, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toggleReaction, addOfferHelp } from '@/lib/queries/posts';
import { OfferHelpSheet } from './OfferHelpSheet';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { FeedPost } from '@/types';

interface PostCardActionsProps {
  post: FeedPost;
}

export function PostCardActions({ post }: PostCardActionsProps) {
  const [isPending, startTransition] = useTransition();

  const [accionable, setAccionable] = useState({
    count: post.accionable_count,
    active: post.viewer_reacted ?? false,
  });
  const [reforged, setReforged] = useState({ count: post.reforge_count, active: false });
  const [offerHelpOpen, setOfferHelpOpen] = useState(false);
  const [offeredHelp, setOfferedHelp] = useState(post.viewer_offered_help ?? false);
  const [reforgeOpen, setReforgeOpen] = useState(false);
  const [reforgeComment, setReforgeComment] = useState('');
  const [reforgeLoading, setReforgeLoading] = useState(false);

  function handleAccionable() {
    setAccionable(prev => ({ count: prev.active ? prev.count - 1 : prev.count + 1, active: !prev.active }));
    startTransition(async () => {
      const { error } = await toggleReaction(post.id, 'accionable');
      if (error) {
        setAccionable(prev => ({ count: prev.active ? prev.count - 1 : prev.count + 1, active: !prev.active }));
        toast.error(error);
      }
    });
  }

  async function handleOfferHelp(message: string) {
    const { error } = await addOfferHelp(post.id, message);
    if (error) { toast.error(error); return; }
    setOfferedHelp(true);
    setOfferHelpOpen(false);
    toast.success('¡Oferta de ayuda enviada!');
  }

  async function handleReforge() {
    setReforgeLoading(true);
    const { error } = await toggleReaction(post.id, 'reforge');
    if (error) { toast.error(error); setReforgeLoading(false); return; }
    setReforged(prev => ({ count: prev.count + 1, active: true }));
    setReforgeOpen(false);
    setReforgeComment('');
    setReforgeLoading(false);
    toast.success('Re-forgeado');
  }

  return (
    <>
      <div className="flex items-center gap-1 mt-3 -ml-1">
        {/* Reply */}
        <Link
          href={`/post/${post.id}`}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors text-xs"
        >
          <MessageCircle className="w-4 h-4" strokeWidth={1.8} />
          {post.reply_count > 0 && <span>{post.reply_count}</span>}
        </Link>

        {/* Re-forge */}
        <button
          className={cn(
            'flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-colors text-xs',
            reforged.active
              ? 'text-green-400 bg-green-500/10'
              : 'text-muted-foreground hover:text-green-400 hover:bg-muted/60'
          )}
          onClick={() => !reforged.active && setReforgeOpen(true)}
        >
          <Repeat2 className="w-4 h-4" strokeWidth={1.8} />
          {reforged.count > 0 && <span>{reforged.count}</span>}
        </button>

        {/* Accionable */}
        <button
          className={cn(
            'flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-colors text-xs',
            accionable.active
              ? 'text-orange-500 bg-orange-500/10'
              : 'text-muted-foreground hover:text-orange-500 hover:bg-orange-500/10'
          )}
          onClick={handleAccionable}
          disabled={isPending}
        >
          <Zap className="w-4 h-4" strokeWidth={1.8} fill={accionable.active ? 'currentColor' : 'none'} />
          {accionable.count > 0 && <span className="font-medium">{accionable.count}</span>}
        </button>

        {/* Offer Help */}
        <button
          className={cn(
            'flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-colors text-xs ml-auto',
            offeredHelp
              ? 'text-blue-400 bg-blue-500/10'
              : 'text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10'
          )}
          onClick={() => !offeredHelp && setOfferHelpOpen(true)}
        >
          <HandHeart className="w-4 h-4" strokeWidth={1.8} />
          <span className="font-medium">
            {offeredHelp ? 'Ayuda enviada' : `Offer Help${post.offer_help_count > 0 ? ` · ${post.offer_help_count}` : ''}`}
          </span>
        </button>
      </div>

      <OfferHelpSheet
        open={offerHelpOpen}
        onClose={() => setOfferHelpOpen(false)}
        onSubmit={handleOfferHelp}
        postAuthor={post.author?.display_name ?? ''}
      />

      {/* Re-forge sheet */}
      <Sheet open={reforgeOpen} onOpenChange={o => !o && setReforgeOpen(false)}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-8">
          <SheetHeader className="pb-3">
            <SheetTitle className="text-left text-sm">Re-forge</SheetTitle>
          </SheetHeader>
          <div className="mx-6 mb-3 p-3 rounded-xl border border-border/60 bg-muted/20 text-sm text-muted-foreground line-clamp-2">
            <span className="font-medium text-foreground">{post.author?.display_name}: </span>
            {post.ship_title ?? post.ask_title ?? post.content}
          </div>
          <div className="px-6 space-y-3">
            <Textarea
              value={reforgeComment}
              onChange={e => setReforgeComment(e.target.value)}
              placeholder="Añade un comentario... (opcional)"
              rows={3}
              maxLength={280}
              className="resize-none"
            />
            <div className="flex gap-2">
              <Button
                className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                onClick={handleReforge}
                disabled={reforgeLoading}
              >
                {reforgeLoading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <><Repeat2 className="w-4 h-4 mr-1.5" /> Re-forgear</>}
              </Button>
              <Button variant="outline" onClick={() => setReforgeOpen(false)}>Cancelar</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
