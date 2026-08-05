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
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 'var(--space-12) var(--space-6) var(--space-16)' }}>
      {/* 头部 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--space-6)' }}>
        <h1
          className="display-medium"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--color-text)',
            margin: 0,
          }}
        >
          日历
        </h1>
        <button
          onClick={goToday}
          style={{
            padding: 'var(--space-1) var(--space-4)',
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--color-primary)',
            backgroundColor: 'var(--color-primary-subtle)',
            border: 'none',
            borderRadius: 'var(--radius-full)',
            cursor: 'pointer',
            transition: 'var(--transition-fast)',
          }}
        >
          今天
        </button>
      </div>

      {/* 月份导航 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <button onClick={prevMonth} style={navBtnStyle}>◀</button>
        <span
          className="heading-2"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--color-text)',
          }}
        >
          {year}年 {monthNames[month]}
        </span>
        <button onClick={nextMonth} style={navBtnStyle}>▶</button>
      </div>

      {/* 日历格子 */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-4)',
          border: '1px solid var(--color-divider)',
          marginBottom: 'var(--space-8)',
        }}
      >
        {/* 星期头 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 'var(--space-1)', marginBottom: 'var(--space-2)' }}>
          {weekDays.map((d) => (
            <div
              key={d}
              className="caption"
              style={{
                textAlign: 'center',
                fontFamily: 'var(--font-body)',
                color: 'var(--color-text-muted)',
                padding: 'var(--space-1) 0',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* 日期 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 'var(--space-1)' }}>
          {/* 填充上月空白 */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} style={{ aspectRatio: '1', borderRadius: 'var(--radius-md)' }} />
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
                  borderRadius: 'var(--radius-md)',
                  border: isSelected
                    ? '1.5px solid var(--color-primary)'
                    : '1.5px solid transparent',
                  backgroundColor: isSelected
                    ? 'var(--color-primary-subtle)'
                    : isToday
                      ? 'var(--color-surface-hover)'
                      : 'transparent',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  fontSize: 14,
                  fontWeight: isToday ? 700 : 400,
                  color: isSelected
                    ? 'var(--color-primary)'
                    : 'var(--color-text)',
                  transition: 'var(--transition-fast)',
                  position: 'relative',
                }}
              >
                {day}
                {/* 活动指示点 */}
                {act && (
                  <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
                    {act.focus > 0 && <Dot color="var(--color-primary)" />}
                    {act.tasks > 0 && <Dot color="var(--color-info)" />}
                    {act.habits > 0 && <Dot color="var(--color-success)" />}
                    {act.journal && <Dot color="#EC4899" />}
                    {act.mood && <Dot color="var(--color-warning)" />}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* 图例 */}
        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', marginTop: 'var(--space-3)', fontFamily: 'var(--font-body)', color: 'var(--color-text-muted)' }}>
          <LegendDot color="var(--color-primary)" label="专注" />
          <LegendDot color="var(--color-info)" label="任务" />
          <LegendDot color="var(--color-success)" label="习惯" />
          <LegendDot color="#EC4899" label="日记" />
          <LegendDot color="var(--color-warning)" label="心情" />
        </div>
      </div>

      {/* ===== 选中日期汇总 ===== */}
      <div>
        <h2
          className="heading-2"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--color-text)',
            margin: '0 0 var(--space-4)',
          }}
        >
          📅 {selectedDate}
          {selectedDate === `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}` && ' (今天)'}
        </h2>

        {!selectedActivity || (selectedActivity.focus === 0 && selectedActivity.tasks === 0 && selectedActivity.habits === 0 && !selectedActivity.journal && !selectedActivity.mood) ? (
          <EmptyDay />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* 时间线 */}
            {selectedFocus.length > 0 && (
              <TimelineView sessions={selectedFocus} />
            )}

            {/* 心情 */}
            {selectedMood && (
              <DayCard emoji="😊" title="心情" accentColor="var(--color-primary)">
                <span style={{ fontSize: 36 }}>{selectedMood}</span>
              </DayCard>
            )}

            {/* 专注 */}
            {selectedFocus.length > 0 && (
              <DayCard emoji="🎯" title="专注记录" accentColor="var(--color-primary)">
                {selectedFocus.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: 'var(--space-1) 0',
                      fontFamily: 'var(--font-body)',
                      fontSize: 13,
                      color: 'var(--color-text)',
                    }}
                  >
                    <span>{s.taskTitle || '自由专注'}</span>
                    <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                      {s.durationMinutes}分钟
                    </span>
                  </div>
                ))}
                <div
                  className="body-small"
                  style={{
                    fontFamily: 'var(--font-body)',
                    color: 'var(--color-primary)',
                    fontWeight: 600,
                    marginTop: 'var(--space-1)',
                  }}
                >
                  合计: {selectedFocus.reduce((s, x) => s + x.durationMinutes, 0)}分钟 · {selectedFocus.filter((s) => s.sessionType === 'pomodoro').length}个番茄
                </div>
              </DayCard>
            )}

            {/* 任务 */}
            {selectedTasks.length > 0 && (
              <DayCard emoji="✅" title="任务活动" accentColor="var(--color-info)">
                {selectedTasks.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      padding: 'var(--space-1) 0',
                      fontFamily: 'var(--font-body)',
                      fontSize: 13,
                    }}
                  >
                    <span
                      style={{
                        color: t.status === 'done' ? 'var(--color-success)' : 'var(--color-info)',
                        fontSize: 12,
                      }}
                    >
                      {t.status === 'done' ? '✓' : '○'}
                    </span>
                    <span
                      style={{
                        flex: 1,
                        color: t.status === 'done' ? 'var(--color-text-secondary)' : 'var(--color-text)',
                        textDecoration: t.status === 'done' ? 'line-through' : undefined,
                      }}
                    >
                      {t.title}
                    </span>
                  </div>
                ))}
              </DayCard>
            )}

            {/* 习惯 */}
            {selectedHabits.length > 0 && (
              <DayCard emoji="🔥" title="习惯打卡" accentColor="var(--color-success)">
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  {selectedHabits.map((l) => {
                    const h = habits.find((x) => x.id === l.habitId);
                    return h ? (
                      <span
                        key={l.habitId}
                        style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: 13,
                          padding: 'var(--space-1) var(--space-3)',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--color-success)',
                          color: 'var(--color-bg)',
                          opacity: 0.85,
                        }}
                      >
                        {h.icon} {h.name}
                      </span>
                    ) : null;
                  })}
                </div>
              </DayCard>
            )}

            {/* 日记 */}
            {selectedJournal && (
              <DayCard emoji="📝" title="日记" accentColor="#EC4899">
                <div
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 13,
                    color: 'var(--color-text)',
                    lineHeight: 1.7,
                    maxHeight: 120,
                    overflow: 'hidden',
                  }}
                >
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
  return (
    <span
      style={{
        display: 'inline-block',
        width: 5,
        height: 5,
        borderRadius: 'var(--radius-full)',
        backgroundColor: color,
      }}
    />
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span
      className="caption"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-1)',
        fontFamily: 'var(--font-body)',
        color: 'var(--color-text-muted)',
      }}
    >
      <Dot color={color} /> {label}
    </span>
  );
}

function DayCard({
  emoji,
  title,
  accentColor,
  children,
}: {
  emoji: string;
  title: string;
  accentColor: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-4)',
        border: '1px solid var(--color-divider)',
        borderLeft: `3px solid ${accentColor}`,
      }}
    >
      <p
        className="label-text"
        style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 600,
          color: accentColor,
          margin: '0 0 var(--space-2)',
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
        }}
      >
        {emoji} {title}
      </p>
      {children}
    </div>
  );
}

function TimelineView({
  sessions,
}: {
  sessions: {
    id: string;
    taskTitle: string | null;
    startedAt: string;
    endedAt: string | null;
    durationMinutes: number;
    sessionType: string;
  }[];
}) {
  const sorted = [...sessions].sort((a, b) => a.startedAt.localeCompare(b.startedAt));

  const getTop = (iso: string) => {
    const d = new Date(iso);
    return ((d.getHours() * 60 + d.getMinutes()) / (24 * 60)) * 100;
  };

  return (
    <DayCard emoji="⏱️" title="今日时间线" accentColor="#6366F1">
      <div
        style={{
          position: 'relative',
          height: 200,
          backgroundColor: 'var(--color-bg)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          border: '1px solid var(--color-divider)',
        }}
      >
        {/* 小时刻度 */}
        {[0, 6, 12, 18].map((h) => (
          <div
            key={h}
            style={{
              position: 'absolute',
              top: `${(h / 24) * 100}%`,
              left: 0,
              right: 0,
              borderTop: '1px dashed var(--color-divider)',
            }}
          >
            <span
              className="caption"
              style={{
                position: 'absolute',
                left: 2,
                top: -8,
                fontFamily: 'var(--font-body)',
                color: 'var(--color-text-muted)',
                backgroundColor: 'var(--color-bg)',
                padding: '0 2px',
              }}
            >
              {String(h).padStart(2, '0')}:00
            </span>
          </div>
        ))}

        {/* 专注块 */}
        {sorted.map((s) => {
          const top = getTop(s.startedAt);
          const height = Math.max((s.durationMinutes / (24 * 60)) * 100, 2);
          const color =
            s.sessionType === 'break'
              ? 'var(--color-success)'
              : s.sessionType === 'pomodoro'
                ? 'var(--color-primary)'
                : '#6366F1';
          return (
            <div
              key={s.id}
              title={`${s.taskTitle || '自由专注'} · ${s.durationMinutes}分钟`}
              style={{
                position: 'absolute',
                left: 30,
                right: 4,
                top: `${top}%`,
                height: `${height}%`,
                backgroundColor: `${color}30`,
                borderLeft: `3px solid ${color}`,
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                padding: '0 var(--space-2)',
                fontFamily: 'var(--font-body)',
                fontSize: 11,
                color: color,
                fontWeight: 600,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
            >
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
    <div
      style={{
        textAlign: 'center',
        padding: 'var(--space-12) var(--space-6)',
        color: 'var(--color-text-muted)',
      }}
    >
      <p style={{ fontSize: 44, margin: '0 0 var(--space-2)', lineHeight: 1 }}>📭</p>
      <p
        className="heading-3"
        style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--color-text)',
          margin: '0 0 var(--space-1)',
        }}
      >
        这一天没有记录
      </p>
      <p
        className="body-small"
        style={{
          fontFamily: 'var(--font-body)',
          color: 'var(--color-text-muted)',
          margin: 0,
        }}
      >
        开始专注、完成任务或写日记都会出现在这里
      </p>
    </div>
  );
}

const navBtnStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 'var(--radius-full)',
  border: '1px solid var(--color-border)',
  backgroundColor: 'transparent',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--color-text-secondary)',
  transition: 'var(--transition-fast)',
};
