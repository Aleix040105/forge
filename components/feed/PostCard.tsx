'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatRelativeDate, cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PostCardActions } from './PostCardActions';
import { Ship, HelpCircle, ExternalLink, BarChart2, Clock } from 'lucide-react';
import type { FeedPost } from '@/types';

interface PostCardProps {
  post: FeedPost;
  showActions?: boolean;
  compact?: boolean;
}

export function PostCard({ post, showActions = true, compact = false }: PostCardProps) {
  const author = post.author;
  if (!author) return null;

  const isShipLog = post.type === 'ship_log';
  const isAsk     = post.type === 'ask';

  return (
    <article className="px-4 py-4 border-b border-border/40 hover:bg-muted/10 transition-colors">
      <div className="flex gap-3">
        {/* Avatar */}
        <Link href={`/profile/${author.username}`} className="shrink-0">
          <Avatar className="w-9 h-9">
            <AvatarImage src={author.avatar_url ?? ''} />
            <AvatarFallback className="text-xs bg-orange-500/20 text-orange-400 font-semibold">
              {author.display_name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="flex-1 min-w-0">
          {/* Author + meta */}
          <div className="flex items-baseline gap-1.5 flex-wrap mb-1">
            <Link href={`/profile/${author.username}`} className="font-semibold text-sm hover:underline">
              {author.display_name}
            </Link>
            <Link href={`/profile/${author.username}`} className="text-xs text-muted-foreground">
              @{author.username}
            </Link>
            <span className="text-xs text-muted-foreground">·</span>
            <Link href={`/post/${post.id}`} className="text-xs text-muted-foreground hover:underline">
              {formatRelativeDate(post.created_at)}
            </Link>
            {post.project && (
              <>
                <span className="text-xs text-muted-foreground">·</span>
                <Link href={`/project/${post.project.slug}`} className="text-xs text-orange-500 hover:underline font-medium">
                  {post.project.name}
                </Link>
              </>
            )}
          </div>

          {/* Ship Log header */}
          {isShipLog && post.ship_title && (
            <div className="flex items-center gap-1.5 mb-2">
              <Ship className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              <Badge variant="ship" className="text-[10px] px-1.5 py-0.5">Ship Log</Badge>
              <p className="font-semibold text-sm leading-tight">{post.ship_title}</p>
            </div>
          )}

          {/* Ask header */}
          {isAsk && post.ask_title && (
            <div className="flex items-center gap-1.5 mb-2">
              <HelpCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <Badge variant="ask" className="text-[10px] px-1.5 py-0.5">
                {post.ask_type ?? 'Ask'}
              </Badge>
              <p className="font-semibold text-sm leading-tight">{post.ask_title}</p>
            </div>
          )}

          {/* Content */}
          <p className={cn(
            'text-sm leading-relaxed whitespace-pre-wrap',
            compact && 'line-clamp-3'
          )}>
            {post.content}
          </p>

          {/* Ship Log proof */}
          {isShipLog && (
            <div className="mt-2 space-y-1">
              {post.ship_proof_url && (
                <a
                  href={post.ship_proof_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-orange-500 hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  Ver prueba →
                </a>
              )}
              {post.ship_metric && (
                <div className="inline-flex items-center gap-1 text-xs text-green-400 font-medium bg-green-500/10 px-2 py-0.5 rounded-full">
                  <BarChart2 className="w-3 h-3" />
                  {post.ship_metric}
                </div>
              )}
              {post.ship_time_days && (
                <div className="inline-flex items-center gap-1 text-xs text-muted-foreground ml-2">
                  <Clock className="w-3 h-3" />
                  {post.ship_time_days} {post.ship_time_days === 1 ? 'día' : 'días'}
                </div>
              )}
            </div>
          )}

          {/* Screenshot proof */}
          {isShipLog && post.ship_proof_screenshot && (
            <div className="mt-2 rounded-xl overflow-hidden border border-border/50">
              <img
                src={post.ship_proof_screenshot}
                alt="Prueba de trabajo"
                className="w-full max-h-48 object-cover"
              />
            </div>
          )}

          {/* Ask offering */}
          {isAsk && post.ask_offering && (
            <div className="mt-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-xs text-blue-400">
                <span className="font-medium">Ofrezco: </span>{post.ask_offering}
              </p>
            </div>
          )}

          {/* Actions */}
          {showActions && (
            <PostCardActions post={post} />
          )}
        </div>
      </div>
    </article>
  );
}
