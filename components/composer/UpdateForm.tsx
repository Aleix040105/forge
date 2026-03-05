'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Link2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createClient } from '@/lib/supabase/client';
import { createPost } from '@/lib/queries/posts';

const MAX_CHARS = 280;

const schema = z.object({
  content:    z.string().min(1, 'El update no puede estar vacío').max(MAX_CHARS),
  project_id: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface UpdateFormProps {
  parentId?: string;
  onSuccess: () => void;
  onBack?: () => void;
}

export function UpdateForm({ parentId, onSuccess, onBack }: UpdateFormProps) {
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);

  const supabase = createClient();

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const content = watch('content', '');
  const charsLeft = MAX_CHARS - (content?.length ?? 0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from('profiles').select('display_name, avatar_url, username').eq('id', user.id).single()
        .then(({ data }) => setUserProfile(data));
      supabase.from('projects').select('id, name').eq('owner_id', user.id).order('created_at', { ascending: false })
        .then(({ data }) => setProjects(data ?? []));
    });
  }, []);

  async function onSubmit(data: FormData) {
    setLoading(true);
    const { error } = await createPost({
      type: 'update',
      content: data.content,
      project_id: data.project_id || undefined,
      parent_id: parentId,
    });

    if (error) {
      toast.error(error);
      setLoading(false);
      return;
    }

    toast.success(parentId ? 'Respuesta publicada' : 'Update publicado');
    onSuccess();
  }

  return (
    <div>
      <div className="flex items-center gap-3 px-6 py-3 border-b border-border/50">
        {onBack && (
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <span className="text-sm font-semibold">{parentId ? 'Responder' : 'Update'}</span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-4">
        <div className="flex gap-3">
          <Avatar className="w-9 h-9 shrink-0 mt-0.5">
            <AvatarImage src={userProfile?.avatar_url ?? ''} />
            <AvatarFallback className="text-xs bg-orange-500/20 text-orange-400">
              {userProfile?.display_name?.slice(0, 2).toUpperCase() ?? '?'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <Textarea
              placeholder={parentId
                ? 'Escribe tu respuesta...'
                : '¿Qué estás construyendo o aprendiendo hoy?'
              }
              className="border-none bg-transparent resize-none text-base p-0 focus-visible:ring-0 min-h-[100px]"
              maxLength={MAX_CHARS}
              autoFocus
              {...register('content')}
            />

            {projects.length > 0 && !parentId && (
              <div className="flex items-center gap-2 mt-2">
                <Link2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <select
                  className="text-xs text-muted-foreground bg-transparent border-none focus:outline-none"
                  {...register('project_id')}
                >
                  <option value="">Vincular a proyecto (opcional)</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
          <span className={`text-xs ${charsLeft < 20 ? 'text-orange-500' : 'text-muted-foreground'}`}>
            {charsLeft} caracteres restantes
          </span>
          <Button
            type="submit"
            className="bg-orange-500 hover:bg-orange-600 text-white h-9 px-5 text-sm"
            disabled={loading || content.length === 0}
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Publicar'}
          </Button>
        </div>
      </form>
    </div>
  );
}
