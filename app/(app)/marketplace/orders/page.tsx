import Link from 'next/link';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { getBuyingOrders, getSellingOrders } from '@/lib/queries/marketplace';
import { OrderCard } from '@/components/marketplace/OrderCard';

export default async function OrdersPage() {
  const [buying, selling] = await Promise.all([getBuyingOrders(), getSellingOrders()]);

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="sticky top-14 z-20 flex items-center gap-3 px-4 py-3 border-b border-border/40 bg-background/95 backdrop-blur-sm">
        <Link href="/marketplace" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-semibold text-sm">Mis pedidos</h1>
      </div>

      {/* Comprando */}
      <div>
        <div className="px-4 py-3 border-b border-border/40 bg-muted/20">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Comprando ({buying.length})
          </p>
        </div>
        {buying.length === 0 ? (
          <div className="py-8 text-center px-6">
            <p className="text-sm text-muted-foreground mb-2">Aún no has hecho ningún pedido.</p>
            <Link href="/marketplace" className="text-sm text-orange-500">Explorar servicios</Link>
          </div>
        ) : (
          buying.map(order => <OrderCard key={order.id} order={order} role="buyer" />)
        )}
      </div>

      {/* Vendiendo */}
      {selling.length > 0 && (
        <div className="mt-2">
          <div className="px-4 py-3 border-b border-border/40 bg-muted/20">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Vendiendo ({selling.length})
            </p>
          </div>
          {selling.map(order => <OrderCard key={order.id} order={order} role="seller" />)}
        </div>
      )}

      {buying.length === 0 && selling.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <ShoppingBag className="w-8 h-8 text-muted-foreground mb-3" />
          <p className="font-medium text-sm mb-1">Sin pedidos todavía</p>
          <p className="text-xs text-muted-foreground mb-4">
            Explora el marketplace o crea tu primer servicio.
          </p>
          <div className="flex gap-2">
            <Link href="/marketplace" className="text-sm text-orange-500">Explorar</Link>
            <span className="text-muted-foreground">·</span>
            <Link href="/marketplace/new" className="text-sm text-orange-500">Vender</Link>
          </div>
        </div>
      )}
    </div>
  );
}
