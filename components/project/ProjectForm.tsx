'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createProject } from '@/lib/queries/projects';
import { INDUSTRY_OPTIONS, STAGE_OPTIONS } from '@/lib/utils';

const schema = z.object({
  name:        z.string().min(2, 'Mínimo 2 caracteres').max(80),
  tagline:     z.string().min(5, 'Mínimo 5 caracteres').max(120),
  description: z.string().max(500).optional(),
  url:         z.string().url('URL no válida').optional().or(z.literal('')),
  status:      z.string().min(1),
  industry:    z.string().optional(),
  is_open_for_collab: z.boolean().default(false),
});

type FormData = z.infer<typeof schema>;

interface ProjectFormProps {
  onSuccess?: (slug: string) => void;
}

export function ProjectForm({ onSuccess }: ProjectFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'Building', is_open_for_collab: false },
  });

  async function onSubmit(data: FormData) {
    setLoading(true);
    const { data: project, error } = await createProject({
      name: data.name,
      tagline: data.tagline,
      description: data.description,
      url: data.url || undefined,
      status: data.status,
      industry: data.industry,
      is_open_for_collab: data.is_open_for_collab,
    });

    if (error || !project) {
      toast.error(error ?? 'Error creando el proyecto');
      setLoading(false);
      return;
    }

    toast.success('Proyecto creado');
    if (onSuccess) onSuccess(project.slug);
    else router.push(`/project/${project.slug}`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-4 py-4">
      <div>
        <label className="text-sm font-medium mb-1.5 block">Nombre del proyecto *</label>
        <Input placeholder="Ej: Turnomatic" {...register('name')} className={errors.name ? 'border-destructive' : ''} />
        {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">Tagline *</label>
        <Input placeholder="Una frase que explique qué hace" {...register('tagline')} className={errors.tagline ? 'border-destructive' : ''} />
        {errors.tagline && <p className="text-xs text-destructive mt-1">{errors.tagline.message}</p>}
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">Descripción</label>
        <Textarea placeholder="Contexto adicional del proyecto..." rows={3} {...register('description')} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Estado *</label>
          <select className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-ring focus:outline-none" {...register('status')}>
            {STAGE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Industria</label>
          <select className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-ring focus:outline-none" {...register('industry')}>
            <option value="">Seleccionar</option>
            {INDUSTRY_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">URL del proyecto</label>
        <Input type="url" placeholder="https://tuproyecto.com" {...register('url')} />
        {errors.url && <p className="text-xs text-destructive mt-1">{errors.url.message}</p>}
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="collab" {...register('is_open_for_collab')} className="rounded" />
        <label htmlFor="collab" className="text-sm text-muted-foreground">
          Busco colaboradores para este proyecto
        </label>
      </div>

      <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white h-11" disabled={loading}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear proyecto →'}
      </Button>
    </form>
  );
}
