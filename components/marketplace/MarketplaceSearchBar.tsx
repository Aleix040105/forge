'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2 } from 'lucide-react';

export function MarketplaceSearchBar({ defaultValue = '' }: { defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    startTransition(() => {
      router.push(q ? `/marketplace?q=${encodeURIComponent(q)}` : '/marketplace');
    });
  }

  function handleClear() {
    setValue('');
    startTransition(() => router.push('/marketplace'));
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-card border border-border focus-within:border-orange-500/60 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all shadow-sm">
        {isPending
          ? <Loader2 className="w-4 h-4 shrink-0 text-muted-foreground animate-spin" />
          : <Search className="w-4 h-4 shrink-0 text-muted-foreground" />
        }
        <input
          type="search"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="Busca un servicio, skill o categoría..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          autoComplete="off"
        />
        {value ? (
          <button type="button" onClick={handleClear} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        ) : (
          <button type="submit" className="text-xs font-medium px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors">
            Buscar
          </button>
        )}
      </div>
    </form>
  );
}
