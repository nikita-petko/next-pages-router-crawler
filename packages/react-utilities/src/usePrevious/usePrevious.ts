import { useEffect, useRef } from 'react';

/**
 * Return the previous input value.
 *
 * @param value - Value to monitor for changes
 * @returns the previous value if it has changed otherwise returns undefined
 */
const usePrevious = <T>(value: T): T | undefined => {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
};

export default usePrevious;
