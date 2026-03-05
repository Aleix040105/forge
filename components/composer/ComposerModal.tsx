'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Ship, MessageSquare, HelpCircle, Zap } from 'lucide-react';
import { UpdateForm } from './UpdateForm';
import { ShipLogForm } from './ShipLogForm';
import { AskForm } from './AskForm';
import { cn } from '@/lib/utils';

type PostType = 'update' | 'ship_log' | 'ask';

interface ComposerModalProps {
  open: boolean;
  onClose: () => void;
  parentId?: string;
  defaultType?: PostType;
}

const TYPE_OPTIONS = [
  {
    type: 'update' as PostType,
    label: 'Update',
    icon: MessageSquare,
    desc: 'Pensamiento, progreso o reflexión',
    color: 'text-muted-foreground',
    bg: 'bg-muted/50',
  },
  {
    type: 'ship_log' as PostType,
    label: 'Ship Log',
    icon: Ship,
    desc: 'Algo que construiste o lanzaste',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
  },
  {
    type: 'ask' as PostType,
    label: 'Ask',
    icon: HelpCircle,
    desc: 'Pide feedback, intro o consejo',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
];

export function ComposerModal({ open, onClose, parentId, defaultType }: ComposerModalProps) {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<PostType>(defaultType ?? 'update');
  const [step, setStep] = useState<'select' | 'compose'>(defaultType ? 'compose' : 'select');

  function handleTypeSelect(type: PostType) {
    setSelectedType(type);
    setStep('compose');
  }

  function handleClose() {
    setStep(defaultType ? 'compose' : 'select');
    setSelectedType(defaultType ?? 'update');
    onClose();
  }

  function handleSuccess() {
    handleClose();
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && handleClose()}>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-2xl pb-8">
        {/* Type selector */}
        {step === 'select' && (
          <>
            <SheetHeader className="pb-4">
              <SheetTitle>¿Qué quieres publicar?</SheetTitle>
            </SheetHeader>
            <div className="px-6 space-y-2 mt-2">
              {TYPE_OPTIONS.map(({ type, label, icon: Icon, desc, color, bg }) => (
                <button
                  key={type}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-foreground/20 transition-colors text-left"
                  onClick={() => handleTypeSelect(type)}
                >
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', bg)}>
                    <Icon className={cn('w-5 h-5', color)} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </button>
              ))}

              <div className="flex items-center gap-4 p-4 rounded-xl border border-dashed border-border opacity-50 cursor-not-allowed">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-green-500/10">
                  <Zap className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Bounty</p>
                  <p className="text-xs text-muted-foreground">Próximamente · Tarea pagada con escrow</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Compose forms */}
        {step === 'compose' && selectedType === 'update' && (
          <UpdateForm
            parentId={parentId}
            onSuccess={handleSuccess}
            onBack={parentId ? undefined : () => setStep('select')}
          />
        )}

        {step === 'compose' && selectedType === 'ship_log' && (
          <ShipLogForm
            onSuccess={handleSuccess}
            onBack={() => setStep('select')}
          />
        )}

        {step === 'compose' && selectedType === 'ask' && (
          <AskForm onSuccess={handleSuccess} onBack={() => setStep('select')} />
        )}
      </SheetContent>
    </Sheet>
  );
}
