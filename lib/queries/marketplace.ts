'use server';

import { createClient } from '@/lib/supabase/server';
import type { Service, Order, Review, PackageType, ServiceCategory } from '@/types';

const SERVICE_WITH_SELLER = `
  *,
  seller:profiles!services_seller_id_fkey(
    id, username, display_name, avatar_url, reputation_tier, impact_score
  )
`;

const ORDER_WITH_RELATIONS = `
  *,
  service:services(id, title, category, price_basic),
  buyer:profiles!orders_buyer_id_fkey(id, username, display_name, avatar_url),
  seller:profiles!orders_seller_id_fkey(id, username, display_name, avatar_url)
`;

// ── Services ────────────────────────────────────────────────────────────────

export async function getServices(category?: ServiceCategory, limit = 24): Promise<Service[]> {
  const supabase = await createClient();

  let query = supabase
    .from('services')
    .select(SERVICE_WITH_SELLER)
    .eq('is_active', true)
    .order('order_count', { ascending: false })
    .limit(limit);

  if (category) query = query.eq('category', category);

  const { data } = await query;
  return (data ?? []) as Service[];
}

export async function getService(id: string): Promise<Service | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('services')
    .select(SERVICE_WITH_SELLER)
    .eq('id', id)
    .single();
  return data as Service | null;
}

export async function searchServices(query: string, limit = 20): Promise<Service[]> {
  const supabase = await createClient();
  const q = query.trim();
  if (!q) return [];

  const { data } = await supabase
    .from('services')
    .select(SERVICE_WITH_SELLER)
    .eq('is_active', true)
    .or(`title.ilike.%${q}%,tagline.ilike.%${q}%,description.ilike.%${q}%`)
    .order('order_count', { ascending: false })
    .limit(limit);

  return (data ?? []) as Service[];
}

export async function getMyServices(): Promise<Service[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('services')
    .select('*')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false });

  return (data ?? []) as Service[];
}

export async function createService(input: {
  title: string;
  tagline: string;
  description: string;
  category: ServiceCategory;
  tags: string[];
  price_basic: number;
  price_standard?: number;
  price_premium?: number;
  title_basic: string;
  title_standard?: string;
  title_premium?: string;
  desc_basic: string;
  desc_standard?: string;
  desc_premium?: string;
  delivery_days_basic: number;
  delivery_days_standard?: number;
  delivery_days_premium?: number;
}): Promise<{ data: Service | null; error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'No autenticado' };

  const { data, error } = await supabase
    .from('services')
    .insert({ ...input, seller_id: user.id })
    .select()
    .single();

  return { data: data as Service | null, error: error?.message ?? null };
}

export async function updateService(
  id: string,
  input: Partial<Service>
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('services')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id);
  return { error: error?.message ?? null };
}

export async function toggleServiceActive(id: string, is_active: boolean): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('services')
    .update({ is_active })
    .eq('id', id);
  return { error: error?.message ?? null };
}

// ── Orders ──────────────────────────────────────────────────────────────────

export async function createOrder(input: {
  service_id: string;
  seller_id: string;
  package_type: PackageType;
  price: number;
  title: string;
  requirements?: string;
  due_date: string;
}): Promise<{ data: Order | null; error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'No autenticado' };

  const { data, error } = await supabase
    .from('orders')
    .insert({ ...input, buyer_id: user.id, status: 'active' })
    .select()
    .single();

  return { data: data as Order | null, error: error?.message ?? null };
}

export async function getOrder(id: string): Promise<Order | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('orders')
    .select(ORDER_WITH_RELATIONS)
    .eq('id', id)
    .single();
  return data as Order | null;
}

export async function getBuyingOrders(): Promise<Order[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('orders')
    .select(ORDER_WITH_RELATIONS)
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false });

  return (data ?? []) as Order[];
}

export async function getSellingOrders(): Promise<Order[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('orders')
    .select(ORDER_WITH_RELATIONS)
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false });

  return (data ?? []) as Order[];
}

export async function deliverOrder(id: string, delivery_url: string, delivery_note: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('orders')
    .update({
      status: 'delivered',
      delivery_url,
      delivery_note,
      delivered_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  return { error: error?.message ?? null };
}

export async function completeOrder(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('orders')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  return { error: error?.message ?? null };
}

export async function requestRevision(id: string, revision_note: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('orders')
    .update({
      status: 'revision_requested',
      revision_note,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  return { error: error?.message ?? null };
}

export async function cancelOrder(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('orders')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  return { error: error?.message ?? null };
}

// ── Reviews ─────────────────────────────────────────────────────────────────

export async function getServiceReviews(service_id: string): Promise<Review[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('reviews')
    .select('*, reviewer:profiles!reviews_reviewer_id_fkey(id, username, display_name, avatar_url)')
    .eq('service_id', service_id)
    .order('created_at', { ascending: false });
  return (data ?? []) as Review[];
}

export async function createReview(input: {
  order_id: string;
  service_id: string;
  seller_id: string;
  rating: number;
  comment?: string;
}): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const { error } = await supabase
    .from('reviews')
    .insert({ ...input, reviewer_id: user.id });

  return { error: error?.message ?? null };
}

export async function getOrderReview(order_id: string): Promise<Review | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('reviews')
    .select('*')
    .eq('order_id', order_id)
    .single();
  return data as Review | null;
}
