'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { FolderPlus, FolderCheck, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { followProject, unfollowProject } from '@/lib/queries/follows';
import Link from 'next/link';

interface ProjectFollowButtonProps {
  projectId: string;
  isFollowing: boolean;
  isOwner: boolean;
}

export function ProjectFollowButton({ projectId, isFollowing: initial, isOwner }: ProjectFollowButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [following, setFollowing] = useState(initial);

  if (isOwner) {
    return (
      <Button variant="outline" size="sm" asChild>
        <Link href={`/project/${projectId}/edit`}>
          Editar proyecto
        </Link>
      </Button>
    );
  }

  function handleFollow() {
    const wasFollowing = following;
    setFollowing(!wasFollowing);

    startTransition(async () => {
      const { error } = wasFollowing
        ? await unfollowProject(projectId)
        : await followProject(projectId);
      if (error) {
        setFollowing(wasFollowing);
        toast.error(error);
      }
    });
  }

  return (
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
          ? <><FolderCheck className="w-3.5 h-3.5 mr-1" /> Siguiendo</>
          : <><FolderPlus className="w-3.5 h-3.5 mr-1" /> Seguir</>
      }
    </Button>
  );
}
