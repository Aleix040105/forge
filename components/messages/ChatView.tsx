'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeft, Send, Loader2, Check, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { sendMessage, acceptConversation, rejectConversation } from '@/lib/queries/messages';
import { formatRelativeDate } from '@/lib/utils';

interface ChatViewProps {
  conversation: any;
  initialMessages: any[];
}

export function ChatView({ conversation, initialMessages }: ChatViewProps) {
  const router = useRouter();
  const supabase = createClient();
  const [messages, setMessages] = useState<any[]>(initialMessages);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { other, request_status, is_requester, current_user_id } = conversation;
  const isPending = request_status === 'pending';
  const isRejected = request_status === 'rejected';
  const canSend = request_status === 'accepted' || is_requester;

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversation.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversation.id}`,
      }, (payload) => {
        setMessages(prev => {
          // Avoid duplicates
          if (prev.find(m => m.id === payload.new.id)) return prev;
          return [...prev, { ...payload.new, sender: null }];
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversation.id]);

  async function handleSend() {
    if (!text.trim() || sending) return;
    const content = text.trim();
    setText('');
    setSending(true);

    // Optimistic
    const optimistic = {
      id: `tmp-${Date.now()}`,
      content,
      sender_id: current_user_id,
      created_at: new Date().toISOString(),
      is_read: false,
      sender: null,
    };
    setMessages(prev => [...prev, optimistic]);

    const { error } = await sendMessage(conversation.id, content);
    if (error) {
      toast.error(error);
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
    }
    setSending(false);
    inputRef.current?.focus();
  }

  async function handleAccept() {
    setAccepting(true);
    const { error } = await acceptConversation(conversation.id);
    if (error) { toast.error(error); setAccepting(false); return; }
    router.refresh();
  }

  async function handleReject() {
    setAccepting(true);
    const { error } = await rejectConversation(conversation.id);
    if (error) { toast.error(error); setAccepting(false); return; }
    router.push('/messages');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-56px-64px)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40 bg-background shrink-0">
        <Link href="/messages" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <Link href={`/profile/${other?.username}`} className="flex items-center gap-2 flex-1 min-w-0">
          <Avatar className="w-8 h-8">
            <AvatarImage src={other?.avatar_url ?? ''} />
            <AvatarFallback className="text-xs bg-orange-500/20 text-orange-400">
              {other?.display_name?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{other?.display_name}</p>
            <p className="text-[10px] text-muted-foreground">@{other?.username}</p>
          </div>
        </Link>
      </div>

      {/* Request banner */}
      {isPending && !is_requester && (
        <div className="px-4 py-3 bg-orange-500/10 border-b border-orange-500/20 shrink-0">
          <p className="text-sm font-medium mb-2">{other?.display_name} quiere enviarte un mensaje</p>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="bg-orange-500 hover:bg-orange-600 text-white h-8"
              onClick={handleAccept}
              disabled={accepting}
            >
              {accepting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Check className="w-3.5 h-3.5 mr-1" /> Aceptar</>}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8"
              onClick={handleReject}
              disabled={accepting}
            >
              <X className="w-3.5 h-3.5 mr-1" /> Rechazar
            </Button>
          </div>
        </div>
      )}

      {isPending && is_requester && (
        <div className="px-4 py-2 bg-muted/30 border-b border-border/40 text-xs text-muted-foreground shrink-0">
          Solicitud enviada. Espera a que {other?.display_name} la acepte.
        </div>
      )}

      {isRejected && (
        <div className="px-4 py-2 bg-destructive/10 border-b border-destructive/20 text-xs text-destructive shrink-0">
          Esta conversación fue rechazada.
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-8">
            Ningún mensaje todavía. ¡Empieza la conversación!
          </div>
        )}
        {messages.map(msg => {
          const isOwn = msg.sender_id === current_user_id;
          return (
            <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                isOwn
                  ? 'bg-orange-500 text-white rounded-br-sm'
                  : 'bg-muted text-foreground rounded-bl-sm'
              }`}>
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                <p className={`text-[10px] mt-1 ${isOwn ? 'text-orange-100' : 'text-muted-foreground'}`}>
                  {formatRelativeDate(msg.created_at)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {canSend && !isRejected && (
        <div className="px-4 py-3 border-t border-border/40 bg-background shrink-0">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe un mensaje..."
              rows={1}
              className="flex-1 resize-none bg-muted rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 max-h-32 overflow-y-auto"
              style={{ height: 'auto' }}
              onInput={e => {
                const el = e.currentTarget;
                el.style.height = 'auto';
                el.style.height = Math.min(el.scrollHeight, 128) + 'px';
              }}
            />
            <button
              onClick={handleSend}
              disabled={!text.trim() || sending}
              className="w-10 h-10 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white rounded-full flex items-center justify-center shrink-0 transition-colors"
            >
              {sending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />
              }
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
