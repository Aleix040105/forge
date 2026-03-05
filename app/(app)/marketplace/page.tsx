import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import {
  Code2, Palette, TrendingUp, Briefcase, FileText,
  BarChart2, Grid3x3, ShoppingBag, Plus, Search, Star
} from 'lucide-react';
import { getServices, searchServices } from '@/lib/queries/marketplace';
import { ServiceCard } from '@/components/marketplace/ServiceCard';
import { MarketplaceSearchBar } from '@/components/marketplace/MarketplaceSearchBar';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import type { ServiceCategory } from '@/types';

export const metadata: Metadata = {
  title: 'Marketplace — Forge',
  description: 'Servicios de fundadores para fundadores. Desarrollo, diseño, marketing y más.',
};

// ── Category config ──────────────────────────────────────────────────────────
const CATEGORIES: {
  value: ServiceCategory;
  label: string;
  icon: React.ElementType;
  gradient: string;
  iconColor: string;
}[] = [
  { value: 'Desarrollo', label: 'Desarrollo',  icon: Code2,      gradient: 'from-blue-500/20 to-blue-600/5',    iconColor: 'text-blue-400'   },
  { value: 'Diseño',     label: 'Diseño',       icon: Palette,    gradient: 'from-purple-500/20 to-purple-600/5', iconColor: 'text-purple-400' },
  { value: 'Marketing',  label: 'Marketing',    icon: TrendingUp, gradient: 'from-green-500/20 to-green-600/5',  iconColor: 'text-green-400'  },
  { value: 'Negocio',    label: 'Negocio',      icon: Briefcase,  gradient: 'from-orange-500/20 to-orange-600/5',iconColor: 'text-orange-400' },
  { value: 'Contenido',  label: 'Contenido',    icon: FileText,   gradient: 'from-pink-500/20 to-pink-600/5',    iconColor: 'text-pink-400'   },
  { value: 'Datos',      label: 'Datos',        icon: BarChart2,  gradient: 'from-cyan-500/20 to-cyan-600/5',    iconColor: 'text-cyan-400'   },
  { value: 'Otro',       label: 'Más',          icon: Grid3x3,    gradient: 'from-muted/60 to-muted/20',         iconColor: 'text-muted-foreground' },
];

// ── Search results ───────────────────────────────────────────────────────────
async function SearchResults({ query }: { query: string }) {
  const services = await searchServices(query, 20);

  if (services.length === 0) {
    return (
      <div className="py-16 text-center px-6">
        <Search className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="font-semibold text-sm mb-1">Sin resultados para "{query}"</p>
        <p className="text-xs text-muted-foreground">Prueba con otro término o explora por categoría.</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4">
      <p className="text-xs text-muted-foreground mb-3">
        {services.length} resultados para <span className="font-semibold text-foreground">"{query}"</span>
      </p>
      <div className="grid grid-cols-2 gap-3">
        {services.map(service => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>
    </div>
  );
}

// ── Category grid ────────────────────────────────────────────────────────────
function CategoryGrid({ active }: { active?: string }) {
  return (
    <div className="px-4">
      <div className="grid grid-cols-4 gap-2">
        {CATEGORIES.map(({ value, label, icon: Icon, gradient, iconColor }) => {
          const isActive = active === value;
          return (
            <Link
              key={value}
              href={isActive ? '/marketplace' : `/marketplace?category=${value}`}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                isActive
                  ? 'border-orange-500/50 bg-orange-500/10'
                  : 'border-border hover:border-foreground/20 bg-card'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${isActive ? 'text-orange-400' : iconColor}`} />
              </div>
              <span className={`text-[10px] font-medium text-center leading-tight ${isActive ? 'text-orange-400' : 'text-muted-foreground'}`}>
                {label}
              </span>
            </Link>
          );
        })}

        {/* "Become a seller" card */}
        <Link
          href="/marketplace/new"
          className="flex flex-col items-center gap-2 p-3 rounded-xl border border-dashed border-orange-500/30 bg-orange-500/5 hover:border-orange-500/60 transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <Plus className="w-5 h-5 text-orange-400" />
          </div>
          <span className="text-[10px] font-medium text-center leading-tight text-orange-400">
            Vender
          </span>
        </Link>
      </div>
    </div>
  );
}

// ── Service grid ─────────────────────────────────────────────────────────────
async function ServiceGrid({ category }: { category?: ServiceCategory }) {
  const services = await getServices(category, 24);

  if (services.length === 0) {
    return (
      <div className="py-16 text-center px-6">
        <ShoppingBag className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="font-semibold text-sm mb-1">Sin servicios todavía</p>
        <p className="text-xs text-muted-foreground mb-4">
          {category ? `Sé el primero en ofrecer servicios de ${category}.` : 'Sé el primero en publicar tu expertise.'}
        </p>
        <Button asChild size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
          <Link href="/marketplace/new">Crear mi primer servicio</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 px-4">
      {services.map(service => (
        <ServiceCard key={service.id} service={service} />
      ))}
    </div>
  );
}

// ── Featured categories (visual cards) ───────────────────────────────────────
async function FeaturedCategories() {
  const featured: { value: ServiceCategory; gradient: string; emoji: string }[] = [
    { value: 'Desarrollo', gradient: 'from-blue-600 to-blue-900',    emoji: '⚡' },
    { value: 'Diseño',     gradient: 'from-purple-600 to-purple-900', emoji: '🎨' },
    { value: 'Marketing',  gradient: 'from-green-600 to-green-900',   emoji: '📈' },
    { value: 'Negocio',    gradient: 'from-orange-600 to-orange-900', emoji: '💼' },
  ];

  const counts = await Promise.all(
    featured.map(async ({ value }) => {
      const svcs = await getServices(value, 1);
      return svcs.length;
    })
  );

  const withCounts = featured.map((f, i) => ({ ...f, count: counts[i] }));
  if (withCounts.every(f => f.count === 0)) return null;

  return (
    <div className="px-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Categorías populares
      </p>
      <div className="grid grid-cols-2 gap-2">
        {withCounts.filter(f => f.count > 0).map(({ value, gradient, emoji }) => (
          <Link
            key={value}
            href={`/marketplace?category=${value}`}
            className={`relative overflow-hidden rounded-xl p-4 bg-gradient-to-br ${gradient} min-h-[80px] flex flex-col justify-between group`}
          >
            <span className="text-2xl">{emoji}</span>
            <div>
              <p className="text-sm font-bold text-white">{value}</p>
            </div>
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
interface PageProps {
  searchParams: { category?: string; q?: string };
}

export default async function MarketplacePage({ searchParams }: PageProps) {
  const category = searchParams.category as ServiceCategory | undefined;
  const query = searchParams.q?.trim() ?? '';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="pb-24">
      {/* Hero */}
      <div className="relative bg-gradient-to-b from-orange-500/8 via-background to-background pt-6 pb-5 px-4 border-b border-border/40">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="font-bold text-2xl leading-tight">
              Marketplace
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Servicios de fundadores para fundadores
            </p>
          </div>
          <Button asChild size="sm" className="bg-orange-500 hover:bg-orange-600 text-white shrink-0 mt-1">
            <Link href="/marketplace/new">
              <Plus className="w-3.5 h-3.5 mr-1" /> Vender
            </Link>
          </Button>
        </div>

        {/* Search */}
        <MarketplaceSearchBar defaultValue={query} />

        {/* Trust badge */}
        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span>Valoraciones verificadas</span>
          </div>
          <span className="text-border">·</span>
          <span className="text-xs text-muted-foreground">Sin comisión en Beta</span>
        </div>
      </div>

      {/* My orders link */}
      <div className="flex items-center justify-end px-4 py-2">
        <Link href="/marketplace/orders" className="text-xs text-orange-500 hover:underline">
          Mis pedidos →
        </Link>
      </div>

      {query ? (
        /* ── Search results ── */
        <Suspense fallback={<div className="grid grid-cols-2 gap-3 px-4 pt-4">{Array.from({length:6}).map((_,i)=><div key={i} className="h-52 bg-muted rounded-xl animate-pulse"/>)}</div>}>
          <SearchResults query={query} />
        </Suspense>
      ) : (
        <div className="space-y-6 pt-2">
          {/* Category icons */}
          <CategoryGrid active={category} />

          {/* Featured visual categories (only when no filter) */}
          {!category && (
            <Suspense fallback={null}>
              <FeaturedCategories />
            </Suspense>
          )}

          {/* Service grid */}
          <div>
            <div className="flex items-center justify-between px-4 mb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {category ? `Servicios · ${category}` : 'Todos los servicios'}
              </p>
            </div>
            <Suspense fallback={
              <div className="grid grid-cols-2 gap-3 px-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-52 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            }>
              <ServiceGrid category={category} />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
}
