// ============================================================
// API 请求/响应类型
// ============================================================

import type { UUID, PaginatedResponse, DateRange } from './common';
import type {
  Task,
  Project,
  Tag,
  CalendarEvent,
  FocusSession,
  Habit,
  HabitLog,
  Goal,
  Note,
  MoodEntry,
  Album,
  Photo,
  DailySummary,
  TaskStatus,
  HabitFrequency,
  NoteType,
} from './models';

// ============ 任务 API ============

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: number;
  due_date?: string;
  estimated_minutes?: number;
  project_id?: UUID;
  parent_task_id?: UUID;
  tag_ids?: UUID[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: number;
  due_date?: string | null;
  estimated_minutes?: number | null;
  project_id?: UUID | null;
  parent_task_id?: UUID | null;
  is_recurring?: boolean;
  recurring_rule?: string | null;
  sort_order?: number;
}

export interface TaskQueryParams {
  status?: TaskStatus | TaskStatus[];
  project_id?: UUID;
  tag_id?: UUID;
  priority?: number;
  due_date_range?: DateRange;
  search?: string;
}

export type TaskListResponse = PaginatedResponse<Task>;

// ============ 日历 API ============

export interface CreateEventInput {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  is_all_day?: boolean;
  event_type?: string;
  task_id?: UUID;
  color?: string;
}

export interface UpdateEventInput {
  title?: string;
  description?: string | null;
  start_time?: string;
  end_time?: string;
  is_all_day?: boolean;
  task_id?: UUID | null;
  color?: string | null;
}

// ============ 专注 API ============

export interface CreateFocusSessionInput {
  task_id?: UUID;
  session_type?: string;
  started_at: string;
}

export interface EndFocusSessionInput {
  ended_at: string;
  notes?: string;
}

// ============ 习惯 API ============

export interface CreateHabitInput {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  frequency_type?: HabitFrequency;
  frequency_count?: number;
  target_days?: number[];
  reminder_time?: string;
}

export interface UpdateHabitInput {
  name?: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  frequency_type?: HabitFrequency;
  frequency_count?: number;
  target_days?: number[] | null;
  reminder_time?: string | null;
  is_archived?: boolean;
}

export interface LogHabitInput {
  habit_id: UUID;
  logged_date: string;
  completed?: boolean;
  notes?: string;
}

// ============ 目标 API ============

export interface CreateGoalInput {
  title: string;
  description?: string;
  goal_type?: string;
  parent_goal_id?: UUID;
  time_period?: string;
  target_value?: number;
  unit?: string;
  color?: string;
}

export interface UpdateGoalInput {
  title?: string;
  description?: string | null;
  current_value?: number;
  target_value?: number | null;
  status?: string;
  color?: string | null;
}

// ============ 笔记 API ============

export interface CreateNoteInput {
  title?: string;
  content: string;
  note_type?: NoteType;
  journal_date?: string;
  tag_ids?: UUID[];
}

export interface UpdateNoteInput {
  title?: string | null;
  content?: string;
  is_pinned?: boolean;
  is_archived?: boolean;
}

export interface NoteQueryParams {
  note_type?: NoteType;
  tag_id?: UUID;
  search?: string;
  is_pinned?: boolean;
}

export type NoteListResponse = PaginatedResponse<Note>;

// ============ 心情 API ============

export interface CreateMoodInput {
  mood: string;
  intensity?: number;
  notes?: string;
  recorded_at?: string;
}

// ============ 照片 API ============

export interface CreateAlbumInput {
  name: string;
  description?: string;
}

export interface UploadPhotoInput {
  album_id?: UUID;
  caption?: string;
  taken_at?: string;
  // file 由 FormData 处理
}

// ============ 搜索 ============

export interface SearchQuery {
  q: string;
  scope?: ('tasks' | 'notes' | 'goals' | 'habits')[];
}

export interface SearchResult {
  id: UUID;
  type: 'task' | 'note' | 'goal' | 'habit';
  title: string;
  subtitle: string;
  url: string;
}

// ============ 同步 ============

export interface SyncPayload {
  last_synced_at: string;
  changes: {
    tasks: Task[];
    habits: Habit[];
    habit_logs: HabitLog[];
    goals: Goal[];
    notes: Note[];
    mood_entries: MoodEntry[];
    events: CalendarEvent[];
    focus_sessions: FocusSession[];
  };
}

// ============ Realtime Events ============

export type RealtimeEvent =
  | { type: 'task:created'; payload: Task }
  | { type: 'task:updated'; payload: Task }
  | { type: 'task:deleted'; payload: { id: UUID } }
  | { type: 'focus:started'; payload: FocusSession }
  | { type: 'focus:ended'; payload: FocusSession }
  | { type: 'habit:logged'; payload: HabitLog }
  | { type: 'mood:recorded'; payload: MoodEntry }
  | { type: 'goal:progress'; payload: Goal };
