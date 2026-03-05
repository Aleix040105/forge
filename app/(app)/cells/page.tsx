import { Users, Lock, Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CellsPage() {
  return (
    <div>
      <div className="px-4 py-4 border-b border-border/40">
        <div className="flex items-center gap-2 mb-1">
          <Users className="w-5 h-5 text-purple-400" />
          <h1 className="font-bold text-lg">Cells</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Grupos de 6–10 fundadores, sprints de 14 días con Demo Day.
        </p>
      </div>

      {/* Coming soon */}
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6">
          <Users className="w-8 h-8 text-purple-400" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium mb-4">
          <Lock className="w-3 h-3" /> Próximamente
        </div>

        <h2 className="text-xl font-bold mb-3">Cells está en desarrollo</h2>
        <p className="text-muted-foreground text-sm mb-8 max-w-xs">
          Los grupos de accountability para fundadores estarán disponibles muy pronto.
          Ciclos de 14 días con Demo Day incluido.
        </p>

        <div className="space-y-3 w-full max-w-xs text-left">
          {[
            { icon: Users,    text: '6–10 fundadores por Cell' },
            { icon: Calendar, text: 'Ciclos de 14 días + Demo Day' },
            { icon: ArrowRight, text: 'Objetivos declarados y accountability real' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <Icon className="w-4 h-4 text-purple-400 shrink-0" />
              <p className="text-sm">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
