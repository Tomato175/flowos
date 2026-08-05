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

      addCustomTrack: (track) => set((s) => ({ customTracks: [...s.customTracks, track] })),
      removeCustomTrack: (id) => set((s) => ({ customTracks: s.customTracks.filter((t) => t.id !== id) })),
    }),
    { name: 'flowos-audio', partialize: (s) => ({ volume: s.volume, customTracks: s.customTracks }) },
  ),
);
