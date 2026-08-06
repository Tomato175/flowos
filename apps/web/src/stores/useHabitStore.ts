'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type HabitFrequency = 'daily' | 'weekly' | 'monthly';

export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  frequencyType: HabitFrequency;
  frequencyCount: number;
  reminderTime: string | null;
  isArchived: boolean;
  createdAt: string;
}

export interface HabitLog {
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
}

interface HabitStore {
  habits: Habit[];
  logs: HabitLog[];

  addHabit: (h: Omit<Habit, 'id' | 'isArchived' | 'createdAt'>) => void;
  updateHabit: (id: string, u: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  archiveHabit: (id: string) => void;

  toggleLog: (habitId: string, date: string) => void;
  isCompleted: (habitId: string, date: string) => boolean;
  getStreak: (habitId: string) => number;
  getCompletionRate: (habitId: string, days: number) => number;
  getActiveHabits: () => Habit[];
  hydrateFromCloud: (habits: Habit[], logs: HabitLog[]) => void;
}

function generateId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function todayStr() { return new Date().toISOString().split('T')[0]!; }

function calcStreak(logs: HabitLog[], habitId: string): number {
  const habitLogs = logs.filter((l) => l.habitId === habitId && l.completed);
  const dates = [...new Set(habitLogs.map((l) => l.date))].sort().reverse();
  if (dates.length === 0 || dates[0] !== todayStr()) return 0;
  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]!);
    prev.setDate(prev.getDate() - 1);
    if (dates[i] === prev.toISOString().split('T')[0]) streak++;
    else break;
  }
  return streak;
}

export const useHabitStore = create<HabitStore>()(
  persist(
    (set, get) => ({
      habits: [
        { id: 'h-1', name: '早起 (7:00前)', icon: '🌅', color: '#F59E0B', frequencyType: 'daily', frequencyCount: 1, reminderTime: '06:50', isArchived: false, createdAt: new Date().toISOString() },
        { id: 'h-2', name: '运动30分钟', icon: '🏃', color: '#10B981', frequencyType: 'daily', frequencyCount: 1, reminderTime: null, isArchived: false, createdAt: new Date().toISOString() },
        { id: 'h-3', name: '阅读20分钟', icon: '📖', color: '#6366F1', frequencyType: 'daily', frequencyCount: 1, reminderTime: null, isArchived: false, createdAt: new Date().toISOString() },
        { id: 'h-4', name: '写日记', icon: '✍️', color: '#EC4899', frequencyType: 'daily', frequencyCount: 1, reminderTime: '22:00', isArchived: false, createdAt: new Date().toISOString() },
      ],
      logs: [],

      addHabit: (h) => set((s) => ({ habits: [...s.habits, { ...h, id: generateId(), isArchived: false, createdAt: new Date().toISOString() }] })),

      updateHabit: (id, u) => set((s) => ({ habits: s.habits.map((h) => (h.id === id ? { ...h, ...u } : h)) })),

      deleteHabit: (id) => set((s) => ({
        habits: s.habits.filter((h) => h.id !== id),
        logs: s.logs.filter((l) => l.habitId !== id),
      })),

      archiveHabit: (id) => set((s) => ({
        habits: s.habits.map((h) => (h.id === id ? { ...h, isArchived: !h.isArchived } : h)),
      })),

      toggleLog: (habitId, date) => set((s) => {
        const existing = s.logs.find((l) => l.habitId === habitId && l.date === date);
        if (existing) {
          return { logs: s.logs.filter((l) => !(l.habitId === habitId && l.date === date)) };
        }
        return { logs: [...s.logs, { habitId, date, completed: true }] };
      }),

      isCompleted: (habitId, date) => {
        const s = get();
        return s.logs.some((l) => l.habitId === habitId && l.date === date && l.completed);
      },

      getStreak: (habitId) => calcStreak(get().logs, habitId),

      getCompletionRate: (habitId, days) => {
        const s = get();
        const logs = s.logs.filter((l) => l.habitId === habitId && l.completed);
        const uniqueDays = new Set(logs.map((l) => l.date)).size;
        return days > 0 ? uniqueDays / days : 0;
      },

      getActiveHabits: () => get().habits.filter((h) => !h.isArchived),

      hydrateFromCloud: (cloudHabits, cloudLogs) => {
        if (cloudHabits.length > 0 || cloudLogs.length > 0) {
          set({ habits: cloudHabits, logs: cloudLogs });
        }
      },
    }),
    { name: 'flowos-habits' },
  ),
);
