'use client';

import { useState } from 'react';
import { Check, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Service, PackageType } from '@/types';

interface PackagePickerProps {
  service: Service;
  onOrder: (pkg: PackageType, price: number, days: number) => void;
  loading?: boolean;
}

export function PackagePicker({ service, onOrder, loading }: PackagePickerProps) {
  const packages = [
    service.price_basic != null && {
      key: 'basic' as PackageType,
      title: service.title_basic,
      desc: service.desc_basic,
      price: service.price_basic,
      days: service.delivery_days_basic,
    },
    service.price_standard != null && {
      key: 'standard' as PackageType,
      title: service.title_standard ?? 'Estándar',
      desc: service.desc_standard ?? '',
      price: service.price_standard,
      days: service.delivery_days_standard ?? service.delivery_days_basic,
    },
    service.price_premium != null && {
      key: 'premium' as PackageType,
      title: service.title_premium ?? 'Premium',
      desc: service.desc_premium ?? '',
      price: service.price_premium,
      days: service.delivery_days_premium ?? service.delivery_days_basic,
    },
  ].filter(Boolean) as { key: PackageType; title: string; desc: string; price: number; days: number }[];

  const [selected, setSelected] = useState<PackageType>(packages[0].key);
  const current = packages.find(p => p.key === selected)!;

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      {/* Package tabs */}
      {packages.length > 1 && (
        <div className="flex border-b border-border">
          {packages.map(pkg => (
            <button
              key={pkg.key}
              type="button"
              onClick={() => setSelected(pkg.key)}
              className={cn(
                'flex-1 py-2.5 text-xs font-semibold transition-colors',
                selected === pkg.key
                  ? 'bg-orange-500 text-white'
                  : 'text-muted-foreground hover:bg-muted/40'
              )}
            >
              {pkg.title}
            </button>
          ))}
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <span className="font-bold text-xl">€{(current.price / 100).toFixed(0)}</span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            {current.days} días de entrega
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-4">{current.desc}</p>

        <Button
          className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          onClick={() => onOrder(current.key, current.price, current.days)}
          disabled={loading}
        >
          {loading ? 'Procesando...' : `Contratar · €${(current.price / 100).toFixed(0)}`}
        </Button>
      </div>
    </div>
  );
}
