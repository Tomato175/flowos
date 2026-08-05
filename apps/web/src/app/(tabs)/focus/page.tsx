'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useFocusStore } from '@/stores/useFocusStore';
import { useTaskStore } from '@/stores/useTaskStore';
import { useAudioStore } from '@/stores/useAudioStore';
import { useTimer } from '@/hooks/useTimer';

/* ---- 氛围音 ---- */
const SOUNDS = [
  { id: 'rain', label: '雨声', emoji: '🌧️' },
  { id: 'ocean', label: '海浪', emoji: '🌊' },
  { id: 'forest', label: '林间', emoji: '🌲' },
  { id: 'cafe', label: '咖啡馆', emoji: '☕' },
  { id: 'fire', label: '篝火', emoji: '🔥' },
];

/* ---- 音效 Web Audio ---- */
function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch { /* 静默失败 */ }
}

function notify(title: string, body: string) {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '🌀' });
  }
}

function requestNotification() {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

/* ---- 主组件 ---- */
export default function FocusPage() {
  useTimer();
  const router = useRouter();
  const prevStateRef = useRef<string>('idle');

  const {
    timerState, timeRemaining, sessionType, pomodoroCount,
    currentTaskId, currentTaskTitle,
    startTimer, pauseTimer, resumeTimer, resetTimer,
    setCurrentTask, startBreakSession,
    getTodayStats, workDuration, breakDuration,
  } = useFocusStore();

  const { activeSound, setActiveSound, volume, setVolume, isPlaying } = useAudioStore();

  const { tasks } = useTaskStore();
  const stats = getTodayStats();

  // 请求通知权限
  useEffect(() => { requestNotification(); }, []);

  // 计时结束时触发通知和音效
  useEffect(() => {
    if (prevStateRef.current === 'running' && timerState === 'finished') {
      playBeep();
      if (sessionType === 'pomodoro') {
        notify('🍅 番茄完成！', '太棒了，休息一下吧。');
      } else {
        notify('☕ 休息结束', '准备好开始新番茄了吗？');
      }
    }
    prevStateRef.current = timerState;
  }, [timerState, sessionType]);

  const progress = ((sessionType === 'break' ? breakDuration * 60 : workDuration * 60) - timeRemaining)
    / ((sessionType === 'break' ? breakDuration : workDuration) * 60);

  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60), sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const isBreak = sessionType === 'break';
  const accentColor = isBreak ? '#10B981' : '#7C3AED';

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 20px', textAlign: 'center' }}>
      {/* 头部 */}
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px', color: '#1C1917' }}>
        {isBreak ? '☕ 休息时间' : '🎯 专注模式'}
      </h1>
      <p style={{ fontSize: 13, color: '#78716C', margin: '0 0 28px' }}>
        {isBreak ? '放松一下，马上回来' : '选择一个任务，开始专注'}
      </p>

      {/* 环形进度 */}
      <div style={{ position: 'relative', width: 260, height: 260, margin: '0 auto 28px' }}>
        <Ring progress={Math.min(progress, 1)} size={260} stroke={8} color={accentColor} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 52, fontWeight: 700, fontFamily: 'monospace', color: '#1C1917', letterSpacing: 2 }}>
            {formatTimer(timeRemaining)}
          </span>
          <span style={{ fontSize: 13, color: '#78716C', marginTop: 6 }}>
            {isBreak ? '休息' : '专注'} · 番茄 #{pomodoroCount + 1}
          </span>
          {currentTaskTitle && (
            <span style={{ fontSize: 12, color: accentColor, marginTop: 4, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              📌 {currentTaskTitle}
            </span>
          )}
        </div>
      </div>

      {/* 控制按钮 */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        {timerState === 'idle' && <Btn color={accentColor} onClick={startTimer}>开始{isBreak ? '休息' : '专注'}</Btn>}
        {timerState === 'running' && (
          <>
            <Btn color="#F59E0B" onClick={pauseTimer}>暂停</Btn>
            <Btn color="#EF4444" outline onClick={resetTimer}>放弃</Btn>
          </>
        )}
        {timerState === 'paused' && (
          <>
            <Btn color={accentColor} onClick={resumeTimer}>继续</Btn>
            <Btn color="#EF4444" outline onClick={resetTimer}>放弃</Btn>
          </>
        )}
        {timerState === 'finished' && !isBreak && (
          <>
            <Btn color="#10B981" onClick={startBreakSession}>开始休息 ☕</Btn>
            <Btn color={accentColor} outline onClick={startTimer}>跳过休息</Btn>
          </>
        )}
        {timerState === 'finished' && isBreak && (
          <Btn color={accentColor} onClick={startTimer}>开始新番茄</Btn>
        )}
      </div>

      {/* 卡片区 */}
      <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* 关联任务 */}
        <Card>
          <CardTitle>📌 关联任务</CardTitle>
          {currentTaskId ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, backgroundColor: '#EDE9FE' }}>
              <span style={{ fontSize: 14, color: '#5B21B6' }}>{currentTaskTitle}</span>
              <button onClick={() => setCurrentTask(null, null)} style={{ border: 'none', backgroundColor: 'transparent', color: '#7C3AED', cursor: 'pointer', fontSize: 13 }}>
                取消
              </button>
            </div>
          ) : (
            <select
              onChange={(e) => { const t = tasks.find((x) => x.id === e.target.value); if (t) setCurrentTask(t.id, t.title); }}
              value=""
              style={selectStyle}
            >
              <option value="">选择任务（可选）</option>
              {tasks.filter((t) => t.status !== 'done' && t.status !== 'archived').map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          )}
        </Card>

        {/* 氛围音 */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <CardTitle>🎶 氛围音</CardTitle>
            {activeSound && (
              <span style={{ fontSize: 11, color: isPlaying ? '#10B981' : '#A8A29E', backgroundColor: isPlaying ? '#D1FAE5' : '#F5F5F4', padding: '2px 8px', borderRadius: 8 }}>
                {SOUNDS.find(s => s.id === activeSound)?.emoji} {SOUNDS.find(s => s.id === activeSound)?.label} {isPlaying ? '▶ 播放中' : '⏸ 已暂停'}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {SOUNDS.map((s) => {
              const isActive = activeSound === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSound(isActive ? null : s.id)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    padding: '14px 16px', borderRadius: 14, cursor: 'pointer', transition: 'all 200ms ease',
                    border: `2px solid ${isActive ? '#7C3AED' : 'transparent'}`,
                    backgroundColor: isActive ? '#EDE9FE' : '#FAFAF9',
                    boxShadow: isActive ? '0 0 12px rgba(124,58,237,0.25)' : '0 1px 3px rgba(0,0,0,0.06)',
                    transform: isActive ? 'scale(1.05)' : 'scale(1)',
                    minWidth: 80,
                  }}
                >
                  <span style={{ fontSize: 28, filter: isActive ? 'none' : 'grayscale(0.3)', transition: 'filter 200ms' }}>
                    {s.emoji}
                  </span>
                  <span style={{ fontSize: 11, color: isActive ? '#5B21B6' : '#78716C', fontWeight: isActive ? 600 : 400 }}>
                    {s.label}
                  </span>
                  {isActive && (
                    <span style={{ fontSize: 9, color: '#7C3AED', opacity: 0.8 }}>● 播放</span>
                  )}
                </button>
              );
            })}
          </div>
          {activeSound && (
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#78716C' }}>🔊</span>
              <input
                type="range" min={0} max={1} step={0.05} value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                style={{ flex: 1, accentColor: '#7C3AED', height: 4 }}
              />
              <span style={{ fontSize: 11, color: '#A8A29E', minWidth: 32, textAlign: 'right' }}>
                {Math.round(volume * 100)}%
              </span>
            </div>
          )}
        </Card>

        {/* 今日统计 */}
        <Card>
          <CardTitle>📊 今日统计</CardTitle>
          <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
            <div><p style={statValStyle}>{stats.sessions}</p><p style={statLblStyle}>专注次数</p></div>
            <div><p style={statValStyle}>{stats.minutes}分</p><p style={statLblStyle}>专注时长</p></div>
            <div><p style={statValStyle}>{stats.pomodoros} 🍅</p><p style={statLblStyle}>番茄数</p></div>
          </div>
        </Card>
      </div>

      {/* 全屏 */}
      <button onClick={() => router.push('/focus/fullscreen')} style={fullscreenBtnStyle}>
        ⛶ 全屏专注模式
      </button>
    </div>
  );
}

/* ===== 内联组件 ===== */

function Ring({ progress, size, stroke, color }: { progress: number; size: number; stroke: number; color: string }) {
  const r = (size - stroke) / 2;
  const circ = r * 2 * Math.PI;
  const offset = circ * (1 - progress);
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E7E5E4" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease', filter: `drop-shadow(0 0 6px ${color}60)` }}
      />
    </svg>
  );
}

function Btn({ children, color, outline, onClick }: { children: React.ReactNode; color: string; outline?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      style={{
        padding: '12px 32px', fontSize: 16, fontWeight: 600, borderRadius: 14, border: outline ? `2px solid ${color}` : 'none',
        backgroundColor: outline ? 'transparent' : color, color: outline ? color : '#FFF',
        cursor: 'pointer', transition: 'all 150ms ease',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
    >
      {children}
    </button>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div style={{ backgroundColor: '#FFF', borderRadius: 14, padding: 14, border: '1.5px solid #E7E5E4' }}>{children}</div>;
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 13, fontWeight: 600, color: '#78716C', margin: '0 0 10px' }}>{children}</p>;
}

const selectStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', fontSize: 14, borderRadius: 8,
  border: '1.5px solid #E7E5E4', color: '#292524', backgroundColor: '#FFF',
};

const statValStyle: React.CSSProperties = { fontSize: 18, fontWeight: 700, color: '#1C1917', margin: '0 0 2px' };
const statLblStyle: React.CSSProperties = { fontSize: 11, color: '#A8A29E', margin: 0 };

const fullscreenBtnStyle: React.CSSProperties = {
  marginTop: 20, padding: '10px 24px', fontSize: 13, color: '#7C3AED',
  backgroundColor: '#EDE9FE', border: 'none', borderRadius: 20, cursor: 'pointer',
  transition: 'all 150ms ease',
};
