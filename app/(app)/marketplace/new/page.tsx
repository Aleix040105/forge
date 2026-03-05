'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createService } from '@/lib/queries/marketplace';
import { cn } from '@/lib/utils';
import type { ServiceCategory } from '@/types';

const CATEGORIES: ServiceCategory[] = ['Desarrollo', 'Diseño', 'Marketing', 'Negocio', 'Contenido', 'Datos', 'Otro'];

const schema = z.object({
  title:        z.string().min(10, 'Mínimo 10 caracteres').max(100),
  tagline:      z.string().min(10, 'Mínimo 10 caracteres').max(150),
  description:  z.string().min(50, 'Mínimo 50 caracteres').max(3000),
  category:     z.enum(['Desarrollo', 'Diseño', 'Marketing', 'Negocio', 'Contenido', 'Datos', 'Otro']),
  // Package básico (obligatorio)
  title_basic:  z.string().min(2).max(50).default('Básico'),
  desc_basic:   z.string().min(10, 'Describe qué incluye').max(300),
  price_basic:  z.coerce.number().min(1, 'Mínimo €1').max(10000),
  delivery_days_basic: z.coerce.number().min(1).max(365).default(7),
  // Package estándar (opcional)
  title_standard: z.string().max(50).optional(),
  desc_standard:  z.string().max(300).optional(),
  price_standard: z.coerce.number().min(0).max(10000).optional(),
  delivery_days_standard: z.coerce.number().min(1).max(365).optional(),
  // Package premium (opcional)
  title_premium: z.string().max(50).optional(),
  desc_premium:  z.string().max(300).optional(),
  price_premium: z.coerce.number().min(0).max(10000).optional(),
  delivery_days_premium: z.coerce.number().min(1).max(365).optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewServicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [showStandard, setShowStandard] = useState(false);
  const [showPremium, setShowPremium] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title_basic: 'Básico', delivery_days_basic: 7 },
  });

  const selectedCategory = watch('category');

  function addTag(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase();
      if (tag && !tags.includes(tag) && tags.length < 5) {
        setTags(prev => [...prev, tag]);
        setTagInput('');
      }
    }
  }

  async function onSubmit(data: FormData) {
    setLoading(true);
    const { data: service, error } = await createService({
      ...data,
      price_basic: Math.round(data.price_basic * 100),
      price_standard: showStandard && data.price_standard ? Math.round(data.price_standard * 100) : undefined,
      price_premium: showPremium && data.price_premium ? Math.round(data.price_premium * 100) : undefined,
      title_standard: showStandard ? data.title_standard : undefined,
      desc_standard: showStandard ? data.desc_standard : undefined,
      delivery_days_standard: showStandard ? data.delivery_days_standard : undefined,
      title_premium: showPremium ? data.title_premium : undefined,
      desc_premium: showPremium ? data.desc_premium : undefined,
      delivery_days_premium: showPremium ? data.delivery_days_premium : undefined,
      tags,
    });

    if (error) { toast.error(error); setLoading(false); return; }
    toast.success('Servicio publicado');
    router.push(`/marketplace/${service!.id}`);
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-14 z-20 flex items-center gap-3 px-4 py-3 border-b border-border/40 bg-background/95 backdrop-blur-sm">
        <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-semibold text-sm">Nuevo servicio</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="px-4 py-4 space-y-5">
        {/* Básicos */}
        <section className="space-y-3">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Información general</h2>

          <div>
            <label className="text-xs font-medium mb-1 block">Título del servicio</label>
            <Input placeholder="Ej: Diseño de landing page profesional en Figma" {...register('title')} className={cn(errors.title && 'border-destructive')} />
            {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block">Tagline (una línea)</label>
            <Input placeholder="Ej: Landing pages que convierten en 5 días o menos" {...register('tagline')} className={cn(errors.tagline && 'border-destructive')} />
            {errors.tagline && <p className="text-xs text-destructive mt-1">{errors.tagline.message}</p>}
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block">Descripción completa</label>
            <Textarea
              placeholder="Describe tu servicio, proceso de trabajo, qué incluye y qué necesitas del cliente..."
              rows={5}
              className={cn('resize-none', errors.description && 'border-destructive')}
              {...register('description')}
            />
            {errors.description && <p className="text-xs text-destructive mt-1">{errors.description.message}</p>}
          </div>

          {/* Categoría */}
          <div>
            <label className="text-xs font-medium mb-2 block">Categoría</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setValue('category', cat)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                    selectedCategory === cat
                      ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                      : 'border-border text-muted-foreground hover:border-foreground/30'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
            {errors.category && <p className="text-xs text-destructive mt-1">Selecciona una categoría</p>}
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-medium mb-1 block">Tags (máx. 5)</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-muted rounded-full text-xs">
                  {tag}
                  <button type="button" onClick={() => setTags(t => t.filter(x => x !== tag))}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            {tags.length < 5 && (
              <Input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={addTag}
                placeholder="Escribe y pulsa Enter..."
                className="text-sm"
              />
            )}
          </div>
        </section>

        {/* Paquetes */}
        <section className="space-y-4">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Paquetes y precios</h2>

          {/* Básico */}
          <PackageSection
            label="Básico"
            required
            register={register}
            errors={errors}
            prefix="basic"
          />

          {/* Estándar */}
          {showStandard ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">Estándar</span>
                <button type="button" onClick={() => setShowStandard(false)} className="text-xs text-muted-foreground hover:text-destructive">
                  Eliminar
                </button>
              </div>
              <PackageSection register={register} errors={errors} prefix="standard" />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowStandard(true)}
              className="w-full border border-dashed border-border rounded-xl p-3 text-xs text-muted-foreground hover:border-orange-500/50 hover:text-orange-400 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Añadir paquete Estándar
            </button>
          )}

          {/* Premium */}
          {showPremium ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">Premium</span>
                <button type="button" onClick={() => setShowPremium(false)} className="text-xs text-muted-foreground hover:text-destructive">
                  Eliminar
                </button>
              </div>
              <PackageSection register={register} errors={errors} prefix="premium" />
            </div>
          ) : showStandard && (
            <button
              type="button"
              onClick={() => setShowPremium(true)}
              className="w-full border border-dashed border-border rounded-xl p-3 text-xs text-muted-foreground hover:border-orange-500/50 hover:text-orange-400 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Añadir paquete Premium
            </button>
          )}
        </section>

        <Button
          type="submit"
          className="w-full bg-orange-500 hover:bg-orange-600 text-white h-11"
          disabled={loading}
        >
          {loading ? 'Publicando...' : 'Publicar servicio'}
        </Button>
      </form>
    </div>
  );
}

function PackageSection({ label, required, register, errors, prefix }: {
  label?: string;
  required?: boolean;
  register: any;
  errors: any;
  prefix: 'basic' | 'standard' | 'premium';
}) {
  return (
    <div className="p-4 rounded-xl border border-border space-y-3">
      {label && <p className="text-sm font-semibold">{label}{required && <span className="text-orange-500 ml-0.5">*</span>}</p>}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-medium mb-1 block">Nombre del paquete</label>
          <Input placeholder="Ej: Básico" {...register(`title_${prefix}`)} />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">Precio (€)</label>
          <Input type="number" min="1" placeholder="99" {...register(`price_${prefix}`)} className={cn(errors[`price_${prefix}`] && 'border-destructive')} />
          {errors[`price_${prefix}`] && <p className="text-xs text-destructive">{errors[`price_${prefix}`]?.message}</p>}
        </div>
      </div>
      <div>
        <label className="text-xs font-medium mb-1 block">Días de entrega</label>
        <Input type="number" min="1" max="365" placeholder="7" {...register(`delivery_days_${prefix}`)} />
      </div>
      <div>
        <label className="text-xs font-medium mb-1 block">¿Qué incluye?</label>
        <Textarea
          placeholder="Describe qué incluye este paquete..."
          rows={2}
          className={cn('resize-none text-sm', errors[`desc_${prefix}`] && 'border-destructive')}
          {...register(`desc_${prefix}`)}
        />
        {errors[`desc_${prefix}`] && <p className="text-xs text-destructive">{errors[`desc_${prefix}`]?.message}</p>}
      </div>
    </div>
  );
}
