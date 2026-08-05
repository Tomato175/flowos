// ============================================================
// @flow/db — Drizzle ORM Schema（心流OS 数据库定义）
// ============================================================

import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  date,
  numeric,
  primaryKey,
  uniqueIndex,
  index,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ============================================================
// 用户扩展（auth.users 由 Supabase 管理）
// ============================================================

export const profiles = pgTable(
  'profiles',
  {
    id: uuid('id').primaryKey(),
    username: text('username').unique(),
    display_name: text('display_name'),
    avatar_url: text('avatar_url'),
    timezone: text('timezone').default('Asia/Shanghai').notNull(),
    theme: text('theme').default('system').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex('profiles_username_idx').on(table.username)],
);

// ============================================================
// 项目管理
// ============================================================

export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color'),
  icon: text('icon'),
  is_archived: boolean('is_archived').default(false).notNull(),
  sort_order: integer('sort_order').default(0).notNull(),
});

// ============================================================
// 任务管理
// ============================================================

export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    status: text('status').default('inbox').notNull(),
    priority: integer('priority').default(2).notNull(),
    due_date: timestamp('due_date', { withTimezone: true }),
    estimated_minutes: integer('estimated_minutes'),
    project_id: uuid('project_id').references((): AnyPgColumn => projects.id, {
      onDelete: 'set null',
    }),
    parent_task_id: uuid('parent_task_id').references((): AnyPgColumn => tasks.id, {
      onDelete: 'cascade',
    }),
    is_recurring: boolean('is_recurring').default(false).notNull(),
    recurring_rule: text('recurring_rule'),
    sort_order: integer('sort_order').default(0).notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => sql`now()`),
  },
  (table) => [
    index('tasks_user_id_idx').on(table.user_id),
    index('tasks_status_idx').on(table.status),
    index('tasks_project_id_idx').on(table.project_id),
    index('tasks_due_date_idx').on(table.due_date),
  ],
);

export const tags = pgTable('tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color'),
});

export const taskTags = pgTable(
  'task_tags',
  {
    task_id: uuid('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    tag_id: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.task_id, table.tag_id] })],
);

// ============================================================
// 日历事件
// ============================================================

export const calendarEvents = pgTable(
  'calendar_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    start_time: timestamp('start_time', { withTimezone: true }).notNull(),
    end_time: timestamp('end_time', { withTimezone: true }).notNull(),
    is_all_day: boolean('is_all_day').default(false).notNull(),
    event_type: text('event_type').default('event').notNull(),
    task_id: uuid('task_id').references(() => tasks.id, { onDelete: 'set null' }),
    focus_session_id: uuid('focus_session_id'),
    color: text('color'),
    external_calendar_id: text('external_calendar_id'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('calendar_events_user_id_idx').on(table.user_id),
    index('calendar_events_time_idx').on(table.start_time, table.end_time),
  ],
);

// ============================================================
// 专注计时
// ============================================================

export const focusSessions = pgTable(
  'focus_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    task_id: uuid('task_id').references(() => tasks.id, { onDelete: 'set null' }),
    started_at: timestamp('started_at', { withTimezone: true }).notNull(),
    ended_at: timestamp('ended_at', { withTimezone: true }),
    duration_minutes: integer('duration_minutes'),
    session_type: text('session_type').default('pomodoro').notNull(),
    pomodoro_cycle: integer('pomodoro_cycle'),
    notes: text('notes'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('focus_sessions_user_id_idx').on(table.user_id),
    index('focus_sessions_started_at_idx').on(table.started_at),
  ],
);

// ============================================================
// 习惯追踪
// ============================================================

export const habits = pgTable('habits', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  icon: text('icon'),
  color: text('color'),
  frequency_type: text('frequency_type').default('daily').notNull(),
  frequency_count: integer('frequency_count').default(1).notNull(),
  target_days: integer('target_days').array(),
  reminder_time: text('reminder_time'),
  is_archived: boolean('is_archived').default(false).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const habitLogs = pgTable(
  'habit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    habit_id: uuid('habit_id')
      .notNull()
      .references(() => habits.id, { onDelete: 'cascade' }),
    user_id: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    logged_date: date('logged_date').notNull(),
    completed: boolean('completed').default(true).notNull(),
    notes: text('notes'),
  },
  (table) => [
    uniqueIndex('habit_logs_unique_idx').on(table.habit_id, table.logged_date),
    index('habit_logs_date_idx').on(table.logged_date),
  ],
);

// ============================================================
// 目标 OKR
// ============================================================

export const goals = pgTable(
  'goals',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    goal_type: text('goal_type').default('objective').notNull(),
    parent_goal_id: uuid('parent_goal_id').references((): AnyPgColumn => goals.id, {
      onDelete: 'cascade',
    }),
    time_period: text('time_period'),
    target_value: numeric('target_value'),
    current_value: numeric('current_value').default('0').notNull(),
    unit: text('unit'),
    status: text('status').default('active').notNull(),
    color: text('color'),
    sort_order: integer('sort_order').default(0).notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('goals_user_id_idx').on(table.user_id)],
);

export const goalTasks = pgTable(
  'goal_tasks',
  {
    goal_id: uuid('goal_id')
      .notNull()
      .references(() => goals.id, { onDelete: 'cascade' }),
    task_id: uuid('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.goal_id, table.task_id] })],
);

// ============================================================
// 笔记 & 日记
// ============================================================

export const notes = pgTable(
  'notes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    title: text('title'),
    content: text('content').notNull(),
    note_type: text('note_type').default('note').notNull(),
    journal_date: date('journal_date'),
    is_pinned: boolean('is_pinned').default(false).notNull(),
    is_archived: boolean('is_archived').default(false).notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => sql`now()`),
  },
  (table) => [
    index('notes_user_id_idx').on(table.user_id),
    index('notes_type_idx').on(table.note_type),
    index('notes_journal_date_idx').on(table.journal_date),
  ],
);

export const noteTags = pgTable(
  'note_tags',
  {
    note_id: uuid('note_id')
      .notNull()
      .references(() => notes.id, { onDelete: 'cascade' }),
    tag_id: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.note_id, table.tag_id] })],
);

export const noteLinks = pgTable(
  'note_links',
  {
    source_note_id: uuid('source_note_id')
      .notNull()
      .references(() => notes.id, { onDelete: 'cascade' }),
    target_note_id: uuid('target_note_id')
      .notNull()
      .references(() => notes.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.source_note_id, table.target_note_id] })],
);

// ============================================================
// 心情追踪
// ============================================================

export const moodEntries = pgTable(
  'mood_entries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    mood: text('mood').notNull(),
    intensity: integer('intensity').default(3).notNull(),
    notes: text('notes'),
    recorded_at: timestamp('recorded_at', { withTimezone: true }).notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('mood_entries_user_id_idx').on(table.user_id),
    index('mood_entries_recorded_at_idx').on(table.recorded_at),
  ],
);

// ============================================================
// 照片存储
// ============================================================

export const albums = pgTable('albums', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  cover_photo_id: uuid('cover_photo_id'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const photos = pgTable(
  'photos',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    album_id: uuid('album_id').references(() => albums.id, { onDelete: 'set null' }),
    storage_path: text('storage_path').notNull(),
    thumbnail_path: text('thumbnail_path'),
    caption: text('caption'),
    taken_at: timestamp('taken_at', { withTimezone: true }),
    file_size: integer('file_size'),
    width: integer('width'),
    height: integer('height'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('photos_user_id_idx').on(table.user_id)],
);

// ============================================================
// 导出所有表（用于 Drizzle 迁移）
// ============================================================

export const schema = {
  profiles,
  projects,
  tasks,
  tags,
  taskTags,
  calendarEvents,
  focusSessions,
  habits,
  habitLogs,
  goals,
  goalTasks,
  notes,
  noteTags,
  noteLinks,
  moodEntries,
  albums,
  photos,
};
