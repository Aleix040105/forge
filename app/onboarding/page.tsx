'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Zap, Check, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createClient } from '@/lib/supabase/client';
import { cn, NEEDS_OPTIONS, INDUSTRY_OPTIONS, STAGE_OPTIONS } from '@/lib/utils';

// ─── Step schemas ─────────────────────────────────────────────────────────────
const step2Schema = z.object({
  username:      z.string().min(3).max(30).regex(/^[a-z0-9_]+$/, 'Solo letras minúsculas, números y _'),
  now_objective: z.string().min(10, 'Mínimo 10 caracteres').max(120),
  company_stage: z.enum(['Idea', 'Building', 'Beta', 'Live', 'Scaling', 'Exited']),
  industry:      z.string().min(1, 'Selecciona una industria'),
});

type Step2Data = z.infer<typeof step2Schema>;

const STEPS = 5;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedNeeds,   setSelectedNeeds]   = useState<string[]>([]);
  const [selectedOffers,  setSelectedOffers]  = useState<string[]>([]);
  const [suggestedUsers,  setSuggestedUsers]  = useState<any[]>([]);
  const [loadingUsers,    setLoadingUsers]    = useState(false);
  const [selectedToFollow,setSelectedToFollow]= useState<string[]>([]);
  const [userData, setUserData] = useState<Partial<Step2Data>>({});

  const supabase = createClient();

  const { register, handleSubmit, formState: { errors } } = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
  });

  // Load suggested users when we reach step 4
  useEffect(() => {
    if (step === 4) {
      setLoadingUsers(true);
      const { data: { user: currentUser } } = { data: { user: null } };
      supabase.auth.getUser().then(({ data: { user: me } }) => {
        supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url, now_objective, company_stage, industry, impact_score')
          .neq('id', me?.id ?? '')
          .order('impact_score', { ascending: false })
          .limit(12)
          .then(({ data }) => {
            setSuggestedUsers(data ?? []);
            setLoadingUsers(false);
          });
      });
    }
  }, [step]);

  // ─── Step 2: Profile Now ────────────────────────────────────────────────────
  async function handleStep2(data: Step2Data) {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // Check username availability
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', data.username)
      .neq('id', user.id)
      .single();

    if (existing) {
      toast.error('Este username ya está en uso. Prueba otro.');
      setLoading(false);
      return;
    }

    setUserData(data);
    setLoading(false);
    setStep(3);
  }

  // ─── Step 3: Needs & Offers ─────────────────────────────────────────────────
  function handleStep3() {
    if (selectedNeeds.length === 0 && selectedOffers.length === 0) {
      toast.error('Selecciona al menos una necesidad u oferta.');
      return;
    }
    setStep(4);
  }

  // ─── Step 4: Follow ─────────────────────────────────────────────────────────
  function toggleFollow(id: string) {
    setSelectedToFollow(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  const minFollow = Math.min(3, suggestedUsers.length);

  async function handleStep4() {
    if (selectedToFollow.length < minFollow) {
      toast.error(`Sigue al menos a ${minFollow} persona${minFollow !== 1 ? 's' : ''} para empezar.`);
      return;
    }
    setStep(5);
  }

  // ─── Final save ─────────────────────────────────────────────────────────────
  async function completeOnboarding() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // Save profile
    const { error } = await supabase
      .from('profiles')
      .update({
        username:      userData.username,
        now_objective: userData.now_objective,
        company_stage: userData.company_stage,
        industry:      userData.industry,
        now_needs:     selectedNeeds,
        now_offers:    selectedOffers,
        onboarding_done: true,
        onboarding_step: 5,
      })
      .eq('id', user.id);

    if (error) {
      toast.error('Error guardando el perfil: ' + error.message);
      setLoading(false);
      return;
    }

    // Follow selected users
    if (selectedToFollow.length > 0) {
      const rows = selectedToFollow.map(id => ({ follower_id: user.id, following_id: id }));
      await supabase.from('user_follows').upsert(rows, { onConflict: 'follower_id,following_id' });
    }

    router.push('/feed');
    router.refresh();
  }

  // ─── Progress bar ──────────────────────────────────────────────────────────
  const progress = ((step - 1) / (STEPS - 1)) * 100;

  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="font-bold">Forge</span>
        </div>
        <span className="text-xs text-muted-foreground">{step} de {STEPS}</span>
      </header>

      {/* Progress */}
      <div className="h-1 bg-muted">
        <div
          className="h-full bg-orange-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center px-6 py-8 max-w-lg mx-auto w-full">

        {/* ── Step 1: Welcome ─────────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Zap className="w-8 h-8 text-orange-500" />
            </div>
            <h1 className="text-2xl font-bold mb-3">Bienvenido a Forge</h1>
            <p className="text-muted-foreground mb-8">
              En 4 pasos rápidos configuras tu perfil y empiezas a construir en público.
            </p>
            <div className="space-y-3 text-left mb-8">
              {[
                { n: '01', t: 'Tu perfil "Now"', d: 'Qué estás construyendo hoy' },
                { n: '02', t: 'Needs & Offers', d: 'Qué necesitas y qué puedes dar' },
                { n: '03', t: 'Tu tribu', d: 'Sigue a otros fundadores' },
                { n: '04', t: 'Primera acción', d: 'Publica tu primer Ship Log o Ask' },
              ].map(({ n, t, d }) => (
                <div key={n} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  <span className="text-xs font-mono text-orange-500 w-6">{n}</span>
                  <div>
                    <p className="text-sm font-medium">{t}</p>
                    <p className="text-xs text-muted-foreground">{d}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white h-11" onClick={() => setStep(2)}>
              Empezar <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* ── Step 2: Profile Now ──────────────────────────────────────────────── */}
        {step === 2 && (
          <form onSubmit={handleSubmit(handleStep2)} className="w-full space-y-5">
            <div>
              <h2 className="text-xl font-bold mb-1">Tu perfil "Now"</h2>
              <p className="text-sm text-muted-foreground mb-6">
                En Forge el perfil muestra lo que estás construyendo hoy, no tus cargos pasados.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Username <span className="text-muted-foreground">(único, no se puede cambiar)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                <Input
                  className={cn('pl-7', errors.username && 'border-destructive')}
                  placeholder="tupau_garcia"
                  {...register('username')}
                />
              </div>
              {errors.username && <p className="text-xs text-destructive mt-1">{errors.username.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">
                ¿Qué estás construyendo ahora mismo?
              </label>
              <Textarea
                className={cn('resize-none', errors.now_objective && 'border-destructive')}
                placeholder="Ej: Lanzando el MVP de un SaaS B2B para gestión de turnos en hostelería"
                rows={2}
                maxLength={120}
                {...register('now_objective')}
              />
              {errors.now_objective && <p className="text-xs text-destructive mt-1">{errors.now_objective.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Fase</label>
                <select
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                  {...register('company_stage')}
                >
                  <option value="">Seleccionar</option>
                  {STAGE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.company_stage && <p className="text-xs text-destructive mt-1">Requerido</p>}
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Industria</label>
                <select
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                  {...register('industry')}
                >
                  <option value="">Seleccionar</option>
                  {INDUSTRY_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
                {errors.industry && <p className="text-xs text-destructive mt-1">Requerido</p>}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white h-11"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Continuar →'}
            </Button>
          </form>
        )}

        {/* ── Step 3: Needs & Offers ──────────────────────────────────────────── */}
        {step === 3 && (
          <div className="w-full">
            <h2 className="text-xl font-bold mb-1">Needs & Offers</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Esto personaliza tu feed y permite que otros te encuentren. Selecciona todo lo que aplique.
            </p>

            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Necesito ahora
              </h3>
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

            <div className="mb-8">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Puedo ofrecer
              </h3>
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

            <Button
              className="w-full bg-orange-500 hover:bg-orange-600 text-white h-11"
              onClick={handleStep3}
            >
              Continuar →
            </Button>
          </div>
        )}

        {/* ── Step 4: Follow ──────────────────────────────────────────────────── */}
        {step === 4 && (
          <div className="w-full">
            <h2 className="text-xl font-bold mb-1">Tu tribu</h2>
            <p className="text-sm text-muted-foreground mb-2">
              Sigue a al menos 3 fundadores para activar tu feed.
            </p>
            <p className="text-xs text-muted-foreground mb-6">
              {selectedToFollow.length}/{minFollow} seleccionados
            </p>

            <div className="space-y-2 mb-8">
              {loadingUsers ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Cargando sugerencias...
                </div>
              ) : suggestedUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Todavía no hay otros fundadores. Serás el primero.
                </div>
              ) : (
                suggestedUsers.map(user => (
                  <div
                    key={user.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors',
                      selectedToFollow.includes(user.id)
                        ? 'border-orange-500/50 bg-orange-500/10'
                        : 'border-border hover:border-border/80 bg-card'
                    )}
                    onClick={() => toggleFollow(user.id)}
                  >
                    <Avatar className="w-9 h-9 shrink-0">
                      <AvatarImage src={user.avatar_url ?? ''} />
                      <AvatarFallback className="text-xs bg-orange-500/20 text-orange-400">
                        {user.display_name?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.display_name}</p>
                      <p className="text-xs text-muted-foreground truncate">@{user.username} · {user.industry}</p>
                    </div>
                    {selectedToFollow.includes(user.id) && (
                      <Check className="w-4 h-4 text-orange-500 shrink-0" />
                    )}
                  </div>
                ))
              )}
            </div>

            <Button
              className="w-full bg-orange-500 hover:bg-orange-600 text-white h-11"
              onClick={handleStep4}
              disabled={selectedToFollow.length < minFollow}
            >
              {selectedToFollow.length < minFollow
                ? `Selecciona ${minFollow - selectedToFollow.length} más`
                : 'Continuar →'
              }
            </Button>
          </div>
        )}

        {/* ── Step 5: Ready ───────────────────────────────────────────────────── */}
        {step === 5 && (
          <div className="text-center w-full">
            <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-3">¡Todo listo!</h2>
            <p className="text-muted-foreground mb-8">
              Tu perfil está configurado. Ahora elige cómo quieres empezar.
            </p>

            <div className="space-y-3 mb-8">
              <div className="p-4 rounded-xl border border-orange-500/30 bg-orange-500/10 text-left">
                <p className="text-sm font-semibold text-orange-400 mb-1">🚀 Documentar lo que construí</p>
                <p className="text-xs text-muted-foreground">Publica tu primer Ship Log con prueba de lo que has enviado.</p>
              </div>
              <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/10 text-left">
                <p className="text-sm font-semibold text-blue-400 mb-1">🤝 Pedir algo concreto</p>
                <p className="text-xs text-muted-foreground">Crea un Ask para feedback, una intro o consejo experto.</p>
              </div>
            </div>

            <Button
              className="w-full bg-orange-500 hover:bg-orange-600 text-white h-11 mb-3"
              onClick={completeOnboarding}
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ir al feed →'}
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
