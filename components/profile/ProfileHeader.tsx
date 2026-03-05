'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Globe, Linkedin, Twitter, Edit3, Loader2, UserCheck, UserPlus, MessageSquare } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, getReputationColor } from '@/lib/utils';
import { followUser, unfollowUser } from '@/lib/queries/follows';
import { getOrCreateConversation } from '@/lib/queries/messages';
import type { Profile } from '@/types';

interface ProfileHeaderProps {
  profile: Profile;
  isOwn: boolean;
  isFollowing: boolean;
}

export function ProfileHeader({ profile, isOwn, isFollowing: initialFollowing }: ProfileHeaderProps) {
  const [isPending, startTransition] = useTransition();
  const [following, setFollowing] = useState(initialFollowing);
  const [followerCount, setFollowerCount] = useState(profile.follower_count);

  const router = useRouter();

  async function handleMessage() {
    const { data, error } = await getOrCreateConversation(profile.id);
    if (error || !data) { toast.error('No se pudo abrir el chat'); return; }
    router.push(`/messages/${data.id}`);
  }

  function handleFollow() {
    const wasFollowing = following;
    // Optimistic
    setFollowing(!wasFollowing);
    setFollowerCount(prev => wasFollowing ? prev - 1 : prev + 1);

    startTransition(async () => {
      const { error } = wasFollowing
        ? await unfollowUser(profile.id)
        : await followUser(profile.id);

      if (error) {
        // Revert
        setFollowing(wasFollowing);
        setFollowerCount(prev => wasFollowing ? prev + 1 : prev - 1);
        toast.error(error);
      } else {
        toast.success(wasFollowing ? 'Has dejado de seguir' : `Siguiendo a ${profile.display_name}`);
      }
    });
  }

  return (
    <div className="px-4 pt-4 pb-3">
      {/* Top row: avatar + actions */}
      <div className="flex items-start justify-between mb-3">
        <Avatar className="w-16 h-16">
          <AvatarImage src={profile.avatar_url ?? ''} />
          <AvatarFallback className="text-xl bg-orange-500/20 text-orange-400 font-bold">
            {profile.display_name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex gap-2 mt-1">
          {isOwn ? (
            <Button variant="outline" size="sm" asChild>
              <Link href="/profile/edit">
                <Edit3 className="w-3.5 h-3.5 mr-1" /> Editar perfil
              </Link>
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                variant={following ? 'outline' : 'default'}
                className={following ? '' : 'bg-orange-500 hover:bg-orange-600 text-white'}
                onClick={handleFollow}
                disabled={isPending}
              >
                {isPending
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : following
                    ? <><UserCheck className="w-3.5 h-3.5 mr-1" /> Siguiendo</>
                    : <><UserPlus className="w-3.5 h-3.5 mr-1" /> Seguir</>
                }
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleMessage}
                disabled={isPending}
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Name + username */}
      <h1 className="font-bold text-lg leading-tight">{profile.display_name}</h1>
      <p className="text-sm text-muted-foreground mb-2">@{profile.username}</p>

      {/* Reputation tier */}
      <div className="flex items-center gap-2 mb-3">
        <span className={cn('text-xs font-semibold', getReputationColor(profile.reputation_tier))}>
          ⚡ {profile.reputation_tier}
        </span>
        <span className="text-xs text-muted-foreground">· Score {profile.impact_score}</span>
        {profile.company_stage && (
          <Badge variant="outline" className="text-[10px] px-1.5">
            {profile.company_stage}
          </Badge>
        )}
        {profile.industry && (
          <Badge variant="outline" className="text-[10px] px-1.5">
            {profile.industry}
          </Badge>
        )}
      </div>

      {/* Bio */}
      {profile.bio && (
        <p className="text-sm text-muted-foreground mb-3">{profile.bio}</p>
      )}

      {/* Links */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        {profile.website_url && (
          <a href={profile.website_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <Globe className="w-3 h-3" /> {profile.website_url.replace(/^https?:\/\//, '')}
          </a>
        )}
        {profile.linkedin_url && (
          <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-blue-400">
            <Linkedin className="w-3 h-3" /> LinkedIn
          </a>
        )}
        {profile.twitter_handle && (
          <a href={`https://x.com/${profile.twitter_handle}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <Twitter className="w-3 h-3" /> @{profile.twitter_handle}
          </a>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm">
        <span>
          <span className="font-semibold">{followerCount}</span>{' '}
          <span className="text-muted-foreground">seguidores</span>
        </span>
        <span>
          <span className="font-semibold">{profile.following_count}</span>{' '}
          <span className="text-muted-foreground">siguiendo</span>
        </span>
        <span>
          <span className="font-semibold">{profile.post_count}</span>{' '}
          <span className="text-muted-foreground">posts</span>
        </span>
      </div>
    </div>
  );
}
