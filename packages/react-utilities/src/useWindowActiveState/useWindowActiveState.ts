import { useState, useEffect, useCallback } from 'react';
import { activeEvents, inactiveEvents } from './constants';

const useWindowActiveState = (): boolean => {
  const [isActive, setIsActive] = useState<boolean>(false);

  const handleActiveChange = useCallback(() => {
    setIsActive(true);
  }, []);
  const handleInActiveChange = useCallback(() => {
    setIsActive(false);
  }, []);
  useEffect(() => {
    activeEvents.forEach((event) => {
      window.addEventListener(event, handleActiveChange);
    });

    inactiveEvents.forEach((event) => {
      window.addEventListener(event, handleInActiveChange);
    });
    return () => {
      activeEvents.forEach((event) => {
        window.removeEventListener(event, handleActiveChange);
      });
      inactiveEvents.forEach((event) => {
        window.removeEventListener(event, handleInActiveChange);
      });
    };
  }, [handleActiveChange, handleInActiveChange]);

  return isActive;
};

export default useWindowActiveState;
