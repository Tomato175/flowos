'use client';

import { useEffect, useRef } from 'react';
import { useAudioStore, AMBIENT_SOUNDS } from '@/stores/useAudioStore';
import { playAmbient, setAmbientVolume, stopAmbient } from '@/lib/audio-engine';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

export function MiniPlayer() {
  const { activeSound, volume, isPlaying, setActiveSound, setVolume, togglePlay, stop, customTracks, addCustomTrack } = useAudioStore();
  const { user } = useAuth();
  const sound = AMBIENT_SOUNDS.find((s) => s.id === activeSound);
  const customTrack = customTracks.find((t) => t.id === activeSound);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeSound && isPlaying) {
      const track = customTracks.find((t) => t.id === activeSound);
      playAmbient(track ? track.url : activeSound, volume);
    } else if (!isPlaying || !activeSound) {
      stopAmbient();
    }
    return () => { if (!isPlaying) stopAmbient(); };
  }, [activeSound, isPlaying]);

  useEffect(() => {
    setAmbientVolume(volume);
  }, [volume]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    e.target.value = '';

    if (!user) {
      alert('请先登录后再上传音乐（音乐需要保存到云端才能持久化）');
      return;
    }

    const file = files[0]!;
    if (!file.type.startsWith('audio/')) {
      alert('请选择音频文件 (MP3/WAV/OGG)');
      return;
    }

    const trackId = 'custom-' + Date.now().toString(36);
    const trackName = file.name.replace(/\.[^.]+$/, '');

    try {
      const supabase = createClient();
      const filePath = `${user.id}/${trackId}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('music')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('music').getPublicUrl(filePath);
      addCustomTrack({ id: trackId, name: trackName, url: urlData.publicUrl });
    } catch (err) {
      console.error('Upload failed:', err);
      alert('上传失败，请重试');
    }
  };

  if (!activeSound && !isPlaying) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 'var(--space-6)',
      left: '50%',
      transform: 'translateX(-50%)',
      marginLeft: 100,
      background: 'var(--color-surface)',
      borderRadius: 'var(--radius-full)',
      padding: 'var(--space-2) var(--space-4)',
      border: '1px solid var(--color-border)',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-2)',
      boxShadow: 'var(--shadow-md)',
      zIndex: 49,
      maxWidth: 'calc(100vw - 32px)',
    }}>
      <button onClick={togglePlay}
        style={{
          width: 30,
          height: 30,
          borderRadius: 'var(--radius-full)',
          border: 'none',
          background: 'var(--color-primary)',
          color: '#fff',
          fontSize: 'var(--text-xs)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'background var(--transition-fast)',
        }}>
        {isPlaying ? '⏸' : '▶'}
      </button>

      <span className="body-small" style={{
        fontWeight: 'var(--weight-medium)',
        whiteSpace: 'nowrap',
        color: 'var(--color-text)',
      }}>
        {customTrack ? '🎵' : sound?.emoji} {customTrack ? customTrack.name : sound?.label}
      </span>

      <input type="range" min={0} max={1} step={0.05} value={volume}
        onChange={(e) => setVolume(Number(e.target.value))}
        style={{
          width: 48,
          accentColor: 'var(--color-primary)',
          height: 3,
        }} />

      <select value={activeSound || ''} onChange={(e) => setActiveSound(e.target.value || null)}
        style={{
          fontSize: 'var(--text-xs)',
          padding: '2px 4px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
          color: 'var(--color-text-secondary)',
          maxWidth: 80,
        }}>
        <optgroup label="内置">
          {AMBIENT_SOUNDS.map((s) => (
            <option key={s.id} value={s.id}>{s.emoji} {s.label}</option>
          ))}
        </optgroup>
        {customTracks.length > 0 && (
          <optgroup label="我的">
            {customTracks.map((t) => (
              <option key={t.id} value={t.id}>🎵 {t.name}</option>
            ))}
          </optgroup>
        )}
      </select>

      <button onClick={() => fileRef.current?.click()}
        style={{
          border: 'none',
          background: 'var(--color-primary-subtle)',
          color: 'var(--color-primary-dark)',
          cursor: 'pointer',
          fontSize: 'var(--text-sm)',
          padding: 'var(--space-1) var(--space-2)',
          borderRadius: 'var(--radius-sm)',
          transition: 'background var(--transition-fast)',
        }}
        title="上传音乐">📤</button>
      <input ref={fileRef} type="file" accept="audio/*" onChange={handleUpload} style={{ display: 'none' }} />

      <button onClick={stop}
        style={{
          border: 'none',
          background: 'transparent',
          color: 'var(--color-text-muted)',
          cursor: 'pointer',
          fontSize: 'var(--text-sm)',
          padding: 2,
          lineHeight: 1,
        }}>
        ✕
      </button>
    </div>
  );
}
