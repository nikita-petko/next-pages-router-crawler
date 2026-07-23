import { useEffect, useRef } from 'react';

/**
 * reference from https://usehooks-typescript.com/react-hook/use-interval
 * @param callback
 * @param delay
 */
const useInterval = (callback: () => void, delay: number | null) => {
  const savedCallback = useRef(callback);

  // Remember the latest callback if it changes.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    // Don't schedule if no delay is specified.
    if (delay === null) {
      return;
    }

    const interval = setInterval(() => savedCallback.current(), delay);

    // eslint-disable-next-line consistent-return
    return () => {
      clearInterval(interval);
    };
  }, [delay]);
};

export default useInterval;
