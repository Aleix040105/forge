'use server';

import { createClient } from '@/lib/supabase/server';
import { slugify } from '@/lib/utils';
import type { Project } from '@/types';

export async function getProject(slug: string): Promise<(Project & { owner: any; members: any[] }) | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('projects')
    .select(`
      *,
      owner:profiles!projects_owner_id_fkey(id, username, display_name, avatar_url, reputation_tier),
      members:project_members(user_id, role, user:profiles(id, username, display_name, avatar_url))
    `)
    .eq('slug', slug)
    .single();
  return data;
}

export async function getMyProjects(): Promise<Project[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('projects')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  return data ?? [];
}

export async function createProject(input: {
  name: string;
  tagline: string;
  description?: string;
  url?: string;
  status: string;
  industry?: string;
  business_model?: string;
  is_open_for_collab?: boolean;
}): Promise<{ data: Project | null; error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'No autenticado' };

  // Generate unique slug
  const baseSlug = slugify(input.name);
  const { data: existing } = await supabase
    .from('projects')
    .select('slug')
    .eq('owner_id', user.id)
    .eq('slug', baseSlug)
    .single();

  const slug = existing ? `${baseSlug}-${Date.now().toString(36)}` : baseSlug;

  const { data, error } = await supabase
    .from('projects')
    .insert({
      owner_id: user.id,
      name: input.name,
      slug,
      tagline: input.tagline,
      description: input.description ?? null,
      url: input.url ?? null,
      status: input.status,
      industry: input.industry ?? null,
      business_model: input.business_model ?? null,
      is_open_for_collab: input.is_open_for_collab ?? false,
    })
    .select()
    .single();

  return { data, error: error?.message ?? null };
}

export async function updateProject(
  projectId: string,
  updates: Partial<Project>
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId);
  return { error: error?.message ?? null };
}
