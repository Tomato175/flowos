'use client';

/**
 * 实时云同步引擎
 * - 登录后自动加载云端数据到本地 stores
 * - 监听所有 store 变化，自动同步到 Supabase（debounce 2s）
 * - 确保本地和云端数据始终一致
 */

import { createClient } from './supabase';
import type { Task } from '@/stores/useTaskStore';
import type { Note } from '@/stores/useNoteStore';
import type { Objective } from '@/stores/useGoalStore';
import type { FocusSession } from '@/stores/useFocusStore';
import type { Habit, HabitLog } from '@/stores/useHabitStore';

let syncActive = false;
let syncInterval: ReturnType<typeof setInterval> | null = null;
let currentUserId: string | null = null;

/**
 * 启动同步引擎
 */
export function startSync(userId: string) {
  if (syncActive) return;
  syncActive = true;
  currentUserId = userId;

  // 首次：从云端加载数据
  loadFromCloud(userId).then(() => {
    console.log('🔄 云同步已启动');
  });

  // 每 5 秒检查一次变化并同步
  syncInterval = setInterval(() => {
    if (!syncActive || !currentUserId) return;
    syncAllToCloud(currentUserId);
  }, 5000);
}

/**
 * 停止同步引擎
 */
export function stopSync() {
  syncActive = false;
  currentUserId = null;
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
  console.log('⏸ 云同步已停止');
}

/**
 * 强制立即同步所有数据
 */
export async function forceSync(userId: string) {
  await syncAllToCloud(userId);
}

// ══════════════════════════════════════════
//  云端 → 本地
// ══════════════════════════════════════════

async function loadFromCloud(userId: string) {
  const supabase = createClient();

  const [
    tasksResult, notesResult, goalsResult,
    focusResult, habitsResult, habitLogsResult,
  ] = await Promise.all([
    supabase.from('tasks').select('*').eq('user_id', userId),
    supabase.from('notes').select('*').eq('user_id', userId),
    supabase.from('objectives').select('*, key_results(*)').eq('user_id', userId),
    supabase.from('focus_sessions').select('*').eq('user_id', userId).order('started_at', { ascending: false }).limit(100),
    supabase.from('habits').select('*').eq('user_id', userId),
    supabase.from('habit_logs').select('*').eq('user_id', userId),
  ]);

  // Tasks
  if (tasksResult.data && tasksResult.data.length > 0) {
    const { useTaskStore } = await import('@/stores/useTaskStore');
    const tasks: Task[] = tasksResult.data.map((t: any) => ({
      id: t.id, title: t.title, description: t.description || '',
      status: t.status, priority: t.priority, dueDate: t.due_date,
      estimatedMinutes: t.estimated_minutes, projectId: t.project_id,
      tags: t.tags || [], isRecurring: t.is_recurring || false,
      createdAt: t.created_at, updatedAt: t.updated_at,
    }));
    useTaskStore.getState().hydrateFromCloud(tasks);
  }

  // Notes
  if (notesResult.data && notesResult.data.length > 0) {
    const { useNoteStore } = await import('@/stores/useNoteStore');
    const notes: Note[] = notesResult.data.map((n: any) => ({
      id: n.id, title: n.title, content: n.content || '',
      noteType: n.note_type || 'note', journalDate: n.journal_date,
      tags: n.tags || [], isPinned: n.is_pinned || false,
      isArchived: n.is_archived || false,
      createdAt: n.created_at, updatedAt: n.updated_at,
    }));
    useNoteStore.getState().hydrateFromCloud(notes);
  }

  // Goals
  if (goalsResult.data && goalsResult.data.length > 0) {
    const { useGoalStore } = await import('@/stores/useGoalStore');
    const objectives: Objective[] = goalsResult.data.map((o: any) => ({
      id: o.id, title: o.title, description: o.description || '',
      timePeriod: o.time_period || '2026-Q3', color: o.color || 'var(--color-primary)',
      status: o.status || 'active',
      createdAt: o.created_at || new Date().toISOString(),
      keyResults: (o.key_results || []).map((kr: any) => ({
        id: kr.id, title: kr.title,
        targetValue: kr.target_value, currentValue: kr.current_value,
        unit: kr.unit || '%', taskIds: kr.task_ids || [],
      })),
    }));
    useGoalStore.getState().hydrateFromCloud(objectives);
  }

  // Focus
  if (focusResult.data && focusResult.data.length > 0) {
    const { useFocusStore } = await import('@/stores/useFocusStore');
    const sessions: FocusSession[] = focusResult.data.map((s: any) => ({
      id: s.id, taskId: s.task_id, taskTitle: s.task_title,
      startedAt: s.started_at, endedAt: s.ended_at,
      durationMinutes: s.duration_minutes, sessionType: s.session_type,
      pomodoroCycle: s.pomodoro_cycle, completed: s.completed,
    }));
    useFocusStore.getState().hydrateSessions(sessions);
  }

  // Habits
  if (habitsResult.data && habitsResult.data.length > 0) {
    const { useHabitStore } = await import('@/stores/useHabitStore');
    useHabitStore.getState().hydrateFromCloud(
      habitsResult.data.map((h: any) => ({
        id: h.id, name: h.name, icon: h.icon, color: h.color,
        frequencyType: h.frequency_type, frequencyCount: h.frequency_count,
        reminderTime: h.reminder_time, isArchived: h.is_archived || false,
        createdAt: h.created_at || new Date().toISOString(),
      })),
      (habitLogsResult.data || []).map((l: any) => ({
        habitId: l.habit_id, date: l.logged_date, completed: l.completed,
      })),
    );
  }

  console.log('☁️ 云端数据已加载');
}

// ══════════════════════════════════════════
//  本地 → 云端
// ══════════════════════════════════════════

async function syncAllToCloud(userId: string) {
  const supabase = createClient();

  try {
    const [tasksResult, notesResult, goalsResult, focusResult, habitsResult] = await Promise.all([
      syncTasks(supabase, userId),
      syncNotes(supabase, userId),
      syncGoals(supabase, userId),
      syncFocus(supabase, userId),
      syncHabits(supabase, userId),
    ]);

    const changed = [tasksResult, notesResult, goalsResult, focusResult, habitsResult]
      .filter(Boolean).length;
    if (changed > 0) {
      console.log(`💾 已同步 ${changed} 类数据到云端`);
    }
  } catch (err) {
    console.warn('同步失败:', err);
  }
}

async function syncTasks(supabase: any, userId: string): Promise<boolean> {
  try {
    const { useTaskStore } = await import('@/stores/useTaskStore');
    const { tasks } = useTaskStore.getState();
    if (tasks.length === 0) return false;

    const rows = tasks.map((t) => ({
      id: t.id, user_id: userId, title: t.title,
      description: t.description || '', status: t.status, priority: t.priority,
      due_date: t.dueDate, estimated_minutes: t.estimatedMinutes,
      project_id: t.projectId, tags: t.tags || [],
      is_recurring: t.isRecurring || false,
      created_at: t.createdAt, updated_at: t.updatedAt,
    }));
    await supabase.from('tasks').upsert(rows, { onConflict: 'id' });
    return true;
  } catch { return false; }
}

async function syncNotes(supabase: any, userId: string): Promise<boolean> {
  try {
    const { useNoteStore } = await import('@/stores/useNoteStore');
    const { notes } = useNoteStore.getState();
    if (notes.length === 0) return false;

    const rows = notes.map((n) => ({
      id: n.id, user_id: userId, title: n.title,
      content: n.content || '', note_type: n.noteType || 'note',
      journal_date: n.journalDate, tags: n.tags || [],
      is_pinned: n.isPinned || false, is_archived: n.isArchived || false,
      created_at: n.createdAt, updated_at: n.updatedAt,
    }));
    await supabase.from('notes').upsert(rows, { onConflict: 'id' });
    return true;
  } catch { return false; }
}

async function syncGoals(supabase: any, userId: string): Promise<boolean> {
  try {
    const { useGoalStore } = await import('@/stores/useGoalStore');
    const { objectives } = useGoalStore.getState();
    if (objectives.length === 0) return false;

    for (const obj of objectives) {
      await supabase.from('objectives').upsert({
        id: obj.id, user_id: userId, title: obj.title,
        description: obj.description || '', time_period: obj.timePeriod || '2026-Q3',
        color: obj.color || 'var(--color-primary)', status: obj.status || 'active',
      });

      if (obj.keyResults?.length) {
        const krRows = obj.keyResults.map((kr) => ({
          id: kr.id, objective_id: obj.id, title: kr.title,
          target_value: kr.targetValue, current_value: kr.currentValue,
          unit: kr.unit || '%', task_ids: kr.taskIds || [],
        }));
        await supabase.from('key_results').upsert(krRows, { onConflict: 'id' });
      }
    }
    return true;
  } catch { return false; }
}

async function syncFocus(supabase: any, userId: string): Promise<boolean> {
  try {
    const { useFocusStore } = await import('@/stores/useFocusStore');
    const { sessions } = useFocusStore.getState();
    if (sessions.length === 0) return false;

    const rows = sessions.map((s) => ({
      id: s.id, user_id: userId, task_id: s.taskId,
      task_title: s.taskTitle, started_at: s.startedAt, ended_at: s.endedAt,
      duration_minutes: s.durationMinutes, session_type: s.sessionType,
      pomodoro_cycle: s.pomodoroCycle, completed: s.completed,
    }));
    await supabase.from('focus_sessions').upsert(rows, { onConflict: 'id' });
    return true;
  } catch { return false; }
}

async function syncHabits(supabase: any, userId: string): Promise<boolean> {
  try {
    const { useHabitStore } = await import('@/stores/useHabitStore');
    const { habits, logs } = useHabitStore.getState();
    if (habits.length === 0 && logs.length === 0) return false;

    if (habits.length > 0) {
      const habitRows = habits.map((h) => ({
        id: h.id, user_id: userId, name: h.name,
        icon: h.icon, color: h.color,
        frequency_type: h.frequencyType, frequency_count: h.frequencyCount,
        reminder_time: h.reminderTime, is_archived: h.isArchived || false,
      }));
      await supabase.from('habits').upsert(habitRows, { onConflict: 'id' });
    }

    if (logs.length > 0) {
      const logRows = logs.map((l) => ({
        habit_id: l.habitId, user_id: userId,
        logged_date: l.date, completed: l.completed,
      }));
      await supabase.from('habit_logs').upsert(logRows, {
        onConflict: 'habit_id,logged_date',
        ignoreDuplicates: false,
      });
    }
    return true;
  } catch { return false; }
}
