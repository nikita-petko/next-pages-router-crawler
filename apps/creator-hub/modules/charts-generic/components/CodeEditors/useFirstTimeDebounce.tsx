import { useCallback, useRef } from 'react';

// Utility function to debounce a function only for the first time. Subsequent calls are not debounced.
const useFirstTimeDebounce = (func: () => void, delay: number) => {
  const isFirstTimeRef = useRef(true);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const firstTimeDebouncedFunc = useCallback(() => {
    if (isFirstTimeRef.current) {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = setTimeout(() => {
        func();
        isFirstTimeRef.current = false;
      }, delay);
    } else {
      func();
    }
  }, [func, delay]);

  return firstTimeDebouncedFunc;
};

export default useFirstTimeDebounce;
