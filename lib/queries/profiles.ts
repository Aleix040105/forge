'use server';

import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/types';

export async function getProfile(username: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();
  return data;
}

export async function getProfileById(id: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();
  return data;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  return data;
}

export async function updateProfile(updates: Partial<Profile>): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id);

  return { error: error?.message ?? null };
}

export async function completeOnboarding(profileData: {
  username: string;
  display_name: string;
  now_objective: string;
  now_needs: string[];
  now_offers: string[];
  company_stage: string;
  industry: string;
}): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const { error } = await supabase
    .from('profiles')
    .update({
      ...profileData,
      onboarding_done: true,
      onboarding_step: 5,
    })
    .eq('id', user.id);

  return { error: error?.message ?? null };
}

export async function getSuggestedProfiles(industry: string | null, limit = 12): Promise<Profile[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase
    .from('profiles')
    .select('*')
    .eq('onboarding_done', true)
    .order('impact_score', { ascending: false })
    .limit(limit);

  if (industry) query = query.eq('industry', industry);
  if (user) query = query.neq('id', user.id);

  const { data } = await query;
  return data ?? [];
}

export async function searchProfiles(query: string, limit = 10): Promise<Profile[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const q = query.trim();
  if (!q) return [];

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .or(`display_name.ilike.%${q}%,username.ilike.%${q}%,bio.ilike.%${q}%`)
    .eq('onboarding_done', true)
    .neq('id', user?.id ?? '')
    .order('impact_score', { ascending: false })
    .limit(limit);

  return data ?? [];
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single();
  return !data;
}
