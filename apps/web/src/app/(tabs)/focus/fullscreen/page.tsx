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
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: isBreak ? '#064E3B' : '#1E1B4B',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#FFFFFF',
        zIndex: 100,
      }}
    >
      {/* 返回按钮 */}
      <button
        onClick={() => router.back()}
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          background: 'rgba(255,255,255,0.1)',
          border: 'none',
          color: '#FFFFFF',
          padding: '8px 16px',
          borderRadius: 20,
          cursor: 'pointer',
          fontSize: 14,
        }}
      >
        ← 退出全屏
      </button>

      {/* 提示 */}
      <p style={{ fontSize: 16, opacity: 0.7, marginBottom: 8 }}>
        {isBreak ? '休息一下' : '专注中'} · 番茄 #{pomodoroCount + 1}
      </p>

      {currentTaskTitle && (
        <p style={{ fontSize: 14, opacity: 0.6, marginBottom: 32 }}>📌 {currentTaskTitle}</p>
      )}

      {/* 大环形进度 */}
      <div style={{ position: 'relative', width: 280, height: 280, marginBottom: 32 }}>
        <svg width={280} height={280} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={140} cy={140} r={128}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={6}
          />
          <circle
            cx={140} cy={140} r={128}
            fill="none"
            stroke={isBreak ? '#34D399' : '#A78BFA'}
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray={128 * 2 * Math.PI}
            strokeDashoffset={128 * 2 * Math.PI - ((Math.min(progress, 100) / 100) * 128 * 2 * Math.PI)}
            style={{ transition: 'stroke-dashoffset 0.3s ease' }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: 72, fontWeight: 700, fontFamily: 'monospace', letterSpacing: 4 }}>
            {formatTimer(timeRemaining)}
          </span>
        </div>
      </div>

      {/* 控制 */}
      <div style={{ display: 'flex', gap: 16 }}>
        {timerState === 'idle' && (
          <Btn color="#7C3AED" onClick={startTimer}>
            开始{isBreak ? '休息' : '专注'}
          </Btn>
        )}
        {timerState === 'running' && (
          <>
            <Btn color="#F59E0B" onClick={pauseTimer}>
              暂停
            </Btn>
            <Btn color="rgba(255,255,255,0.15)" onClick={resetTimer}>
              放弃
            </Btn>
          </>
        )}
        {timerState === 'paused' && (
          <>
            <Btn color="#7C3AED" onClick={resumeTimer}>
              继续
            </Btn>
            <Btn color="#EF4444" onClick={resetTimer}>
              放弃
            </Btn>
          </>
        )}
        {timerState === 'finished' && !isBreak && (
          <>
            <Btn color="#10B981" onClick={startBreakSession}>
              休息 ☕
            </Btn>
            <Btn color="#7C3AED" onClick={startTimer}>
              继续
            </Btn>
          </>
        )}
        {timerState === 'finished' && isBreak && (
          <Btn color="#7C3AED" onClick={startTimer}>
            新番茄
          </Btn>
        )}
      </div>
    </div>
  );
}

function Btn({
  children,
  color,
  onClick,
}: {
  children: React.ReactNode;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '14px 36px',
        fontSize: 17,
        fontWeight: 600,
        color: '#FFF',
        backgroundColor: color,
        border: 'none',
        borderRadius: 16,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}
