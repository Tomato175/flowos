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
  const [form, setForm] = useState({ name: '', icon: '🔥', color: '#7C3AED', frequencyType: 'daily' as HabitFrequency, frequencyCount: 1, reminderTime: '' });

  const totalMin = sessions.reduce((s, x) => s + x.durationMinutes, 0);
  const pomos = sessions.filter((s) => s.sessionType === 'pomodoro' && s.completed).length;
  const doneTasks = tasks.filter((t) => t.status === 'done').length;
  const activeHabits = getActiveHabits();

  const ICONS = ['🔥', '🏃', '📖', '✍️', '🧘', '💧', '🍎', '💤', '📵', '🎯', '💪', '🎨'];

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 20px' }}>
      {/* 头像区域 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', backgroundColor: user ? '#D1FAE5' : '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, color: user ? '#10B981' : '#7C3AED' }}>👤</div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 2px', color: '#1C1917' }}>{user?.email || '心流用户'}</h2>
          <p style={{ fontSize: 13, color: '#78716C', margin: 0 }}>
            {user ? '🟢 已登录 · 数据自动云同步' : '⚪ 离线模式 · 数据存于本地'}
          </p>
        </div>
        {user && (
          <button onClick={() => signOut()}
            style={{ padding: '6px 14px', fontSize: 12, color: '#EF4444', backgroundColor: '#FEE2E2', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
            退出
          </button>
        )}
      </div>

      {/* 标签 */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 18 }}>
        <TabBtn active={tab === 'stats'} onClick={() => setTab('stats')}>📊 数据</TabBtn>
        <TabBtn active={tab === 'habits'} onClick={() => setTab('habits')}>🔥 习惯</TabBtn>
      </div>

      {/* ===== 数据 ===== */}
      {tab === 'stats' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 16 }}>
            <StatBox label="总专注时长" value={`${Math.floor(totalMin / 60)}h ${totalMin % 60}m`} color="#7C3AED" />
            <StatBox label="完成番茄" value={`${pomos} 🍅`} color="#F59E0B" />
            <StatBox label="完成任务" value={`${doneTasks} 项`} color="#10B981" />
            <StatBox label="专注次数" value={`${sessions.length} 次`} color="#3B82F6" />
          </div>

          {/* 习惯热力图(简版) */}
          <div style={{ backgroundColor: '#FFF', borderRadius: 14, padding: 16, border: '1.5px solid #E7E5E4', marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#78716C', margin: '0 0 10px' }}>📅 本月习惯热力图</p>
            <HeatmapGrid habits={activeHabits} logs={logs} />
          </div>

          {/* 设置 */}
          <div style={{ backgroundColor: '#FFF', borderRadius: 14, padding: 16, border: '1.5px solid #E7E5E4' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#78716C', margin: '0 0 10px' }}>⚙️ 设置</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F5F5F4' }}>
              <span style={{ fontSize: 13, color: '#44403C' }}>深色模式</span>
              <select value={theme} onChange={(e) => setTheme(e.target.value as any)}
                style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, border: '1px solid #E7E5E4', color: '#78716C' }}>
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

          <button onClick={() => {
            const data = useSettingsStore.getState().exportAll();
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `flowos-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click(); URL.revokeObjectURL(url);
          }}
            style={{ marginTop: 10, width: '100%', padding: '10px', fontSize: 14, fontWeight: 600, color: '#10B981', backgroundColor: '#D1FAE5', border: 'none', borderRadius: 10, cursor: 'pointer' }}>
            💾 导出全部数据 (JSON)
          </button>
          <button onClick={() => {
            const input = document.createElement('input');
            input.type = 'file'; input.accept = '.json';
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
            style={{ marginTop: 8, width: '100%', padding: '10px', fontSize: 14, fontWeight: 600, color: '#F59E0B', backgroundColor: '#FEF3C7', border: 'none', borderRadius: 10, cursor: 'pointer' }}>
            📥 导入数据 (JSON)
          </button>

          <button onClick={() => router.push('/photos')}
            style={{ marginTop: 8, width: '100%', padding: '10px', fontSize: 14, fontWeight: 600, color: '#EC4899', backgroundColor: '#FCE7F3', border: 'none', borderRadius: 10, cursor: 'pointer' }}>
            📷 照片墙
          </button>

          {/* 音乐上传 */}
          <div style={{ marginTop: 8, backgroundColor: '#F0FDF4', borderRadius: 10, padding: 12 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#065F46', margin: '0 0 8px' }}>🎵 我的音乐</p>
            {customTracks.length === 0 ? (
              <p style={{ fontSize: 12, color: '#78716C', margin: '0 0 8px' }}>还没有上传歌曲</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
                {customTracks.map((t) => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#065F46' }}>
                    <span style={{ flex: 1 }}>🎵 {t.name}</span>
                    <button onClick={() => removeCustomTrack(t.id)}
                      style={{ border: 'none', background: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 14 }}>✕</button>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => {
              const input = document.createElement('input');
              input.type = 'file'; input.accept = 'audio/*';
              input.onchange = (e: any) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (!file.type.startsWith('audio/')) { alert('请选择音频文件 (MP3/WAV/OGG)'); return; }
                const url = URL.createObjectURL(file);
                addCustomTrack({ id: 'custom-' + Date.now().toString(36), name: file.name.replace(/\.[^.]+$/, ''), url });
              };
              input.click();
            }}
              style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600, color: '#10B981', backgroundColor: '#D1FAE5', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
              📤 上传歌曲
            </button>
          </div>

          <button onClick={() => router.push('/notes')}
            style={{ marginTop: 8, width: '100%', padding: '10px', fontSize: 14, fontWeight: 600, color: '#7C3AED', backgroundColor: '#EDE9FE', border: 'none', borderRadius: 10, cursor: 'pointer' }}>
            📝 打开笔记本
          </button>
          <button onClick={() => router.push('/goals')}
            style={{ marginTop: 8, width: '100%', padding: '10px', fontSize: 14, fontWeight: 600, color: '#F59E0B', backgroundColor: '#FEF3C7', border: 'none', borderRadius: 10, cursor: 'pointer' }}>
            🎯 管理目标 OKR
          </button>
        </>
      )}

      {/* ===== 习惯 ===== */}
      {tab === 'habits' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button onClick={() => setShowForm(!showForm)}
              style={{ padding: '8px 18px', fontSize: 13, fontWeight: 600, color: '#FFF', backgroundColor: '#7C3AED', border: 'none', borderRadius: 10, cursor: 'pointer' }}>
              {showForm ? '取消' : '+ 新建习惯'}
            </button>
          </div>

          {showForm && (
            <div style={{ backgroundColor: '#FFF', borderRadius: 14, padding: 14, marginBottom: 12, border: '1.5px solid #7C3AED' }}>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="习惯名称 *" autoFocus
                style={{ fontSize: 15, fontWeight: 600, border: 'none', borderBottom: '1px solid #E7E5E4', outline: 'none', width: '100%', padding: '6px 0', marginBottom: 10 }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && form.name.trim()) { addHabit({ name: form.name.trim(), icon: form.icon, color: form.color, frequencyType: form.frequencyType, frequencyCount: form.frequencyCount, reminderTime: form.reminderTime || null }); setForm({ name: '', icon: '🔥', color: '#7C3AED', frequencyType: 'daily', frequencyCount: 1, reminderTime: '' }); setShowForm(false); }
                }}
              />
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {ICONS.map((i) => (
                    <button key={i} onClick={() => setForm({ ...form, icon: i })}
                      style={{ fontSize: 18, padding: 4, border: form.icon === i ? '2px solid #7C3AED' : '2px solid transparent', borderRadius: 6, backgroundColor: form.icon === i ? '#EDE9FE' : 'transparent', cursor: 'pointer' }}>{i}</button>
                  ))}
                </div>
                <span style={{ flex: 1 }} />
                <select value={form.frequencyType} onChange={(e) => setForm({ ...form, frequencyType: e.target.value as HabitFrequency })}
                  style={{ fontSize: 13, padding: '4px 8px', borderRadius: 6, border: '1px solid #E7E5E4' }}>
                  <option value="daily">每天</option>
                  <option value="weekly">每周</option>
                  <option value="monthly">每月</option>
                </select>
                <button onClick={() => { if (form.name.trim()) { addHabit({ name: form.name.trim(), icon: form.icon, color: form.color, frequencyType: form.frequencyType, frequencyCount: form.frequencyCount, reminderTime: form.reminderTime || null }); setForm({ name: '', icon: '🔥', color: '#7C3AED', frequencyType: 'daily', frequencyCount: 1, reminderTime: '' }); setShowForm(false); } }}
                  style={{ padding: '6px 14px', fontSize: 13, fontWeight: 600, color: '#FFF', backgroundColor: '#7C3AED', border: 'none', borderRadius: 8, cursor: 'pointer' }}>添加</button>
              </div>
            </div>
          )}

          {activeHabits.map((h) => {
            const streak = getStreak(h.id);
            return (
              <div key={h.id} style={{ backgroundColor: '#FFF', borderRadius: 14, padding: '12px 16px', marginBottom: 8, border: '1.5px solid #E7E5E4', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 26 }}>{h.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#1C1917' }}>{h.name}</div>
                  <div style={{ fontSize: 12, color: '#A8A29E' }}>
                    {h.frequencyType === 'daily' ? '每天' : h.frequencyType === 'weekly' ? `每周${h.frequencyCount}次` : `每月${h.frequencyCount}次`}
                    {streak > 0 && <span style={{ color: '#F59E0B', marginLeft: 8 }}>🔥 连续 {streak} 天</span>}
                  </div>
                </div>
                <button onClick={() => deleteHabit(h.id)}
                  style={{ border: 'none', backgroundColor: 'transparent', color: '#D6D3D1', cursor: 'pointer', fontSize: 16, padding: 4 }}>✕</button>
              </div>
            );
          })}

          {activeHabits.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#A8A29E' }}>
              <p style={{ fontSize: 40, margin: '0 0 8px' }}>🔥</p>
              <p style={{ fontSize: 15 }}>还没有习惯，点击上方按钮创建</p>
            </div>
          )}
        </>
      )}

      <p style={{ textAlign: 'center', fontSize: 12, color: '#A8A29E', marginTop: 24 }}>
        🌀 心流OS · Phase 2 · 开源个人生活中枢
      </p>
    </div>
  );
}

/* ===== 子组件 ===== */

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ padding: '8px 20px', fontSize: 14, fontWeight: active ? 600 : 400, borderRadius: 10, border: 'none', backgroundColor: active ? '#7C3AED' : '#F5F5F4', color: active ? '#FFF' : '#78716C', cursor: 'pointer', transition: 'all 150ms ease' }}>
      {children}
    </button>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ backgroundColor: '#FFF', borderRadius: 12, padding: '14px 16px', border: '1.5px solid #E7E5E4', textAlign: 'center' }}>
      <p style={{ fontSize: 20, fontWeight: 700, color, margin: '0 0 2px' }}>{value}</p>
      <p style={{ fontSize: 11, color: '#A8A29E', margin: 0 }}>{label}</p>
    </div>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F5F5F4', fontSize: 13 }}>
      <span style={{ color: '#44403C' }}>{label}</span>
      <span style={{ color: '#78716C' }}>{value}</span>
    </div>
  );
}

/* 简易热力图 */
function HeatmapGrid({ habits, logs }: { habits: Habit[]; logs: { habitId: string; date: string }[] }) {
  const today = new Date();
  const days: { date: string; day: number }[] = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push({ date: d.toISOString().split('T')[0]!, day: d.getDay() });
  }

  const getIntensity = (date: string) => {
    const count = logs.filter((l) => l.date === date).length;
    if (count === 0) return '#F5F5F4';
    if (habits.length <= 2) return count >= 1 ? '#10B981' : '#F5F5F4';
    const ratio = count / habits.length;
    if (ratio >= 0.75) return '#10B981';
    if (ratio >= 0.5) return '#6EE7B7';
    if (ratio >= 0.25) return '#A7F3D0';
    return '#D1FAE5';
  };

  const weeks: typeof days[] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {weeks.map((week, wi) => (
        <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {week.map((d) => (
            <div key={d.date} title={`${d.date}: ${logs.filter((l) => l.date === d.date).length}项`}
              style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: getIntensity(d.date) }} />
          ))}
        </div>
      ))}
    </div>
  );
}
