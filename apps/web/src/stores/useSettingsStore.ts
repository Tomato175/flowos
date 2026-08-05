'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsStore {
  // Widget 显隐
  showStats: boolean;
  showMood: boolean;
  showHabits: boolean;
  showCapture: boolean;
  showWeekly: boolean;
  showGoals: boolean;
  showTasks: boolean;

  toggleWidget: (key: keyof Omit<SettingsStore, 'toggleWidget' | 'exportAll' | 'importAll' | 'weatherCity' | 'setWeatherCity'>) => void;

  // 天气设置
  weatherCity: string;
  setWeatherCity: (city: string) => void;

  // 数据导出
  exportAll: () => string;
  importAll: (json: string) => boolean;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      showStats: true,
      showMood: true,
      showHabits: true,
      showCapture: true,
      showWeekly: true,
      showGoals: true,
      showTasks: true,

      weatherCity: '北京',
      setWeatherCity: (city) => set({ weatherCity: city }),

      toggleWidget: (key) => set({ [key]: !get()[key] } as any),

      exportAll: () => {
        const data: Record<string, unknown> = {};
        const keys = ['flowos-tasks', 'flowos-focus', 'flowos-habits', 'flowos-goals', 'flowos-notes', 'flowos-audio', 'flowos-settings', 'flowos-theme', 'flowos-mood-today'];
        keys.forEach((k) => {
          const v = localStorage.getItem(k);
          if (v) data[k] = JSON.parse(v);
        });
        return JSON.stringify(data, null, 2);
      },

      importAll: (json) => {
        try {
          const data = JSON.parse(json);
          Object.entries(data).forEach(([k, v]) => {
            localStorage.setItem(k, JSON.stringify(v));
          });
          return true;
        } catch {
          return false;
        }
      },
    }),
    { name: 'flowos-settings' },
  ),
);
