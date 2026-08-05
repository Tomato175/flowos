'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface KeyResult {
  id: string;
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string; // %, 次, 小时, 本...
  taskIds: string[];
}

export interface Objective {
  id: string;
  title: string;
  description: string;
  timePeriod: string; // 2026-Q3, 2026-H2, 2026
  color: string;
  status: 'active' | 'completed' | 'cancelled';
  keyResults: KeyResult[];
  createdAt: string;
}

interface GoalStore {
  objectives: Objective[];
  addObjective: (o: Omit<Objective, 'id' | 'keyResults' | 'status' | 'createdAt'>) => void;
  updateObjective: (id: string, u: Partial<Objective>) => void;
  deleteObjective: (id: string) => void;
  completeObjective: (id: string) => void;

  addKeyResult: (objectiveId: string, kr: Omit<KeyResult, 'id' | 'taskIds'>) => void;
  updateKeyResult: (objectiveId: string, krId: string, u: Partial<KeyResult>) => void;
  deleteKeyResult: (objectiveId: string, krId: string) => void;
  linkTask: (objectiveId: string, krId: string, taskId: string) => void;
  unlinkTask: (objectiveId: string, krId: string, taskId: string) => void;
  updateKRProgress: (objectiveId: string, krId: string, value: number) => void;

  getOverallProgress: (objectiveId: string) => number;
  getActiveObjectives: () => Objective[];
}

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

export const useGoalStore = create<GoalStore>()(
  persist(
    (set, get) => ({
      objectives: [],

      addObjective: (o) => set((s) => ({
        objectives: [...s.objectives, { ...o, id: genId(), keyResults: [], status: 'active', createdAt: new Date().toISOString() }],
      })),

      updateObjective: (id, u) => set((s) => ({
        objectives: s.objectives.map((o) => (o.id === id ? { ...o, ...u } : o)),
      })),

      deleteObjective: (id) => set((s) => ({ objectives: s.objectives.filter((o) => o.id !== id) })),

      completeObjective: (id) => set((s) => ({
        objectives: s.objectives.map((o) => (o.id === id ? { ...o, status: 'completed' } : o)),
      })),

      addKeyResult: (oid, kr) => set((s) => ({
        objectives: s.objectives.map((o) =>
          o.id === oid ? { ...o, keyResults: [...o.keyResults, { ...kr, id: genId(), taskIds: [] }] } : o,
        ),
      })),

      updateKeyResult: (oid, krId, u) => set((s) => ({
        objectives: s.objectives.map((o) =>
          o.id === oid ? { ...o, keyResults: o.keyResults.map((kr) => (kr.id === krId ? { ...kr, ...u } : kr)) } : o,
        ),
      })),

      deleteKeyResult: (oid, krId) => set((s) => ({
        objectives: s.objectives.map((o) =>
          o.id === oid ? { ...o, keyResults: o.keyResults.filter((kr) => kr.id !== krId) } : o,
        ),
      })),

      linkTask: (oid, krId, taskId) => set((s) => ({
        objectives: s.objectives.map((o) =>
          o.id === oid ? { ...o, keyResults: o.keyResults.map((kr) =>
            kr.id === krId ? { ...kr, taskIds: kr.taskIds.includes(taskId) ? kr.taskIds : [...kr.taskIds, taskId] } : kr
          )} : o,
        ),
      })),

      unlinkTask: (oid, krId, taskId) => set((s) => ({
        objectives: s.objectives.map((o) =>
          o.id === oid ? { ...o, keyResults: o.keyResults.map((kr) =>
            kr.id === krId ? { ...kr, taskIds: kr.taskIds.filter((id) => id !== taskId) } : kr
          )} : o,
        ),
      })),

      updateKRProgress: (oid, krId, value) => set((s) => ({
        objectives: s.objectives.map((o) =>
          o.id === oid ? { ...o, keyResults: o.keyResults.map((kr) =>
            kr.id === krId ? { ...kr, currentValue: Math.max(0, value) } : kr
          )} : o,
        ),
      })),

      getOverallProgress: (oid) => {
        const obj = get().objectives.find((o) => o.id === oid);
        if (!obj || obj.keyResults.length === 0) return 0;
        const total = obj.keyResults.reduce((s, kr) => s + Math.min(kr.currentValue / kr.targetValue, 1), 0);
        return Math.round((total / obj.keyResults.length) * 100);
      },

      getActiveObjectives: () => get().objectives.filter((o) => o.status === 'active'),
    }),
    { name: 'flowos-goals' },
  ),
);
