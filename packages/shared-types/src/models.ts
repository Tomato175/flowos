// ============================================================
// 数据模型类型定义（对应数据库 Schema）
// ============================================================

import type {
  UUID,
  Timestamps,
  UserOwned,
  TimePeriod,
  DayOfWeek,
  TaskStatus,
  Priority,
  EventType,
  FocusSessionType,
  HabitFrequency,
  GoalType,
  GoalStatus,
  NoteType,
  MoodIntensity,
  Theme,
} from './index';

// ============ 用户 ============

export interface Profile extends Timestamps {
  id: UUID;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  timezone: string;
  theme: Theme;
}

// ============ 任务 ============

export interface Task extends UserOwned, Timestamps {
  id: UUID;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  due_date: string | null;
  estimated_minutes: number | null;
  project_id: UUID | null;
  parent_task_id: UUID | null;
  is_recurring: boolean;
  recurring_rule: string | null;
  sort_order: number;

  // 关联（JOIN 时填充）
  project?: Project | null;
  tags?: Tag[];
  subtasks?: Task[];
}

export interface Project extends UserOwned {
  id: UUID;
  name: string;
  color: string | null;
  icon: string | null;
  is_archived: boolean;
  sort_order: number;
}

export interface Tag extends UserOwned {
  id: UUID;
  name: string;
  color: string | null;
}

export interface TaskTag {
  task_id: UUID;
  tag_id: UUID;
}

// ============ 日历 ============

export interface CalendarEvent extends UserOwned, Timestamps {
  id: UUID;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  is_all_day: boolean;
  event_type: EventType;
  task_id: UUID | null;
  focus_session_id: UUID | null;
  color: string | null;
  external_calendar_id: string | null;
}

// ============ 专注计时 ============

export interface FocusSession extends UserOwned, Timestamps {
  id: UUID;
  task_id: UUID | null;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  session_type: FocusSessionType;
  pomodoro_cycle: number | null;
  notes: string | null;

  // 关联
  task?: Task | null;
}

export interface FocusStats {
  total_sessions: number;
  total_minutes: number;
  total_pomodoros: number;
  daily_average: number;
  streak_days: number;
}

// ============ 习惯 ============

export interface Habit extends UserOwned, Timestamps {
  id: UUID;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  frequency_type: HabitFrequency;
  frequency_count: number;
  target_days: DayOfWeek[] | null;
  reminder_time: string | null;
  is_archived: boolean;

  // 关联
  logs?: HabitLog[];
  current_streak?: number;
  completion_rate?: number;
}

export interface HabitLog extends UserOwned {
  id: UUID;
  habit_id: UUID;
  logged_date: string; // YYYY-MM-DD
  completed: boolean;
  notes: string | null;
}

// ============ 目标 OKR ============

export interface Goal extends UserOwned, Timestamps {
  id: UUID;
  title: string;
  description: string | null;
  goal_type: GoalType;
  parent_goal_id: UUID | null;
  time_period: TimePeriod | null;
  target_value: number | null;
  current_value: number;
  unit: string | null;
  status: GoalStatus;
  color: string | null;
  sort_order: number;

  // 关联
  key_results?: Goal[];
  tasks?: Task[];
  progress_percent?: number;
}

export interface GoalTask {
  goal_id: UUID;
  task_id: UUID;
}

// ============ 笔记 ============

export interface Note extends UserOwned, Timestamps {
  id: UUID;
  title: string | null;
  content: string;
  note_type: NoteType;
  journal_date: string | null;
  is_pinned: boolean;
  is_archived: boolean;
  updated_at: string;

  // 关联
  tags?: Tag[];
  linked_notes?: NoteLink[];
}

export interface NoteTag {
  note_id: UUID;
  tag_id: UUID;
}

export interface NoteLink {
  source_note_id: UUID;
  target_note_id: UUID;
}

// ============ 心情 ============

export interface MoodEntry extends UserOwned {
  id: UUID;
  mood: string;
  intensity: MoodIntensity;
  notes: string | null;
  recorded_at: string;
  created_at: string;
}

export interface MoodStats {
  average_intensity: number;
  dominant_mood: string;
  total_entries: number;
  trend: 'up' | 'down' | 'stable';
}

// ============ 照片 ============

export interface Album extends UserOwned {
  id: UUID;
  name: string;
  description: string | null;
  cover_photo_id: UUID | null;
  created_at: string;
}

export interface Photo extends UserOwned {
  id: UUID;
  album_id: UUID | null;
  storage_path: string;
  thumbnail_path: string | null;
  caption: string | null;
  taken_at: string | null;
  file_size: number | null;
  width: number | null;
  height: number | null;
  created_at: string;
}

// ============ 仪表盘 ============

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  position: number;
  config: Record<string, unknown>;
}

export type WidgetType =
  | 'today_tasks'
  | 'today_habits'
  | 'focus_stats'
  | 'mood_check'
  | 'calendar_mini'
  | 'quick_capture'
  | 'goal_progress';

export interface DailySummary {
  date: string;
  tasks_completed: number;
  tasks_total: number;
  focus_minutes: number;
  habits_completed: number;
  habits_total: number;
  mood_avg: number | null;
  journal_written: boolean;
}
