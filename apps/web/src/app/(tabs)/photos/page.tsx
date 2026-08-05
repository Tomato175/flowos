'use client';

import { useState, useRef } from 'react';
import { usePhotoStore, type PhotoEntry } from '@/stores/usePhotoStore';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

export default function PhotosPage() {
  const { photos, albums, addPhoto, deletePhoto, setDailyTheme, dailyTheme, getDailyPhoto } = usePhotoStore();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<string | 'all'>('all');
  const [viewing, setViewing] = useState<PhotoEntry | null>(null);

  const filtered = selectedAlbum === 'all'
    ? photos
    : photos.filter((p) => p.albumId === selectedAlbum);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      try {
        const photoId = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

        // Generate thumbnail
        const dataUrl = await readAsDataURL(file);
        const thumb = await generateThumbnail(dataUrl);

        if (user) {
          // Upload to Supabase Storage for cross-session persistence
          const supabase = createClient();
          const filePath = `${user.id}/${photoId}-${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('photos')
            .upload(filePath, file, { upsert: true });

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage.from('photos').getPublicUrl(filePath);

          // Upload thumbnail too
          const thumbBlob = dataURLtoBlob(thumb);
          const thumbPath = `${user.id}/${photoId}-thumb.jpg`;
          await supabase.storage
            .from('photos')
            .upload(thumbPath, thumbBlob, { contentType: 'image/jpeg', upsert: true });
          const { data: thumbUrlData } = supabase.storage.from('photos').getPublicUrl(thumbPath);

          addPhoto({
            title: file.name.replace(/\.[^.]+$/, ''),
            url: urlData.publicUrl,
            thumbnailUrl: thumbUrlData.publicUrl,
            storagePath: filePath,
            tags: [],
            albumId: null,
            date: new Date().toISOString().split('T')[0]!,
          });
        } else {
          // Not logged in - use data URL (won't survive page reload)
          addPhoto({
            title: file.name.replace(/\.[^.]+$/, ''),
            url: dataUrl,
            thumbnailUrl: thumb,
            tags: [],
            albumId: null,
            date: new Date().toISOString().split('T')[0]!,
          });
        }
      } catch (err) {
        console.error('Photo upload failed:', err);
      }
    }
    setUploading(false);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i]!.type.startsWith('image/')) {
        files.push(items[i]!.getAsFile()!);
      }
    }
    if (files.length > 0) {
      handleUpload(files as unknown as FileList);
    }
  };

  const dailyPhoto = getDailyPhoto();

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '24px 20px', minHeight: '100vh' }}
      onPaste={handlePaste} tabIndex={0}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 2px' }}>照片</h1>
          <p style={{ fontSize: 12, color: '#A8A29E', margin: 0 }}>
            {photos.length} 张 · 支持粘贴上传 (Ctrl+V)
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => fileInputRef.current?.click()}
            style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, color: '#FFF', backgroundColor: '#7C3AED', border: 'none', borderRadius: 10, cursor: 'pointer' }}>
            {uploading ? '上传中...' : '+ 上传照片'}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" multiple
            onChange={(e) => handleUpload(e.target.files)}
            style={{ display: 'none' }} />
        </div>
      </div>

      {/* 每日主题照 */}
      {dailyPhoto && (
        <div style={{ backgroundColor: '#FFF', borderRadius: 16, padding: 16, border: '1.5px solid #E7E5E4', marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#78716C', margin: '0 0 8px' }}>📸 今日主题</p>
          <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', maxHeight: 300 }}>
            <img src={dailyPhoto.url} alt={dailyPhoto.title}
              style={{ width: '100%', objectFit: 'cover', cursor: 'pointer' }}
              onClick={() => setViewing(dailyPhoto)} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px', background: 'linear-gradient(transparent, rgba(0,0,0,0.6))' }}>
              <span style={{ color: '#FFF', fontSize: 14, fontWeight: 600 }}>{dailyPhoto.title}</span>
            </div>
          </div>
        </div>
      )}

      {/* 相册过滤 */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 14, scrollbarWidth: 'none' }}>
        <button onClick={() => setSelectedAlbum('all')}
          style={albumBtnStyle(selectedAlbum === 'all')}>📷 全部</button>
        {albums.map((a) => (
          <button key={a.id} onClick={() => setSelectedAlbum(a.id)}
            style={albumBtnStyle(selectedAlbum === a.id)}>{a.icon} {a.name}</button>
        ))}
      </div>

      {/* 照片墙 */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#A8A29E' }}>
          <p style={{ fontSize: 48, margin: '0 0 12px' }}>📷</p>
          <p style={{ fontSize: 15, margin: 0 }}>还没有照片</p>
          <p style={{ fontSize: 13, margin: '4px 0 16px' }}>点击「+ 上传照片」或直接 Ctrl+V 粘贴图片</p>
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: 'inline-block', padding: '12px 24px', fontSize: 14, fontWeight: 600,
              color: '#FFF', backgroundColor: '#7C3AED', borderRadius: 10, cursor: 'pointer',
              border: '2px dashed #A78BFA',
            }}>
            📤 拖拽或粘贴到此
          </div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 8,
        }}>
          {filtered.map((p) => (
            <div key={p.id} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', aspectRatio: '1', backgroundColor: '#F5F5F4', cursor: 'pointer' }}
              onClick={() => setViewing(p)}>
              <img src={p.thumbnailUrl} alt={p.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 150ms ease' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
              />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '6px 8px', background: 'linear-gradient(transparent, rgba(0,0,0,0.5))' }}>
                <span style={{ color: '#FFF', fontSize: 11 }}>{p.title}</span>
              </div>
              <button onClick={async (e) => {
                e.stopPropagation();
                // Also delete from Supabase Storage if cloud-synced
                if (p.storagePath && user) {
                  const supabase = createClient();
                  await supabase.storage.from('photos').remove([p.storagePath]);
                }
                deletePhoto(p.id);
              }}
                style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', border: 'none', backgroundColor: 'rgba(0,0,0,0.4)', color: '#FFF', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ✕
              </button>
              {dailyTheme === p.id && (
                <span style={{ position: 'absolute', top: 4, left: 4, fontSize: 16 }}>⭐</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 照片查看器 */}
      {viewing && (
        <div onClick={() => setViewing(null)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <img src={viewing.url} alt={viewing.title}
            style={{ maxWidth: '90vw', maxHeight: '80vh', borderRadius: 12 }} />
          <div style={{ marginTop: 16, color: '#FFF', fontSize: 14 }}>{viewing.title} · {viewing.date}</div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button onClick={(e) => { e.stopPropagation(); setDailyTheme(viewing.id); }}
              style={{ padding: '6px 14px', fontSize: 12, color: '#FFF', backgroundColor: '#F59E0B', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
              ⭐ 设为今日主题
            </button>
            <button onClick={() => setViewing(null)}
              style={{ padding: '6px 14px', fontSize: 12, color: '#FFF', backgroundColor: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function albumBtnStyle(active: boolean): React.CSSProperties {
  return {
    padding: '5px 14px', fontSize: 12, borderRadius: 16, border: 'none', whiteSpace: 'nowrap',
    backgroundColor: active ? '#EDE9FE' : '#F5F5F4', color: active ? '#5B21B6' : '#78716C',
    fontWeight: active ? 600 : 400, cursor: 'pointer', transition: 'all 150ms ease',
  };
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function generateThumbnail(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxSize = 200;
      const scale = Math.min(maxSize / img.width, maxSize / img.height);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.src = dataUrl;
  });
}

function dataURLtoBlob(dataURL: string): Blob {
  const parts = dataURL.split(',');
  const mime = parts[0]!.match(/:(.*?);/)![1];
  const bytes = atob(parts[1]!);
  const ab = new ArrayBuffer(bytes.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < bytes.length; i++) ia[i] = bytes.charCodeAt(i);
  return new Blob([ab], { type: mime });
}
