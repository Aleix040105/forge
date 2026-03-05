'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { createPost } from '@/lib/queries/posts';

interface InlineReplyComposerProps {
  parentId: string;
  onReplied?: () => void;
}

export function InlineReplyComposer({ parentId, onReplied }: InlineReplyComposerProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!text.trim()) return;
    setLoading(true);

    const { error } = await createPost({ type: 'update', content: text, parent_id: parentId });
    if (error) {
      toast.error(error);
    } else {
      setText('');
      toast.success('Respuesta publicada');
      onReplied?.();
      window.location.reload();
    }
    setLoading(false);
  }

  return (
    <div className="px-4 py-3">
      <Textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Escribe tu respuesta..."
        rows={2}
        className="resize-none text-sm"
        maxLength={280}
      />
      <div className="flex justify-end mt-2">
        <Button
          size="sm"
          className="bg-orange-500 hover:bg-orange-600 text-white"
          onClick={submit}
          disabled={loading || !text.trim()}
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Responder'}
        </Button>
      </div>
    </div>
  );
}
