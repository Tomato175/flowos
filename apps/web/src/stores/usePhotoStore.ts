'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PhotoEntry {
  id: string;
  title: string;
  url: string; // local data URL or Supabase public URL
  thumbnailUrl: string;
  tags: string[];
  albumId: string | null;
  date: string; // YYYY-MM-DD
  createdAt: string;
}

export interface Album {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface PhotoStore {
  photos: PhotoEntry[];
  albums: Album[];
  dailyTheme: string | null; // 每日主题照片

  addPhoto: (p: Omit<PhotoEntry, 'id' | 'createdAt'>) => void;
  deletePhoto: (id: string) => void;
  setDailyTheme: (photoId: string | null) => void;
  getDailyPhoto: () => PhotoEntry | null;
  addAlbum: (a: Omit<Album, 'id'>) => void;
  deleteAlbum: (id: string) => void;

  // Cloud sync
  getCloudReady: () => PhotoEntry[];
}

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

export const usePhotoStore = create<PhotoStore>()(
  persist(
    (set, get) => ({
      photos: [],
      albums: [
        { id: 'album-1', name: '日常', icon: '📷', color: '#7C3AED' },
        { id: 'album-2', name: '美食', icon: '🍕', color: '#F59E0B' },
      ],
      dailyTheme: null,

      addPhoto: (p) => set((s) => ({
        photos: [{ ...p, id: genId(), createdAt: new Date().toISOString() }, ...s.photos],
      })),

      deletePhoto: (id) => set((s) => ({ photos: s.photos.filter((p) => p.id !== id) })),

      setDailyTheme: (photoId) => set({ dailyTheme: photoId }),

      getDailyPhoto: () => {
        const s = get();
        if (s.dailyTheme) {
          const p = s.photos.find((x) => x.id === s.dailyTheme);
          if (p) return p;
        }
        const today = new Date().toISOString().split('T')[0]!;
        return s.photos.find((x) => x.date === today) || s.photos[0] || null;
      },

      addAlbum: (a) => set((s) => ({ albums: [...s.albums, { ...a, id: genId() }] })),

      deleteAlbum: (id) => set((s) => ({
        albums: s.albums.filter((a) => a.id !== id),
        photos: s.photos.map((p) => (p.albumId === id ? { ...p, albumId: null } : p)),
      })),

      getCloudReady: () => get().photos,
    }),
    { name: 'flowos-photos' },
  ),
);
