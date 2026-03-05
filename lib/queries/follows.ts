'use server';

import { createClient } from '@/lib/supabase/server';

export async function followUser(followingId: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const { error } = await supabase
    .from('user_follows')
    .insert({ follower_id: user.id, following_id: followingId });

  return { error: error?.message ?? null };
}

export async function unfollowUser(followingId: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const { error } = await supabase
    .from('user_follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', followingId);

  return { error: error?.message ?? null };
}

export async function isFollowingUser(followingId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from('user_follows')
    .select('follower_id')
    .eq('follower_id', user.id)
    .eq('following_id', followingId)
    .single();

  return !!data;
}

export async function followProject(projectId: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const { error } = await supabase
    .from('project_follows')
    .insert({ follower_id: user.id, project_id: projectId });

  return { error: error?.message ?? null };
}

export async function unfollowProject(projectId: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const { error } = await supabase
    .from('project_follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('project_id', projectId);

  return { error: error?.message ?? null };
}

export async function isFollowingProject(projectId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from('project_follows')
    .select('follower_id')
    .eq('follower_id', user.id)
    .eq('project_id', projectId)
    .single();

  return !!data;
}

export async function getFollowingIds(userId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('user_follows')
    .select('following_id')
    .eq('follower_id', userId);
  return data?.map(r => r.following_id) ?? [];
}

export async function followMultipleUsers(userIds: string[]): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const rows = userIds
    .filter(id => id !== user.id)
    .map(id => ({ follower_id: user.id, following_id: id }));

  if (rows.length === 0) return { error: null };

  const { error } = await supabase
    .from('user_follows')
    .upsert(rows, { onConflict: 'follower_id,following_id' });

  return { error: error?.message ?? null };
}
