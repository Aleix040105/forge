'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, Check, Loader2, Camera } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createClient } from '@/lib/supabase/client';
import { cn, NEEDS_OPTIONS, INDUSTRY_OPTIONS, STAGE_OPTIONS } from '@/lib/utils';

const schema = z.object({
  display_name:   z.string().min(1).max(50),
  bio:            z.string().max(200).optional(),
  now_objective:  z.string().max(120).optional(),
  company_stage:  z.enum(['Idea', 'Building', 'Beta', 'Live', 'Scaling', 'Exited', '']).optional(),
  industry:       z.string().optional(),
  website_url:    z.string().url('URL no válida').optional().or(z.literal('')),
  linkedin_url:   z.string().url('URL no válida').optional().or(z.literal('')),
  twitter_handle: z.string().max(50).optional(),
  is_available:   z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

export default function EditProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([]);
  const [selectedOffers, setSelectedOffers] = useState<string[]>([]);
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [displayName, setDisplayNameState] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return; }
      supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
        if (!data) return;
        setUsername(data.username);
        setAvatarUrl(data.avatar_url ?? null);
        setDisplayNameState(data.display_name ?? '');
        setSelectedNeeds(data.now_needs ?? []);
        setSelectedOffers(data.now_offers ?? []);
        reset({
          display_name:   data.display_name ?? '',
          bio:            data.bio ?? '',
          now_objective:  data.now_objective ?? '',
          company_stage:  data.company_stage ?? '',
          industry:       data.industry ?? '',
          website_url:    data.website_url ?? '',
          linkedin_url:   data.linkedin_url ?? '',
          twitter_handle: data.twitter_handle ?? '',
          is_available:   data.is_available ?? true,
        });
        setLoadingProfile(false);
      });
    });
  }, []);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Imagen máx. 2MB'); return; }
    setAvatarUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const ext = file.name.split('.').pop();
    const path = `avatars/${user.id}.${ext}`;
    const { error } = await supabase.storage.from('uploads').upload(path, file, { upsert: true });
    if (error) { toast.error('Error subiendo imagen'); setAvatarUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(path);
    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
    setAvatarUrl(publicUrl + '?t=' + Date.now());
    toast.success('Avatar actualizado');
    setAvatarUploading(false);
  }

  async function onSubmit(data: FormData) {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name:   data.display_name,
        bio:            data.bio || null,
        now_objective:  data.now_objective || null,
        company_stage:  data.company_stage || null,
        industry:       data.industry || null,
        website_url:    data.website_url || null,
        linkedin_url:   data.linkedin_url || null,
        twitter_handle: data.twitter_handle || null,
        is_available:   data.is_available,
        now_needs:      selectedNeeds,
        now_offers:     selectedOffers,
      })
      .eq('id', user.id);

    if (error) {
      toast.error('Error guardando: ' + error.message);
      setLoading(false);
      return;
    }

    toast.success('Perfil actualizado');
    router.push(`/profile/${username}`);
    router.refresh();
  }

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="sticky top-14 z-20 flex items-center gap-3 px-4 py-3 border-b border-border/40 bg-background/95 backdrop-blur-sm">
        <Link href={`/profile/${username}`} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <span className="font-semibold text-sm flex-1">Editar perfil</span>
        <Button
          size="sm"
          className="bg-orange-500 hover:bg-orange-600 text-white h-8 px-4"
          onClick={handleSubmit(onSubmit)}
          disabled={loading}
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Guardar'}
        </Button>
      </div>

      <form className="px-4 py-5 space-y-5 max-w-lg mx-auto">

        {/* Avatar */}
        <div className="flex justify-center">
          <label className="relative cursor-pointer group">
            <Avatar className="w-20 h-20">
              <AvatarImage src={avatarUrl ?? ''} />
              <AvatarFallback className="text-2xl bg-orange-500/20 text-orange-400 font-bold">
                {displayName.slice(0, 2).toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              {avatarUploading
                ? <Loader2 className="w-5 h-5 text-white animate-spin" />
                : <Camera className="w-5 h-5 text-white" />}
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={avatarUploading} />
          </label>
        </div>

        {/* Nombre */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">Nombre</label>
          <Input placeholder="Tu nombre" {...register('display_name')} />
          {errors.display_name && <p className="text-xs text-destructive mt-1">{errors.display_name.message}</p>}
        </div>

        {/* Bio */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">Bio <span className="text-muted-foreground font-normal">(máx. 200 caracteres)</span></label>
          <Textarea
            placeholder="Cuéntanos quién eres en una frase"
            className="resize-none"
            rows={2}
            maxLength={200}
            {...register('bio')}
          />
        </div>

        {/* Now objective */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">¿Qué estás construyendo ahora?</label>
          <Textarea
            placeholder="Ej: Lanzando el MVP de un SaaS B2B para hostelería"
            className="resize-none"
            rows={2}
            maxLength={120}
            {...register('now_objective')}
          />
        </div>

        {/* Stage + Industry */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Fase</label>
            <select
              className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
              {...register('company_stage')}
            >
              <option value="">Sin especificar</option>
              {STAGE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Industria</label>
            <select
              className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
              {...register('industry')}
            >
              <option value="">Sin especificar</option>
              {INDUSTRY_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
        </div>

        {/* Needs */}
        <div>
          <label className="text-sm font-medium mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Necesito ahora
          </label>
          <div className="flex flex-wrap gap-2">
            {NEEDS_OPTIONS.map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setSelectedNeeds(prev =>
                  prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n]
                )}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm border transition-colors',
                  selectedNeeds.includes(n)
                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                    : 'border-border text-muted-foreground hover:border-foreground/50'
                )}
              >
                {selectedNeeds.includes(n) && <Check className="w-3 h-3 inline mr-1" />}
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Offers */}
        <div>
          <label className="text-sm font-medium mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Puedo ofrecer
          </label>
          <div className="flex flex-wrap gap-2">
            {NEEDS_OPTIONS.map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setSelectedOffers(prev =>
                  prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n]
                )}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm border transition-colors',
                  selectedOffers.includes(n)
                    ? 'bg-green-500/20 border-green-500/50 text-green-400'
                    : 'border-border text-muted-foreground hover:border-foreground/50'
                )}
              >
                {selectedOffers.includes(n) && <Check className="w-3 h-3 inline mr-1" />}
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Links */}
        <div className="space-y-3">
          <label className="text-sm font-medium block">Links</label>
          <Input placeholder="https://tu-web.com" {...register('website_url')} />
          {errors.website_url && <p className="text-xs text-destructive">{errors.website_url.message}</p>}
          <Input placeholder="https://linkedin.com/in/tu-perfil" {...register('linkedin_url')} />
          {errors.linkedin_url && <p className="text-xs text-destructive">{errors.linkedin_url.message}</p>}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
            <Input className="pl-7" placeholder="handle de X/Twitter" {...register('twitter_handle')} />
          </div>
        </div>

        {/* Disponibilidad */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
          <div>
            <p className="text-sm font-medium">Disponible para colaborar</p>
            <p className="text-xs text-muted-foreground">Aparece como disponible en tu perfil</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" {...register('is_available')} />
            <div className="w-10 h-6 bg-muted peer-checked:bg-orange-500 rounded-full peer peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
          </label>
        </div>

      </form>
    </div>
  );
}
