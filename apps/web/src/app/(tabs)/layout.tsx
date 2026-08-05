'use client';

import { TabBar } from '@/components/TabBar';
import { MiniPlayer } from '@/components/MiniPlayer';

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main style={{ paddingBottom: 80, minHeight: '100vh' }}>{children}</main>
      <MiniPlayer />
      <TabBar />
    </>
  );
}
