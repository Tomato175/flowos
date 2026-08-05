'use client';

import { createClient } from './supabase';

/**
 * 检查 Supabase 是否可用（表是否存在）
 */
export async function isSupabaseReady(): Promise<boolean> {
  try {
    const supabase = createClient();
    const { error } = await supabase.from('tasks').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

/**
 * 将 localStorage 数据迁移到 Supabase
 */
export async function migrateFromLocal(userId: string) {
  const supabase = createClient();

  // 任务
  const tasksData = localStorage.getItem('flowos-tasks');
  if (tasksData) {
    const { state } = JSON.parse(tasksData);
    if (state?.tasks?.length) {
      const rows = state.tasks.map((t: any) => ({
        id: t.id,
        user_id: userId,
        title: t.title,
        description: t.description || '',
        status: t.status,
        priority: t.priority,
        due_date: t.dueDate,
        estimated_minutes: t.estimatedMinutes,
        project_id: t.projectId,
        tags: t.tags || [],
        is_recurring: t.isRecurring || false,
        created_at: t.createdAt,
        updated_at: t.updatedAt,
      }));
      await supabase.from('tasks').upsert(rows, { onConflict: 'id' });
    }
    // 项目
    if (state?.projects?.length) {
      const projRows = state.projects.map((p: any) => ({
        id: p.id,
        user_id: userId,
        name: p.name,
        color: p.color,
        icon: p.icon,
        is_archived: false,
        sort_order: 0,
      }));
      await supabase.from('projects').upsert(projRows, { onConflict: 'id' });
    }
  }

  // 专注
  const focusData = localStorage.getItem('flowos-focus');
  if (focusData) {
    const { state } = JSON.parse(focusData);
    if (state?.sessions?.length) {
      const rows = state.sessions.map((s: any) => ({
        id: s.id,
        user_id: userId,
        task_id: s.taskId,
        task_title: s.taskTitle,
        started_at: s.startedAt,
        ended_at: s.endedAt,
        duration_minutes: s.durationMinutes,
        session_type: s.sessionType,
        pomodoro_cycle: s.pomodoroCycle,
        completed: s.completed,
      }));
      await supabase.from('focus_sessions').upsert(rows, { onConflict: 'id' });
    }
  }

  // 习惯
  const habitData = localStorage.getItem('flowos-habits');
  if (habitData) {
    const { state } = JSON.parse(habitData);
    if (state?.habits?.length) {
      const rows = state.habits.map((h: any) => ({
        id: h.id,
        user_id: userId,
        name: h.name,
        icon: h.icon,
        color: h.color,
        frequency_type: h.frequencyType,
        frequency_count: h.frequencyCount,
        reminder_time: h.reminderTime,
        is_archived: h.isArchived || false,
      }));
      await supabase.from('habits').upsert(rows, { onConflict: 'id' });
    }
    if (state?.logs?.length) {
      const logRows = state.logs.map((l: any) => ({
        habit_id: l.habitId,
        user_id: userId,
        logged_date: l.date,
        completed: l.completed,
      }));
      await supabase.from('habit_logs').upsert(logRows, { onConflict: 'habit_id,logged_date', ignoreDuplicates: false });
    }
  }

  // 目标
  const goalData = localStorage.getItem('flowos-goals');
  if (goalData) {
    const { state } = JSON.parse(goalData);
    if (state?.objectives?.length) {
      for (const obj of state.objectives) {
        const { data: inserted } = await supabase.from('objectives').upsert({
          id: obj.id,
          user_id: userId,
          title: obj.title,
          description: obj.description || '',
          time_period: obj.timePeriod || '2026-Q3',
          color: obj.color || '#7C3AED',
          status: obj.status || 'active',
        } as any).select('id').single();

        const insertedObj = (inserted as any)?.id;
        if (insertedObj && obj.keyResults?.length) {
          const krRows = obj.keyResults.map((kr: any) => ({
            id: kr.id,
            objective_id: insertedObj,
            title: kr.title,
            target_value: kr.targetValue,
            current_value: kr.currentValue,
            unit: kr.unit || '%',
            task_ids: kr.taskIds || [],
          }));
          await supabase.from('key_results').upsert(krRows, { onConflict: 'id' });
        }
      }
    }
  }

  // 笔记
  const noteData = localStorage.getItem('flowos-notes');
  if (noteData) {
    const { state } = JSON.parse(noteData);
    if (state?.notes?.length) {
      const rows = state.notes.map((n: any) => ({
        id: n.id,
        user_id: userId,
        title: n.title,
        content: n.content || '',
        note_type: n.noteType || 'note',
        journal_date: n.journalDate,
        tags: n.tags || [],
        is_pinned: n.isPinned || false,
        is_archived: n.isArchived || false,
        created_at: n.createdAt,
        updated_at: n.updatedAt,
      }));
      await supabase.from('notes').upsert(rows, { onConflict: 'id' });
    }
  }

  console.log('✅ 本地数据已迁移到 Supabase');
}
