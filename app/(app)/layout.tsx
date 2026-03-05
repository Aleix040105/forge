import { BottomNav } from '@/components/layout/BottomNav';
import { TopBar } from '@/components/layout/TopBar';
import { ComposerButton } from '@/components/composer/ComposerButton';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="app-content max-w-lg mx-auto">
        {children}
      </main>
      <ComposerButton />
      <BottomNav />
    </div>
  );
}
