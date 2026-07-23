import { useEffect, useState } from 'react';

/**
 * Return the debounced input value to prevent frequently updated.
 *
 * @param value - Value to be debounced
 * @param {number} delay - Delay of the debounce in ms
 * @returns the debouned input value based on the given delay
 */
const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;
