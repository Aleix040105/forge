'use server';

import { createClient } from '@/lib/supabase/server';

export async function getConversations() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('conversations')
    .select(`
      id, request_status, requested_by, last_message_at, last_message_preview, created_at,
      participant_1, participant_2,
      profile_1:profiles!conversations_participant_1_fkey(id, username, display_name, avatar_url),
      profile_2:profiles!conversations_participant_2_fkey(id, username, display_name, avatar_url)
    `)
    .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
    .order('last_message_at', { ascending: false, nullsFirst: false });

  return (data ?? []).map((conv: any) => ({
    ...conv,
    other: conv.participant_1 === user.id ? conv.profile_2 : conv.profile_1,
    is_requester: conv.requested_by === user.id,
    unread: false, // extended in future
  }));
}

export async function getOrCreateConversation(otherUserId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'No autenticado' };

  // Ensure consistent ordering
  const p1 = user.id < otherUserId ? user.id : otherUserId;
  const p2 = user.id < otherUserId ? otherUserId : user.id;

  // Check if exists
  const { data: existing } = await supabase
    .from('conversations')
    .select('id, request_status')
    .eq('participant_1', p1)
    .eq('participant_2', p2)
    .single();

  if (existing) return { data: existing, error: null };

  // Create new (request-to-message)
  const { data, error } = await supabase
    .from('conversations')
    .insert({ participant_1: p1, participant_2: p2, requested_by: user.id })
    .select('id, request_status')
    .single();

  return { data, error: error?.message ?? null };
}

export async function acceptConversation(conversationId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('conversations')
    .update({ request_status: 'accepted' })
    .eq('id', conversationId);
  return { error: error?.message ?? null };
}

export async function rejectConversation(conversationId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('conversations')
    .update({ request_status: 'rejected' })
    .eq('id', conversationId);
  return { error: error?.message ?? null };
}

export async function getMessages(conversationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('messages')
    .select(`
      id, content, is_read, created_at, sender_id,
      sender:profiles!messages_sender_id_fkey(id, username, display_name, avatar_url)
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  // Mark unread messages as read
  await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .neq('sender_id', user.id)
    .eq('is_read', false);

  return data ?? [];
}

export async function sendMessage(conversationId: string, content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const { error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: user.id, content });

  return { error: error?.message ?? null };
}

export async function getConversation(conversationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('conversations')
    .select(`
      id, request_status, requested_by, created_at,
      participant_1, participant_2,
      profile_1:profiles!conversations_participant_1_fkey(id, username, display_name, avatar_url),
      profile_2:profiles!conversations_participant_2_fkey(id, username, display_name, avatar_url)
    `)
    .eq('id', conversationId)
    .single();

  if (!data) return null;

  return {
    ...data,
    other: (data as any).participant_1 === user.id ? (data as any).profile_2 : (data as any).profile_1,
    is_requester: data.requested_by === user.id,
    current_user_id: user.id,
  };
}

export async function getUnreadMessagesCount() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('is_read', false)
    .neq('sender_id', user.id)
    .in('conversation_id',
      supabase
        .from('conversations')
        .select('id')
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
        .eq('request_status', 'accepted') as any
    );

  return count ?? 0;
}
