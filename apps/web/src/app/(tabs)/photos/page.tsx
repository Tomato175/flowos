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
    <div
      style={{
        maxWidth: 880,
        margin: '0 auto',
        padding: 'var(--space-12) var(--space-6) var(--space-16)',
        minHeight: '100vh',
      }}
      onPaste={handlePaste}
      tabIndex={0}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: 'var(--space-8)',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
        }}
      >
        <div>
          <h1
            className="display-medium"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--color-text)',
              margin: 0,
              marginBottom: 'var(--space-1)',
            }}
          >
            照片
          </h1>
          <p
            className="body-small"
            style={{
              color: 'var(--color-text-muted)',
              margin: 0,
            }}
          >
            {photos.length} 张 · 支持粘贴上传 (Ctrl+V)
          </p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            padding: 'var(--space-2) var(--space-5)',
            fontSize: 14,
            fontWeight: 600,
            fontFamily: 'var(--font-body)',
            color: 'var(--color-bg)',
            backgroundColor: 'var(--color-primary)',
            border: 'none',
            borderRadius: 'var(--radius-full)',
            cursor: 'pointer',
            transition: 'var(--transition-fast)',
          }}
        >
          {uploading ? '上传中...' : '+ 上传照片'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleUpload(e.target.files)}
          style={{ display: 'none' }}
        />
      </div>

      {/* Daily Featured Photo */}
      {dailyPhoto && (
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <p
            className="label-text"
            style={{
              fontFamily: 'var(--font-body)',
              color: 'var(--color-text-secondary)',
              margin: '0 0 var(--space-2)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            📸 今日主题
          </p>
          <div
            style={{
              position: 'relative',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              maxHeight: 360,
              cursor: 'pointer',
            }}
            onClick={() => setViewing(dailyPhoto)}
          >
            <img
              src={dailyPhoto.url}
              alt={dailyPhoto.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'var(--transition-base)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: 'var(--space-6) var(--space-4) var(--space-4)',
                background:
                  'linear-gradient(transparent, rgba(0,0,0,0.55))',
              }}
            >
              <span
                className="heading-3"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: '#fff',
                }}
              >
                {dailyPhoto.title}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Album filter pills */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-2)',
          overflowX: 'auto',
          marginBottom: 'var(--space-6)',
          scrollbarWidth: 'none',
          paddingBottom: 'var(--space-1)',
        }}
      >
        <button
          onClick={() => setSelectedAlbum('all')}
          style={albumBtnStyle(selectedAlbum === 'all')}
        >
          📷 全部
        </button>
        {albums.map((a) => (
          <button
            key={a.id}
            onClick={() => setSelectedAlbum(a.id)}
            style={albumBtnStyle(selectedAlbum === a.id)}
          >
            {a.icon} {a.name}
          </button>
        ))}
      </div>

      {/* Photo Gallery Grid */}
      {filtered.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: 'var(--space-20) var(--space-6)',
            color: 'var(--color-text-muted)',
          }}
        >
          <p style={{ fontSize: 56, margin: '0 0 var(--space-3)', lineHeight: 1 }}>📷</p>
          <p
            className="heading-3"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--color-text)',
              margin: '0 0 var(--space-1)',
            }}
          >
            还没有照片
          </p>
          <p
            className="body-small"
            style={{
              color: 'var(--color-text-muted)',
              margin: '0 0 var(--space-6)',
            }}
          >
            点击「+ 上传照片」或直接 Ctrl+V 粘贴图片
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: 'inline-block',
              padding: 'var(--space-3) var(--space-6)',
              fontSize: 14,
              fontWeight: 600,
              fontFamily: 'var(--font-body)',
              color: 'var(--color-bg)',
              backgroundColor: 'var(--color-primary)',
              borderRadius: 'var(--radius-full)',
              cursor: 'pointer',
              border: 'none',
            }}
          >
            📤 拖拽或粘贴到此
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 'var(--space-3)',
          }}
        >
          {filtered.map((p) => (
            <div
              key={p.id}
              style={{
                position: 'relative',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                aspectRatio: '1',
                backgroundColor: 'var(--color-surface)',
                cursor: 'pointer',
              }}
              onClick={() => setViewing(p)}
            >
              <img
                src={p.thumbnailUrl}
                alt={p.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'transform var(--transition-base)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform =
                    'scale(1.06)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform =
                    'scale(1)';
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: 'var(--space-2) var(--space-3)',
                  background:
                    'linear-gradient(transparent, rgba(0,0,0,0.45))',
                }}
              >
                <span
                  className="caption"
                  style={{ fontFamily: 'var(--font-body)', color: '#fff' }}
                >
                  {p.title}
                </span>
              </div>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  if (p.storagePath && user) {
                    const supabase = createClient();
                    await supabase.storage
                      .from('photos')
                      .remove([p.storagePath]);
                  }
                  deletePhoto(p.id);
                }}
                style={{
                  position: 'absolute',
                  top: 'var(--space-2)',
                  right: 'var(--space-2)',
                  width: 24,
                  height: 24,
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  backgroundColor: 'rgba(0,0,0,0.35)',
                  color: '#fff',
                  fontSize: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(4px)',
                }}
              >
                ✕
              </button>
              {dailyTheme === p.id && (
                <span
                  style={{
                    position: 'absolute',
                    top: 'var(--space-2)',
                    left: 'var(--space-2)',
                    fontSize: 18,
                  }}
                >
                  ⭐
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Photo Viewer Overlay */}
      {viewing && (
        <div
          onClick={() => setViewing(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.92)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src={viewing.url}
            alt={viewing.title}
            style={{
              maxWidth: '90vw',
              maxHeight: '80vh',
              borderRadius: 'var(--radius-lg)',
            }}
          />
          <div
            className="body-text"
            style={{
              fontFamily: 'var(--font-body)',
              marginTop: 'var(--space-4)',
              color: '#fff',
            }}
          >
            {viewing.title} · {viewing.date}
          </div>
          <div
            style={{
              marginTop: 'var(--space-3)',
              display: 'flex',
              gap: 'var(--space-2)',
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDailyTheme(viewing.id);
              }}
              style={{
                padding: 'var(--space-2) var(--space-4)',
                fontSize: 13,
                fontFamily: 'var(--font-body)',
                color: 'var(--color-bg)',
                backgroundColor: 'var(--color-primary)',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
              }}
            >
              ⭐ 设为今日主题
            </button>
            <button
              onClick={() => setViewing(null)}
              style={{
                padding: 'var(--space-2) var(--space-4)',
                fontSize: 13,
                fontFamily: 'var(--font-body)',
                color: '#fff',
                backgroundColor: 'rgba(255,255,255,0.15)',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
              }}
            >
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
    padding: 'var(--space-1) var(--space-3)',
    fontSize: 13,
    fontFamily: 'var(--font-body)',
    borderRadius: 'var(--radius-full)',
    border: 'none',
    whiteSpace: 'nowrap',
    backgroundColor: active
      ? 'var(--color-primary-subtle)'
      : 'var(--color-surface-hover)',
    color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
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
