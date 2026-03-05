'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { acceptConversation, rejectConversation } from '@/lib/queries/messages';

export function RequestActions({ conversationId }: { conversationId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleAccept() {
    startTransition(async () => {
      const { error } = await acceptConversation(conversationId);
      if (error) { toast.error(error); return; }
      toast.success('Solicitud aceptada');
      router.push(`/messages/${conversationId}`);
    });
  }

  function handleReject() {
    startTransition(async () => {
      const { error } = await rejectConversation(conversationId);
      if (error) { toast.error(error); return; }
      toast.success('Solicitud rechazada');
      router.refresh();
    });
  }

  return (
    <div className="flex gap-1.5 shrink-0">
      <Button
        size="sm"
        className="h-8 bg-orange-500 hover:bg-orange-600 text-white px-3"
        onClick={handleAccept}
        disabled={isPending}
      >
        {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="h-8 px-3"
        onClick={handleReject}
        disabled={isPending}
      >
        <X className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
