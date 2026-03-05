import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Zap, Ship, Target, Users } from 'lucide-react';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">Forge</span>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Entrar</Link>
          </Button>
          <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white" asChild>
            <Link href="/register">Unirse</Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-medium mb-8">
          <Zap className="w-3 h-3" /> Fundadores que ejecutan, no que presumen
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-4">
          Build in public.{' '}
          <span className="text-orange-500">Ship with proof.</span>
        </h1>

        <p className="text-muted-foreground text-lg mb-8 max-w-md">
          La red donde tu reputación es lo que has entregado, no lo que has publicado.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
          <Button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white h-12 text-base" asChild>
            <Link href="/register">Empieza a construir →</Link>
          </Button>
          <Button variant="outline" className="flex-1 h-12 text-base" asChild>
            <Link href="/login">Ya tengo cuenta</Link>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          Solo para fundadores. Gratis para empezar.
        </p>
      </section>

      {/* Features */}
      <section className="px-6 py-12 border-t border-border/50 max-w-2xl mx-auto w-full">
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: Ship, title: 'Ship Logs', desc: 'Documenta lo que construyes con prueba real.' },
            { icon: Target, title: 'Asks', desc: 'Pide ayuda estructurada. Ofrece valor a cambio.' },
            { icon: Zap, title: 'Bounties', desc: 'Paga por tareas concretas. Con escrow.' },
            { icon: Users, title: 'Cells', desc: 'Grupos de 6–10 fundadores, sprints de 14 días.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-4 rounded-xl border border-border/50 bg-card">
              <Icon className="w-5 h-5 text-orange-500 mb-2" />
              <h3 className="font-semibold text-sm mb-1">{title}</h3>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="px-6 py-4 text-center text-xs text-muted-foreground border-t border-border/50">
        © 2025 Forge · Build in public.
      </footer>
    </main>
  );
}
