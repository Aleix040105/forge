import { Ship, HelpCircle, Zap } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getMyPosts } from '@/lib/queries/posts';
import { PostCard } from '@/components/feed/PostCard';

export default async function ForgePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [myShips, myAsks] = await Promise.all([
    getMyPosts('ship_log', 10),
    getMyPosts('ask', 10),
  ]);

  return (
    <div>
      {/* Header */}
      <div className="px-4 py-4 border-b border-border/40">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-5 h-5 text-orange-500 fill-orange-500" />
          <h1 className="font-bold text-lg">Tu Execution Hub</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Tus Ships, Asks y Bounties en un lugar.
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 px-4 py-4 border-b border-border/40">
        <button
          className="flex items-center gap-2 p-3 rounded-xl border border-orange-500/30 bg-orange-500/10 text-left hover:bg-orange-500/20 transition-colors"
        >
          <Ship className="w-4 h-4 text-orange-500" />
          <div>
            <p className="text-xs font-semibold text-orange-400">Nuevo Ship Log</p>
            <p className="text-[10px] text-muted-foreground">Documenta lo que ships</p>
          </div>
        </button>
        <button
          className="flex items-center gap-2 p-3 rounded-xl border border-blue-500/30 bg-blue-500/10 text-left hover:bg-blue-500/20 transition-colors opacity-50 cursor-not-allowed"
        >
          <HelpCircle className="w-4 h-4 text-blue-500" />
          <div>
            <p className="text-xs font-semibold text-blue-400">Nuevo Ask</p>
            <p className="text-[10px] text-muted-foreground">Próximamente</p>
          </div>
        </button>
      </div>

      {/* My Ships */}
      <div>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Ship className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-semibold">Mis Ship Logs</span>
            <span className="text-xs text-muted-foreground">({myShips.length})</span>
          </div>
        </div>

        {myShips.length > 0
          ? myShips.map(post => <PostCard key={post.id} post={post} />)
          : (
            <div className="py-10 text-center px-6">
              <Ship className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium text-sm mb-1">Sin Ship Logs todavía</p>
              <p className="text-xs text-muted-foreground mb-4">
                Documenta lo último que has enviado. Tu primer Ship Log.
              </p>
            </div>
          )
        }
      </div>

      {/* Stats summary */}
      <div className="px-4 py-4 border-t border-border/40 mt-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Tu actividad de la semana
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-xl bg-muted/50">
            <p className="text-2xl font-bold">{myShips.length}</p>
            <p className="text-[10px] text-muted-foreground">Ships totales</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-muted/50">
            <p className="text-2xl font-bold">{myAsks.length}</p>
            <p className="text-[10px] text-muted-foreground">Asks activos</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-muted/50">
            <p className="text-2xl font-bold">0</p>
            <p className="text-[10px] text-muted-foreground">Bounties</p>
          </div>
        </div>
      </div>
    </div>
  );
}
