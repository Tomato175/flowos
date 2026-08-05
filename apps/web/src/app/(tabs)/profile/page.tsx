'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFocusStore } from '@/stores/useFocusStore';
import { useTaskStore } from '@/stores/useTaskStore';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-provider';
import { useHabitStore, type Habit, type HabitFrequency } from '@/stores/useHabitStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useAudioStore } from '@/stores/useAudioStore';

export default function ProfilePage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { sessions } = useFocusStore();
  const { tasks } = useTaskStore();
  const { logs, addHabit, deleteHabit, getStreak, getActiveHabits } = useHabitStore();
  const { customTracks, addCustomTrack, removeCustomTrack } = useAudioStore();

  const [tab, setTab] = useState<'stats' | 'habits'>('stats');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', icon: '🔥', color: 'var(--color-primary)', frequencyType: 'daily' as HabitFrequency, frequencyCount: 1, reminderTime: '' });

  const totalMin = sessions.reduce((s, x) => s + x.durationMinutes, 0);
  const pomos = sessions.filter((s) => s.sessionType === 'pomodoro' && s.completed).length;
  const doneTasks = tasks.filter((t) => t.status === 'done').length;
  const activeHabits = getActiveHabits();

  const ICONS = ['🔥', '🏃', '📖', '✍️', '🧘', '💧', '🍎', '💤', '📵', '🎯', '💪', '🎨'];

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: 'var(--space-12) var(--space-6) var(--space-16)' }}>
      {/* ==== Magazine Header: About Section ==== */}
      <div
        style={{
          marginBottom: 'var(--space-8)',
          paddingBottom: 'var(--space-6)',
          borderBottom: '1px solid var(--color-divider)',
        }}
      >
        <p
          className="body-small"
          style={{
            fontFamily: 'var(--font-body)',
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            margin: '0 0 var(--space-2)',
          }}
        >
          Profile / 个人主页
        </p>
        <h1
          className="display-large"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--color-text)',
            margin: '0 0 var(--space-3)',
          }}
        >
          关于我
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 'var(--radius-full)',
              backgroundColor: user ? 'var(--color-success)' : 'var(--color-primary-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 30,
              color: user ? 'var(--color-bg)' : 'var(--color-primary)',
              opacity: user ? 0.85 : 1,
            }}
          >
            👤
          </div>
          <div style={{ flex: 1 }}>
            <h2
              className="heading-2"
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--color-text)',
                margin: '0 0 var(--space-1)',
              }}
            >
              {user?.email || '心流用户'}
            </h2>
            <p
              className="body-small"
              style={{
                fontFamily: 'var(--font-body)',
                color: 'var(--color-text-muted)',
                margin: 0,
              }}
            >
              {user ? '🟢 已登录 · 数据自动云同步' : '⚪ 离线模式 · 数据存于本地'}
            </p>
          </div>
          {user && (
            <button
              onClick={() => signOut()}
              style={{
                padding: 'var(--space-1) var(--space-4)',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: 'var(--font-body)',
                color: 'var(--color-error)',
                backgroundColor: 'transparent',
                border: '1px solid var(--color-error)',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
              }}
            >
              退出
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-8)' }}>
        <TabBtn active={tab === 'stats'} onClick={() => setTab('stats')}>📊 数据</TabBtn>
        <TabBtn active={tab === 'habits'} onClick={() => setTab('habits')}>🔥 习惯</TabBtn>
      </div>

      {/* ===== Stats ===== */}
      {tab === 'stats' && (
        <>
          {/* Stat Highlights — magazine-style large numbers */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 'var(--space-4)',
              marginBottom: 'var(--space-8)',
            }}
          >
            <StatBox label="总专注时长" value={`${Math.floor(totalMin / 60)}h ${totalMin % 60}m`} />
            <StatBox label="完成番茄" value={`${pomos} 🍅`} />
            <StatBox label="完成任务" value={`${doneTasks} 项`} />
            <StatBox label="专注次数" value={`${sessions.length} 次`} />
          </div>

          {/* Habit Heatmap */}
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-5) var(--space-4)',
              border: '1px solid var(--color-divider)',
              marginBottom: 'var(--space-8)',
            }}
          >
            <p
              className="label-text"
              style={{
                fontFamily: 'var(--font-body)',
                color: 'var(--color-text-secondary)',
                margin: '0 0 var(--space-3)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              📅 本月习惯热力图
            </p>
            <HeatmapGrid habits={activeHabits} logs={logs} />
          </div>

          {/* Settings */}
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-5) var(--space-4)',
              border: '1px solid var(--color-divider)',
              marginBottom: 'var(--space-8)',
            }}
          >
            <p
              className="label-text"
              style={{
                fontFamily: 'var(--font-body)',
                color: 'var(--color-text-secondary)',
                margin: '0 0 var(--space-3)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              ⚙️ 设置
            </p>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'var(--space-2) 0',
                borderBottom: '1px solid var(--color-divider)',
              }}
            >
              <span
                className="body-text"
                style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text)' }}
              >
                深色模式
              </span>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as any)}
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 12,
                  padding: 'var(--space-1) var(--space-2)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'transparent',
                  color: 'var(--color-text-secondary)',
                }}
              >
                <option value="system">跟随系统</option>
                <option value="light">浅色</option>
                <option value="dark">深色</option>
              </select>
            </div>
            <SettingRow label="专注时长" value="25 分钟" />
            <SettingRow label="短休息" value="5 分钟" />
            <SettingRow label="长休息" value="15 分钟" />
            <SettingRow label="数据存储" value="本地 (localStorage)" />
            <SettingRow label="版本" value="v0.4.0 Phase 4" />
          </div>

          {/* Action buttons — magazine-style text links with subtle backgrounds */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-8)' }}>
            <ActionBtn
              emoji="💾"
              label="导出全部数据 (JSON)"
              color="var(--color-success)"
              onClick={() => {
                const data = useSettingsStore.getState().exportAll();
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `flowos-backup-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            />
            <ActionBtn
              emoji="📥"
              label="导入数据 (JSON)"
              color="var(--color-primary)"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = (e: any) => {
                  const file = e.target.files[0];
                  const reader = new FileReader();
                  reader.onload = () => {
                    const ok = useSettingsStore.getState().importAll(reader.result as string);
                    alert(ok ? '✅ 数据已导入，请刷新页面' : '❌ 导入失败，JSON 格式无效');
                    if (ok) window.location.reload();
                  };
                  reader.readAsText(file);
                };
                input.click();
              }}
            />
            <ActionBtn
              emoji="📷"
              label="照片墙"
              color="#EC4899"
              onClick={() => router.push('/photos')}
            />
          </div>

          {/* Music section */}
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-4)',
              border: '1px solid var(--color-divider)',
              marginBottom: 'var(--space-4)',
            }}
          >
            <p
              className="label-text"
              style={{
                fontFamily: 'var(--font-body)',
                color: 'var(--color-success)',
                margin: '0 0 var(--space-2)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              🎵 我的音乐
            </p>
            {customTracks.length === 0 ? (
              <p
                className="body-small"
                style={{
                  fontFamily: 'var(--font-body)',
                  color: 'var(--color-text-muted)',
                  margin: '0 0 var(--space-2)',
                }}
              >
                还没有上传歌曲
              </p>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-1)',
                  marginBottom: 'var(--space-2)',
                }}
              >
                {customTracks.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      fontFamily: 'var(--font-body)',
                      color: 'var(--color-success)',
                    }}
                  >
                    <span style={{ flex: 1 }}>🎵 {t.name}</span>
                    <button
                      onClick={() => removeCustomTrack(t.id)}
                      style={{
                        border: 'none',
                        background: 'none',
                        color: 'var(--color-error)',
                        cursor: 'pointer',
                        fontSize: 14,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'audio/*';
                input.onchange = (e: any) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (!file.type.startsWith('audio/')) {
                    alert('请选择音频文件 (MP3/WAV/OGG)');
                    return;
                  }
                  const url = URL.createObjectURL(file);
                  addCustomTrack({
                    id: 'custom-' + Date.now().toString(36),
                    name: file.name.replace(/\.[^.]+$/, ''),
                    url,
                  });
                };
                input.click();
              }}
              style={{
                padding: 'var(--space-1) var(--space-3)',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: 'var(--font-body)',
                color: 'var(--color-success)',
                backgroundColor: 'transparent',
                border: '1px solid var(--color-success)',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
              }}
            >
              📤 上传歌曲
            </button>
          </div>

          {/* Navigation Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <ActionBtn
              emoji="📝"
              label="打开笔记本"
              color="var(--color-primary)"
              onClick={() => router.push('/notes')}
            />
            <ActionBtn
              emoji="🎯"
              label="管理目标 OKR"
              color="var(--color-primary)"
              onClick={() => router.push('/goals')}
            />
          </div>
        </>
      )}

      {/* ===== Habits ===== */}
      {tab === 'habits' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-6)' }}>
            <button
              onClick={() => setShowForm(!showForm)}
              style={{
                padding: 'var(--space-2) var(--space-5)',
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--color-bg)',
                backgroundColor: 'var(--color-primary)',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
              }}
            >
              {showForm ? '取消' : '+ 新建习惯'}
            </button>
          </div>

          {showForm && (
            <div
              style={{
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-4)',
                marginBottom: 'var(--space-4)',
                border: '1px solid var(--color-primary)',
              }}
            >
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="习惯名称 *"
                autoFocus
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 18,
                  fontWeight: 600,
                  border: 'none',
                  borderBottom: '1px solid var(--color-divider)',
                  outline: 'none',
                  width: '100%',
                  padding: 'var(--space-2) 0',
                  marginBottom: 'var(--space-3)',
                  backgroundColor: 'transparent',
                  color: 'var(--color-text)',
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && form.name.trim()) {
                    addHabit({
                      name: form.name.trim(),
                      icon: form.icon,
                      color: form.color,
                      frequencyType: form.frequencyType,
                      frequencyCount: form.frequencyCount,
                      reminderTime: form.reminderTime || null,
                    });
                    setForm({
                      name: '',
                      icon: '🔥',
                      color: 'var(--color-primary)',
                      frequencyType: 'daily',
                      frequencyCount: 1,
                      reminderTime: '',
                    });
                    setShowForm(false);
                  }
                }}
              />
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--space-3)',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                  {ICONS.map((i) => (
                    <button
                      key={i}
                      onClick={() => setForm({ ...form, icon: i })}
                      style={{
                        fontSize: 20,
                        padding: 'var(--space-1)',
                        border:
                          form.icon === i
                            ? '1.5px solid var(--color-primary)'
                            : '1.5px solid transparent',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor:
                          form.icon === i
                            ? 'var(--color-primary-subtle)'
                            : 'transparent',
                        cursor: 'pointer',
                        transition: 'var(--transition-fast)',
                      }}
                    >
                      {i}
                    </button>
                  ))}
                </div>
                <span style={{ flex: 1 }} />
                <select
                  value={form.frequencyType}
                  onChange={(e) =>
                    setForm({ ...form, frequencyType: e.target.value as HabitFrequency })
                  }
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 13,
                    padding: 'var(--space-1) var(--space-2)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'transparent',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  <option value="daily">每天</option>
                  <option value="weekly">每周</option>
                  <option value="monthly">每月</option>
                </select>
                <button
                  onClick={() => {
                    if (form.name.trim()) {
                      addHabit({
                        name: form.name.trim(),
                        icon: form.icon,
                        color: form.color,
                        frequencyType: form.frequencyType,
                        frequencyCount: form.frequencyCount,
                        reminderTime: form.reminderTime || null,
                      });
                      setForm({
                        name: '',
                        icon: '🔥',
                        color: 'var(--color-primary)',
                        frequencyType: 'daily',
                        frequencyCount: 1,
                        reminderTime: '',
                      });
                      setShowForm(false);
                    }
                  }}
                  style={{
                    padding: 'var(--space-1) var(--space-4)',
                    fontFamily: 'var(--font-body)',
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--color-bg)',
                    backgroundColor: 'var(--color-primary)',
                    border: 'none',
                    borderRadius: 'var(--radius-full)',
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)',
                  }}
                >
                  添加
                </button>
              </div>
            </div>
          )}

          {activeHabits.map((h) => {
            const streak = getStreak(h.id);
            return (
              <div
                key={h.id}
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-3) var(--space-4)',
                  marginBottom: 'var(--space-2)',
                  border: '1px solid var(--color-divider)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  transition: 'var(--transition-fast)',
                }}
              >
                <span style={{ fontSize: 28 }}>{h.icon}</span>
                <div style={{ flex: 1 }}>
                  <div
                    className="body-text"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 600,
                      color: 'var(--color-text)',
                    }}
                  >
                    {h.name}
                  </div>
                  <div
                    className="caption"
                    style={{
                      fontFamily: 'var(--font-body)',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    {h.frequencyType === 'daily'
                      ? '每天'
                      : h.frequencyType === 'weekly'
                        ? `每周${h.frequencyCount}次`
                        : `每月${h.frequencyCount}次`}
                    {streak > 0 && (
                      <span
                        style={{
                          color: 'var(--color-primary)',
                          marginLeft: 'var(--space-2)',
                          fontWeight: 600,
                        }}
                      >
                        🔥 连续 {streak} 天
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteHabit(h.id)}
                  style={{
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer',
                    fontSize: 16,
                    padding: 'var(--space-1)',
                    transition: 'var(--transition-fast)',
                  }}
                >
                  ✕
                </button>
              </div>
            );
          })}

          {activeHabits.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: 'var(--space-12) var(--space-6)',
                color: 'var(--color-text-muted)',
              }}
            >
              <p style={{ fontSize: 44, margin: '0 0 var(--space-2)', lineHeight: 1 }}>🔥</p>
              <p
                className="heading-3"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: 'var(--color-text)',
                  margin: 0,
                }}
              >
                还没有习惯，点击上方按钮创建
              </p>
            </div>
          )}
        </>
      )}

      {/* Magazine footer */}
      <p
        className="caption"
        style={{
          textAlign: 'center',
          fontFamily: 'var(--font-body)',
          color: 'var(--color-text-muted)',
          marginTop: 'var(--space-10)',
        }}
      >
        🌀 心流OS · Phase 2 · 开源个人生活中枢
      </p>
    </div>
  );
}

/* ===== 子组件 ===== */

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: 'var(--space-2) var(--space-5)',
        fontFamily: 'var(--font-body)',
        fontSize: 14,
        fontWeight: active ? 600 : 400,
        borderRadius: 'var(--radius-full)',
        border: active
          ? '1px solid var(--color-primary)'
          : '1px solid var(--color-divider)',
        backgroundColor: active
          ? 'var(--color-primary-subtle)'
          : 'transparent',
        color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
        cursor: 'pointer',
        transition: 'var(--transition-fast)',
      }}
    >
      {children}
    </button>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <p
        className="display-medium"
        style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--color-primary)',
          margin: '0 0 var(--space-1)',
          fontSize: 32,
        }}
      >
        {value}
      </p>
      <p
        className="caption"
        style={{
          fontFamily: 'var(--font-body)',
          color: 'var(--color-text-muted)',
          margin: 0,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </p>
    </div>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: 'var(--space-2) 0',
        borderBottom: '1px solid var(--color-divider)',
      }}
    >
      <span
        className="body-text"
        style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text)' }}
      >
        {label}
      </span>
      <span
        className="body-text"
        style={{
          fontFamily: 'var(--font-body)',
          color: 'var(--color-text-secondary)',
        }}
      >
        {value}
      </span>
    </div>
  );
}

function ActionBtn({
  emoji,
  label,
  color,
  onClick,
}: {
  emoji: string;
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: 'var(--space-3) var(--space-4)',
        fontFamily: 'var(--font-body)',
        fontSize: 14,
        fontWeight: 600,
        color: color,
        backgroundColor: 'transparent',
        border: `1px solid var(--color-divider)`,
        borderRadius: 'var(--radius-full)',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'var(--transition-fast)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
      }}
    >
      <span>{emoji}</span>
      <span>{label}</span>
    </button>
  );
}

/* 简易热力图 */
function HeatmapGrid({
  habits,
  logs,
}: {
  habits: Habit[];
  logs: { habitId: string; date: string }[];
}) {
  const today = new Date();
  const days: { date: string; day: number }[] = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push({ date: d.toISOString().split('T')[0]!, day: d.getDay() });
  }

  const getIntensity = (date: string) => {
    const count = logs.filter((l) => l.date === date).length;
    if (count === 0) return 'var(--color-surface-hover)';
    if (habits.length <= 2) return count >= 1 ? 'var(--color-success)' : 'var(--color-surface-hover)';
    const ratio = count / habits.length;
    if (ratio >= 0.75) return 'var(--color-success)';
    if (ratio >= 0.5) return '#6EE7B7';
    if (ratio >= 0.25) return '#A7F3D0';
    return '#D1FAE5';
  };

  const weeks: typeof days[] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  return (
    <div style={{ display: 'flex', gap: 3, overflowX: 'auto' }}>
      {weeks.map((week, wi) => (
        <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {week.map((d) => (
            <div
              key={d.date}
              title={`${d.date}: ${logs.filter((l) => l.date === d.date).length}项`}
              style={{
                width: 12,
                height: 12,
                borderRadius: 'var(--radius-sm)',
                backgroundColor: getIntensity(d.date),
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
