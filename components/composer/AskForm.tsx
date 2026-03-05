'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createClient } from '@/lib/supabase/client';
import { createPost } from '@/lib/queries/posts';
import { cn } from '@/lib/utils';

const ASK_TYPES = [
  { value: 'Feedback',  label: 'Feedback',  desc: 'Opinión sobre tu producto o idea' },
  { value: 'Intro',     label: 'Intro',     desc: 'Presentación a alguien de tu red' },
  { value: 'Hiring',    label: 'Hiring',    desc: 'Buscas talento o colaboradores' },
  { value: 'Advice',    label: 'Advice',    desc: 'Consejo experto o mentoría' },
  { value: 'Resource',  label: 'Resource',  desc: 'Tool, recurso o referencia' },
];

const schema = z.object({
  ask_type:    z.enum(['Feedback', 'Intro', 'Hiring', 'Advice', 'Resource'], { required_error: 'Selecciona un tipo' }),
  ask_title:   z.string().min(5, 'Mínimo 5 caracteres').max(80),
  content:     z.string().min(10, 'Describe tu petición (mín. 10 caracteres)').max(500),
  ask_offering: z.string().max(100).optional(),
  project_id:  z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface AskFormProps {
  onSuccess: () => void;
  onBack: () => void;
}

export function AskForm({ onSuccess, onBack }: AskFormProps) {
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const supabase = createClient();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const selectedType = watch('ask_type');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from('profiles').select('display_name, avatar_url').eq('id', user.id).single()
        .then(({ data }) => setUserProfile(data));
      supabase.from('projects').select('id, name').eq('owner_id', user.id)
        .then(({ data }) => setProjects(data ?? []));
    });
  }, []);

  async function onSubmit(data: FormData) {
    setLoading(true);
    const { error } = await createPost({
      type: 'ask',
      content: data.content,
      project_id: data.project_id || undefined,
      ask_type: data.ask_type,
      ask_title: data.ask_title,
      ask_offering: data.ask_offering || undefined,
    });

    if (error) {
      toast.error(error);
      setLoading(false);
      return;
    }

    toast.success('Ask publicado');
    onSuccess();
  }

  return (
    <div>
      <div className="flex items-center gap-3 px-6 py-3 border-b border-border/50">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <HelpCircle className="w-4 h-4 text-blue-400" />
        <span className="text-sm font-semibold">Ask</span>
        <span className="text-xs text-muted-foreground ml-auto">Pide algo concreto</span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-4 space-y-4">
        {/* Avatar + tipo */}
        <div className="flex gap-3">
          <Avatar className="w-9 h-9 shrink-0 mt-0.5">
            <AvatarImage src={userProfile?.avatar_url ?? ''} />
            <AvatarFallback className="text-xs bg-blue-500/20 text-blue-400">
              {userProfile?.display_name?.slice(0, 2).toUpperCase() ?? '?'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            {/* Tipo selector */}
            <div className="grid grid-cols-3 gap-1.5 mb-4 sm:grid-cols-5">
              {ASK_TYPES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setValue('ask_type', value as any)}
                  className={cn(
                    'px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                    selectedType === value
                      ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                      : 'border-border text-muted-foreground hover:border-foreground/30'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            {errors.ask_type && <p className="text-xs text-destructive mb-2">{errors.ask_type.message}</p>}

            {selectedType && (
              <p className="text-xs text-muted-foreground mb-3">
                {ASK_TYPES.find(t => t.value === selectedType)?.desc}
              </p>
            )}

            {/* Título */}
            <Input
              placeholder="¿Qué necesitas exactamente? (título breve)"
              className={cn('mb-2', errors.ask_title && 'border-destructive')}
              {...register('ask_title')}
            />
            {errors.ask_title && <p className="text-xs text-destructive mb-2">{errors.ask_title.message}</p>}

            {/* Descripción */}
            <Textarea
              placeholder="Explica el contexto, qué has probado ya y qué tipo de ayuda buscas."
              className="resize-none mb-2"
              rows={3}
              {...register('content')}
            />
            {errors.content && <p className="text-xs text-destructive mb-2">{errors.content.message}</p>}

            {/* Qué ofreces a cambio */}
            <Input
              placeholder="¿Qué ofreces a cambio? (opcional) — ej: feedback recíproco, visibilidad..."
              className="text-sm"
              {...register('ask_offering')}
            />
          </div>
        </div>

        {/* Proyecto */}
        {projects.length > 0 && (
          <select
            className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
            {...register('project_id')}
          >
            <option value="">Vincular a proyecto (opcional)</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}

        <Button
          type="submit"
          className="w-full bg-blue-500 hover:bg-blue-600 text-white h-11"
          disabled={loading}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publicar Ask'}
        </Button>
      </form>
    </div>
  );
}
