'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeft, Clock, Package, Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PackagePicker } from '@/components/marketplace/PackagePicker';
import { StarRating } from '@/components/marketplace/StarRating';
import { createClient } from '@/lib/supabase/client';
import { getService, getServiceReviews, createOrder } from '@/lib/queries/marketplace';
import type { Service, Review, PackageType } from '@/types';

const CATEGORY_COLORS: Record<string, string> = {
  Desarrollo: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Diseño:     'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Marketing:  'bg-green-500/10 text-green-400 border-green-500/20',
  Negocio:    'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Contenido:  'bg-pink-500/10 text-pink-400 border-pink-500/20',
  Datos:      'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  Otro:       'bg-muted text-muted-foreground border-border',
};

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [service, setService] = useState<Service | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUserId(user?.id ?? null));
    Promise.all([getService(id), getServiceReviews(id)]).then(([svc, rvs]) => {
      setService(svc);
      setReviews(rvs);
      setLoading(false);
    });
  }, [id]);

  async function handleOrder(pkg: PackageType, price: number, days: number) {
    if (!currentUserId) { router.push('/login'); return; }
    if (!service) return;
    setOrdering(true);

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + days);

    const { data: order, error } = await createOrder({
      service_id: service.id,
      seller_id: service.seller_id,
      package_type: pkg,
      price,
      title: service.title,
      due_date: dueDate.toISOString(),
    });

    if (error) { toast.error(error); setOrdering(false); return; }
    toast.success('Pedido creado');
    router.push(`/marketplace/orders/${order!.id}`);
  }

  if (loading) {
    return (
      <div className="p-4 space-y-4 animate-pulse">
        <div className="h-40 bg-muted rounded-xl" />
        <div className="h-6 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-1/2" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Servicio no encontrado.</p>
        <Link href="/marketplace" className="text-sm text-orange-500 mt-2 block">Volver al Marketplace</Link>
      </div>
    );
  }

  const seller = service.seller;
  const isOwn = currentUserId === service.seller_id;
  const categoryColor = CATEGORY_COLORS[service.category] ?? CATEGORY_COLORS.Otro;

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40">
        <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-semibold text-sm truncate flex-1">{service.title}</span>
        {isOwn && (
          <Link href={`/marketplace/${service.id}/edit`} className="text-xs text-orange-500">
            Editar
          </Link>
        )}
      </div>

      {/* Cover */}
      <div className="h-40 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-background flex items-center justify-center border-b border-border/40">
        <span className="text-6xl opacity-20">
          {service.category === 'Desarrollo' ? '⚡' :
           service.category === 'Diseño' ? '🎨' :
           service.category === 'Marketing' ? '📈' :
           service.category === 'Negocio' ? '💼' :
           service.category === 'Contenido' ? '✍️' :
           service.category === 'Datos' ? '📊' : '🔧'}
        </span>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Category + tags */}
        <div className="flex flex-wrap gap-1.5">
          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${categoryColor}`}>
            {service.category}
          </span>
          {service.tags?.map(tag => (
            <span key={tag} className="text-[11px] px-2.5 py-1 rounded-full border border-border text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>

        {/* Title + tagline */}
        <div>
          <h1 className="font-bold text-xl leading-tight mb-1">{service.title}</h1>
          <p className="text-sm text-muted-foreground">{service.tagline}</p>
        </div>

        {/* Rating */}
        {service.rating_count > 0 && (
          <div className="flex items-center gap-2">
            <StarRating rating={service.rating_avg ?? 0} size="md" showValue count={service.rating_count} />
            <span className="text-xs text-muted-foreground">· {service.order_count} pedidos</span>
          </div>
        )}

        {/* Seller */}
        {seller && (
          <Link href={`/profile/${seller.username}`} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-foreground/20 transition-colors">
            <Avatar className="w-10 h-10">
              <AvatarImage src={seller.avatar_url ?? ''} />
              <AvatarFallback className="bg-orange-500/20 text-orange-400 font-bold">
                {seller.display_name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{seller.display_name}</p>
              <p className="text-xs text-muted-foreground">@{seller.username} · ⚡ {seller.reputation_tier}</p>
            </div>
          </Link>
        )}

        {/* Description */}
        <div>
          <h2 className="font-semibold text-sm mb-2">Descripción</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {service.description}
          </p>
        </div>

        {/* Package picker (only if not own service) */}
        {!isOwn && (
          <div>
            <h2 className="font-semibold text-sm mb-3">Elige tu paquete</h2>
            <PackagePicker service={service} onOrder={handleOrder} loading={ordering} />
          </div>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <div>
            <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
              Valoraciones
              <span className="text-muted-foreground font-normal">({reviews.length})</span>
            </h2>
            <div className="space-y-3">
              {reviews.map(review => (
                <div key={review.id} className="p-3 rounded-xl border border-border/60">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="w-7 h-7">
                      <AvatarImage src={review.reviewer?.avatar_url ?? ''} />
                      <AvatarFallback className="text-[10px] bg-muted">
                        {review.reviewer?.display_name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium">{review.reviewer?.display_name}</span>
                    <StarRating rating={review.rating} />
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
