import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { TrendingUp, Ship, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Explore — Forge',
  description: 'Descubre fundadores, proyectos y servicios en Forge.',
};
import { getTrendingPosts, searchPosts } from '@/lib/queries/posts';
import { getSuggestedProfiles, searchProfiles } from '@/lib/queries/profiles';
import { PostCard } from '@/components/feed/PostCard';
import { FeedSkeleton } from '@/components/feed/FeedSkeleton';
import { SearchBar } from '@/components/explore/SearchBar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/server';

async function SearchResults({ query }: { query: string }) {
  const [profiles, posts] = await Promise.all([
    searchProfiles(query, 5),
    searchPosts(query, 10),
  ]);

  const hasResults = profiles.length > 0 || posts.length > 0;

  if (!hasResults) {
    return (
      <div className="py-16 text-center px-6">
        <p className="font-medium text-sm mb-1">Sin resultados para "{query}"</p>
        <p className="text-xs text-muted-foreground">Prueba con otro término o revisa la ortografía.</p>
      </div>
    );
  }

  return (
    <div>
      {profiles.length > 0 && (
        <div>
          <div className="px-4 pt-4 pb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Personas
            </p>
          </div>
          <div className="px-4 space-y-1 pb-4 border-b border-border/40">
            {profiles.map(p => (
              <Link
                key={p.id}
                href={`/profile/${p.username}`}
                className="flex items-center gap-3 py-2"
              >
                <Avatar className="w-9 h-9">
                  <AvatarImage src={p.avatar_url ?? ''} />
                  <AvatarFallback className="text-xs bg-orange-500/20 text-orange-400 font-semibold">
                    {p.display_name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.display_name}</p>
                  <p className="text-xs text-muted-foreground truncate">@{p.username}{p.industry ? ` · ${p.industry}` : ''}</p>
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0">
                  ⚡ {p.impact_score}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}

      {posts.length > 0 && (
        <div>
          <div className="px-4 pt-4 pb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Posts
            </p>
          </div>
          {posts.map(post => (
            <PostCard key={post.id} post={post} compact />
          ))}
        </div>
      )}
    </div>
  );
}

async function TrendingSection() {
  const posts = await getTrendingPosts(10);

  if (posts.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-muted-foreground">Sin posts trending en las últimas 24h.</p>
      </div>
    );
  }

  return (
    <div>
      {posts.map(post => (
        <PostCard key={post.id} post={post} compact />
      ))}
    </div>
  );
}

async function SuggestedPeople() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from('profiles').select('industry').eq('id', user.id).single()
    : { data: null };

  const suggested = await getSuggestedProfiles(profile?.industry ?? null, 8);

  return (
    <div className="px-4 space-y-2">
      {suggested.map(p => (
        <Link
          key={p.id}
          href={`/profile/${p.username}`}
          className="flex items-center gap-3 py-2"
        >
          <Avatar className="w-9 h-9">
            <AvatarImage src={p.avatar_url ?? ''} />
            <AvatarFallback className="text-xs bg-orange-500/20 text-orange-400 font-semibold">
              {p.display_name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{p.display_name}</p>
            <p className="text-xs text-muted-foreground truncate">@{p.username} · {p.industry ?? 'Fundador'}</p>
          </div>
          <Badge variant="outline" className="text-[10px] shrink-0">
            ⚡ {p.impact_score}
          </Badge>
        </Link>
      ))}
    </div>
  );
}

interface PageProps {
  searchParams: { tab?: string; q?: string };
}

export default async function ExplorePage({ searchParams }: PageProps) {
  const tab = searchParams.tab ?? 'trending';
  const query = searchParams.q?.trim() ?? '';

  return (
    <div>
      <SearchBar defaultValue={query} />

      {query ? (
        <Suspense fallback={<FeedSkeleton />}>
          <SearchResults query={query} />
        </Suspense>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex border-b border-border/40">
            {[
              { id: 'trending', label: 'Trending', icon: TrendingUp },
              { id: 'people',   label: 'Personas', icon: Users     },
              { id: 'ships',    label: 'Ships',    icon: Ship       },
            ].map(({ id, label, icon: Icon }) => (
              <Link
                key={id}
                href={`/explore?tab=${id}`}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium border-b-2 transition-colors ${
                  tab === id
                    ? 'border-orange-500 text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            ))}
          </div>

          <Suspense fallback={<FeedSkeleton />}>
            {tab === 'trending' && <TrendingSection />}
            {tab === 'people' && (
              <div className="pt-4 pb-8">
                <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Fundadores sugeridos
                </p>
                <SuggestedPeople />
              </div>
            )}
            {tab === 'ships' && <ShipsSection />}
          </Suspense>
        </>
      )}
    </div>
  );
}

async function ShipsSection() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('posts')
    .select(`
      *,
      author:profiles!posts_author_id_fkey(
        id, username, display_name, avatar_url,
        reputation_tier, impact_score, company_stage
      ),
      project:projects(id, name, slug, logo_url, status)
    `)
    .eq('type', 'ship_log')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(20);

  const posts = data ?? [];

  if (posts.length === 0) {
    return (
      <div className="py-16 text-center px-6">
        <Ship className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Aún no hay Ship Logs.</p>
        <p className="text-xs text-muted-foreground mt-1">¡Sé el primero en documentar lo que has construido!</p>
      </div>
    );
  }

  return (
    <div>
      {posts.map((post: any) => (
        <PostCard key={post.id} post={post} compact />
      ))}
    </div>
  );
}
