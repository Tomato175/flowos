'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTaskStore } from '@/stores/useTaskStore';
import { useFocusStore } from '@/stores/useFocusStore';
import { useHabitStore } from '@/stores/useHabitStore';
import { useGoalStore } from '@/stores/useGoalStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { formatTime } from '@/hooks/useTimer';
import { useWeather } from '@/hooks/useWeather';

const MOODS = ['😄', '😊', '😐', '😢', '😡', '🤩', '😴', '😌'];

const QUOTES = [
  { text: '日拱一卒，功不唐捐', author: '胡适' },
  { text: '现在就是最好的开始', author: '佚名' },
  { text: '专注是新的超能力', author: 'Cal Newport' },
  { text: '不积跬步，无以至千里', author: '荀子' },
  { text: '完成比完美更重要', author: '佚名' },
  { text: '心之所向，素履以往', author: '木心' },
  { text: '你专注的每一分钟，都在塑造未来的你', author: '佚名' },
  { text: 'Less but better', author: 'Dieter Rams' },
  { text: '戒骄戒躁，行稳致远', author: '佚名' },
  { text: '深耕自己，才是最好的破圈', author: '佚名' },
  { text: '流水不争先，争的是滔滔不绝', author: '老子' },
  { text: '万物皆有裂痕，那是光照进来的地方', author: 'Leonard Cohen' },
];

function pickQuote() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return QUOTES[dayOfYear % QUOTES.length]!;
}

// ─── 交错动画辅助 ───
const stagger = (i: number) => ({
  animationDelay: `${i * 60}ms`,
});

export default function TodayPage() {
  const router = useRouter();
  const { tasks } = useTaskStore();
  const { getTodayStats } = useFocusStore();
  const [greeting, setGreeting] = useState('');
  const [mood, setMood] = useState<string | null>(null);
  const [quickInput, setQuickInput] = useState('');
  const [editingCity, setEditingCity] = useState(false);
  const [cityInput, setCityInput] = useState('');
  const [stats, setStats] = useState({ sessions: 0, minutes: 0, pomodoros: 0 });
  const [animatedStats, setAnimatedStats] = useState(stats);
  const [beijingTime, setBeijingTime] = useState('');
  const quote = pickQuote();

  const { weatherCity, setWeatherCity } = useSettingsStore();
  const weather = useWeather(weatherCity);

  const todayDate = new Date();
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const dateStr = `${todayDate.getFullYear()}年${todayDate.getMonth() + 1}月${todayDate.getDate()}日 周${weekDays[todayDate.getDay()]}`;
  const todayStr = todayDate.toISOString().split('T')[0]!;

  const activeTasks = tasks.filter((t) => t.status !== 'done' && t.status !== 'archived').slice(0, 8);
  const todayDone = tasks.filter((t) => t.status === 'done' && t.updatedAt.startsWith(todayStr));

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 6) setGreeting('夜深了');
    else if (hour < 12) setGreeting('早上好');
    else if (hour < 14) setGreeting('中午好');
    else if (hour < 18) setGreeting('下午好');
    else setGreeting('晚上好');
    const saved = localStorage.getItem('flowos-mood-today');
    if (saved) {
      const { date, mood: m } = JSON.parse(saved);
      if (date === todayStr) setMood(m);
    }
  }, []);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const bj = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
      setBeijingTime(`${String(bj.getHours()).padStart(2, '0')}:${String(bj.getMinutes()).padStart(2, '0')}`);
    };
    update();
    const timer = setInterval(update, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const newStats = getTodayStats();
    setStats(newStats);
    const duration = 600;
    const steps = 20;
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setAnimatedStats({
        sessions: Math.round(newStats.sessions * progress),
        minutes: Math.round(newStats.minutes * progress),
        pomodoros: Math.round(newStats.pomodoros * progress),
      });
      if (progress >= 1) clearInterval(timer);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [getTodayStats]);

  const recordMood = (m: string) => {
    setMood(m);
    localStorage.setItem('flowos-mood-today', JSON.stringify({ date: todayStr, mood: m }));
  };

  const handleQuickCapture = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && quickInput.trim()) {
      useTaskStore.getState().addTask({
        title: quickInput.trim(),
        description: '',
        status: 'inbox',
        priority: 2,
        dueDate: null,
        estimatedMinutes: null,
        projectId: null,
        tags: [],
        isRecurring: false,
      });
      setQuickInput('');
    }
  };

  const saveCity = () => {
    if (cityInput.trim()) setWeatherCity(cityInput.trim());
    setEditingCity(false);
  };

  return (
    <div style={{
      maxWidth: 840,
      margin: '0 auto',
      padding: 'var(--space-12) var(--space-6) var(--space-16)',
    }}>
      {/* ═══════════ 卷首：Hero ═══════════ */}
      <header style={{ marginBottom: 'var(--space-12)' }}>
        {/* 日期小标 — 杂志眉题 */}
        <p className="caption" style={{ marginBottom: 'var(--space-2)' }}>
          {dateStr}
        </p>

        {/* 主标题 — 衬线大字 */}
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-5xl)',
          fontWeight: 'var(--weight-bold)',
          lineHeight: 'var(--leading-tight)',
          letterSpacing: 'var(--tracking-tight)',
          color: 'var(--color-text)',
          marginBottom: 'var(--space-2)',
        }}>
          {greeting}
        </h1>

        {/* 时间 + 天气行 — 像杂志副标题 */}
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 'var(--space-4)',
          flexWrap: 'wrap',
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-2xl)',
            fontWeight: 'var(--weight-light)',
            color: 'var(--color-text-secondary)',
            letterSpacing: '0.04em',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {beijingTime || '--:--'} <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>北京时间</span>
          </span>
          {weather && (
            <span style={{
              fontSize: 'var(--text-base)',
              color: 'var(--color-text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-1)',
            }}>
              {weather.emoji} {weather.temp} {weather.condition}
              {editingCity ? (
                <input
                  autoFocus
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveCity(); }}
                  onBlur={saveCity}
                  placeholder="城市名"
                  style={{ fontSize: 'var(--text-xs)', width: 56, border: '1px solid var(--color-primary)', borderRadius: 3, padding: '1px 3px', marginLeft: 2 }}
                />
              ) : (
                <button onClick={() => { setEditingCity(true); setCityInput(weatherCity); }}
                  style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', border: 'none', background: 'none', cursor: 'pointer', padding: 0, marginLeft: 2 }}>
                  📍 {weather.city}
                </button>
              )}
            </span>
          )}
        </div>
      </header>

      {/* ═══════════ 引言 — Pull Quote 杂志式 ═══════════ */}
      <blockquote style={{
        margin: '0 0 var(--space-10)',
        padding: 'var(--space-6) 0',
        borderTop: '1px solid var(--color-divider)',
        borderBottom: '1px solid var(--color-divider)',
      }}>
        <p style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-xl)',
          lineHeight: 'var(--leading-relaxed)',
          color: 'var(--color-text)',
          fontStyle: 'italic',
          margin: '0 0 var(--space-2)',
        }}>
          「{quote.text}」
        </p>
        <p className="caption">
          —— {quote.author}
        </p>
      </blockquote>

      {/* ═══════════ 数据摘要 — 数字排版 ═══════════ */}
      <section style={{ marginBottom: 'var(--space-10)' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: 'var(--space-6)',
        }}>
          <NumberStat label="今日专注" value={formatTime(animatedStats.minutes * 60)} accent="var(--color-primary)" />
          <NumberStat label="完成番茄" value={`${animatedStats.pomodoros}`} accent="var(--color-accent-gold)" unit="🍅" />
          <NumberStat label="完成任务" value={`${todayDone.length}`} accent="var(--color-success)" unit="项" />
          <NumberStat label="待办任务" value={`${activeTasks.length}`} accent="var(--color-info)" unit="项" />
        </div>
      </section>

      {/* ═══════════ 主体：双栏杂志布局 ═══════════ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: 'var(--space-10) var(--space-12)',
      }}>
        {/* ── 左栏 ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
          {/* 心情 */}
          <EditorialSection title="今日心情" index={0}>
            <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
              {MOODS.map((m, i) => (
                <button
                  key={m}
                  onClick={() => recordMood(m)}
                  style={{
                    fontSize: '1.5em',
                    padding: 'var(--space-1) var(--space-2)',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    background: mood === m ? 'var(--color-primary-subtle)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background var(--transition-fast), transform var(--transition-fast)',
                    transform: mood === m ? 'scale(1.12)' : 'scale(1)',
                    lineHeight: 1,
                    ...stagger(i),
                  }}
                  className="stagger-item"
                >
                  {m}
                </button>
              ))}
            </div>
          </EditorialSection>

          {/* 习惯 */}
          <HabitCheckWidget />

          {/* 快速捕获 */}
          <EditorialSection title="快速捕获" index={1}>
            <input
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              onKeyDown={handleQuickCapture}
              placeholder="记录想法，Enter 添加到收件箱…"
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                fontSize: 'var(--text-base)',
                background: 'transparent',
                padding: 'var(--space-2) 0',
                color: 'var(--color-text)',
              }}
            />
          </EditorialSection>

          {/* 今日日记 */}
          <EditorialSection title="今日日记" index={2}>
            <p className="body-small" style={{ marginBottom: 'var(--space-3)' }}>
              记录今天的心情、收获和思考
            </p>
            <button
              onClick={() => router.push('/notes')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-2) var(--space-5)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--weight-medium)',
                color: 'var(--color-surface)',
                background: 'var(--color-primary)',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
                transition: 'background var(--transition-fast)',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--color-primary-dark)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--color-primary)'; }}
            >
              写日记
            </button>
          </EditorialSection>

          {/* 本周专注 */}
          <WeeklyFocusCard />

          {/* 目标进度 */}
          <GoalProgressCard />

          {/* 今日小成就 */}
          <TodayAchievements />
        </div>

        {/* ── 右栏 ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
          {/* 待办任务 */}
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: 'var(--space-4)',
            }}>
              <h2 className="heading-3">待办</h2>
              {activeTasks.length > 0 && (
                <button
                  onClick={() => router.push('/tasks')}
                  className="body-small"
                  style={{
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  查看全部 →
                </button>
              )}
            </div>

            {activeTasks.length === 0 ? (
              <p className="body-small" style={{ padding: 'var(--space-8) 0', textAlign: 'center' }}>
                今天没有待办任务 ✨
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                {activeTasks.map((task, i) => (
                  <div
                    key={task.id}
                    onClick={() => router.push('/tasks')}
                    className="stagger-item"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-3)',
                      padding: 'var(--space-2) var(--space-3)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      transition: 'background var(--transition-fast)',
                      ...stagger(i),
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--color-surface-hover)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <PriorityDot priority={task.priority} />
                    <span style={{
                      flex: 1,
                      fontSize: 'var(--text-sm)',
                      color: 'var(--color-text)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {task.title}
                    </span>
                    <TaskStatusBadge status={task.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 今日完成 */}
          {todayDone.length > 0 && (
            <div>
              <h2 className="heading-3" style={{ marginBottom: 'var(--space-3)' }}>今日完成</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                {todayDone.map((task) => (
                  <div key={task.id} className="body-small" style={{
                    textDecoration: 'line-through',
                    padding: 'var(--space-1) 0',
                    color: 'var(--color-text-muted)',
                  }}>
                    {task.title}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 每日金句 — 杂志侧边栏小元素 */}
          <DailyQuoteSidebar />
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   子组件
   ══════════════════════════════════════════ */

function NumberStat({ label, value, accent, unit }: { label: string; value: string; accent: string; unit?: string }) {
  return (
    <div>
      <p className="caption" style={{ marginBottom: 'var(--space-1)' }}>{label}</p>
      <p style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-3xl)',
        fontWeight: 'var(--weight-bold)',
        color: accent,
        lineHeight: 1,
        marginBottom: unit ? 'var(--space-1)' : 0,
      }}>
        {value}
      </p>
      {unit && (
        <span className="body-small" style={{ color: 'var(--color-text-muted)' }}>{unit}</span>
      )}
    </div>
  );
}

function EditorialSection({ title, index, children }: { title: string; index: number; children: React.ReactNode }) {
  return (
    <section className="stagger-item" style={stagger(index)}>
      <h2 className="label-text" style={{ marginBottom: 'var(--space-3)' }}>{title}</h2>
      {children}
    </section>
  );
}

function PriorityDot({ priority }: { priority: number }) {
  const colors = ['var(--color-error)', 'var(--color-warning)', 'var(--color-info)', 'var(--color-text-muted)'];
  return (
    <span style={{
      width: 6,
      height: 6,
      borderRadius: '50%',
      backgroundColor: colors[priority] ?? 'var(--color-text-muted)',
      flexShrink: 0,
    }} />
  );
}

function TaskStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    inbox: { label: '收件箱', bg: 'var(--color-warning-light)', color: 'var(--color-warning)' },
    todo: { label: '待办', bg: 'var(--color-info-light)', color: 'var(--color-info)' },
    doing: { label: '进行中', bg: 'var(--color-primary-subtle)', color: 'var(--color-primary-dark)' },
    done: { label: '完成', bg: 'var(--color-success-light)', color: 'var(--color-success)' },
  };
  const s = map[status] ?? { label: status, bg: 'var(--color-border-light)', color: 'var(--color-text-muted)' };
  return (
    <span className="caption" style={{
      padding: '2px 6px',
      borderRadius: 'var(--radius-xs)',
      background: s.bg,
      color: s.color,
    }}>
      {s.label}
    </span>
  );
}

function HabitCheckWidget() {
  const { getActiveHabits, toggleLog, isCompleted, getStreak } = useHabitStore();
  const todayStr = new Date().toISOString().split('T')[0]!;
  const habits = getActiveHabits();
  if (habits.length === 0) return null;

  return (
    <section className="stagger-item" style={stagger(1)}>
      <h2 className="label-text" style={{ marginBottom: 'var(--space-3)' }}>今日习惯</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {habits.map((h, i) => {
          const done = isCompleted(h.id, todayStr);
          const streak = getStreak(h.id);
          return (
            <div key={h.id}
              onClick={() => toggleLog(h.id, todayStr)}
              className="stagger-item"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-sm)',
                background: done ? 'var(--color-success-light)' : 'var(--color-surface-hover)',
                cursor: 'pointer',
                transition: 'background var(--transition-fast), border-color var(--transition-fast)',
                border: '1px solid transparent',
                borderColor: done ? 'var(--color-success)' : 'transparent',
                ...stagger(i),
              }}
            >
              <span style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                border: `2px solid ${done ? 'var(--color-success)' : 'var(--color-border)'}`,
                background: done ? 'var(--color-success)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 'var(--text-xs)',
                flexShrink: 0,
                transition: 'all var(--transition-fast)',
              }}>
                {done ? '✓' : ''}
              </span>
              <span style={{ fontSize: '1.1em', lineHeight: 1 }}>{h.icon}</span>
              <span style={{
                flex: 1,
                fontSize: 'var(--text-sm)',
                fontWeight: done ? 'var(--weight-normal)' : 'var(--weight-medium)',
                color: done ? 'var(--color-success)' : 'var(--color-text)',
              }}>
                {h.name}
              </span>
              {streak > 0 && (
                <span className="caption" style={{ color: 'var(--color-accent-gold)' }}>
                  {streak}天
                </span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function WeeklyFocusCard() {
  const { getWeekStats } = useFocusStore();
  const weekStats = getWeekStats();

  return (
    <section className="stagger-item" style={stagger(3)}>
      <h2 className="label-text" style={{ marginBottom: 'var(--space-3)' }}>本周专注</h2>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: 'var(--space-3) var(--space-4)',
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-md)',
      }}>
        <MiniStat label="专注天数" value={`${weekStats.days}`} />
        <MiniStat label="专注次数" value={`${weekStats.sessions}`} />
        <MiniStat label="总时长" value={`${Math.floor(weekStats.minutes / 60)}h`} />
        <MiniStat label="番茄数" value={`${weekStats.pomodoros}`} />
      </div>
    </section>
  );
}

function GoalProgressCard() {
  const { getActiveObjectives, getOverallProgress } = useGoalStore();
  const objectives = getActiveObjectives();
  if (objectives.length === 0) return null;

  return (
    <section className="stagger-item" style={stagger(4)}>
      <h2 className="label-text" style={{ marginBottom: 'var(--space-3)' }}>目标进度</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {objectives.slice(0, 2).map((obj, i) => {
          const p = getOverallProgress(obj.id);
          return (
            <div key={obj.id} className="stagger-item" style={stagger(i)}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 'var(--space-2)',
              }}>
                <span className="body-small" style={{ color: 'var(--color-text)' }}>{obj.title}</span>
                <span style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--weight-semibold)',
                  color: obj.color,
                }}>
                  {p}%
                </span>
              </div>
              <div style={{
                height: 4,
                background: 'var(--color-border-light)',
                borderRadius: 2,
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${p}%`,
                  background: obj.color,
                  borderRadius: 2,
                  transition: 'width var(--transition-slow) var(--ease-out-quart)',
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function DailyQuoteSidebar() {
  const quotes = [
    { text: '你做三四月的事，在八九月自有答案', author: '余世存' },
    { text: '专注是智慧的门，静心是力量的源', author: '心流' },
    { text: '与其焦虑未来，不如专注当下', author: '心流' },
  ];
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  const q = quotes[dayOfYear % quotes.length]!;

  return (
    <aside style={{
      marginTop: 'var(--space-4)',
      padding: 'var(--space-6) var(--space-5)',
      background: 'var(--color-surface)',
      borderRadius: 'var(--radius-md)',
      borderLeft: '2px solid var(--color-accent-gold)',
    }}>
      <p style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-lg)',
        lineHeight: 'var(--leading-relaxed)',
        color: 'var(--color-text)',
        fontStyle: 'italic',
        margin: '0 0 var(--space-2)',
      }}>
        「{q.text}」
      </p>
      <p className="caption">—— {q.author}</p>
    </aside>
  );
}

function TodayAchievements() {
  const { tasks } = useTaskStore();
  const todayStr = new Date().toISOString().split('T')[0]!;
  const done = tasks.filter((t) => t.status === 'done' && t.updatedAt.startsWith(todayStr));
  if (done.length === 0) return null;

  return (
    <section className="stagger-item" style={stagger(5)}>
      <h2 className="label-text" style={{ marginBottom: 'var(--space-3)' }}>今日小成就</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
        {done.map((t) => (
          <div key={t.id} className="body-small" style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            color: 'var(--color-text-muted)',
            textDecoration: 'line-through',
            padding: 'var(--space-1) 0',
          }}>
            {t.title}
          </div>
        ))}
      </div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-xl)',
        fontWeight: 'var(--weight-bold)',
        color: 'var(--color-text)',
        margin: '0 0 2px',
      }}>
        {value}
      </p>
      <p className="caption">{label}</p>
    </div>
  );
}
