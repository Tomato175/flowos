'use client';

import { useEffect, useRef } from 'react';
import { useFocusStore } from '../stores/useFocusStore';

/**
 * 计时器核心 Hook：每秒递减
 */
export function useTimer() {
  const {
    timerState,
    timeRemaining,
    setTimeRemaining,
    finishSession,
  } = useFocusStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (timerState === 'running' && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerState, timeRemaining, setTimeRemaining]);

  // 时间到
  useEffect(() => {
    if (timerState === 'running' && timeRemaining <= 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      finishSession();
    }
  }, [timeRemaining, timerState, finishSession]);

  return null;
}

/**
 * 格式化秒数为 MM:SS
 */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
