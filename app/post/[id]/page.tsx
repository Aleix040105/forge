import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getPost, getReplies } from '@/lib/queries/posts';
import { PostCard } from '@/components/feed/PostCard';
import { InlineReplyComposer } from '@/components/feed/InlineReplyComposer';

interface PageProps {
  params: { id: string };
}

export default async function PostPage({ params }: PageProps) {
  const post = await getPost(params.id);
  if (!post) notFound();

  const replies = await getReplies(post.id);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div>
      {/* Back header */}
      <div className="sticky top-14 z-20 flex items-center gap-3 px-4 py-3 border-b border-border/40 bg-background/95 backdrop-blur-sm">
        <Link href="/feed" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <span className="font-semibold text-sm">Post</span>
      </div>

      {/* Parent post */}
      <PostCard post={post} />

      {/* Reply composer */}
      {user && (
        <div className="border-b border-border/40">
          <InlineReplyComposer parentId={post.id} />
        </div>
      )}

      {/* Replies */}
      {replies.length > 0 ? (
        <div>
          <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {replies.length} {replies.length === 1 ? 'respuesta' : 'respuestas'}
          </p>
          {replies.map(reply => (
            <PostCard key={reply.id} post={reply} />
          ))}
        </div>
      ) : (
        <div className="py-10 text-center">
          <p className="text-sm text-muted-foreground">Sin respuestas aún. Sé el primero.</p>
        </div>
      )}
    </div>
  );
}
