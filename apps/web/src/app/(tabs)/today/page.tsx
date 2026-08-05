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

/* ---- 人生格言库 ---- */
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
  { text: '人生最大的遗憾不是失败，而是我本可以', author: '佚名' },
  { text: '深耕自己，才是最好的破圈', author: '佚名' },
  { text: '每一个不曾起舞的日子，都是对生命的辜负', author: '尼采' },
  { text: '流水不争先，争的是滔滔不绝', author: '老子' },
  { text: '万物皆有裂痕，那是光照进来的地方', author: 'Leonard Cohen' },
];

function pickQuote() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return QUOTES[dayOfYear % QUOTES.length]!;
}

export default function TodayPage() {
  const router = useRouter();
  const { tasks } = useTaskStore();
  const { getTodayStats } = useFocusStore();
  const [greeting, setGreeting] = useState('');
  const [mood, setMood] = useState<string | null>(null);
  const [quickInput, setQuickInput] = useState('');
  const [editingCity, setEditingCity] = useState(false);
  const [cityInput, setCityInput] = useState('');

  const saveCity = () => {
    if (cityInput.trim()) setWeatherCity(cityInput.trim());
    setEditingCity(false);
  };
  const [stats, setStats] = useState({ sessions: 0, minutes: 0, pomodoros: 0 });
  const [animatedStats, setAnimatedStats] = useState(stats);
  const [beijingTime, setBeijingTime] = useState('');
  const quote = pickQuote();

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 6) setGreeting('夜深了 🌙');
    else if (hour < 12) setGreeting('早上好 ☀️');
    else if (hour < 14) setGreeting('中午好 🌤️');
    else if (hour < 18) setGreeting('下午好 🌈');
    else setGreeting('晚上好 🌆');
    const saved = localStorage.getItem('flowos-mood-today');
    if (saved) {
      const { date, mood: m } = JSON.parse(saved);
      if (date === new Date().toISOString().split('T')[0]) setMood(m);
    }
  }, []);

  // 北京时间实时刷新
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const bj = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
      const h = String(bj.getHours()).padStart(2, '0');
      const m = String(bj.getMinutes()).padStart(2, '0');
      const s = String(bj.getSeconds()).padStart(2, '0');
      setBeijingTime(`${h}:${m}:${s}`);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const newStats = getTodayStats();
    setStats(newStats);
    // 数字滚动动画
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

  const todayDate = new Date();
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const dateStr = `${todayDate.getFullYear()}年${todayDate.getMonth() + 1}月${todayDate.getDate()}日 周${weekDays[todayDate.getDay()]}`;
  const todayStr = todayDate.toISOString().split('T')[0]!;

  const activeTasks = tasks.filter((t) => t.status !== 'done' && t.status !== 'archived').slice(0, 8);
  const todayDone = tasks.filter((t) => t.status === 'done' && t.updatedAt.startsWith(todayStr));
  const { weatherCity, setWeatherCity } = useSettingsStore();
  const weather = useWeather(weatherCity);

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

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '24px 20px' }}>
      {/* 头部 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 4px', color: '#1C1917' }}>
              {greeting}
            </h1>
            <p style={{ fontSize: 14, color: '#78716C', margin: 0 }}>{dateStr}</p>
          </div>
          {/* 北京时间 + 天气 */}
          <div style={{
            textAlign: 'right',
            backgroundColor: '#FFF',
            borderRadius: 12,
            padding: '10px 16px',
            border: '1.5px solid #E7E5E4',
          }}>
            <p style={{ fontSize: 11, color: '#A8A29E', margin: '0 0 2px' }}>北京时间</p>
            <p style={{
              fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)',
              color: '#1C1917', margin: 0, letterSpacing: 1,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {beijingTime || '--:--:--'}
            </p>
            {weather && (
              <div>
                <p style={{ fontSize: 12, color: '#78716C', margin: '4px 0 0' }}>
                  {weather.emoji} {weather.temp} {weather.condition}
                </p>
                {editingCity ? (
                  <input
                    autoFocus
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveCity(); }}
                    onBlur={saveCity}
                    placeholder="城市名"
                    style={{ fontSize: 10, width: 60, border: '1px solid #7C3AED', borderRadius: 4, padding: 1, marginTop: 2 }}
                  />
                ) : (
                  <button onClick={() => { setEditingCity(true); setCityInput(weatherCity); }}
                    style={{ fontSize: 10, color: '#A8A29E', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', padding: 0, marginTop: 2 }}>
                    📍 {weather.city} ▾
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 人生格言 */}
        <div style={{
          marginTop: 14,
          padding: '12px 16px',
          backgroundColor: '#FFF',
          borderRadius: 12,
          border: '1.5px solid #E7E5E4',
          borderLeft: '3px solid #7C3AED',
        }}>
          <p style={{ fontSize: 14, color: '#44403C', margin: '0 0 2px', fontStyle: 'italic' }}>
            「{quote.text}」
          </p>
          <p style={{ fontSize: 12, color: '#A8A29E', margin: 0 }}>
            —— {quote.author}
          </p>
        </div>

        {/* 每日金句 */}
        <DailyQuote />
      </div>

      {/* 统计卡片 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <StatCard label="今日专注" value={formatTime(animatedStats.minutes * 60)} emoji="⏱️" color="#7C3AED" />
        <StatCard label="完成番茄" value={`${animatedStats.pomodoros} 🍅`} emoji="🍅" color="#F59E0B" />
        <StatCard label="完成任务" value={`${todayDone.length}`} emoji="✅" color="#10B981" />
        <StatCard label="待办任务" value={`${activeTasks.length}`} emoji="📋" color="#3B82F6" />
      </div>

      {/* 两栏布局（桌面端） */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 16,
        }}
      >
        {/* 左栏 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 心情 */}
          <SectionCard title="今日心情" icon="😊">
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {MOODS.map((m) => (
                <button
                  key={m}
                  onClick={() => recordMood(m)}
                  style={{
                    fontSize: 26,
                    padding: '5px 7px',
                    border: 'none',
                    borderRadius: 10,
                    backgroundColor: mood === m ? '#EDE9FE' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                    transform: mood === m ? 'scale(1.15)' : 'scale(1)',
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          </SectionCard>

          {/* 今日习惯 */}
          <HabitCheckWidget />

          {/* 快速捕获 */}
          <SectionCard title="快速捕获" icon="✨">
            <input
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              onKeyDown={handleQuickCapture}
              placeholder="记录想法，Enter 添加到收件箱..."
              style={{
                width: '100%', border: 'none', outline: 'none', fontSize: 14,
                backgroundColor: 'transparent', padding: '4px 0', color: '#292524',
              }}
            />
          </SectionCard>

          {/* 今日日记 */}
          <SectionCard title="今日日记" icon="📝">
            <p style={{ fontSize: 13, color: '#78716C', margin: '0 0 10px' }}>
              记录今天的心情、收获和思考
            </p>
            <button onClick={() => router.push('/notes')}
              style={{ padding: '10px 20px', fontSize: 14, fontWeight: 600, color: '#FFF', backgroundColor: '#7C3AED', border: 'none', borderRadius: 10, cursor: 'pointer', width: '100%' }}>
              ✍️ 写日记
            </button>
          </SectionCard>

          {/* 本周专注 */}
          <WeeklyFocusCard />

          {/* 目标进度 */}
          <GoalProgressCard />

          {/* 今日小成就 */}
          <TodayAchievements />
        </div>

        {/* 右栏 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 任务列表 */}
          <SectionCard
            title="待办任务"
            icon="📌"
            action={activeTasks.length > 0 ? { label: '查看全部 →', onClick: () => router.push('/tasks') } : undefined}
          >
            {activeTasks.length === 0 ? (
              <EmptyPrompt emoji="🎉" text="今天没有待办任务" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {activeTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => router.push('/tasks')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 10px', borderRadius: 8, backgroundColor: '#FAFAF9',
                      cursor: 'pointer', transition: 'background 150ms ease',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F0EEFD'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#FAFAF9'; }}
                  >
                    <PriorityDot priority={task.priority} />
                    <span style={{ flex: 1, fontSize: 14, color: '#292524', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {task.title}
                    </span>
                    <StatusBadge status={task.status} />
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* 今日完成 */}
          {todayDone.length > 0 && (
            <SectionCard title="今日完成" icon="🎯">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {todayDone.map((task) => (
                  <div key={task.id} style={{ fontSize: 13, color: '#78716C', textDecoration: 'line-through', padding: '4px 0' }}>
                    ✓ {task.title}
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}

/* ========== 子组件 ========== */

function StatCard({ label, value, emoji, color }: { label: string; value: string; emoji: string; color: string }) {
  return (
    <div
      style={{
        backgroundColor: '#FFF', borderRadius: 16, padding: '16px 18px',
        border: '1.5px solid #E7E5E4', textAlign: 'center',
        transition: 'all 200ms ease', cursor: 'default',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = color;
        el.style.boxShadow = `0 4px 12px ${color}20`;
        el.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = '#E7E5E4';
        el.style.boxShadow = '';
        el.style.transform = '';
      }}
    >
      <p style={{ fontSize: 18, margin: '0 0 2px' }}>{emoji}</p>
      <p style={{ fontSize: 22, fontWeight: 700, color, margin: '0 0 4px', fontFamily: 'monospace' }}>
        {value}
      </p>
      <p style={{ fontSize: 12, color: '#A8A29E', margin: 0 }}>{label}</p>
    </div>
  );
}

function SectionCard({
  title, icon, action, children,
}: {
  title: string; icon: string; action?: { label: string; onClick: () => void }; children: React.ReactNode;
}) {
  return (
    <div style={{ backgroundColor: '#FFF', borderRadius: 16, padding: '16px', border: '1.5px solid #E7E5E4' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#44403C', margin: 0 }}>
          {icon} {title}
        </h3>
        {action && (
          <button
            onClick={action.onClick}
            style={{ border: 'none', backgroundColor: 'transparent', color: '#7C3AED', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}
          >
            {action.label}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function EmptyPrompt({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '20px 0', color: '#A8A29E' }}>
      <p style={{ fontSize: 28, margin: '0 0 6px' }}>{emoji}</p>
      <p style={{ fontSize: 13, margin: 0 }}>{text}</p>
    </div>
  );
}

function PriorityDot({ priority }: { priority: number }) {
  const colors = ['#EF4444', '#F59E0B', '#3B82F6', '#A8A29E'];
  return <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: colors[priority] ?? '#A8A29E', flexShrink: 0 }} />;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; text: string }> = {
    inbox: { label: '收件箱', bg: '#FEF3C7', text: '#92400E' },
    todo: { label: '待办', bg: '#DBEAFE', text: '#1E40AF' },
    doing: { label: '进行中', bg: '#EDE9FE', text: '#5B21B6' },
    done: { label: '完成', bg: '#D1FAE5', text: '#065F46' },
  };
  const s = map[status] ?? { label: status, bg: '#F5F5F4', text: '#78716C' };
  return (
    <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 4, backgroundColor: s.bg, color: s.text, fontWeight: 500 }}>
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
    <SectionCard title="今日习惯" icon="🔥">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {habits.map((h) => {
          const done = isCompleted(h.id, todayStr);
          const streak = getStreak(h.id);
          return (
            <div key={h.id}
              onClick={() => toggleLog(h.id, todayStr)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                borderRadius: 10, backgroundColor: done ? '#D1FAE5' : '#FAFAF9',
                cursor: 'pointer', transition: 'all 150ms ease',
                border: `1.5px solid ${done ? '#10B981' : '#E7E5E4'}`,
              }}
            >
              <span style={{
                width: 26, height: 26, borderRadius: '50%',
                border: `2px solid ${done ? '#10B981' : '#D6D3D1'}`,
                backgroundColor: done ? '#10B981' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#FFF', fontSize: 14, flexShrink: 0, transition: 'all 150ms ease',
              }}>
                {done ? '✓' : ''}
              </span>
              <span style={{ fontSize: 22 }}>{h.icon}</span>
              <span style={{ flex: 1, fontSize: 14, fontWeight: done ? 400 : 500, color: done ? '#065F46' : '#292524' }}>
                {h.name}
              </span>
              {streak > 0 && (
                <span style={{ fontSize: 12, fontWeight: 600, color: '#F59E0B' }}>
                  🔥 {streak}天
                </span>
              )}
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

function WeeklyFocusCard() {
  const { getWeekStats } = useFocusStore();
  const weekStats = getWeekStats();

  return (
    <SectionCard title="本周专注" icon="📊">
      <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
        <MiniStat label="专注天数" value={`${weekStats.days}`} />
        <MiniStat label="专注次数" value={`${weekStats.sessions}`} />
        <MiniStat label="总时长" value={`${Math.floor(weekStats.minutes / 60)}h ${weekStats.minutes % 60}m`} />
        <MiniStat label="番茄数" value={`${weekStats.pomodoros} 🍅`} />
      </div>
    </SectionCard>
  );
}

function GoalProgressCard() {
  const { getActiveObjectives, getOverallProgress } = useGoalStore();
  const objectives = getActiveObjectives();
  if (objectives.length === 0) return null;
  return (
    <SectionCard title="目标进度" icon="🎯">
      {objectives.slice(0, 2).map((obj) => {
        const p = getOverallProgress(obj.id);
        return (
          <div key={obj.id} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 13, color: '#292524' }}>{obj.title}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: obj.color }}>{p}%</span>
            </div>
            <div style={{ height: 6, backgroundColor: '#F5F5F4', borderRadius: 3 }}>
              <div style={{ height: '100%', width: `${p}%`, backgroundColor: obj.color, borderRadius: 3, transition: 'width 0.5s ease' }} />
            </div>
            <div style={{ fontSize: 11, color: '#A8A29E', marginTop: 3 }}>{obj.keyResults.length} KR · {obj.timePeriod}</div>
          </div>
        );
      })}
    </SectionCard>
  );
}

function DailyQuote() {
  const quotes = [
    { text: '每天都是一年中最美好的一天', author: '爱默生' },
    { text: '行动是治愈恐惧的良药', author: '卡耐基' },
    { text: '不积跬步，无以至千里', author: '荀子' },
    { text: '心之所向，素履以往', author: '七堇年' },
    { text: '你做三四月的事，在八九月自有答案', author: '余世存' },
    { text: '专注是智慧的门，静心是力量的源', author: '心流OS' },
    { text: '每一天都值得被认真对待', author: '心流OS' },
    { text: '与其焦虑未来，不如专注当下', author: '心流OS' },
  ];
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  const q = quotes[dayOfYear % quotes.length]!;
  return (
    <div style={{
      marginTop: 10, padding: '10px 16px',
      backgroundColor: '#FFF', borderRadius: 12,
      border: '1.5px solid #E7E5E4', borderLeft: '3px solid #F59E0B',
    }}>
      <p style={{ fontSize: 14, color: '#44403C', margin: '0 0 2px', fontStyle: 'italic' }}>「{q.text}」</p>
      <p style={{ fontSize: 12, color: '#A8A29E', margin: 0 }}>—— {q.author}</p>
    </div>
  );
}

function TodayAchievements() {
  const { tasks } = useTaskStore();
  const todayStr = new Date().toISOString().split('T')[0]!;
  const done = tasks.filter((t) => t.status === 'done' && t.updatedAt.startsWith(todayStr));
  if (done.length === 0) return null;
  return (
    <SectionCard title="今日小成就" icon="🏆">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {done.map((t) => (
          <div key={t.id} style={{ fontSize: 13, color: '#292524', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#10B981', fontSize: 14 }}>✓</span>
            <span style={{ textDecoration: 'line-through', color: '#78716C' }}>{t.title}</span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12, color: '#10B981', fontWeight: 600, margin: '6px 0 0' }}>共完成 {done.length} 项 🎉</p>
    </SectionCard>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontSize: 17, fontWeight: 700, color: '#1C1917', margin: '0 0 2px' }}>{value}</p>
      <p style={{ fontSize: 11, color: '#A8A29E', margin: 0 }}>{label}</p>
    </div>
  );
}
