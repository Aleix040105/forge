import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { StarRating } from './StarRating';
import type { Service } from '@/types';

const CATEGORY_COLORS: Record<string, string> = {
  Desarrollo: 'bg-blue-500/10 text-blue-400',
  Diseño:     'bg-purple-500/10 text-purple-400',
  Marketing:  'bg-green-500/10 text-green-400',
  Negocio:    'bg-orange-500/10 text-orange-400',
  Contenido:  'bg-pink-500/10 text-pink-400',
  Datos:      'bg-cyan-500/10 text-cyan-400',
  Otro:       'bg-muted text-muted-foreground',
};

interface ServiceCardProps {
  service: Service;
}

export function ServiceCard({ service }: ServiceCardProps) {
  const seller = service.seller;
  const categoryColor = CATEGORY_COLORS[service.category] ?? CATEGORY_COLORS.Otro;

  return (
    <Link
      href={`/marketplace/${service.id}`}
      className="group flex flex-col rounded-xl border border-border bg-card hover:border-foreground/20 hover:shadow-sm transition-all overflow-hidden"
    >
      {/* Cover placeholder */}
      <div className="h-32 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-background flex items-center justify-center border-b border-border/40 relative">
        <span className="text-4xl opacity-20 select-none">
          {service.category === 'Desarrollo' ? '⚡' :
           service.category === 'Diseño' ? '🎨' :
           service.category === 'Marketing' ? '📈' :
           service.category === 'Negocio' ? '💼' :
           service.category === 'Contenido' ? '✍️' :
           service.category === 'Datos' ? '📊' : '🔧'}
        </span>
        <span className={`absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ${categoryColor}`}>
          {service.category}
        </span>
      </div>

      <div className="p-3 flex flex-col flex-1 gap-2">
        <p className="text-sm font-semibold leading-tight line-clamp-2 group-hover:text-orange-500 transition-colors">
          {service.title}
        </p>

        {/* Seller */}
        {seller && (
          <div className="flex items-center gap-1.5">
            <Avatar className="w-5 h-5">
              <AvatarImage src={seller.avatar_url ?? ''} />
              <AvatarFallback className="text-[8px] bg-orange-500/20 text-orange-400">
                {seller.display_name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate">{seller.display_name}</span>
          </div>
        )}

        <div className="mt-auto pt-1 border-t border-border/40 flex items-center justify-between">
          <div>
            {service.rating_count > 0 ? (
              <StarRating rating={service.rating_avg ?? 0} showValue count={service.rating_count} />
            ) : (
              <span className="text-xs text-muted-foreground">Sin valoraciones</span>
            )}
          </div>
          <div className="text-right">
            <span className="text-[10px] text-muted-foreground">Desde </span>
            <span className="text-sm font-bold">€{(service.price_basic / 100).toFixed(0)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
