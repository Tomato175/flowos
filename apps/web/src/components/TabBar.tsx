'use client';

import { usePathname, useRouter } from 'next/navigation';

const tabs = [
  { path: '/today', label: '今日', icon: '🏠', index: 0 },
  { path: '/focus', label: '专注', icon: '🎯', index: 1 },
  { path: '/tasks', label: '任务', icon: '✅', index: 2 },
  { path: '/goals', label: '目标', icon: '🎯', index: 3 },
  { path: '/notes', label: '笔记', icon: '📝', index: 4 },
  { path: '/photos', label: '照片', icon: '📷', index: 5 },
  { path: '/calendar', label: '日历', icon: '📅', index: 6 },
  { path: '/profile', label: '我的', icon: '👤', index: 7 },
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
      width: 200,
      background: 'var(--color-surface)',
      borderRight: '1px solid var(--color-border-light)',
      padding: 'var(--space-8) 0',
      zIndex: 50,
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Logo — 杂志式卷首 */}
      <div style={{
        padding: '0 var(--space-5) var(--space-6)',
        borderBottom: '1px solid var(--color-divider)',
        marginBottom: 'var(--space-6)',
      }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-xl)',
          fontWeight: 'var(--weight-bold)',
          color: 'var(--color-text)',
          margin: 0,
          letterSpacing: 'var(--tracking-tight)',
        }}>
          心流
        </h1>
        <p style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-muted)',
          margin: 'var(--space-1) 0 0',
          letterSpacing: 'var(--tracking-wide)',
          textTransform: 'uppercase',
        }}>
          Flow Journal
        </p>
      </div>

      {/* Navigation — 像杂志目录 */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-1)',
        padding: '0 var(--space-3)',
      }}>
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          return (
            <button
              key={tab.path}
              onClick={() => router.push(tab.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                width: '100%',
                padding: 'var(--space-2) var(--space-3)',
                border: 'none',
                cursor: 'pointer',
                background: active ? 'var(--color-primary-subtle)' : 'transparent',
                color: active ? 'var(--color-primary-dark)' : 'var(--color-text-secondary)',
                fontWeight: active ? 'var(--weight-medium)' : 'var(--weight-normal)',
                fontSize: 'var(--text-sm)',
                textAlign: 'left' as const,
                transition: 'background var(--transition-fast), color var(--transition-fast)',
                borderRadius: 'var(--radius-sm)',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = 'var(--color-surface-hover)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--color-text)';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = 'var(--color-text-secondary)';
                }
              }}
            >
              <span style={{
                fontSize: '1.1em',
                width: 24,
                textAlign: 'center' as const,
                lineHeight: 1,
                opacity: active ? 1 : 0.7,
                transition: 'opacity var(--transition-fast)',
              }}>
                {tab.icon}
              </span>
              <span style={{ lineHeight: 1 }}>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 底部签名 — 杂志式尾注 */}
      <div style={{
        padding: 'var(--space-6) var(--space-5) var(--space-4)',
        borderTop: '1px solid var(--color-divider)',
        marginTop: 'auto',
      }}>
        <p style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-muted)',
          lineHeight: 1.6,
          margin: 0,
        }}>
          保持专注
          <br />
          活在当下
        </p>
      </div>
    </nav>
  );
}
