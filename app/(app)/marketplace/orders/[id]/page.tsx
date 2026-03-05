'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeft, Clock, ExternalLink, CheckCircle, RotateCcw, XCircle, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { StarRating, InteractiveStarRating } from '@/components/marketplace/StarRating';
import { createClient } from '@/lib/supabase/client';
import {
  getOrder, getOrderReview, deliverOrder, completeOrder,
  requestRevision, cancelOrder, createReview
} from '@/lib/queries/marketplace';
import { formatRelativeDate } from '@/lib/utils';
import type { Order, Review, OrderStatus } from '@/types';

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment:    'Pago pendiente',
  active:             'En progreso',
  delivered:          'Entregado — pendiente de aceptación',
  revision_requested: 'Revisión solicitada',
  completed:          'Completado',
  cancelled:          'Cancelado',
  disputed:           'En disputa',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending_payment:    'text-yellow-400',
  active:             'text-blue-400',
  delivered:          'text-orange-400',
  revision_requested: 'text-yellow-400',
  completed:          'text-green-400',
  cancelled:          'text-muted-foreground',
  disputed:           'text-destructive',
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  // Deliver form
  const [deliveryUrl, setDeliveryUrl] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [showDeliverForm, setShowDeliverForm] = useState(false);

  // Revision form
  const [revisionNote, setRevisionNote] = useState('');
  const [showRevisionForm, setShowRevisionForm] = useState(false);

  // Review form
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUserId(user?.id ?? null));
    Promise.all([getOrder(id), getOrderReview(id)]).then(([o, r]) => {
      setOrder(o);
      setReview(r);
      setLoading(false);
    });
  }, [id]);

  const isBuyer = currentUserId === order?.buyer_id;
  const isSeller = currentUserId === order?.seller_id;

  async function handleDeliver() {
    if (!deliveryUrl.trim()) { toast.error('Añade la URL de entrega'); return; }
    setActing(true);
    const { error } = await deliverOrder(id, deliveryUrl.trim(), deliveryNote.trim());
    if (error) { toast.error(error); setActing(false); return; }
    toast.success('Entrega enviada al comprador');
    setOrder(prev => prev ? { ...prev, status: 'delivered', delivery_url: deliveryUrl } : prev);
    setShowDeliverForm(false);
    setActing(false);
  }

  async function handleComplete() {
    setActing(true);
    const { error } = await completeOrder(id);
    if (error) { toast.error(error); setActing(false); return; }
    toast.success('Pedido completado');
    setOrder(prev => prev ? { ...prev, status: 'completed' } : prev);
    setActing(false);
  }

  async function handleRevision() {
    if (!revisionNote.trim()) { toast.error('Explica qué necesitas revisar'); return; }
    setActing(true);
    const { error } = await requestRevision(id, revisionNote.trim());
    if (error) { toast.error(error); setActing(false); return; }
    toast.success('Revisión solicitada');
    setOrder(prev => prev ? { ...prev, status: 'revision_requested' } : prev);
    setShowRevisionForm(false);
    setActing(false);
  }

  async function handleCancel() {
    setActing(true);
    const { error } = await cancelOrder(id);
    if (error) { toast.error(error); setActing(false); return; }
    toast.success('Pedido cancelado');
    setOrder(prev => prev ? { ...prev, status: 'cancelled' } : prev);
    setActing(false);
  }

  async function handleReview() {
    if (!order) return;
    setActing(true);
    const { error } = await createReview({
      order_id: order.id,
      service_id: order.service_id,
      seller_id: order.seller_id,
      rating,
      comment: comment.trim() || undefined,
    });
    if (error) { toast.error(error); setActing(false); return; }
    toast.success('Valoración enviada');
    setShowReviewForm(false);
    setReview({ id: '', order_id: id, service_id: order.service_id, reviewer_id: currentUserId!, seller_id: order.seller_id, rating, comment, created_at: new Date().toISOString() });
    setActing(false);
  }

  if (loading) {
    return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!order) {
    return <div className="py-20 text-center text-muted-foreground text-sm">Pedido no encontrado.</div>;
  }

  const other = isBuyer ? order.seller : order.buyer;

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40">
        <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-semibold text-sm flex-1 truncate">{order.title}</h1>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Status */}
        <div className="p-4 rounded-xl border border-border space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className={`font-semibold text-sm ${STATUS_COLORS[order.status]}`}>
                {STATUS_LABELS[order.status]}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Creado {formatRelativeDate(order.created_at)}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg">€{(order.price / 100).toFixed(0)}</p>
              <p className="text-xs text-muted-foreground capitalize">{order.package_type}</p>
            </div>
          </div>
          {order.due_date && order.status === 'active' && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              Entrega estimada: {new Date(order.due_date).toLocaleDateString('es-ES')}
            </div>
          )}
        </div>

        {/* Other party */}
        {other && (
          <Link href={`/profile/${other.username}`} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-foreground/20 transition-colors">
            <Avatar className="w-9 h-9">
              <AvatarImage src={other.avatar_url ?? ''} />
              <AvatarFallback className="bg-orange-500/20 text-orange-400 text-xs">
                {other.display_name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{other.display_name}</p>
              <p className="text-xs text-muted-foreground">{isBuyer ? 'Vendedor' : 'Comprador'} · @{other.username}</p>
            </div>
          </Link>
        )}

        {/* Requirements */}
        {order.requirements && (
          <div className="p-3 rounded-xl bg-muted/30 border border-border/60">
            <p className="text-xs font-semibold text-muted-foreground mb-1">Requisitos del comprador</p>
            <p className="text-sm">{order.requirements}</p>
          </div>
        )}

        {/* Delivery */}
        {order.delivery_url && (
          <div className="p-3 rounded-xl border border-green-500/20 bg-green-500/5">
            <p className="text-xs font-semibold text-green-400 mb-2">Entrega recibida</p>
            <a href={order.delivery_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-orange-400 hover:underline break-all">
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              {order.delivery_url}
            </a>
            {order.delivery_note && (
              <p className="text-xs text-muted-foreground mt-2">{order.delivery_note}</p>
            )}
          </div>
        )}

        {/* Revision note */}
        {order.revision_note && order.status === 'revision_requested' && (
          <div className="p-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
            <p className="text-xs font-semibold text-yellow-400 mb-1">Solicitud de revisión</p>
            <p className="text-sm">{order.revision_note}</p>
          </div>
        )}

        {/* ── SELLER ACTIONS ── */}
        {isSeller && order.status === 'active' && (
          showDeliverForm ? (
            <div className="space-y-3 p-4 rounded-xl border border-border">
              <p className="font-semibold text-sm">Marcar como entregado</p>
              <div>
                <label className="text-xs font-medium mb-1 block">URL de entrega *</label>
                <Input value={deliveryUrl} onChange={e => setDeliveryUrl(e.target.value)} placeholder="https://..." />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Nota para el comprador (opcional)</label>
                <Textarea value={deliveryNote} onChange={e => setDeliveryNote(e.target.value)} rows={2} className="resize-none text-sm" placeholder="Instrucciones, contraseñas, aclaraciones..." />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white" onClick={handleDeliver} disabled={acting}>
                  {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enviar entrega'}
                </Button>
                <Button variant="outline" onClick={() => setShowDeliverForm(false)}>Cancelar</Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white" onClick={() => setShowDeliverForm(true)}>
                <CheckCircle className="w-4 h-4 mr-1.5" /> Marcar como entregado
              </Button>
              <Button variant="outline" size="sm" onClick={handleCancel} disabled={acting} className="text-destructive border-destructive/30 hover:bg-destructive/10">
                Cancelar
              </Button>
            </div>
          )
        )}

        {isSeller && order.status === 'revision_requested' && (
          <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white" onClick={() => setShowDeliverForm(true)}>
            <RotateCcw className="w-4 h-4 mr-1.5" /> Reenviar entrega revisada
          </Button>
        )}

        {/* ── BUYER ACTIONS ── */}
        {isBuyer && order.status === 'delivered' && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button className="flex-1 bg-green-500 hover:bg-green-600 text-white" onClick={handleComplete} disabled={acting}>
                {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4 mr-1.5" /> Aceptar y completar</>}
              </Button>
            </div>
            {showRevisionForm ? (
              <div className="space-y-2">
                <Textarea value={revisionNote} onChange={e => setRevisionNote(e.target.value)} rows={3} className="resize-none text-sm" placeholder="¿Qué necesitas que se revise o cambie?" />
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={handleRevision} disabled={acting}>
                    {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Solicitar revisión'}
                  </Button>
                  <Button variant="ghost" onClick={() => setShowRevisionForm(false)}>Cancelar</Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" className="w-full" onClick={() => setShowRevisionForm(true)}>
                <RotateCcw className="w-4 h-4 mr-1.5" /> Pedir revisión
              </Button>
            )}
          </div>
        )}

        {/* ── REVIEW (buyer, after completion) ── */}
        {isBuyer && order.status === 'completed' && !review && (
          showReviewForm ? (
            <div className="p-4 rounded-xl border border-border space-y-3">
              <p className="font-semibold text-sm">Deja una valoración</p>
              <InteractiveStarRating value={rating} onChange={setRating} />
              <Textarea value={comment} onChange={e => setComment(e.target.value)} rows={3} className="resize-none text-sm" placeholder="¿Qué te pareció el servicio? (opcional)" />
              <div className="flex gap-2">
                <Button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white" onClick={handleReview} disabled={acting}>
                  {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publicar valoración'}
                </Button>
                <Button variant="outline" onClick={() => setShowReviewForm(false)}>Cancelar</Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => setShowReviewForm(true)}>
              <Star className="w-4 h-4 mr-1.5" /> Valorar este servicio
            </Button>
          )
        )}

        {review && (
          <div className="p-3 rounded-xl border border-border/60 bg-muted/20">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Tu valoración</p>
            <StarRating rating={review.rating} showValue />
            {review.comment && <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>}
          </div>
        )}

        {/* Link to service */}
        <Link href={`/marketplace/${order.service_id}`} className="block text-center text-xs text-orange-500 hover:underline">
          Ver página del servicio
        </Link>
      </div>
    </div>
  );
}
