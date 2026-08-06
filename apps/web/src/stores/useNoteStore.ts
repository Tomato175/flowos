'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Note {
  id: string;
  title: string;
  content: string; // Markdown
  noteType: 'note' | 'daily_journal' | 'weekly_review';
  journalDate: string | null; // YYYY-MM-DD
  tags: string[];
  isPinned: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NoteStore {
  notes: Note[];
  addNote: (n: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateNote: (id: string, u: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  pinNote: (id: string) => void;
  archiveNote: (id: string) => void;
  getJournal: (date: string) => Note | undefined;
  searchNotes: (q: string) => Note[];
  parseLinks: (content: string) => string[];
  hydrateFromCloud: (notes: Note[]) => void;
}

function generateId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

export const useNoteStore = create<NoteStore>()(
  persist(
    (set, get) => ({
      notes: [],

      addNote: (n) => {
        const id = generateId();
        set((s) => ({ notes: [{ ...n, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...s.notes] }));
        return id;
      },

      updateNote: (id, u) => set((s) => ({
        notes: s.notes.map((n) => (n.id === id ? { ...n, ...u, updatedAt: new Date().toISOString() } : n)),
      })),

      deleteNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),

      pinNote: (id) => set((s) => ({
        notes: s.notes.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned } : n)),
      })),

      archiveNote: (id) => set((s) => ({
        notes: s.notes.map((n) => (n.id === id ? { ...n, isArchived: !n.isArchived } : n)),
      })),

      getJournal: (date) => get().notes.find((n) => n.noteType === 'daily_journal' && n.journalDate === date),

      searchNotes: (q) => {
        const lower = q.toLowerCase();
        return get().notes.filter(
          (n) => !n.isArchived && (n.title.toLowerCase().includes(lower) || n.content.toLowerCase().includes(lower) || n.tags.some((t) => t.toLowerCase().includes(lower))),
        );
      },

      parseLinks: (content) => {
        const matches = content.matchAll(/\[\[(.+?)\]\]/g);
        return [...matches].map((m) => m[1]!);
      },

      hydrateFromCloud: (cloudNotes) => { if (cloudNotes.length > 0) set({ notes: cloudNotes }); },
    }),
    { name: 'flowos-notes' },
  ),
);
