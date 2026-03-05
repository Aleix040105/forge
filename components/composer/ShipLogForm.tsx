'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Upload, ExternalLink, BarChart2, Ship } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createClient } from '@/lib/supabase/client';
import { createPost, uploadProofScreenshot } from '@/lib/queries/posts';

const schema = z.object({
  ship_title:   z.string().min(3, 'Mínimo 3 caracteres').max(80),
  content:      z.string().min(10, 'Describe qué construiste (mín. 10 caracteres)').max(280),
  ship_proof_url: z.string().url('URL no válida').optional().or(z.literal('')),
  ship_metric:  z.string().max(100).optional(),
  ship_time_days: z.coerce.number().int().min(1).max(365).optional(),
  project_id:   z.string().optional(),
}).refine(
  (data) => data.ship_proof_url || data.ship_metric,
  { message: 'Añade al menos una prueba: URL o métrica', path: ['ship_proof_url'] }
);

type FormData = z.infer<typeof schema>;

interface ShipLogFormProps {
  onSuccess: () => void;
  onBack: () => void;
}

export function ShipLogForm({ onSuccess, onBack }: ShipLogFormProps) {
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);

  const supabase = createClient();

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const proofUrl = watch('ship_proof_url');
  const metric   = watch('ship_metric');
  const hasProof = !!(proofUrl || metric || screenshotFile);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from('profiles').select('display_name, avatar_url').eq('id', user.id).single()
        .then(({ data }) => setUserProfile(data));
      supabase.from('projects').select('id, name').eq('owner_id', user.id).order('created_at', { ascending: false })
        .then(({ data }) => setProjects(data ?? []));
    });
  }, []);

  function handleScreenshot(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setScreenshotPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function onSubmit(data: FormData) {
    setLoading(true);

    let screenshotUrl: string | undefined;
    if (screenshotFile) {
      const { url, error } = await uploadProofScreenshot(screenshotFile);
      if (error) {
        toast.error('Error subiendo la captura: ' + error);
        setLoading(false);
        return;
      }
      screenshotUrl = url ?? undefined;
    }

    const { error } = await createPost({
      type: 'ship_log',
      content: data.content,
      project_id: data.project_id || undefined,
      ship_title: data.ship_title,
      ship_proof_url: data.ship_proof_url || undefined,
      ship_proof_screenshot: screenshotUrl,
      ship_metric: data.ship_metric || undefined,
      ship_time_days: data.ship_time_days,
    });

    if (error) {
      toast.error(error);
      setLoading(false);
      return;
    }

    toast.success('🚀 Ship Log publicado');
    onSuccess();
  }

  return (
    <div>
      <div className="flex items-center gap-3 px-6 py-3 border-b border-border/50">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <Ship className="w-4 h-4 text-orange-500" />
        <span className="text-sm font-semibold">Ship Log</span>
        <span className="text-xs text-muted-foreground ml-auto">Requiere prueba</span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-4 space-y-4">
        <div className="flex gap-3">
          <Avatar className="w-9 h-9 shrink-0 mt-0.5">
            <AvatarImage src={userProfile?.avatar_url ?? ''} />
            <AvatarFallback className="text-xs bg-orange-500/20 text-orange-400">
              {userProfile?.display_name?.slice(0, 2).toUpperCase() ?? '?'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-3">
            {/* Title */}
            <Input
              placeholder="¿Qué has enviado? (título breve)"
              className={errors.ship_title ? 'border-destructive' : ''}
              {...register('ship_title')}
            />
            {errors.ship_title && <p className="text-xs text-destructive">{errors.ship_title.message}</p>}

            {/* Description */}
            <Textarea
              placeholder="Describe qué construiste, para qué sirve y qué aprendiste en el proceso."
              className="resize-none"
              rows={3}
              {...register('content')}
            />
            {errors.content && <p className="text-xs text-destructive">{errors.content.message}</p>}
          </div>
        </div>

        {/* Proof section */}
        <div className="space-y-3 p-3 rounded-xl bg-muted/50 border border-dashed border-border">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${hasProof ? 'bg-green-500' : 'bg-orange-500'}`} />
            Prueba de trabajo {!hasProof && '(obligatoria — añade al menos una)'}
          </p>

          <div className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <Input
              placeholder="URL del producto, PR, post, etc."
              className="h-8 text-sm"
              {...register('ship_proof_url')}
            />
          </div>

          <div className="flex items-center gap-2">
            <BarChart2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <Input
              placeholder="Métrica: +22% conversión, 150 usuarios nuevos..."
              className="h-8 text-sm"
              {...register('ship_metric')}
            />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Upload className="w-3.5 h-3.5" />
              {screenshotFile ? screenshotFile.name : 'Subir captura de pantalla'}
              <input type="file" accept="image/*" className="hidden" onChange={handleScreenshot} />
            </label>
            {screenshotPreview && (
              <img src={screenshotPreview} alt="Preview" className="mt-2 rounded-lg max-h-32 object-cover" />
            )}
          </div>

          {errors.ship_proof_url && !proofUrl && !metric && !screenshotFile && (
            <p className="text-xs text-destructive">{errors.ship_proof_url.message}</p>
          )}
        </div>

        {/* Optional fields */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Input
              type="number"
              placeholder="Días invertidos"
              className="text-sm"
              {...register('ship_time_days')}
            />
          </div>
          {projects.length > 0 && (
            <select
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
              {...register('project_id')}
            >
              <option value="">Proyecto (opcional)</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
        </div>

        <Button
          type="submit"
          className="w-full bg-orange-500 hover:bg-orange-600 text-white h-11"
          disabled={loading}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : '🚀 Publicar Ship Log'}
        </Button>
      </form>
    </div>
  );
}
