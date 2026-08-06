'use client';

import { TabBar } from '@/components/TabBar';
import { MiniPlayer } from '@/components/MiniPlayer';
import { useAutoSync } from '@/hooks/useAutoSync';

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  useAutoSync();

  return (
    <>
      <TabBar />
      <main style={{
        marginLeft: 200,
        minHeight: '100vh',
        background: 'var(--color-bg)',
      }}>
        {children}
      </main>
      <MiniPlayer />
    </>
  );
}
