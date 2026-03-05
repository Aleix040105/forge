import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Ship } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getProfile } from '@/lib/queries/profiles';
import { isFollowingUser } from '@/lib/queries/follows';
import { getMyPosts } from '@/lib/queries/posts';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { NowSection } from '@/components/profile/NowSection';
import { PostCard } from '@/components/feed/PostCard';
import { Separator } from '@/components/ui/separator';

interface PageProps {
  params: { username: string };
  searchParams: { tab?: string };
}

export default async function UserProfilePage({ params, searchParams }: PageProps) {
  const profile = await getProfile(params.username);
  if (!profile) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const isOwn = user?.id === profile.id;
  const isFollowing = user && !isOwn ? await isFollowingUser(profile.id) : false;

  // Posts for this profile
  const tab = searchParams.tab ?? 'posts';
  let posts: any[] = [];

  if (tab === 'posts' || tab === 'proof') {
    const { data } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles!posts_author_id_fkey(id, username, display_name, avatar_url, reputation_tier, impact_score, company_stage),
        project:projects(id, name, slug, logo_url, status)
      `)
      .eq('author_id', profile.id)
      .is('parent_id', null)
      .eq(tab === 'proof' ? 'type' : 'is_public', tab === 'proof' ? 'ship_log' : true)
      .order('created_at', { ascending: false })
      .limit(20);
    posts = data ?? [];
  }

  // Projects for this profile
  let projects: any[] = [];
  if (tab === 'projects') {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('owner_id', profile.id)
      .order('created_at', { ascending: false });
    projects = data ?? [];
  }

  return (
    <div>
      {/* Back */}
      <div className="sticky top-14 z-20 flex items-center gap-3 px-4 py-3 border-b border-border/40 bg-background/95 backdrop-blur-sm">
        <Link href="/feed" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <span className="font-semibold text-sm">{profile.display_name}</span>
      </div>

      <ProfileHeader profile={profile} isOwn={isOwn} isFollowing={!!isFollowing} />
      <Separator />
      <NowSection profile={profile} />

      {/* Profile tabs */}
      <div className="flex border-b border-border/40">
        {['posts', 'proof', 'projects'].map(t => (
          <Link
            key={t}
            href={`/profile/${profile.username}?tab=${t}`}
            className={`flex-1 py-3 text-center text-xs font-medium border-b-2 transition-colors capitalize ${
              tab === t
                ? 'border-orange-500 text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'proof' ? '🚀 Ships' : t === 'projects' ? 'Proyectos' : 'Posts'}
          </Link>
        ))}
      </div>

      {/* Tab content */}
      {(tab === 'posts' || tab === 'proof') && (
        posts.length > 0
          ? posts.map(post => <PostCard key={post.id} post={post} />)
          : (
            <div className="py-12 text-center px-6">
              {tab === 'proof'
                ? <><Ship className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Sin Ship Logs todavía.</p></>
                : <p className="text-sm text-muted-foreground">Sin posts todavía.</p>
              }
            </div>
          )
      )}

      {tab === 'projects' && (
        projects.length > 0 ? (
          <div className="divide-y divide-border/40">
            {projects.map((project: any) => (
              <Link
                key={project.id}
                href={`/project/${project.slug}`}
                className="flex items-center gap-3 px-4 py-4 hover:bg-muted/10 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-lg font-bold">
                  {project.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-sm">{project.name}</p>
                  <p className="text-xs text-muted-foreground">{project.tagline}</p>
                </div>
                <span className="ml-auto text-xs text-muted-foreground">{project.status}</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">Sin proyectos todavía.</p>
          </div>
        )
      )}
    </div>
  );
}
