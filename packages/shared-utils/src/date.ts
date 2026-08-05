// ============================================================
// 日期时间工具
// ============================================================

/**
 * 格式化日期为 YYYY-MM-DD
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0]!;
}

/**
 * 格式化日期为中文
 */
export function formatDateCN(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

/**
 * 格式化时间为 HH:MM
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * 获取相对时间描述
 */
export function timeAgo(date: Date | string): string {
  const now = Date.now();
  const then = typeof date === 'string' ? new Date(date).getTime() : date.getTime();
  const diff = now - then;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 30) return formatDateCN(date);
  if (days > 0) return `${days}天前`;
  if (hours > 0) return `${hours}小时前`;
  if (minutes > 0) return `${minutes}分钟前`;
  return '刚刚';
}

/**
 * 格式化专注时长（分钟 → 人类可读）
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}分钟`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}小时${m}分钟` : `${h}小时`;
}

/**
 * 格式化番茄钟时长 (e.g., "25:00")
 */
export function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * 获取今天的日期字符串
 */
export function today(): string {
  return formatDate(new Date());
}

/**
 * 获取本周的开始日期 (周一)
 */
export function weekStart(date?: Date): Date {
  const d = date ? new Date(date) : new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

/**
 * 获取本周是第几周
 */
export function weekNumber(date?: Date): number {
  const d = date ? new Date(date) : new Date();
  const start = new Date(d.getFullYear(), 0, 1);
  const days = Math.floor((d.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + start.getDay() + 1) / 7);
}

/**
 * 获取连续天数 (streak)
 */
export function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  const sorted = [...new Set(dates)].sort().reverse();
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < sorted.length; i++) {
    const target = new Date(today);
    target.setDate(target.getDate() - i);
    const targetStr = formatDate(target);

    if (sorted[i] === targetStr) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * 判断是否是今天
 */
export function isToday(date: Date | string): boolean {
  return formatDate(date) === today();
}

/**
 * 判断是否是本周
 */
export function isThisWeek(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
  return d >= weekAgo;
}
