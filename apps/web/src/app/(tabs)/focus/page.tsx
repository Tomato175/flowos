'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useFocusStore } from '@/stores/useFocusStore';
import { useTaskStore } from '@/stores/useTaskStore';
import { useAudioStore, AMBIENT_SOUNDS } from '@/stores/useAudioStore';
import { useTimer } from '@/hooks/useTimer';

/* ---- 音效 Web Audio ---- */
function playBeep() {
  try {
    const ctx = new (window as any).AudioContext || new (window as any).webkitAudioContext();
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

  useEffect(() => { requestNotification(); }, []);

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

  /* 当前氛围音的索引（用于上下首） */
  const currentSoundIdx = activeSound
    ? AMBIENT_SOUNDS.findIndex((s) => s.id === activeSound)
    : 0;
  const playPrev = () => {
    const idx = (currentSoundIdx - 1 + AMBIENT_SOUNDS.length) % AMBIENT_SOUNDS.length;
    setActiveSound(AMBIENT_SOUNDS[idx]!.id);
  };
  const playNext = () => {
    const idx = (currentSoundIdx + 1) % AMBIENT_SOUNDS.length;
    setActiveSound(AMBIENT_SOUNDS[idx]!.id);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: isBreak
        ? 'linear-gradient(160deg, #064E3B 0%, #065F46 40%, #134E4A 100%)'
        : 'linear-gradient(160deg, #1E1B4B 0%, #4C1D95 40%, #831843 100%)',
      color: '#FFF',
      padding: '32px 20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* 顶部装饰光晕 */}
      <div style={{
        position: 'absolute', top: -100, right: -100, width: 300, height: 300,
        background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: -150, left: -100, width: 400, height: 400,
        background: `radial-gradient(circle, ${accentColor}30 0%, transparent 70%)`,
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: 420, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* 顶部 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <button onClick={() => router.back()} style={{
            background: 'rgba(255,255,255,0.1)', border: 'none', color: '#FFF',
            width: 36, height: 36, borderRadius: '50%', fontSize: 16, cursor: 'pointer',
            backdropFilter: 'blur(10px)',
          }}>←</button>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: 0, letterSpacing: 2, textTransform: 'uppercase' }}>
              {isBreak ? 'BREAK TIME' : 'FOCUS MODE'}
            </p>
            <p style={{ fontSize: 16, fontWeight: 700, margin: '2px 0 0' }}>
              {isBreak ? '☕ 休息时间' : '🎯 专注模式'}
            </p>
          </div>
          <button onClick={() => router.push('/focus/fullscreen')} style={{
            background: 'rgba(255,255,255,0.1)', border: 'none', color: '#FFF',
            width: 36, height: 36, borderRadius: '50%', fontSize: 14, cursor: 'pointer',
            backdropFilter: 'blur(10px)',
          }}>⛶</button>
        </div>

        {/* 黑胶唱片 */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <VinylDisc
            color={accentColor}
            soundEmoji={activeSound ? AMBIENT_SOUNDS.find((s) => s.id === activeSound)?.emoji : '🎵'}
            isPlaying={!!(activeSound && isPlaying)}
            soundLabel={activeSound ? AMBIENT_SOUNDS.find((s) => s.id === activeSound)?.label : '选择氛围音'}
          />
        </div>

        {/* 当前曲目信息 */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <p style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px' }}>
            {activeSound ? AMBIENT_SOUNDS.find((s) => s.id === activeSound)?.label : '未选择氛围音'}
          </p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
            {activeSound
              ? `心流OS · ${activeSound === 'rain' ? '宁静雨夜' : activeSound === 'ocean' ? '海浪低语' : activeSound === 'forest' ? '林间鸟鸣' : '深度专注'}`
              : '从下方选择你想要的氛围'}
          </p>
        </div>

        {/* 计时进度条 (替代歌曲进度) */}
        <div style={{ marginBottom: 8 }}>
          <div style={{
            height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden',
            cursor: 'pointer', position: 'relative',
          }}>
            <div style={{
              height: '100%', width: `${Math.min(progress * 100, 100)}%`,
              background: `linear-gradient(90deg, ${accentColor}, #F472B6)`,
              borderRadius: 2, transition: 'width 0.5s ease',
              boxShadow: `0 0 8px ${accentColor}80`,
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
              {formatTimer((sessionType === 'break' ? breakDuration : workDuration) * 60 - timeRemaining)}
            </span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
              {formatTimer((sessionType === 'break' ? breakDuration : workDuration) * 60)}
            </span>
          </div>
        </div>

        {/* 中央大字计时 */}
        <div style={{ textAlign: 'center', margin: '20px 0' }}>
          <p style={{
            fontSize: 64, fontWeight: 700, margin: 0, fontFamily: 'monospace',
            letterSpacing: 4, textShadow: `0 0 20px ${accentColor}80`,
          }}>{formatTimer(timeRemaining)}</p>
        </div>

        {/* 控制按钮 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, padding: '0 10px' }}>
          <button onClick={() => setActiveSound(null)} style={{
            background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)',
            fontSize: 20, cursor: 'pointer', padding: 8,
          }} title="清除氛围音">✕</button>
          <button onClick={playPrev} style={{
            background: 'transparent', border: 'none', color: '#FFF',
            fontSize: 28, cursor: 'pointer', padding: 8,
          }}>⏮</button>
          {timerState === 'idle' && (
            <button onClick={startTimer} style={{
              width: 72, height: 72, borderRadius: '50%',
              background: `linear-gradient(135deg, ${accentColor}, #F472B6)`,
              border: 'none', color: '#FFF', fontSize: 24, cursor: 'pointer',
              boxShadow: `0 8px 24px ${accentColor}80`, transition: 'transform 200ms',
            }}>▶</button>
          )}
          {timerState === 'running' && (
            <button onClick={pauseTimer} style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'rgba(255,255,255,0.95)', border: 'none',
              color: '#1F1B4B', fontSize: 24, cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(255,255,255,0.3)', transition: 'transform 200ms',
            }}>⏸</button>
          )}
          {timerState === 'paused' && (
            <button onClick={resumeTimer} style={{
              width: 72, height: 72, borderRadius: '50%',
              background: `linear-gradient(135deg, ${accentColor}, #F472B6)`,
              border: 'none', color: '#FFF', fontSize: 24, cursor: 'pointer',
              boxShadow: `0 8px 24px ${accentColor}80`,
            }}>▶</button>
          )}
          {timerState === 'finished' && !isBreak && (
            <button onClick={startBreakSession} style={{
              width: 72, height: 72, borderRadius: '50%',
              background: '#10B981', border: 'none', color: '#FFF', fontSize: 22,
              cursor: 'pointer', boxShadow: '0 8px 24px rgba(16,185,129,0.5)',
            }}>☕</button>
          )}
          {timerState === 'finished' && isBreak && (
            <button onClick={startTimer} style={{
              width: 72, height: 72, borderRadius: '50%',
              background: `linear-gradient(135deg, ${accentColor}, #F472B6)`,
              border: 'none', color: '#FFF', fontSize: 24, cursor: 'pointer',
            }}>▶</button>
          )}
          <button onClick={resetTimer} style={{
            background: 'transparent', border: 'none', color: '#EF4444',
            fontSize: 20, cursor: 'pointer', padding: 8,
          }} title="放弃">⏹</button>
          <button onClick={playNext} style={{
            background: 'transparent', border: 'none', color: '#FFF',
            fontSize: 28, cursor: 'pointer', padding: 8,
          }}>⏭</button>
        </div>

        {/* 音量 + 当前任务 */}
        <div style={{
          background: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 16,
          backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)',
          marginBottom: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>📌</span>
            <span style={{ fontSize: 13, flex: 1 }}>{currentTaskTitle || '未关联任务'}</span>
            {!currentTaskId && (
              <select onChange={(e) => {
                const t = tasks.find((x) => x.id === e.target.value);
                if (t) setCurrentTask(t.id, t.title);
              }} value=""
                style={{
                  background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                  color: '#FFF', fontSize: 11, padding: '4px 8px', borderRadius: 8,
                }}>
                <option value="" style={{ background: '#1F1B4B' }}>选择任务</option>
                {tasks.filter((t) => t.status !== 'done' && t.status !== 'archived').map((t) => (
                  <option key={t.id} value={t.id} style={{ background: '#1F1B4B' }}>{t.title}</option>
                ))}
              </select>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>🔊</span>
            <input type="range" min={0} max={1} step={0.05} value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              style={{ flex: 1, accentColor: '#7C3AED' }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', minWidth: 32, textAlign: 'right' }}>
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>

        {/* 氛围音选择（类似播放列表） */}
        <div style={{
          background: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 16,
          backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '0 0 12px', letterSpacing: 1, textTransform: 'uppercase' }}>
            🎵 氛围音库
          </p>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
            {AMBIENT_SOUNDS.slice(0, 10).map((s) => {
              const active = activeSound === s.id;
              return (
                <button key={s.id} onClick={() => setActiveSound(active ? null : s.id)}
                  style={{
                    flexShrink: 0, padding: '10px 14px', borderRadius: 12,
                    border: active ? `2px solid ${accentColor}` : '1.5px solid rgba(255,255,255,0.15)',
                    background: active ? `${accentColor}40` : 'rgba(255,255,255,0.05)',
                    color: '#FFF', cursor: 'pointer', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 4, minWidth: 70,
                    transition: 'all 200ms ease',
                  }}>
                  <span style={{ fontSize: 22 }}>{s.emoji}</span>
                  <span style={{ fontSize: 10, fontWeight: active ? 600 : 400 }}>{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 底部统计 */}
        <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 20, padding: '16px 0' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 22, fontWeight: 700, margin: 0, textShadow: `0 0 10px ${accentColor}60` }}>{stats.sessions}</p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', margin: '4px 0 0' }}>今日番茄</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 22, fontWeight: 700, margin: 0, textShadow: `0 0 10px ${accentColor}60` }}>{stats.minutes}</p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', margin: '4px 0 0' }}>专注分钟</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 22, fontWeight: 700, margin: 0, textShadow: `0 0 10px ${accentColor}60` }}>{pomodoroCount + 1}</p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', margin: '4px 0 0' }}>本轮番茄</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- 黑胶唱片组件 ---- */
function VinylDisc({ color, soundEmoji, isPlaying, soundLabel }: {
  color: string; soundEmoji: string; isPlaying: boolean; soundLabel: string;
}) {
  return (
    <div style={{
      width: 240, height: 240, position: 'relative',
      animation: isPlaying ? 'spin 8s linear infinite' : 'none',
      transition: 'transform 200ms',
    }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      {/* 外圈阴影 */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: 'rgba(0,0,0,0.3)', filter: 'blur(20px)',
      }} />
      {/* 黑胶主体 */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: 'radial-gradient(circle at 50% 50%, #1a1a1a 30%, #0a0a0a 70%, #000 100%)',
        border: '3px solid rgba(255,255,255,0.05)',
        boxShadow: `0 0 40px ${color}40`,
      }}>
        {/* 黑胶纹理 */}
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute', inset: 8 + i * 4, borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.04)',
          }} />
        ))}
      </div>
      {/* 中心专辑标 */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 96, height: 96, borderRadius: '50%',
        background: `linear-gradient(135deg, ${color}, #F472B6)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 36, boxShadow: 'inset 0 0 20px rgba(0,0,0,0.3)',
      }}>
        {soundEmoji}
      </div>
      {/* 中心轴 */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 8, height: 8, borderRadius: '50%',
        background: '#FFF',
      }} />
    </div>
  );
}