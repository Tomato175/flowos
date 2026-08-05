// ============================================================
// 枚举与常量类型
// ============================================================

/** 任务状态 */
export const TaskStatus = {
  Inbox: 'inbox',
  Todo: 'todo',
  Doing: 'doing',
  Done: 'done',
  Archived: 'archived',
} as const;
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

/** 优先级 */
export const Priority = {
  P0: 0, // 紧急重要
  P1: 1,
  P2: 2,
  P3: 3, // 不紧急不重要
} as const;
export type Priority = (typeof Priority)[keyof typeof Priority];

/** 日历事件类型 */
export const EventType = {
  Event: 'event',
  TimeBlock: 'timeblock',
  FocusSession: 'focus_session',
} as const;
export type EventType = (typeof EventType)[keyof typeof EventType];

/** 专注会话类型 */
export const FocusSessionType = {
  Pomodoro: 'pomodoro',
  Free: 'free',
  Break: 'break',
} as const;
export type FocusSessionType = (typeof FocusSessionType)[keyof typeof FocusSessionType];

/** 习惯频率类型 */
export const HabitFrequency = {
  Daily: 'daily',
  Weekly: 'weekly',
  Monthly: 'monthly',
  Custom: 'custom',
} as const;
export type HabitFrequency = (typeof HabitFrequency)[keyof typeof HabitFrequency];

/** 目标类型 */
export const GoalType = {
  Objective: 'objective',
  KeyResult: 'key_result',
} as const;
export type GoalType = (typeof GoalType)[keyof typeof GoalType];

/** 目标状态 */
export const GoalStatus = {
  Active: 'active',
  Completed: 'completed',
  Cancelled: 'cancelled',
} as const;
export type GoalStatus = (typeof GoalStatus)[keyof typeof GoalStatus];

/** 笔记类型 */
export const NoteType = {
  Note: 'note',
  DailyJournal: 'daily_journal',
  WeeklyReview: 'weekly_review',
} as const;
export type NoteType = (typeof NoteType)[keyof typeof NoteType];

/** 心情强度 */
export const MoodIntensity = {
  VeryLow: 1,
  Low: 2,
  Neutral: 3,
  High: 4,
  VeryHigh: 5,
} as const;
export type MoodIntensity = (typeof MoodIntensity)[keyof typeof MoodIntensity];

/** 主题 */
export const Theme = {
  System: 'system',
  Light: 'light',
  Dark: 'dark',
} as const;
export type Theme = (typeof Theme)[keyof typeof Theme];

/** 心情 Emoji 映射 */
export const MOOD_EMOJIS = [
  { emoji: '😄', label: '开心', value: 'happy' },
  { emoji: '😊', label: '愉快', value: 'pleasant' },
  { emoji: '😐', label: '一般', value: 'neutral' },
  { emoji: '😢', label: '难过', value: 'sad' },
  { emoji: '😡', label: '生气', value: 'angry' },
  { emoji: '🤩', label: '兴奋', value: 'excited' },
  { emoji: '😴', label: '疲倦', value: 'tired' },
  { emoji: '😰', label: '焦虑', value: 'anxious' },
  { emoji: '🤔', label: '思考', value: 'thoughtful' },
  { emoji: '😌', label: '放松', value: 'relaxed' },
] as const;

/** 白噪音类型 */
export const AMBIENT_SOUNDS = [
  { id: 'rain', label: '雨声', icon: '🌧️' },
  { id: 'ocean', label: '海浪', icon: '🌊' },
  { id: 'forest', label: '林间', icon: '🌲' },
  { id: 'cafe', label: '咖啡馆', icon: '☕' },
  { id: 'fire', label: '篝火', icon: '🔥' },
  { id: 'whitenoise', label: '白噪音', icon: '📡' },
  { id: 'lofi', label: 'Lo-Fi', icon: '🎧' },
  { id: 'piano', label: '钢琴', icon: '🎹' },
] as const;
