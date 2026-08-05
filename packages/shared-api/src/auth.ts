// ============================================================
// @flow/api — 认证辅助
// ============================================================

import type { SupabaseClient } from './client';
import type { Profile } from '@flow/types';

/**
 * 获取当前登录用户
 */
export async function getCurrentUser(client: SupabaseClient) {
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error) throw error;
  return user;
}

/**
 * 获取用户 Profile
 */
export async function getProfile(client: SupabaseClient): Promise<Profile | null> {
  const user = await getCurrentUser(client);
  if (!user) return null;

  const { data, error } = await client.from('profiles').select('*').eq('id', user.id).single();

  if (error || !data) {
    // 如果 profile 不存在，创建默认 profile
    const { data: newProfile, error: insertError } = await client
      .from('profiles')
      .insert({
        id: user.id,
        display_name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? '用户',
        timezone: 'Asia/Shanghai',
        theme: 'system',
      })
      .select('*')
      .single();

    if (insertError) throw insertError;
    return newProfile as Profile;
  }

  return data as Profile;
}

/**
 * 更新用户 Profile
 */
export async function upsertProfile(
  client: SupabaseClient,
  updates: Partial<Pick<Profile, 'display_name' | 'avatar_url' | 'timezone' | 'theme'>>,
): Promise<Profile> {
  const user = await getCurrentUser(client);
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await client
    .from('profiles')
    .upsert({ id: user.id, ...updates })
    .select('*')
    .single();

  if (error) throw error;
  return data as Profile;
}
