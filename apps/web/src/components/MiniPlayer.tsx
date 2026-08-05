'use client';

import { useEffect, useRef } from 'react';
import { useAudioStore, AMBIENT_SOUNDS, type CustomTrack } from '@/stores/useAudioStore';
import { playAmbient, setAmbientVolume, stopAmbient } from '@/lib/audio-engine';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

export function MiniPlayer() {
  const { activeSound, volume, isPlaying, setActiveSound, setVolume, togglePlay, stop, customTracks, addCustomTrack } = useAudioStore();
  const { user } = useAuth();
  const sound = AMBIENT_SOUNDS.find((s) => s.id === activeSound);
  const customTrack = customTracks.find((t) => t.id === activeSound);
  const fileRef = useRef<HTMLInputElement>(null);

  // 音频引擎联动
  useEffect(() => {
    if (activeSound && isPlaying) {
      // 如果是自定义音轨，用它的 URL；否则用内置ID
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
    const file = files[0]!;
    if (!file.type.startsWith('audio/')) {
      alert('请选择音频文件 (MP3/WAV/OGG)');
      return;
    }

    const trackId = 'custom-' + Date.now().toString(36);
    const trackName = file.name.replace(/\.[^.]+$/, '');

    try {
      if (user) {
        // Upload to Supabase Storage for persistence across sessions
        const supabase = createClient();
        const filePath = `${user.id}/${trackId}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('music')
          .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('music').getPublicUrl(filePath);
        addCustomTrack({ id: trackId, name: trackName, url: urlData.publicUrl });
        setActiveSound(trackId);
      } else {
        // Not logged in - use Blob URL (won't survive page reload)
        addCustomTrack({ id: trackId, name: trackName, url: URL.createObjectURL(file) });
        setActiveSound(trackId);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      alert('上传失败，请重试');
    }
    // Reset file input
    e.target.value = '';
  };

  if (!activeSound && !isPlaying) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 68, left: '50%', transform: 'translateX(-50%)',
      backgroundColor: '#FFF', borderRadius: 16, padding: '8px 14px',
      border: '1.5px solid #E7E5E4', display: 'flex', alignItems: 'center', gap: 8,
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)', zIndex: 49, maxWidth: 'calc(100vw - 32px)',
    }}>
      <button onClick={togglePlay}
        style={{
          width: 32, height: 32, borderRadius: '50%', border: 'none',
          backgroundColor: '#7C3AED', color: '#FFF', fontSize: 13,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
        {isPlaying ? '⏸' : '▶'}
      </button>

      <span style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
        {customTrack ? '🎵' : sound?.emoji} {customTrack ? customTrack.name : sound?.label}
      </span>

      <input type="range" min={0} max={1} step={0.05} value={volume}
        onChange={(e) => setVolume(Number(e.target.value))}
        style={{ width: 48, accentColor: '#7C3AED' }} />

      <select value={activeSound || ''} onChange={(e) => setActiveSound(e.target.value || null)}
        style={{ fontSize: 11, padding: '2px 4px', borderRadius: 6, border: '1px solid #E7E5E4', maxWidth: 80 }}>
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
        style={{ border: 'none', backgroundColor: '#EDE9FE', color: '#7C3AED', cursor: 'pointer', fontSize: 14, padding: '3px 6px', borderRadius: 6 }}
        title="上传音乐">📤</button>
      <input ref={fileRef} type="file" accept="audio/*" onChange={handleUpload} style={{ display: 'none' }} />

      <button onClick={stop}
        style={{ border: 'none', backgroundColor: 'transparent', color: '#D6D3D1', cursor: 'pointer', fontSize: 16, padding: 2 }}>
        ✕
      </button>
    </div>
  );
}
