import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Feed — Forge',
  description: 'Lo que los fundadores están construyendo hoy.',
};
import { createClient } from '@/lib/supabase/server';
import { getForYouFeed, getFollowingFeed } from '@/lib/queries/posts';
import { PostCard } from '@/components/feed/PostCard';
import { FeedSkeleton } from '@/components/feed/FeedSkeleton';
import { Zap, Users, FolderGit2 } from 'lucide-react';
import type { FeedPost } from '@/types';

// ─── Sub-feeds ────────────────────────────────────────────────────────────────

async function ForYouFeed() {
  const posts = await getForYouFeed();

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-4">
          <Zap className="w-6 h-6 text-orange-500" />
        </div>
        <p className="font-semibold mb-1">Nadie ha posteado aún hoy</p>
        <p className="text-sm text-muted-foreground">
          Sé el primero en mostrar lo que estás construyendo.
        </p>
      </div>
    );
  }

  return (
    <div>
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

async function FollowingFeed() {
  const posts = await getFollowingFeed();

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <Users className="w-8 h-8 text-muted-foreground mb-3" />
        <p className="font-semibold mb-1">Tu feed de seguidos está vacío</p>
        <p className="text-sm text-muted-foreground mb-4">
          Sigue a más fundadores para ver sus posts aquí.
        </p>
        <Link href="/explore" className="text-sm text-orange-500 hover:underline">
          Explorar fundadores →
        </Link>
      </div>
    );
  }

  return (
    <div>
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: { tab?: string };
}

export default async function FeedPage({ searchParams }: PageProps) {
  const tab = searchParams.tab ?? 'for-you';

  return (
    <div>
      {/* Feed tabs */}
      <div className="sticky top-14 z-20 bg-background/95 backdrop-blur-sm border-b border-border/40">
        <div className="flex">
          {[
            { id: 'for-you',    label: 'Para ti',   icon: Zap   },
            { id: 'following',  label: 'Siguiendo', icon: Users },
            { id: 'projects',   label: 'Proyectos', icon: FolderGit2 },
          ].map(({ id, label, icon: Icon }) => (
            <Link
              key={id}
              href={`/feed?tab=${id}`}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium border-b-2 transition-colors ${
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
      </div>

      {/* Content */}
      <Suspense fallback={<FeedSkeleton />}>
        {tab === 'for-you'   && <ForYouFeed />}
        {tab === 'following' && <FollowingFeed />}
        {tab === 'projects'  && (
          <div className="py-16 px-6 text-center text-muted-foreground text-sm">
            Sigue proyectos para ver sus Ship Logs aquí.
            <br />
            <Link href="/explore" className="text-orange-500 hover:underline mt-2 inline-block">
              Explorar proyectos →
            </Link>
          </div>
        )}
      </Suspense>
    </div>
  );
}
