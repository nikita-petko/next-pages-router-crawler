import { useState, useEffect } from 'react';

// syncKey snaps to value on change so url hydrate doesn't wait out debounce
function useDebounce<T>(value: T, delay: number, syncKey?: unknown): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const [prevSyncKey, setPrevSyncKey] = useState(syncKey);

  if (syncKey !== prevSyncKey) {
    setPrevSyncKey(syncKey);
    if (debouncedValue !== value) {
      setDebouncedValue(value);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useCustomDebounce<T>(value: T, delay: number, setter: (value: T) => void) {
  useEffect(() => {
    const timer = setTimeout(() => {
      setter(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay, setter]);
}

export default useDebounce;
