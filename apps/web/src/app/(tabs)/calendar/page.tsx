'use client';

import { useState, useMemo } from 'react';
import { useFocusStore } from '@/stores/useFocusStore';
import { useTaskStore } from '@/stores/useTaskStore';
import { useHabitStore } from '@/stores/useHabitStore';
import { useNoteStore } from '@/stores/useNoteStore';

/* ===== 主组件 ===== */
export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-11
  const [selectedDate, setSelectedDate] = useState<string>(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
  );

  const { sessions } = useFocusStore();
  const { tasks } = useTaskStore();
  const { logs: habitLogs, habits } = useHabitStore();
  const { notes } = useNoteStore();

  // ========== 构建日期活动索引 ==========
  const dateActivity = useMemo(() => {
    const map = new Map<string, { focus: number; tasks: number; habits: number; mood: boolean; journal: boolean }>();

    // 专注记录
    sessions.forEach((s) => {
      const d = s.startedAt.split('T')[0]!;
      if (!map.has(d)) map.set(d, { focus: 0, tasks: 0, habits: 0, mood: false, journal: false });
      map.get(d)!.focus += s.durationMinutes;
    });

    // 任务（按 updatedAt 统计完成和创建）
    tasks.forEach((t) => {
      const created = t.createdAt.split('T')[0]!;
      if (!map.has(created)) map.set(created, { focus: 0, tasks: 0, habits: 0, mood: false, journal: false });
      map.get(created)!.tasks += 1;

      if (t.status === 'done') {
        const doneDate = t.updatedAt.split('T')[0]!;
        if (!map.has(doneDate)) map.set(doneDate, { focus: 0, tasks: 0, habits: 0, mood: false, journal: false });
        if (doneDate !== created) map.get(doneDate)!.tasks += 1;
      }
    });

    // 习惯打卡
    habitLogs.forEach((l) => {
      if (!l.completed) return;
      const d = l.date;
      if (!map.has(d)) map.set(d, { focus: 0, tasks: 0, habits: 0, mood: false, journal: false });
      map.get(d)!.habits += 1;
    });

    // 日记
    notes.filter((n) => n.noteType === 'daily_journal' && n.journalDate).forEach((n) => {
      const d = n.journalDate!;
      if (!map.has(d)) map.set(d, { focus: 0, tasks: 0, habits: 0, mood: false, journal: false });
      map.get(d)!.journal = true;
    });

    // 心情 (从 localStorage)
    try {
      const moodData = localStorage.getItem('flowos-mood-today');
      if (moodData) {
        const { date, mood } = JSON.parse(moodData);
        if (mood && date) {
          if (!map.has(date)) map.set(date, { focus: 0, tasks: 0, habits: 0, mood: false, journal: false });
          map.get(date)!.mood = true;
        }
      }
    } catch {}

    return map;
  }, [sessions, tasks, habitLogs, notes]);

  // ========== 当月日历 ==========
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0=Sun

  const prevMonth = () => { if (month === 0) { setYear(year - 1); setMonth(11); } else setMonth(month - 1); };
  const nextMonth = () => { if (month === 11) { setYear(year + 1); setMonth(0); } else setMonth(month + 1); };
  const goToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth()); setSelectedDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`); };

  const pad = (n: number) => String(n).padStart(2, '0');
  const formatDate = (d: number) => `${year}-${pad(month + 1)}-${pad(d)}`;

  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  // ========== 选中日的汇总 ==========
  const selectedActivity = dateActivity.get(selectedDate);
  const selectedFocus = sessions.filter((s) => s.startedAt.startsWith(selectedDate));
  const selectedTasks = tasks.filter((t) => t.createdAt.startsWith(selectedDate) || (t.status === 'done' && t.updatedAt.startsWith(selectedDate)));
  const selectedHabits = habitLogs.filter((l) => l.date === selectedDate && l.completed);
  const selectedJournal = notes.find((n) => n.noteType === 'daily_journal' && n.journalDate === selectedDate);
  const selectedMood = (() => {
    try {
      const d = localStorage.getItem('flowos-mood-today');
      if (d) { const { date, mood } = JSON.parse(d); if (date === selectedDate) return mood; }
    } catch {}
    return null;
  })();

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px' }}>
      {/* 头部 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#1C1917' }}>日历</h1>
        <button onClick={goToday} style={{ padding: '6px 16px', fontSize: 13, color: '#7C3AED', backgroundColor: '#EDE9FE', border: 'none', borderRadius: 20, cursor: 'pointer' }}>今天</button>
      </div>

      {/* 月份导航 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <button onClick={prevMonth} style={navBtnStyle}>◀</button>
        <span style={{ fontSize: 16, fontWeight: 600, color: '#1C1917' }}>{year}年 {monthNames[month]}</span>
        <button onClick={nextMonth} style={navBtnStyle}>▶</button>
      </div>

      {/* 日历格子 */}
      <div style={{ backgroundColor: '#FFF', borderRadius: 16, padding: '12px', border: '1.5px solid #E7E5E4', marginBottom: 20 }}>
        {/* 星期头 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
          {weekDays.map((d) => (
            <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#A8A29E', padding: '4px 0' }}>{d}</div>
          ))}
        </div>

        {/* 日期 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {/* 填充上月空白 */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} style={{ aspectRatio: '1', borderRadius: 10 }} />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateKey = formatDate(day);
            const isToday = dateKey === `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
            const isSelected = dateKey === selectedDate;
            const act = dateActivity.get(dateKey);

            return (
              <button
                key={day}
                onClick={() => setSelectedDate(dateKey)}
                style={{
                  aspectRatio: '1',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 10,
                  border: isSelected ? '2px solid #7C3AED' : '2px solid transparent',
                  backgroundColor: isSelected ? '#EDE9FE' : isToday ? '#F5F5F4' : 'transparent',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: isToday ? 700 : 400,
                  color: isSelected ? '#5B21B6' : '#1C1917',
                  transition: 'all 150ms ease',
                  position: 'relative',
                }}
              >
                {day}
                {/* 活动指示点 */}
                {act && (
                  <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
                    {act.focus > 0 && <span style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#7C3AED' }} />}
                    {act.tasks > 0 && <span style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#3B82F6' }} />}
                    {act.habits > 0 && <span style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#10B981' }} />}
                    {act.journal && <span style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#EC4899' }} />}
                    {act.mood && <span style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#F59E0B' }} />}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* 图例 */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 10, fontSize: 11, color: '#A8A29E' }}>
          <span><Dot color="#7C3AED" /> 专注</span>
          <span><Dot color="#3B82F6" /> 任务</span>
          <span><Dot color="#10B981" /> 习惯</span>
          <span><Dot color="#EC4899" /> 日记</span>
          <span><Dot color="#F59E0B" /> 心情</span>
        </div>
      </div>

      {/* ===== 选中日期汇总 ===== */}
      <div>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1C1917', margin: '0 0 12px' }}>
          📅 {selectedDate}
          {selectedDate === `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}` && ' (今天)'}
        </h2>

        {!selectedActivity || (selectedActivity.focus === 0 && selectedActivity.tasks === 0 && selectedActivity.habits === 0 && !selectedActivity.journal && !selectedActivity.mood) ? (
          <EmptyDay />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* 时间线 */}
            {selectedFocus.length > 0 && (
              <TimelineView sessions={selectedFocus} />
            )}

            {/* 心情 */}
            {selectedMood && (
              <DayCard emoji="😊" title="心情" color="#F59E0B">
                <span style={{ fontSize: 32 }}>{selectedMood}</span>
              </DayCard>
            )}

            {/* 专注 */}
            {selectedFocus.length > 0 && (
              <DayCard emoji="🎯" title="专注记录" color="#7C3AED">
                {selectedFocus.map((s) => (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13, color: '#44403C' }}>
                    <span>{s.taskTitle || '自由专注'}</span>
                    <span style={{ color: '#7C3AED', fontWeight: 600 }}>{s.durationMinutes}分钟</span>
                  </div>
                ))}
                <div style={{ fontSize: 12, color: '#7C3AED', fontWeight: 600, marginTop: 4 }}>
                  合计: {selectedFocus.reduce((s, x) => s + x.durationMinutes, 0)}分钟 · {selectedFocus.filter((s) => s.sessionType === 'pomodoro').length}个番茄
                </div>
              </DayCard>
            )}

            {/* 任务 */}
            {selectedTasks.length > 0 && (
              <DayCard emoji="✅" title="任务活动" color="#3B82F6">
                {selectedTasks.map((t) => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', fontSize: 13 }}>
                    <span style={{ color: t.status === 'done' ? '#10B981' : '#3B82F6', fontSize: 12 }}>
                      {t.status === 'done' ? '✓' : '○'}
                    </span>
                    <span style={{ flex: 1, color: t.status === 'done' ? '#78716C' : '#292524', textDecoration: t.status === 'done' ? 'line-through' : undefined }}>
                      {t.title}
                    </span>
                  </div>
                ))}
              </DayCard>
            )}

            {/* 习惯 */}
            {selectedHabits.length > 0 && (
              <DayCard emoji="🔥" title="习惯打卡" color="#10B981">
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {selectedHabits.map((l) => {
                    const h = habits.find((x) => x.id === l.habitId);
                    return h ? (
                      <span key={l.habitId} style={{ fontSize: 13, padding: '3px 10px', borderRadius: 8, backgroundColor: '#D1FAE5', color: '#065F46' }}>
                        {h.icon} {h.name}
                      </span>
                    ) : null;
                  })}
                </div>
              </DayCard>
            )}

            {/* 日记 */}
            {selectedJournal && (
              <DayCard emoji="📝" title="日记" color="#EC4899">
                <div style={{ fontSize: 13, color: '#44403C', lineHeight: 1.6, maxHeight: 120, overflow: 'hidden' }}>
                  {selectedJournal.content.slice(0, 200)}
                  {selectedJournal.content.length > 200 && '...'}
                </div>
              </DayCard>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ===== 子组件 ===== */

function Dot({ color }: { color: string }) {
  return <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', backgroundColor: color, verticalAlign: 'middle', marginRight: 2 }} />;
}

function DayCard({ emoji, title, color, children }: { emoji: string; title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: '#FFF', borderRadius: 14, padding: '14px 16px', border: '1.5px solid #E7E5E4', borderLeft: `3px solid ${color}` }}>
      <p style={{ fontSize: 13, fontWeight: 600, color, margin: '0 0 8px' }}>{emoji} {title}</p>
      {children}
    </div>
  );
}

function TimelineView({ sessions }: { sessions: { id: string; taskTitle: string | null; startedAt: string; endedAt: string | null; durationMinutes: number; sessionType: string }[] }) {
  const sorted = [...sessions].sort((a, b) => a.startedAt.localeCompare(b.startedAt));

  const getTop = (iso: string) => {
    const d = new Date(iso);
    return ((d.getHours() * 60 + d.getMinutes()) / (24 * 60)) * 100;
  };

  return (
    <DayCard emoji="⏱️" title="今日时间线" color="#6366F1">
      <div style={{ position: 'relative', height: 200, backgroundColor: '#FAFAF9', borderRadius: 10, overflow: 'hidden', border: '1px solid #F5F5F4' }}>
        {/* 小时刻度 */}
        {[0, 6, 12, 18].map((h) => (
          <div key={h} style={{ position: 'absolute', top: `${(h / 24) * 100}%`, left: 0, right: 0, borderTop: '1px dashed #E7E5E4' }}>
            <span style={{ position: 'absolute', left: 2, top: -8, fontSize: 9, color: '#A8A29E', backgroundColor: '#FAFAF9', padding: '0 2px' }}>{String(h).padStart(2, '0')}:00</span>
          </div>
        ))}

        {/* 专注块 */}
        {sorted.map((s) => {
          const top = getTop(s.startedAt);
          const height = Math.max((s.durationMinutes / (24 * 60)) * 100, 2);
          const color = s.sessionType === 'break' ? '#10B981' : s.sessionType === 'pomodoro' ? '#7C3AED' : '#6366F1';
          return (
            <div key={s.id}
              title={`${s.taskTitle || '自由专注'} · ${s.durationMinutes}分钟`}
              style={{
                position: 'absolute', left: 30, right: 4, top: `${top}%`, height: `${height}%`,
                backgroundColor: color + '30', borderLeft: `3px solid ${color}`,
                borderRadius: '0 6px 6px 0', display: 'flex', alignItems: 'center',
                padding: '0 8px', fontSize: 11, color, fontWeight: 600,
                overflow: 'hidden', whiteSpace: 'nowrap',
              }}>
              {s.taskTitle || '自由专注'} · {s.durationMinutes}分
            </div>
          );
        })}
      </div>
    </DayCard>
  );
}

function EmptyDay() {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#A8A29E' }}>
      <p style={{ fontSize: 40, margin: '0 0 8px' }}>📭</p>
      <p style={{ fontSize: 15, margin: 0 }}>这一天没有记录</p>
      <p style={{ fontSize: 13, margin: '4px 0 0' }}>开始专注、完成任务或写日记都会出现在这里</p>
    </div>
  );
}

const navBtnStyle: React.CSSProperties = {
  width: 34, height: 34, borderRadius: '50%', border: '1.5px solid #E7E5E4',
  backgroundColor: '#FFF', fontSize: 14, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#78716C',
};
