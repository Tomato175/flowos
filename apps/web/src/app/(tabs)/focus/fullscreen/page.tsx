'use client';

import { useRouter } from 'next/navigation';
import { useFocusStore } from '@/stores/useFocusStore';
import { useTimer } from '@/hooks/useTimer';

export default function FullscreenFocusPage() {
  useTimer();
  const router = useRouter();

  const {
    timerState,
    timeRemaining,
    sessionType,
    pomodoroCount,
    currentTaskTitle,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    startBreakSession,
  } = useFocusStore();

  const isBreak = sessionType === 'break';
  const progress = ((25 * 60 - timeRemaining) / (25 * 60)) * 100;

  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: isBreak
        ? 'radial-gradient(ellipse 60% 50% at 50% 50%, oklch(22% 0.04 150) 0%, oklch(12% 0.02 150) 100%)'
        : 'radial-gradient(ellipse 60% 50% at 50% 50%, oklch(22% 0.02 30) 0%, oklch(10% 0.01 30) 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'oklch(92% 0.005 60)',
      zIndex: 100,
    }}>
      {/* 返回 */}
      <button
        onClick={() => router.back()}
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          background: 'oklch(100% 0 0 / 0.08)',
          border: 'none',
          color: 'oklch(88% 0.005 60)',
          padding: '8px 16px',
          borderRadius: 'var(--radius-full)',
          cursor: 'pointer',
          fontSize: 'var(--text-sm)',
          transition: 'background var(--transition-fast)',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'oklch(100% 0 0 / 0.15)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'oklch(100% 0 0 / 0.08)'; }}
      >
        ← 退出全屏
      </button>

      {/* 提示 */}
      <p className="body-small" style={{ opacity: 0.5, marginBottom: 'var(--space-2)' }}>
        {isBreak ? '休息一下' : '专注中'} · 番茄 #{pomodoroCount + 1}
      </p>

      {currentTaskTitle && (
        <p className="body-small" style={{ opacity: 0.4, marginBottom: 'var(--space-8)' }}>
          {currentTaskTitle}
        </p>
      )}

      {/* 大环形进度 */}
      <div style={{ position: 'relative', width: 280, height: 280, marginBottom: 'var(--space-8)' }}>
        <svg width={280} height={280} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={140} cy={140} r={128}
            fill="none"
            stroke="oklch(100% 0 0 / 0.06)"
            strokeWidth={4}
          />
          <circle
            cx={140} cy={140} r={128}
            fill="none"
            stroke={isBreak ? 'var(--color-success)' : 'var(--color-primary)'}
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={128 * 2 * Math.PI}
            strokeDashoffset={128 * 2 * Math.PI - ((Math.min(progress, 100) / 100) * 128 * 2 * Math.PI)}
            style={{ transition: 'stroke-dashoffset 0.3s var(--ease-out-quart)' }}
          />
        </svg>
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-5xl)',
            fontWeight: 'var(--weight-light)',
            letterSpacing: 'var(--tracking-wider)',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {formatTimer(timeRemaining)}
          </span>
        </div>
      </div>

      {/* 控制 */}
      <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
        {timerState === 'idle' && (
          <Btn variant="primary" onClick={startTimer}>
            开始{isBreak ? '休息' : '专注'}
          </Btn>
        )}
        {timerState === 'running' && (
          <>
            <Btn variant="secondary" onClick={pauseTimer}>暂停</Btn>
            <Btn variant="ghost" onClick={resetTimer}>放弃</Btn>
          </>
        )}
        {timerState === 'paused' && (
          <>
            <Btn variant="primary" onClick={resumeTimer}>继续</Btn>
            <Btn variant="danger" onClick={resetTimer}>放弃</Btn>
          </>
        )}
        {timerState === 'finished' && !isBreak && (
          <>
            <Btn variant="success" onClick={startBreakSession}>休息 ☕</Btn>
            <Btn variant="primary" onClick={startTimer}>继续</Btn>
          </>
        )}
        {timerState === 'finished' && isBreak && (
          <Btn variant="primary" onClick={startTimer}>新番茄</Btn>
        )}
      </div>
    </div>
  );
}

function Btn({
  children,
  variant,
  onClick,
}: {
  children: React.ReactNode;
  variant: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  onClick: () => void;
}) {
  const bgMap: Record<string, string> = {
    primary: 'var(--color-primary)',
    secondary: 'oklch(100% 0 0 / 0.12)',
    ghost: 'oklch(100% 0 0 / 0.06)',
    danger: 'var(--color-error)',
    success: 'var(--color-success)',
  };

  return (
    <button
      onClick={onClick}
      style={{
        padding: 'var(--space-3) var(--space-8)',
        fontSize: 'var(--text-base)',
        fontWeight: 'var(--weight-medium)',
        color: '#fff',
        backgroundColor: bgMap[variant],
        border: 'none',
        borderRadius: 'var(--radius-full)',
        cursor: 'pointer',
        transition: 'opacity var(--transition-fast)',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.85'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
    >
      {children}
    </button>
  );
}
