'use server';

import { createClient } from '@/lib/supabase/server';
import type { Post, FeedPost } from '@/types';

const POST_WITH_AUTHOR = `
  *,
  author:profiles!posts_author_id_fkey(
    id, username, display_name, avatar_url,
    reputation_tier, impact_score, company_stage
  ),
  project:projects(id, name, slug, logo_url, status)
`;

export async function getForYouFeed(cursor?: string, limit = 20): Promise<FeedPost[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase.rpc('get_for_you_feed', {
    p_user_id: user.id,
    p_cursor: cursor ?? new Date().toISOString(),
    p_limit: limit,
  });

  if (error || !data) return [];

  // Fetch authors for feed posts
  const authorIds = Array.from(new Set(data.map((p: Post) => p.author_id)));
  const { data: authors } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, reputation_tier, impact_score, company_stage')
    .in('id', authorIds);

  const authorMap = new Map(authors?.map(a => [a.id, a]) ?? []);

  return data.map((p: Post) => ({
    ...p,
    author: authorMap.get(p.author_id) ?? null,
  }));
}

export async function getFollowingFeed(cursor?: string, limit = 20): Promise<FeedPost[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Get following IDs
  const { data: follows } = await supabase
    .from('user_follows')
    .select('following_id')
    .eq('follower_id', user.id);

  const followingIds = follows?.map(f => f.following_id) ?? [];
  // Include own posts + followed users
  const authorIds = Array.from(new Set([user.id, ...followingIds]));

  let query = supabase
    .from('posts')
    .select(POST_WITH_AUTHOR)
    .in('author_id', authorIds)
    .is('parent_id', null)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (cursor) query = query.lt('created_at', cursor);

  const { data } = await query;
  if (!data) return [];

  // Enrich with viewer state
  const postIds = data.map(p => p.id);
  const [{ data: myReactions }, { data: myOffers }] = await Promise.all([
    supabase.from('reactions').select('post_id').eq('user_id', user.id).in('post_id', postIds).eq('type', 'accionable'),
    supabase.from('offer_helps').select('post_id').eq('user_id', user.id).in('post_id', postIds),
  ]);

  const reactedSet = new Set(myReactions?.map(r => r.post_id) ?? []);
  const offeredSet = new Set(myOffers?.map(o => o.post_id) ?? []);

  return data.map(p => ({
    ...p,
    viewer_reacted: reactedSet.has(p.id),
    viewer_offered_help: offeredSet.has(p.id),
  })) as FeedPost[];
}

export async function getProjectFeed(cursor?: string, limit = 20): Promise<FeedPost[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: follows } = await supabase
    .from('project_follows')
    .select('project_id')
    .eq('follower_id', user.id);

  const projectIds = follows?.map(f => f.project_id) ?? [];
  if (projectIds.length === 0) return [];

  let query = supabase
    .from('posts')
    .select(POST_WITH_AUTHOR)
    .in('project_id', projectIds)
    .is('parent_id', null)
    .eq('is_public', true)
    .eq('type', 'ship_log')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (cursor) query = query.lt('created_at', cursor);

  const { data } = await query;
  return (data ?? []) as FeedPost[];
}

export async function getPost(postId: string): Promise<FeedPost | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data } = await supabase
    .from('posts')
    .select(POST_WITH_AUTHOR)
    .eq('id', postId)
    .single();

  if (!data) return null;

  let viewerReacted = false;
  let viewerOfferedHelp = false;

  if (user) {
    const [{ data: r }, { data: o }] = await Promise.all([
      supabase.from('reactions').select('id').eq('post_id', postId).eq('user_id', user.id).eq('type', 'accionable').single(),
      supabase.from('offer_helps').select('id').eq('post_id', postId).eq('user_id', user.id).single(),
    ]);
    viewerReacted = !!r;
    viewerOfferedHelp = !!o;
  }

  return { ...data, viewer_reacted: viewerReacted, viewer_offered_help: viewerOfferedHelp } as FeedPost;
}

export async function getReplies(postId: string): Promise<FeedPost[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('posts')
    .select(POST_WITH_AUTHOR)
    .eq('parent_id', postId)
    .order('created_at', { ascending: true });
  return (data ?? []) as FeedPost[];
}

export async function createPost(input: {
  type: 'update' | 'ship_log' | 'ask';
  content: string;
  project_id?: string;
  parent_id?: string;
  ship_title?: string;
  ship_proof_url?: string;
  ship_proof_screenshot?: string;
  ship_metric?: string;
  ship_time_days?: number;
  ask_type?: string;
  ask_title?: string;
  ask_offering?: string;
}): Promise<{ data: Post | null; error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'No autenticado' };

  let depth = 0;
  let root_id: string | null = null;

  if (input.parent_id) {
    const { data: parent } = await supabase
      .from('posts')
      .select('depth, root_id, id')
      .eq('id', input.parent_id)
      .single();
    if (parent) {
      depth = Math.min((parent.depth ?? 0) + 1, 3);
      root_id = parent.root_id ?? parent.id;
    }
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({
      author_id: user.id,
      type: input.type,
      content: input.content,
      project_id: input.project_id ?? null,
      parent_id: input.parent_id ?? null,
      root_id,
      depth,
      ship_title: input.ship_title ?? null,
      ship_proof_url: input.ship_proof_url ?? null,
      ship_proof_screenshot: input.ship_proof_screenshot ?? null,
      ship_metric: input.ship_metric ?? null,
      ship_time_days: input.ship_time_days ?? null,
      ask_type: input.ask_type ?? null,
      ask_title: input.ask_title ?? null,
      ask_offering: input.ask_offering ?? null,
    })
    .select()
    .single();

  return { data, error: error?.message ?? null };
}

export async function toggleReaction(
  postId: string,
  type: 'accionable' | 'reforge'
): Promise<{ added: boolean; error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { added: false, error: 'No autenticado' };

  const { data: existing } = await supabase
    .from('reactions')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .eq('type', type)
    .single();

  if (existing) {
    const { error } = await supabase
      .from('reactions')
      .delete()
      .eq('id', existing.id);
    return { added: false, error: error?.message ?? null };
  } else {
    const { error } = await supabase
      .from('reactions')
      .insert({ post_id: postId, user_id: user.id, type });
    return { added: true, error: error?.message ?? null };
  }
}

export async function addOfferHelp(
  postId: string,
  message: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const { error } = await supabase
    .from('offer_helps')
    .upsert({ post_id: postId, user_id: user.id, message }, { onConflict: 'post_id,user_id' });

  return { error: error?.message ?? null };
}

export async function getOfferHelps(postId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('offer_helps')
    .select('*, user:profiles!offer_helps_user_id_fkey(id, username, display_name, avatar_url, reputation_tier)')
    .eq('post_id', postId)
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function markOfferHelpUseful(
  offerHelpId: string,
  isUseful: boolean
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('offer_helps')
    .update({ is_useful: isUseful })
    .eq('id', offerHelpId);
  return { error: error?.message ?? null };
}

export async function getMyPosts(type?: Post['type'], limit = 20): Promise<FeedPost[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from('posts')
    .select(POST_WITH_AUTHOR)
    .eq('author_id', user.id)
    .is('parent_id', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (type) query = query.eq('type', type);

  const { data } = await query;
  return (data ?? []) as FeedPost[];
}

export async function getTrendingPosts(limit = 20): Promise<FeedPost[]> {
  const supabase = await createClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from('posts')
    .select(POST_WITH_AUTHOR)
    .is('parent_id', null)
    .eq('is_public', true)
    .gte('created_at', since)
    .order('offer_help_count', { ascending: false })
    .order('accionable_count', { ascending: false })
    .limit(limit);

  return (data ?? []) as FeedPost[];
}

export async function searchPosts(query: string, limit = 15): Promise<FeedPost[]> {
  const supabase = await createClient();
  const q = query.trim();
  if (!q) return [];

  const { data } = await supabase
    .from('posts')
    .select(POST_WITH_AUTHOR)
    .or(`content.ilike.%${q}%,ship_title.ilike.%${q}%,ask_title.ilike.%${q}%`)
    .eq('is_public', true)
    .is('parent_id', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data ?? []) as FeedPost[];
}

export async function uploadProofScreenshot(file: File): Promise<{ url: string | null; error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { url: null, error: 'No autenticado' };

  const ext = file.name.split('.').pop();
  const path = `proof/${user.id}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from('uploads').upload(path, file);
  if (error) return { url: null, error: error.message };

  const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(path);
  return { url: publicUrl, error: null };
}
