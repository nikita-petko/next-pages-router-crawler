import { useEffect, useState } from 'react';

const UPDATE_INTERVAL_MS = 1000;

export function useLiveElapsedMs(isRunning: boolean, startedAtMs: number): number {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!isRunning) {
      return undefined;
    }

    const updateElapsed = () => {
      setElapsedMs(Math.max(0, Date.now() - startedAtMs));
    };

    updateElapsed();
    const timer = window.setInterval(updateElapsed, UPDATE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [isRunning, startedAtMs]);

  return isRunning ? elapsedMs : 0;
}
