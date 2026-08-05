'use client';

import { usePathname, useRouter } from 'next/navigation';

const tabs = [
  { path: '/today', label: '今日', icon: '🏠' },
  { path: '/focus', label: '专注', icon: '🎯' },
  { path: '/tasks', label: '任务', icon: '✅' },
  { path: '/goals', label: '目标', icon: '🎯' },
  { path: '/notes', label: '笔记', icon: '📝' },
  { path: '/photos', label: '照片', icon: '📷' },
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
    <nav style={{
      position: 'fixed', top: 0, left: 0, bottom: 0,
      width: 200, backgroundColor: '#FFF',
      borderRight: '1px solid #F0EFED',
      padding: '20px 0', zIndex: 50,
      overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{ padding: '0 20px 20px', borderBottom: '1px solid #F0EFED', marginBottom: 8 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#7C3AED', margin: 0 }}>
          🌀 心流OS
        </h1>
        <p style={{ fontSize: 11, color: '#A8A29E', margin: '4px 0 0' }}>个人生活中枢</p>
      </div>

      {tabs.map((tab) => {
        const active = isActive(tab.path);
        return (
          <button
            key={tab.path}
            onClick={() => router.push(tab.path)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: '10px 20px',
              border: 'none', cursor: 'pointer',
              backgroundColor: active ? '#EDE9FE' : 'transparent',
              color: active ? '#5B21B6' : '#44403C',
              fontWeight: active ? 600 : 400,
              fontSize: 14, textAlign: 'left',
              transition: 'all 150ms ease',
              borderRadius: 0,
              borderRight: active ? '3px solid #7C3AED' : '3px solid transparent',
            }}
            onMouseEnter={(e) => {
              if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = '#FAFAF9';
            }}
            onMouseLeave={(e) => {
              if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
            }}
          >
            <span style={{ fontSize: 20, width: 24, textAlign: 'center' }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}