'use client';

import { TabBar } from '@/components/TabBar';
import { MiniPlayer } from '@/components/MiniPlayer';

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TabBar />
      <main style={{ marginLeft: 200, minHeight: '100vh' }}>{children}</main>
      <MiniPlayer />
    </>
  );
}
