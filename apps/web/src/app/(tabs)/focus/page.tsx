'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useFocusStore } from '@/stores/useFocusStore';
import { useTaskStore } from '@/stores/useTaskStore';
import { useAudioStore, AMBIENT_SOUNDS } from '@/stores/useAudioStore';
import { onTrackEnd } from '@/lib/audio-engine';
import { useTimer } from '@/hooks/useTimer';

/* ---- 音效 ---- */
function playBeep() {
  try {
    const ctx = new (window as any).AudioContext || new (window as any).webkitAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 660;
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.8);
  } catch { /* 静默 */ }
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

/* ═══════════════════ 主组件 ═══════════════════ */
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

  const { activeSound, setActiveSound, volume, setVolume, isPlaying, customTracks } = useAudioStore();
  const { tasks } = useTaskStore();
  const stats = getTodayStats();

  type UnifiedSound = { id: string; label: string; emoji: string; kind: 'builtin' | 'custom' };
  const allSounds: UnifiedSound[] = [
    ...AMBIENT_SOUNDS.map((s) => ({ ...s, kind: 'builtin' as const })),
    ...customTracks.map((t) => ({ id: t.id, label: t.name, emoji: '🎵', kind: 'custom' as const })),
  ];
  const currentSound = allSounds.find((s) => s.id === activeSound);
  const currentIdx = activeSound ? allSounds.findIndex((s) => s.id === activeSound) : -1;

  const playPrev = () => {
    if (allSounds.length === 0) return;
    const idx = currentIdx <= 0 ? allSounds.length - 1 : currentIdx - 1;
    setActiveSound(allSounds[idx]!.id);
  };
  const playNext = () => {
    if (allSounds.length === 0) return;
    const idx = currentIdx >= allSounds.length - 1 ? 0 : currentIdx + 1;
    setActiveSound(allSounds[idx]!.id);
  };

  useEffect(() => {
    onTrackEnd(() => { playNext(); });
    return () => { onTrackEnd(null); };
  }, [currentIdx]);

  useEffect(() => { requestNotification(); }, []);

  useEffect(() => {
    if (prevStateRef.current === 'running' && timerState === 'finished') {
      playBeep();
      if (sessionType === 'pomodoro') notify('番茄完成', '太棒了，休息一下吧。');
      else notify('休息结束', '准备好开始新番茄了吗？');
    }
    prevStateRef.current = timerState;
  }, [timerState, sessionType]);

  const totalSeconds = (sessionType === 'break' ? breakDuration : workDuration) * 60;
  const progress = (totalSeconds - timeRemaining) / totalSeconds;

  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60), sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const isBreak = sessionType === 'break';
  const bgColor = isBreak
    ? 'oklch(18% 0.03 150)'
    : 'oklch(16% 0.015 30)';

  return (
    <div style={{
      minHeight: '100vh',
      background: `radial-gradient(ellipse 80% 60% at 50% 40%, ${isBreak ? 'oklch(22% 0.04 150)' : 'oklch(22% 0.02 30)'} 0%, ${isBreak ? 'oklch(12% 0.02 150)' : 'oklch(10% 0.01 30)'} 100%)`,
      color: 'oklch(92% 0.005 60)',
      padding: 'var(--space-8) var(--space-5) var(--space-12)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* 氛围光晕 — 柔和、有机 */}
      <div style={{
        position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)',
        width: '80%', height: '50%',
        background: isBreak
          ? 'radial-gradient(ellipse, oklch(50% 0.15 150 / 0.15) 0%, transparent 70%)'
          : 'radial-gradient(ellipse, oklch(55% 0.12 30 / 0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: 420, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* ── 顶栏：极简 ── */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-8)',
        }}>
          <button onClick={() => router.back()} style={{
            background: 'oklch(100% 0 0 / 0.08)',
            border: 'none',
            color: 'oklch(88% 0.005 60)',
            width: 36,
            height: 36,
            borderRadius: 'var(--radius-full)',
            fontSize: 'var(--text-base)',
            cursor: 'pointer',
            transition: 'background var(--transition-fast)',
          }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'oklch(100% 0 0 / 0.15)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'oklch(100% 0 0 / 0.08)'; }}
          >←</button>

          <p className="caption" style={{ color: 'oklch(80% 0.005 60 / 0.5)', letterSpacing: '0.1em' }}>
            {isBreak ? '休息' : '专注'}
          </p>

          <button onClick={() => router.push('/focus/fullscreen')} style={{
            background: 'oklch(100% 0 0 / 0.08)',
            border: 'none',
            color: 'oklch(88% 0.005 60)',
            width: 36,
            height: 36,
            borderRadius: 'var(--radius-full)',
            fontSize: 'var(--text-sm)',
            cursor: 'pointer',
            transition: 'background var(--transition-fast)',
          }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'oklch(100% 0 0 / 0.15)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'oklch(100% 0 0 / 0.08)'; }}
          >⛶</button>
        </div>

        {/* ── 黑胶唱片 — 保持特色 ── */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-10)' }}>
          <VinylDisc
            isBreak={isBreak}
            soundEmoji={currentSound?.emoji ?? '🎵'}
            isPlaying={!!(activeSound && isPlaying)}
          />
        </div>

        {/* ── 曲目信息 ── */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <p style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-xl)',
            fontWeight: 'var(--weight-semibold)',
            color: 'oklch(92% 0.005 60)',
            margin: '0 0 var(--space-1)',
          }}>
            {currentSound?.label ?? '选择氛围音'}
          </p>
          {currentSound && (
            <p className="caption" style={{ color: 'oklch(80% 0.005 60 / 0.4)' }}>
              {currentSound.kind === 'custom' ? '我的音乐' : '氛围音轨'}
            </p>
          )}
        </div>

        {/* ── 计时器进度 ── */}
        <div style={{ marginBottom: 'var(--space-2)' }}>
          <div style={{
            height: 2,
            background: 'oklch(100% 0 0 / 0.06)',
            borderRadius: 1,
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${Math.min(progress * 100, 100)}%`,
              background: isBreak
                ? 'linear-gradient(90deg, oklch(62% 0.10 150), oklch(68% 0.08 150))'
                : 'linear-gradient(90deg, oklch(62% 0.12 30), oklch(68% 0.10 30))',
              borderRadius: 1,
              transition: 'width 0.5s var(--ease-out-quart)',
            }} />
          </div>
        </div>

        {/* ── 大字计时 ── */}
        <div style={{ textAlign: 'center', margin: 'var(--space-8) 0 var(--space-10)' }}>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-5xl)',
            fontWeight: 'var(--weight-light)',
            letterSpacing: 'var(--tracking-wider)',
            color: 'oklch(95% 0.005 60)',
            margin: 0,
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {formatTimer(timeRemaining)}
          </p>
        </div>

        {/* ── 控制区 ── */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 'var(--space-8)',
          marginBottom: 'var(--space-10)',
        }}>
          <button onClick={playPrev} style={ctrlBtnStyle}>⏮</button>

          {/* 主按钮 */}
          {timerState === 'idle' && (
            <button onClick={startTimer} style={mainBtnStyle(isBreak)}>▶</button>
          )}
          {timerState === 'running' && (
            <button onClick={pauseTimer} style={{
              ...mainBtnStyle(isBreak),
              background: 'oklch(95% 0.002 60)',
              color: bgColor,
            }}>⏸</button>
          )}
          {timerState === 'paused' && (
            <button onClick={resumeTimer} style={mainBtnStyle(isBreak)}>▶</button>
          )}
          {timerState === 'finished' && !isBreak && (
            <button onClick={startBreakSession} style={{
              ...mainBtnStyle(isBreak),
              background: 'oklch(55% 0.10 150)',
            }}>☕</button>
          )}
          {timerState === 'finished' && isBreak && (
            <button onClick={startTimer} style={mainBtnStyle(isBreak)}>▶</button>
          )}

          <button onClick={playNext} style={ctrlBtnStyle}>⏭</button>
        </div>

        {/* ── 任务关联 + 音量 ── */}
        <div style={{
          background: 'oklch(100% 0 0 / 0.05)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
          border: '1px solid oklch(100% 0 0 / 0.06)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            marginBottom: allSounds.length > 0 ? 'var(--space-3)' : 0,
          }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'oklch(80% 0.005 60 / 0.5)' }}>任务</span>
            <span className="body-small" style={{
              flex: 1,
              color: currentTaskTitle ? 'oklch(90% 0.005 60)' : 'oklch(80% 0.005 60 / 0.3)',
            }}>
              {currentTaskTitle || '未关联任务'}
            </span>
            {!currentTaskId && (
              <select
                onChange={(e) => {
                  const t = tasks.find((x) => x.id === e.target.value);
                  if (t) setCurrentTask(t.id, t.title);
                }}
                value=""
                style={{
                  background: 'oklch(100% 0 0 / 0.08)',
                  border: '1px solid oklch(100% 0 0 / 0.1)',
                  color: 'oklch(88% 0.005 60)',
                  fontSize: 'var(--text-xs)',
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-sm)',
                }}>
                <option value="" style={{ background: '#1a1a1a' }}>选择任务</option>
                {tasks.filter((t) => t.status !== 'done' && t.status !== 'archived').map((t) => (
                  <option key={t.id} value={t.id} style={{ background: '#1a1a1a' }}>{t.title}</option>
                ))}
              </select>
            )}
          </div>

          {allSounds.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'oklch(80% 0.005 60 / 0.4)', minWidth: 16 }}>🔊</span>
              <input type="range" min={0} max={1} step={0.05} value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                style={{
                  flex: 1,
                  accentColor: isBreak ? 'oklch(55% 0.10 150)' : 'oklch(55% 0.12 30)',
                  height: 4,
                }} />
              <span className="caption" style={{ color: 'oklch(80% 0.005 60 / 0.3)', minWidth: 28, textAlign: 'right' }}>
                {Math.round(volume * 100)}%
              </span>
            </div>
          )}
        </div>

        {/* ── 音轨列表 ── */}
        <div style={{
          background: 'oklch(100% 0 0 / 0.04)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-4)',
          border: '1px solid oklch(100% 0 0 / 0.05)',
        }}>
          <p className="caption" style={{ color: 'oklch(80% 0.005 60 / 0.3)', marginBottom: 'var(--space-3)' }}>
            音轨库 ({allSounds.length})
          </p>
          <div style={{
            display: 'flex',
            gap: 'var(--space-2)',
            overflowX: 'auto',
            paddingBottom: 'var(--space-1)',
            scrollbarWidth: 'none',
          }}>
            {allSounds.slice(0, 15).map((s) => {
              const active = activeSound === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSound(active ? null : s.id)}
                  style={{
                    flexShrink: 0,
                    padding: 'var(--space-2) var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    border: active
                      ? `1px solid ${isBreak ? 'oklch(55% 0.10 150 / 0.5)' : 'oklch(55% 0.12 30 / 0.5)'}`
                      : '1px solid oklch(100% 0 0 / 0.06)',
                    background: active
                      ? (isBreak ? 'oklch(55% 0.10 150 / 0.15)' : 'oklch(55% 0.12 30 / 0.15)')
                      : 'transparent',
                    color: 'oklch(90% 0.005 60)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 'var(--space-1)',
                    minWidth: 64,
                    transition: 'all var(--transition-fast)',
                  }}>
                  <span style={{ fontSize: '1.3em', lineHeight: 1 }}>{s.emoji}</span>
                  <span className="caption" style={{
                    fontWeight: active ? 'var(--weight-medium)' : 'var(--weight-normal)',
                    maxWidth: 64,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: active ? 'oklch(90% 0.005 60)' : 'oklch(80% 0.005 60 / 0.4)',
                  }}>
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 底部统计 ── */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          marginTop: 'var(--space-8)',
          padding: 'var(--space-4) 0',
        }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-xl)',
              fontWeight: 'var(--weight-bold)',
              color: 'oklch(90% 0.005 60)',
              margin: '0 0 2px',
            }}>{stats.sessions}</p>
            <p className="caption" style={{ color: 'oklch(80% 0.005 60 / 0.3)' }}>今日番茄</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-xl)',
              fontWeight: 'var(--weight-bold)',
              color: 'oklch(90% 0.005 60)',
              margin: '0 0 2px',
            }}>{stats.minutes}</p>
            <p className="caption" style={{ color: 'oklch(80% 0.005 60 / 0.3)' }}>专注分钟</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-xl)',
              fontWeight: 'var(--weight-bold)',
              color: 'oklch(90% 0.005 60)',
              margin: '0 0 2px',
            }}>{pomodoroCount + 1}</p>
            <p className="caption" style={{ color: 'oklch(80% 0.005 60 / 0.3)' }}>本轮番茄</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════ 控件样式 ══════════════════ */

const ctrlBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'oklch(85% 0.005 60 / 0.6)',
  fontSize: 'var(--text-xl)',
  cursor: 'pointer',
  padding: 'var(--space-2)',
  transition: 'color var(--transition-fast)',
  lineHeight: 1,
};

const mainBtnStyle = (isBreak: boolean): React.CSSProperties => ({
  width: 72,
  height: 72,
  borderRadius: '50%',
  background: isBreak
    ? 'oklch(55% 0.10 150)'
    : 'linear-gradient(135deg, oklch(55% 0.12 30), oklch(62% 0.10 20))',
  border: 'none',
  color: '#fff',
  fontSize: 'var(--text-xl)',
  cursor: 'pointer',
  transition: 'transform var(--transition-fast), opacity var(--transition-fast)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  lineHeight: 1,
});

/* ══════════════════ 黑胶唱片 ══════════════════ */

function VinylDisc({ isBreak, soundEmoji, isPlaying }: {
  isBreak: boolean; soundEmoji: string; isPlaying: boolean;
}) {
  const accentColor = isBreak
    ? 'oklch(55% 0.10 150)'
    : 'oklch(55% 0.12 30)';

  return (
    <div style={{
      width: 240,
      height: 240,
      position: 'relative',
      animation: isPlaying ? 'spin 12s linear infinite' : 'none',
    }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* 光晕 */}
      <div style={{
        position: 'absolute',
        inset: -20,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${accentColor}20 0%, transparent 70%)`,
      }} />

      {/* 黑胶主体 */}
      <div style={{
        position: 'absolute',
        inset: 0,
        borderRadius: '50%',
        background: 'radial-gradient(circle at 50% 50%, oklch(28% 0.005 60) 30%, oklch(18% 0.005 60) 70%, oklch(12% 0.005 60) 100%)',
        border: '2px solid oklch(40% 0.005 60 / 0.3)',
      }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            inset: 10 + i * 5,
            borderRadius: '50%',
            border: '1px solid oklch(100% 0 0 / 0.03)',
          }} />
        ))}
      </div>

      {/* 中心标 */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 96,
        height: 96,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${accentColor}, oklch(62% 0.08 20))`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 36,
        boxShadow: 'inset 0 0 20px oklch(0% 0 0 / 0.2)',
      }}>
        {soundEmoji}
      </div>

      {/* 轴心 */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: 'oklch(90% 0.002 60)',
      }} />
    </div>
  );
}
