'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TimerState = 'idle' | 'running' | 'paused' | 'finished';
export type SessionType = 'pomodoro' | 'free' | 'break';

export interface FocusSession {
  id: string;
  taskId: string | null;
  taskTitle: string | null;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number;
  sessionType: SessionType;
  pomodoroCycle: number;
  completed: boolean;
}

interface FocusStore {
  // 实时计时器
  timerState: TimerState;
  timeRemaining: number; // seconds
  sessionType: SessionType;
  pomodoroCount: number; // 当前已完成的番茄数
  currentTaskId: string | null;
  currentTaskTitle: string | null;
  activeSound: string | null;

  // 设置
  workDuration: number; // minutes
  breakDuration: number; // minutes
  longBreakDuration: number;
  longBreakInterval: number; // 几个番茄后长休息

  // 历史记录
  sessions: FocusSession[];

  // 操作
  setTimeRemaining: (seconds: number) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  finishSession: () => void;
  setTimerState: (state: TimerState) => void;
  setSessionType: (type: SessionType) => void;
  setCurrentTask: (taskId: string | null, taskTitle: string | null) => void;
  setActiveSound: (soundId: string | null) => void;
  startBreakSession: () => void;
  addSession: (session: FocusSession) => void;
  getTodayStats: () => { sessions: number; minutes: number; pomodoros: number };
  getWeekStats: () => { sessions: number; minutes: number; pomodoros: number; days: number };
  hydrateSessions: (sessions: FocusSession[]) => void;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]!;
}

export const useFocusStore = create<FocusStore>()(
  persist(
    (set, get) => ({
      timerState: 'idle',
      timeRemaining: 25 * 60,
      sessionType: 'pomodoro',
      pomodoroCount: 0,
      currentTaskId: null,
      currentTaskTitle: null,
      activeSound: null,

      workDuration: 25,
      breakDuration: 5,
      longBreakDuration: 15,
      longBreakInterval: 4,

      sessions: [],

      setTimeRemaining: (seconds) => set({ timeRemaining: seconds }),

      startTimer: () =>
        set((s) => ({
          timerState: 'running',
          timeRemaining: s.sessionType === 'break' ? s.breakDuration * 60 : s.workDuration * 60,
        })),

      pauseTimer: () => set({ timerState: 'paused' }),
      resumeTimer: () => set({ timerState: 'running' }),

      resetTimer: () =>
        set((s) => ({
          timerState: 'idle',
          timeRemaining: s.sessionType === 'break' ? s.breakDuration * 60 : s.workDuration * 60,
        })),

      finishSession: () => {
        const s = get();
        const durationMin = Math.round(
          (s.sessionType === 'break' ? s.breakDuration * 60 : s.workDuration * 60 - s.timeRemaining) / 60,
        );

        const session: FocusSession = {
          id: generateId(),
          taskId: s.currentTaskId,
          taskTitle: s.currentTaskTitle,
          startedAt: new Date(Date.now() - durationMin * 60000).toISOString(),
          endedAt: new Date().toISOString(),
          durationMinutes: durationMin,
          sessionType: s.sessionType,
          pomodoroCycle: s.pomodoroCount + 1,
          completed: true,
        };

        set({
          timerState: 'finished',
          sessions: [...s.sessions, session],
          pomodoroCount:
            s.sessionType === 'pomodoro' ? s.pomodoroCount + 1 : s.pomodoroCount,
        });
      },

      setTimerState: (state) => set({ timerState: state }),
      setSessionType: (type) => set({ sessionType: type }),
      setCurrentTask: (taskId, taskTitle) =>
        set({ currentTaskId: taskId, currentTaskTitle: taskTitle }),
      setActiveSound: (soundId) => set({ activeSound: soundId }),

      startBreakSession: () =>
        set((s) => {
          const isLongBreak = s.pomodoroCount > 0 && s.pomodoroCount % s.longBreakInterval === 0;
          return {
            sessionType: 'break',
            timerState: 'running',
            timeRemaining: (isLongBreak ? s.longBreakDuration : s.breakDuration) * 60,
          };
        }),

      addSession: (session) =>
        set((s) => ({ sessions: [...s.sessions, session] })),

      getTodayStats: () => {
        const today = todayStr();
        const s = get();
        const todaySessions = s.sessions.filter((s) => s.startedAt.startsWith(today));
        return {
          sessions: todaySessions.length,
          minutes: todaySessions.reduce((sum, s) => sum + s.durationMinutes, 0),
          pomodoros: todaySessions.filter((s) => s.sessionType === 'pomodoro' && s.completed).length,
        };
      },

      getWeekStats: () => {
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
        weekStart.setHours(0, 0, 0, 0);
        const startStr = weekStart.toISOString().split('T')[0]!;

        const s = get();
        const weekSessions = s.sessions.filter(
          (s) => s.startedAt >= startStr && s.startedAt <= todayStr(),
        );

        const uniqueDays = new Set(
          weekSessions.map((s) => s.startedAt.split('T')[0]),
        ).size;

        return {
          sessions: weekSessions.length,
          minutes: weekSessions.reduce((sum, s) => sum + s.durationMinutes, 0),
          pomodoros: weekSessions.filter((s) => s.sessionType === 'pomodoro' && s.completed).length,
          days: uniqueDays,
        };
      },

      hydrateSessions: (cloudSessions) => set({ sessions: cloudSessions }),
    }),
    { name: 'flowos-focus' },
  ),
);
