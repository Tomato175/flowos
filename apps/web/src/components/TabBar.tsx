'use client';

import { usePathname, useRouter } from 'next/navigation';

const tabs = [
  { path: '/today', label: '今日', icon: '🏠' },
  { path: '/focus', label: '专注', icon: '🎯' },
  { path: '/tasks', label: '任务', icon: '✅' },
  { path: '/calendar', label: '日历', icon: '📅' },
  { path: '/profile', label: '我的', icon: '👤' },
];

export function TabBar() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (path: string) => {
    if (path === '/today') return pathname === '/today';
    return pathname.startsWith(path);
  };

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 64,
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid #E7E5E4',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingBottom: 'env(safe-area-inset-bottom, 8px)',
        zIndex: 50,
      }}
    >
      {tabs.map((tab) => {
        const active = isActive(tab.path);
        return (
          <button
            key={tab.path}
            onClick={() => router.push(tab.path)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 12px',
              color: active ? '#7C3AED' : '#A8A29E',
              transition: 'color 150ms ease',
              minWidth: 56,
            }}
          >
            <span style={{ fontSize: 22, lineHeight: 1 }}>{tab.icon}</span>
            <span
              style={{
                fontSize: 11,
                fontWeight: active ? 600 : 400,
                lineHeight: 1,
              }}
            >
              {tab.label}
            </span>
            {active && (
              <span
                style={{
                  position: 'absolute',
                  top: -1,
                  width: 24,
                  height: 3,
                  backgroundColor: '#7C3AED',
                  borderRadius: '0 0 3px 3px',
                }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
