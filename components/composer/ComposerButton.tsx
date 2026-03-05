'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { ComposerModal } from './ComposerModal';

export function ComposerButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-30 w-13 h-13 w-[52px] h-[52px] bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95"
        aria-label="Crear post"
      >
        <Plus className="w-6 h-6" />
      </button>
      <ComposerModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
