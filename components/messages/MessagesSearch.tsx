'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

export function MessagesSearch({ conversations }: { conversations: any[] }) {
  const [query, setQuery] = useState('');

  return (
    <div>
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/60">
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          autoComplete="off"
        />
      </div>
    </div>
  );
}
