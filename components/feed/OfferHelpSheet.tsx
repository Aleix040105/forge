'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { HandHeart, Loader2 } from 'lucide-react';

interface OfferHelpSheetProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (message: string) => Promise<void>;
  postAuthor: string;
}

const MAX_CHARS = 140;

export function OfferHelpSheet({ open, onClose, onSubmit, postAuthor }: OfferHelpSheetProps) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (message.trim().length < 10) return;
    setLoading(true);
    await onSubmit(message.trim());
    setMessage('');
    setLoading(false);
  }

  const charsLeft = MAX_CHARS - message.length;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-8">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-2">
            <HandHeart className="w-4 h-4 text-blue-400" />
            <SheetTitle className="text-base">Ofrecer ayuda a {postAuthor}</SheetTitle>
          </div>
        </SheetHeader>

        <div className="px-6 space-y-4">
          <Textarea
            value={message}
            onChange={e => setMessage(e.target.value.slice(0, MAX_CHARS))}
            placeholder="¿Cómo puedes ayudar? Sé específico. Ej: 'Tengo contactos en 5 fondos seed de LATAM, te puedo hacer intro esta semana.'"
            rows={4}
            autoFocus
          />

          <div className="flex items-center justify-between">
            <span className={`text-xs ${charsLeft < 20 ? 'text-orange-500' : 'text-muted-foreground'}`}>
              {charsLeft} caracteres restantes
            </span>

            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                size="sm"
                className="bg-blue-500 hover:bg-blue-600 text-white"
                onClick={handleSubmit}
                disabled={loading || message.trim().length < 10}
              >
                {loading
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : 'Enviar ayuda'
                }
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Tu oferta es visible para el autor del post. Las ofertas de calidad mejoran tu reputación.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
