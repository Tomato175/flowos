// ============================================================
// @flow/db — 开发种子数据
// ============================================================

import type { DbClient } from './client';
import { projects, tasks, habits, goals, notes, moodEntries } from './schema';
import { sql } from 'drizzle-orm';

/**
 * 插入开发用种子数据
 */
export async function seed(db: DbClient, userId: string) {
  // 清空用户数据
  await db.execute(sql`DELETE FROM mood_entries WHERE user_id = ${userId}`);
  await db.execute(sql`DELETE FROM notes WHERE user_id = ${userId}`);
  await db.execute(sql`DELETE FROM goal_tasks WHERE goal_id IN (SELECT id FROM goals WHERE user_id = ${userId})`);
  await db.execute(sql`DELETE FROM goals WHERE user_id = ${userId}`);
  await db.execute(sql`DELETE FROM habit_logs WHERE habit_id IN (SELECT id FROM habits WHERE user_id = ${userId})`);
  await db.execute(sql`DELETE FROM habits WHERE user_id = ${userId}`);
  await db.execute(sql`DELETE FROM task_tags WHERE task_id IN (SELECT id FROM tasks WHERE user_id = ${userId})`);
  await db.execute(sql`DELETE FROM tasks WHERE user_id = ${userId}`);
  await db.execute(sql`DELETE FROM projects WHERE user_id = ${userId}`);

  // 创建示例项目
  const [work] = await db
    .insert(projects)
    .values([
      { user_id: userId, name: '💼 工作', color: '#4F46E5', sort_order: 0 },
      { user_id: userId, name: '🏠 个人', color: '#059669', sort_order: 1 },
      { user_id: userId, name: '📚 学习', color: '#D97706', sort_order: 2 },
    ])
    .returning();

  // 创建示例任务
  await db.insert(tasks).values([
    {
      user_id: userId,
      title: '完成心流OS Phase 0 开发环境搭建',
      status: 'doing',
      priority: 0,
      project_id: work!.id,
      estimated_minutes: 120,
    },
    {
      user_id: userId,
      title: '编写数据库 Schema 文档',
      status: 'todo',
      priority: 1,
      project_id: work!.id,
    },
    {
      user_id: userId,
      title: '晨间冥想 10 分钟',
      status: 'todo',
      priority: 2,
    },
    {
      user_id: userId,
      title: '阅读《深度工作》第 3 章',
      status: 'todo',
      priority: 2,
      estimated_minutes: 30,
    },
  ]);

  // 创建示例习惯
  await db.insert(habits).values([
    {
      user_id: userId,
      name: '早起 (7:00 前)',
      icon: '🌅',
      color: '#F59E0B',
      frequency_type: 'daily',
      reminder_time: '06:50',
    },
    {
      user_id: userId,
      name: '运动 30 分钟',
      icon: '🏃',
      color: '#10B981',
      frequency_type: 'daily',
    },
    {
      user_id: userId,
      name: '阅读 20 分钟',
      icon: '📖',
      color: '#6366F1',
      frequency_type: 'daily',
    },
    {
      user_id: userId,
      name: '日记',
      icon: '✍️',
      color: '#EC4899',
      frequency_type: 'daily',
    },
  ]);

  // 创建示例目标
  const [q4Objective] = await db
    .insert(goals)
    .values([
      {
        user_id: userId,
        title: '2025 Q4 — 个人效能突破',
        goal_type: 'objective',
        time_period: '2025-Q4',
        color: '#7C3AED',
      },
    ])
    .returning();

  await db.insert(goals).values([
    {
      user_id: userId,
      title: '日均专注时长达到 4 小时',
      goal_type: 'key_result',
      parent_goal_id: q4Objective!.id,
      target_value: '4',
      current_value: '2.5',
      unit: '小时',
      color: '#3B82F6',
    },
    {
      user_id: userId,
      title: '每周阅读 2 本书',
      goal_type: 'key_result',
      parent_goal_id: q4Objective!.id,
      target_value: '2',
      current_value: '1',
      unit: '本',
      color: '#10B981',
    },
  ]);

  // 创建示例日记
  await db.insert(notes).values([
    {
      user_id: userId,
      title: '今日反思',
      content: `# 今日反思\n\n## 完成的事情\n- 搭建了心流OS Monorepo\n- 完成了数据库 Schema 设计\n\n## 感受\n今天的专注状态不错，早上完成了大部分编码工作。\n\n## 明日计划\n- 开始前端组件开发\n- 跑通 Supabase 连接`,
      note_type: 'daily_journal',
      journal_date: new Date().toISOString().split('T')[0]!,
    },
  ]);

  // 创建示例心情
  await db.insert(moodEntries).values([
    {
      user_id: userId,
      mood: 'pleasant',
      intensity: 4,
      notes: '代码写得顺利，心情不错',
      recorded_at: new Date(),
    },
  ]);

  console.log('✅ 种子数据已插入');
}
