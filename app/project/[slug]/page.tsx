import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Globe, ExternalLink, Users, Ship } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getProject } from '@/lib/queries/projects';
import { isFollowingProject } from '@/lib/queries/follows';
import { PostCard } from '@/components/feed/PostCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ProjectFollowButton } from '@/components/project/ProjectFollowButton';

interface PageProps {
  params: { slug: string };
  searchParams: { tab?: string };
}

export default async function ProjectPage({ params, searchParams }: PageProps) {
  const project = await getProject(params.slug);
  if (!project) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const isOwner = user?.id === project.owner_id;
  const isFollowing = user && !isOwner ? await isFollowingProject(project.id) : false;

  const tab = searchParams.tab ?? 'timeline';

  // Posts for this project
  const { data: posts } = await supabase
    .from('posts')
    .select(`
      *,
      author:profiles!posts_author_id_fkey(id, username, display_name, avatar_url, reputation_tier, impact_score, company_stage),
      project:projects(id, name, slug, logo_url, status)
    `)
    .eq('project_id', project.id)
    .is('parent_id', null)
    .eq(tab === 'ships' ? 'type' : 'is_public', tab === 'ships' ? 'ship_log' : true)
    .order('created_at', { ascending: false })
    .limit(30);

  return (
    <div>
      <div className="sticky top-14 z-20 flex items-center gap-3 px-4 py-3 border-b border-border/40 bg-background/95 backdrop-blur-sm">
        <Link href="/feed" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <span className="font-semibold text-sm">{project.name}</span>
      </div>

      {/* Project header */}
      <div className="px-4 pt-4 pb-4 border-b border-border/40">
        <div className="flex items-start justify-between mb-3">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-2xl font-bold overflow-hidden">
            {project.logo_url
              ? <img src={project.logo_url} alt={project.name} className="w-full h-full object-cover" />
              : project.name.charAt(0)
            }
          </div>
          {user && (
            <ProjectFollowButton
              projectId={project.id}
              isFollowing={!!isFollowing}
              isOwner={isOwner}
            />
          )}
        </div>

        <h1 className="font-bold text-xl mb-1">{project.name}</h1>
        {project.tagline && <p className="text-sm text-muted-foreground mb-2">{project.tagline}</p>}

        <div className="flex items-center gap-2 flex-wrap mb-3">
          <Badge variant={project.status === 'Live' ? 'bounty' : 'secondary'} className="text-xs">
            {project.status}
          </Badge>
          {project.industry && <Badge variant="outline" className="text-xs">{project.industry}</Badge>}
          {project.is_open_for_collab && (
            <Badge variant="ask" className="text-xs">Busca colaboradores</Badge>
          )}
        </div>

        {project.description && (
          <p className="text-sm text-muted-foreground mb-3">{project.description}</p>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          {project.url && (
            <a href={project.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-orange-500 hover:underline">
              <Globe className="w-3 h-3" /> Ver proyecto
            </a>
          )}
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Users className="w-3 h-3" /> {project.follower_count} seguidores
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Ship className="w-3 h-3" /> {project.post_count} posts
          </span>
        </div>

        {/* Owner */}
        {project.owner && (
          <Link href={`/profile/${project.owner.username}`} className="flex items-center gap-2 mt-3">
            <Avatar className="w-5 h-5">
              <AvatarImage src={project.owner.avatar_url ?? ''} />
              <AvatarFallback className="text-[8px]">
                {project.owner.display_name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">
              por @{project.owner.username}
            </span>
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/40">
        {['timeline', 'ships'].map(t => (
          <Link
            key={t}
            href={`/project/${project.slug}?tab=${t}`}
            className={`flex-1 py-3 text-center text-xs font-medium border-b-2 transition-colors ${
              tab === t
                ? 'border-orange-500 text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'ships' ? '🚀 Ship Logs' : 'Timeline'}
          </Link>
        ))}
      </div>

      {/* Posts */}
      {posts && posts.length > 0
        ? posts.map(post => <PostCard key={post.id} post={post as any} />)
        : (
          <div className="py-12 text-center px-6">
            <p className="text-sm text-muted-foreground">Sin actividad todavía en este proyecto.</p>
          </div>
        )
      }
    </div>
  );
}
