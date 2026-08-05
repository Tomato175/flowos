-- file: supabase/migration-storage.sql
-- ===================================
-- 心流OS — Supabase Storage 设置
-- ===================================

-- 创建存储桶
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('music', 'music', TRUE, 52428800, ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3']),
  ('photos', 'photos', TRUE, 20971520, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- RLS: 用户可以上传自己的文件
CREATE POLICY "Users can upload music" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'music' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own music" ON storage.objects
  FOR UPDATE USING (bucket_id = 'music' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read music" ON storage.objects
  FOR SELECT USING (bucket_id = 'music');

CREATE POLICY "Users can upload photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own photos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'photos');
