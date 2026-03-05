import { Target, Lightbulb, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Profile } from '@/types';

interface NowSectionProps {
  profile: Profile;
}

const NEED_COLOR = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
const OFFER_COLOR = 'bg-green-500/10 text-green-400 border-green-500/20';

export function NowSection({ profile }: NowSectionProps) {
  const hasContent = profile.now_objective || profile.now_needs?.length > 0 || profile.now_offers?.length > 0;

  if (!hasContent) {
    return (
      <div className="px-4 py-4 border-b border-border/40">
        <p className="text-sm text-muted-foreground italic">
          Este fundador aún no ha configurado su sección "Now".
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 border-b border-border/40 space-y-3">
      {/* Objective */}
      {profile.now_objective && (
        <div className="flex items-start gap-2">
          <Target className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-orange-500 uppercase tracking-wide mb-0.5">Objetivo ahora</p>
            <p className="text-sm">{profile.now_objective}</p>
          </div>
        </div>
      )}

      {/* Needs */}
      {profile.now_needs?.length > 0 && (
        <div className="flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide mb-1.5">Necesita</p>
            <div className="flex flex-wrap gap-1.5">
              {profile.now_needs.map(need => (
                <span key={need} className={cn('px-2 py-0.5 rounded-full text-xs border', NEED_COLOR)}>
                  {need}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Offers */}
      {profile.now_offers?.length > 0 && (
        <div className="flex items-start gap-2">
          <Gift className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-green-400 uppercase tracking-wide mb-1.5">Puede ofrecer</p>
            <div className="flex flex-wrap gap-1.5">
              {profile.now_offers.map(offer => (
                <span key={offer} className={cn('px-2 py-0.5 rounded-full text-xs border', OFFER_COLOR)}>
                  {offer}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Availability */}
      {profile.is_available && (
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-green-400 font-medium">Disponible para colaborar</span>
        </div>
      )}
    </div>
  );
}
