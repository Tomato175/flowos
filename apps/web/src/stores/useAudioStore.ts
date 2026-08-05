'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const AMBIENT_SOUNDS = [
  { id: 'rain', label: '雨声', emoji: '🌧️' },
  { id: 'ocean', label: '海浪', emoji: '🌊' },
  { id: 'forest', label: '林间', emoji: '🌲' },
  { id: 'cafe', label: '咖啡馆', emoji: '☕' },
  { id: 'fire', label: '篝火', emoji: '🔥' },
  { id: 'whitenoise', label: '白噪音', emoji: '📡' },
  { id: 'lofi', label: 'Lo-Fi', emoji: '🎧' },
  { id: 'piano', label: '钢琴', emoji: '🎹' },
  { id: 'windchime', label: '风铃', emoji: '🎐' },
  { id: 'thunder', label: '雷雨', emoji: '⛈️' },
] as const;

export interface CustomTrack {
  id: string;
  name: string;
  url: string; // data URL or blob URL
}

interface AudioStore {
  activeSound: string | null;
  volume: number;
  isPlaying: boolean;
  customTracks: CustomTrack[];

  setActiveSound: (id: string | null) => void;
  setVolume: (v: number) => void;
  togglePlay: () => void;
  stop: () => void;
  addCustomTrack: (track: CustomTrack) => void;
  removeCustomTrack: (id: string) => void;
  syncFromCloud: (userId: string) => Promise<void>;
  clearCloudTracks: () => void;
}

export const useAudioStore = create<AudioStore>()(
  persist(
    (set, get) => ({
      activeSound: null,
      volume: 0.5,
      isPlaying: false,
      customTracks: [],

      setActiveSound: (id) => {
        if (id === null) {
          set({ activeSound: null, isPlaying: false });
        } else if (id === get().activeSound) {
          set({ isPlaying: !get().isPlaying });
        } else {
          set({ activeSound: id, isPlaying: true });
        }
      },

      setVolume: (v) => set({ volume: v }),
      togglePlay: () => set({ isPlaying: !get().isPlaying }),
      stop: () => set({ isPlaying: false, activeSound: null }),

      addCustomTrack: (track) => {
        const newTracks = [...get().customTracks, track];
        set({ customTracks: newTracks });
        // 立即同步写入 localStorage，避免刷新丢失
        try {
          const raw = localStorage.getItem('flowos-audio');
          const existing = raw ? JSON.parse(raw) : {};
          existing.state = { ...existing.state, customTracks: newTracks };
          localStorage.setItem('flowos-audio', JSON.stringify(existing));
        } catch { /* ignore */ }
      },
      removeCustomTrack: (id) => set((s) => ({ customTracks: s.customTracks.filter((t) => t.id !== id) })),
      syncFromCloud: async (userId: string) => {
        // 从 Supabase Storage 拉取并合并（不覆盖已存在的本地歌曲）
        try {
          const { createClient } = await import('@/lib/supabase');
          const supabase = createClient();
          const { data: files, error } = await supabase.storage.from('music').list(userId);
          if (error || !files) return;
          const existing = get().customTracks;
          const existingUrls = new Set(existing.map((t) => t.url));
          const newTracks = files
            .filter((f) => f.name && !f.name.endsWith('-thumb.jpg'))
            .map((f) => {
              const { data: urlData } = supabase.storage.from('music').getPublicUrl(`${userId}/${f.name}`);
              const url = urlData.publicUrl;
              // Skip if this URL already exists in local tracks
              if (existingUrls.has(url)) return null as any;
              const trackId = 'custom-' + f.name.split('-')[0];
              const displayName = f.name.replace(/^[^-]+-/, '').replace(/\.[^.]+$/, '');
              return { id: trackId, name: displayName, url };
            })
            .filter(Boolean);
          if (newTracks.length > 0) {
            set({ customTracks: [...existing, ...newTracks] });
          }
        } catch { /* ignore */ }
      },
      clearCloudTracks: () => set({ customTracks: [], activeSound: null, isPlaying: false }),
    }),
    { name: 'flowos-audio', partialize: (s) => ({ volume: s.volume, customTracks: s.customTracks, activeSound: s.activeSound }),
  onRehydrateStorage: () => (state) => {
    // 清理失效的 blob: URL（旧版无登录时上传的临时链接）
    if (state?.customTracks) {
      state.customTracks = state.customTracks.filter((t) => !t.url.startsWith('blob:'));
    }
  }
},
  ),
);
