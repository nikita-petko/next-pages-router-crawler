import { useState, useEffect, useCallback } from 'react';

export interface WindowSize {
  width?: number;
  height?: number;
}

// reference: https://usehooks.com/useWindowSize/
const useWindowSize = (): WindowSize => {
  // initialize state with undefined width/height so server and client renders match
  // read more here: https://joshwcomeau.com/react/the-perils-of-rehydration/
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: undefined,
    height: undefined,
  });

  const handleResize = useCallback(() => {
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, []);

  useEffect(() => {
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  return windowSize;
};

export default useWindowSize;
