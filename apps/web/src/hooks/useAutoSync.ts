'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { startSync, stopSync } from '@/lib/sync-engine';

/**
 * 自动云同步 Hook
 * 挂载到 Layout 层，检测登录状态后自动启停同步引擎
 */
export function useAutoSync() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (user) {
      startSync(user.id);
    } else {
      stopSync();
    }

    return () => {
      stopSync();
    };
  }, [user, loading]);
}
