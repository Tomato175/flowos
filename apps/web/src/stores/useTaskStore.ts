'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TaskStatus = 'inbox' | 'todo' | 'doing' | 'done' | 'archived';
export type Priority = 0 | 1 | 2 | 3;

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
  estimatedMinutes: number | null;
  projectId: string | null;
  tags: string[];
  isRecurring: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface TaskStore {
  tasks: Task[];
  projects: Project[];

  // 任务操作
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTask: (id: string, status: TaskStatus) => void;

  // 项目操作
  addProject: (project: Omit<Project, 'id'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  // 云端恢复
  hydrateFromCloud: (tasks: Task[]) => void;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set) => ({
      tasks: [],
      projects: [
        { id: 'proj-1', name: '💼 工作', color: '#4F46E5', icon: '💼' },
        { id: 'proj-2', name: '🏠 个人', color: '#059669', icon: '🏠' },
        { id: 'proj-3', name: '📚 学习', color: '#D97706', icon: '📚' },
      ],

      addTask: (task) =>
        set((state) => ({
          tasks: [
            ...state.tasks,
            {
              ...task,
              id: generateId(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        })),

      updateTask: (id, updates) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t,
          ),
        })),

      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        })),

      moveTask: (id, status) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id
              ? { ...t, status, updatedAt: new Date().toISOString() }
              : t,
          ),
        })),

      addProject: (project) =>
        set((state) => ({
          projects: [...state.projects, { ...project, id: generateId() }],
        })),

      updateProject: (id, updates) =>
        set((state) => ({
          projects: state.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),

      deleteProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          tasks: state.tasks.map((t) =>
            t.projectId === id ? { ...t, projectId: null } : t,
          ),
        })),

      hydrateFromCloud: (cloudTasks) => { if (cloudTasks.length > 0) set({ tasks: cloudTasks }); },
    }),
    { name: 'flowos-tasks' },
  ),
);
