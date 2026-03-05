'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2 } from 'lucide-react';

interface SearchBarProps {
  defaultValue?: string;
}

export function SearchBar({ defaultValue = '' }: SearchBarProps) {
  const [value, setValue] = useState(defaultValue);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    startTransition(() => {
      if (q) {
        router.push(`/explore?q=${encodeURIComponent(q)}`);
      } else {
        router.push('/explore');
      }
    });
  }

  function handleClear() {
    setValue('');
    startTransition(() => { router.push('/explore'); });
  }

  return (
    <form onSubmit={handleSubmit} className="px-4 py-3 border-b border-border/40">
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-muted/60 focus-within:ring-2 focus-within:ring-orange-500/40 transition-all">
        {isPending
          ? <Loader2 className="w-4 h-4 shrink-0 text-muted-foreground animate-spin" />
          : <Search className="w-4 h-4 shrink-0 text-muted-foreground" />
        }
        <input
          type="search"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="Buscar fundadores, proyectos, posts..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          autoComplete="off"
        />
        {value && (
          <button type="button" onClick={handleClear} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </form>
  );
}
