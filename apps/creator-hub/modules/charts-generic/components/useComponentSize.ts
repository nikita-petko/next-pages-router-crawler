import type { RefObject } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { throttle } from '@modules/miscellaneous/utils/helperUtils';
import emptyFunction from '../utils/emptyFunction';

/**
 * Observer component size with an optional throttle timeout.
 * @param ref
 * @param throttleTimeout
 */
const useComponentSize = (
  ref: RefObject<HTMLElement | null>,
  throttleTimeout?: number,
): {
  width: number;
  height: number;
} => {
  const [size, setSize] = useState(() => {
    const rect = ref.current?.getBoundingClientRect();
    return {
      width: rect?.width || 0,
      height: rect?.height || 0,
    };
  });

  const updateSize = useCallback((entries: ResizeObserverEntry[]) => {
    entries.forEach(({ target }) => {
      const { width, height } = target.getBoundingClientRect();
      setSize((oldSize) => {
        if (oldSize.width !== width || oldSize.height !== height) {
          return { width, height };
        }
        return oldSize;
      });
    });
  }, []);

  const { update, cancelUpdate } = useMemo(() => {
    if (throttleTimeout) {
      const [throttledUpdate, clearThrottledUpdate] = throttle(updateSize, throttleTimeout);
      return {
        update: throttledUpdate,
        cancelUpdate: clearThrottledUpdate,
      };
    }
    return {
      update: updateSize,
      cancelUpdate: emptyFunction,
    };
  }, [updateSize, throttleTimeout]);

  useEffect(() => {
    const sizeObserver = new ResizeObserver(update);
    if (ref.current) {
      sizeObserver.observe(ref.current);
    }
    return () => {
      cancelUpdate();
      sizeObserver.disconnect();
    };
  }, [cancelUpdate, ref, update]);

  return size;
};

export default useComponentSize;
