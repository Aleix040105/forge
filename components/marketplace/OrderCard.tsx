import Link from 'next/link';
import { Clock, CheckCircle, Package, XCircle, AlertCircle, RotateCcw } from 'lucide-react';
import { formatRelativeDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { Order, OrderStatus } from '@/types';

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: typeof Clock }> = {
  pending_payment: { label: 'Pago pendiente',    color: 'text-yellow-400',      icon: Clock        },
  active:          { label: 'En progreso',        color: 'text-blue-400',        icon: Package      },
  delivered:       { label: 'Entregado',          color: 'text-orange-400',      icon: Package      },
  revision_requested: { label: 'Revisión',        color: 'text-yellow-400',      icon: RotateCcw    },
  completed:       { label: 'Completado',         color: 'text-green-400',       icon: CheckCircle  },
  cancelled:       { label: 'Cancelado',          color: 'text-muted-foreground',icon: XCircle      },
  disputed:        { label: 'En disputa',         color: 'text-destructive',     icon: AlertCircle  },
};

interface OrderCardProps {
  order: Order;
  role: 'buyer' | 'seller';
}

export function OrderCard({ order, role }: OrderCardProps) {
  const status = STATUS_CONFIG[order.status];
  const StatusIcon = status.icon;
  const other = role === 'buyer' ? order.seller : order.buyer;

  return (
    <Link
      href={`/marketplace/orders/${order.id}`}
      className="flex items-center gap-3 px-4 py-3 border-b border-border/40 hover:bg-muted/10 transition-colors"
    >
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center bg-muted/50 shrink-0')}>
        <StatusIcon className={cn('w-4 h-4', status.color)} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{order.title}</p>
        <p className="text-xs text-muted-foreground truncate">
          {role === 'buyer' ? 'Vendedor' : 'Comprador'}: {other?.display_name}
        </p>
      </div>

      <div className="text-right shrink-0">
        <p className="text-sm font-semibold">€{(order.price / 100).toFixed(0)}</p>
        <p className={cn('text-xs font-medium', status.color)}>{status.label}</p>
      </div>
    </Link>
  );
}
